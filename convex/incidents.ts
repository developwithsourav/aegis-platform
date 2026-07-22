import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const WALK_SPEED_M_PER_MIN = 84; // ~1.4 m/s
const DEDUP_WINDOW_MS = 120_000;

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const etaMinutes = (meters: number) => Math.max(1, Math.round(meters / WALK_SPEED_M_PER_MIN));

// ---------- photo upload ----------
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

// ---------- report ingestion with dedup ----------
export const submitReport = mutation({
  args: {
    category: v.string(),
    description: v.optional(v.string()),
    phone: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    zone: v.optional(v.string()),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    // resolve zone: nearest venue gate if GPS given, else manual zone, else Unknown
    let zone = args.zone ?? "Unknown zone";
    let lat = args.lat, lng = args.lng;
    const venue = await ctx.db.query("venue").first();
    if (lat !== undefined && lng !== undefined && venue) {
      let best = Infinity;
      for (const g of venue.gates) {
        const d = haversineMeters(lat, lng, g.lat, g.lng);
        if (d < best) { best = d; zone = "Near " + g.name; }
      }
    }
    if ((lat === undefined || lng === undefined) && venue) {
      // manual zone: pin to the named gate, else venue center
      const g = venue.gates.find((g) => args.zone && args.zone.includes(g.name));
      lat = g ? g.lat : venue.centerLat;
      lng = g ? g.lng : venue.centerLng;
    }
    lat = lat ?? 0; lng = lng ?? 0;

    // dedup: same category + zone, open, within window
    const now = Date.now();
    const open = await ctx.db
      .query("incidents")
      .filter((q) => q.and(q.eq(q.field("category"), args.category), q.neq(q.field("status"), "resolved")))
      .collect();
    const twin = open.find((i) => i.zone === zone && now - i._creationTime < DEDUP_WINDOW_MS);
    if (twin) {
      await ctx.db.insert("reports", { ...args, zone, incidentId: twin._id });
      await ctx.db.patch(twin._id, {
        reportCount: twin.reportCount + 1,
        confidence: Math.min(99, twin.confidence + 5),
      });
      await ctx.db.insert("events", {
        incidentId: twin._id,
        msg: `Duplicate report merged (now ${twin.reportCount + 1} reports)`,
      });
      return { incidentId: twin._id, merged: true };
    }

    const incidentId = await ctx.db.insert("incidents", {
      category: args.category,
      priority: 3,
      headline: "Analyzing...",
      summary: "",
      confidence: 40,
      sopSteps: [],
      sopSource: "",
      reportCount: 1,
      lat, lng, zone,
      status: "ai_processing",
    });
    await ctx.db.insert("reports", { ...args, zone, incidentId });
    await ctx.db.insert("events", { incidentId, msg: "Report received" });
    await ctx.scheduler.runAfter(0, internal.ai.triage, { incidentId });
    await ctx.scheduler.runAfter(60_000, internal.incidents.escalateIfUnhandled, { incidentId });
    return { incidentId, merged: false };
  },
});

export const applyTriage = internalMutation({
  args: {
    incidentId: v.id("incidents"),
    priority: v.number(),
    headline: v.string(),
    summary: v.string(),
    confidence: v.number(),
    sopSteps: v.array(v.string()),
    sopSource: v.string(),
    aiFailed: v.optional(v.boolean()),
  },
  handler: async (ctx, { incidentId, ...fields }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc) return;
    await ctx.db.patch(incidentId, {
      ...fields,
      status: inc.status === "ai_processing" ? "verified" : inc.status,
      confidence: Math.min(99, fields.confidence + (inc.reportCount - 1) * 5),
    });
    await ctx.db.insert("events", {
      incidentId,
      msg: fields.aiFailed
        ? "AI unavailable, manual mode (rule based severity applied)"
        : "AI triage complete",
    });
  },
});

export const escalateIfUnhandled = internalMutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (inc && inc.priority === 1 && (inc.status === "ai_processing" || inc.status === "verified")) {
      await ctx.db.insert("events", {
        incidentId,
        msg: "ESCALATED to control lead, P1 unacknowledged for 60 s",
      });
    }
  },
});

// ---------- dispatch and lifecycle ----------
export const dispatch = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc || inc.assignedResponderId) return { ok: false, reason: "already assigned" };
    const prefer: Record<string, string> = {
      medical: "medic", fire: "fire", crowd: "marshal", violence_security: "security",
    };
    const pool = await ctx.db
      .query("responders")
      .withIndex("by_available", (q) => q.eq("available", true))
      .collect();
    const pick = (cands: typeof pool) => {
      let best = null, bestD = Infinity;
      for (const r of cands) {
        const d = haversineMeters(inc.lat, inc.lng, r.lat, r.lng);
        if (d < bestD) { bestD = d; best = r; }
      }
      return best ? { r: best, d: bestD } : null;
    };
    const wanted = prefer[inc.category];
    const chosen = (wanted && pick(pool.filter((r) => r.role === wanted))) || pick(pool);
    if (!chosen) return { ok: false, reason: "no responders available" };
    await ctx.db.patch(chosen.r._id, { available: false });
    await ctx.db.patch(incidentId, { assignedResponderId: chosen.r._id, status: "dispatched" });
    await ctx.db.insert("events", {
      incidentId,
      msg: `${chosen.r.role} ${chosen.r.code} dispatched, ETA ${etaMinutes(chosen.d)} min`,
    });
    return { ok: true, responder: chosen.r.code };
  },
});

export const acceptAssignment = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc || inc.status !== "dispatched") return;
    await ctx.db.patch(incidentId, { status: "en_route" });
    await ctx.db.insert("events", { incidentId, msg: "Responder accepted, en route" });
  },
});

export const updateResponderLocation = mutation({
  args: { responderId: v.id("responders"), lat: v.number(), lng: v.number() },
  handler: async (ctx, { responderId, lat, lng }) => {
    await ctx.db.patch(responderId, { lat, lng, lastSeen: Date.now() });
  },
});

export const markOnScene = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    await ctx.db.patch(incidentId, { status: "on_scene" });
    await ctx.db.insert("events", { incidentId, msg: "Responder on scene" });
  },
});

export const resolve = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc) return;
    if (inc.assignedResponderId) await ctx.db.patch(inc.assignedResponderId, { available: true });
    await ctx.db.patch(incidentId, { status: "resolved" });
    await ctx.db.insert("events", { incidentId, msg: "Incident resolved, audit log closed" });
  },
});

// ---------- broadcasts (exit guidance) ----------
export const sendBroadcast = mutation({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    for (const b of await ctx.db.query("broadcasts").collect())
      await ctx.db.patch(b._id, { active: false });
    await ctx.db.insert("broadcasts", { message, active: true });
  },
});
export const clearBroadcast = mutation({
  args: {},
  handler: async (ctx) => {
    for (const b of await ctx.db.query("broadcasts").collect())
      await ctx.db.patch(b._id, { active: false });
  },
});

// ---------- operator login (env based, hackathon grade) ----------
export const login = query({
  args: { email: v.string(), password: v.string() },
  handler: async (_ctx, { email, password }) => {
    // Fail closed: with no OPERATOR_PASSWORD configured on the deployment,
    // nobody gets in. Never fall back to a default that lives in the repo.
    const okEmail = (process.env.OPERATOR_EMAIL ?? "operator").toLowerCase();
    const okPass = process.env.OPERATOR_PASSWORD;
    if (!okPass) return { ok: false };
    const ok = email.toLowerCase() === okEmail && password === okPass;
    return ok ? { ok: true, name: "Control Room" } : { ok: false };
  },
});

/* Responder devices share one venue passcode. Same fail-closed rule as the
   operator login: no RESPONDER_PASSCODE configured means nobody gets in.
   This gates the UI, not the API — real deployments would use Convex Auth with
   role-scoped functions. It exists so a public demo URL cannot be interfered
   with by anyone who happens to have the link. */
export const responderLogin = query({
  args: { passcode: v.string() },
  handler: async (_ctx, { passcode }) => {
    const expected = process.env.RESPONDER_PASSCODE;
    if (!expected) return { ok: false };
    return passcode === expected ? { ok: true } : { ok: false };
  },
});

// ---------- live queries ----------
export const liveBoard = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").order("desc").take(60);
    const out = [];
    for (const i of incidents) {
      const responder = i.assignedResponderId ? await ctx.db.get(i.assignedResponderId) : null;
      out.push({ ...i, responder: responder ? { code: responder.code, role: responder.role, lat: responder.lat, lng: responder.lng } : null });
    }
    return out;
  },
});

export const incidentDetail = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc) return null;
    const reports = await ctx.db.query("reports")
      .filter((q) => q.eq(q.field("incidentId"), incidentId)).collect();
    const events = await ctx.db.query("events")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId)).collect();
    const photos: string[] = [];
    for (const r of reports) if (r.photoId) {
      const url = await ctx.storage.getUrl(r.photoId);
      if (url) photos.push(url);
    }
    const responder = inc.assignedResponderId ? await ctx.db.get(inc.assignedResponderId) : null;
    return { ...inc, reports, events, photos, responder };
  },
});

export const trackIncident = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const inc = await ctx.db.get(incidentId);
    if (!inc) return null;
    const responder = inc.assignedResponderId ? await ctx.db.get(inc.assignedResponderId) : null;
    const etaMin = responder
      ? etaMinutes(haversineMeters(inc.lat, inc.lng, responder.lat, responder.lng))
      : null;
    return {
      status: inc.status, priority: inc.priority, headline: inc.headline,
      sopSteps: inc.sopSteps, sopSource: inc.sopSource,
      lat: inc.lat, lng: inc.lng, zone: inc.zone,
      responder: responder
        ? { code: responder.code, role: responder.role, lat: responder.lat, lng: responder.lng, etaMin }
        : null,
    };
  },
});

export const activeBroadcast = query({
  args: {},
  handler: async (ctx) =>
    (await ctx.db.query("broadcasts").collect()).find((b) => b.active) ?? null,
});

export const respondersList = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("responders").collect(),
});

export const venueInfo = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("venue").first(),
});
