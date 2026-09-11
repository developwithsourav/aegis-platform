import { mutation, query, internalMutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { haversineMeters, etaMinutes, corroboration, ROLE_FOR_CATEGORY } from "./model";

/* Incident lifecycle:
   report -> ai_processing -> verified -> dispatched -> en_route -> on_scene -> resolved */

const DEDUP_WINDOW_MS = 2 * 60_000;
const ESCALATE_AFTER_MS = 60_000;

/* Public demo mode, switched on with DEMO_MODE=1 on the deployment. Anyone with
   the link can use the demo, so it stores only the last two digits of a callback
   number, refuses photo uploads, sends only the preset broadcasts and rate limits
   reports. crons.ts wipes the incidents every hour. */
const isDemo = () => process.env.DEMO_MODE === "1";
const DEMO_REPORT_LIMIT = 40;
const DEMO_REPORT_WINDOW_MS = 10 * 60_000;
const DEMO_BROADCASTS = [
  "Evacuate via Gate 3B",
  "Avoid the east concourse",
  "Medical corridor in use, keep Gate 2 clear",
];
const maskPhone = (phone: string) => phone.replace(/\d(?=\d{2})/g, "X");

// ---------- reporting ----------

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    if (isDemo()) throw new ConvexError("Photo upload is turned off in the public demo.");
    return await ctx.storage.generateUploadUrl();
  },
});

/* Optional fields accept null as well as undefined, because browsers send null
   for empty values (lat and lng when GPS is denied, for example). */
const optionalString = v.optional(v.union(v.string(), v.null()));
const optionalNumber = v.optional(v.union(v.number(), v.null()));

export const submitReport = mutation({
  args: {
    category: v.string(),
    description: optionalString,
    phone: optionalString,
    lat: optionalNumber,
    lng: optionalNumber,
    zone: optionalString,
    photoId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  handler: async (ctx, raw) => {
    const demo = isDemo();
    const now = Date.now();

    if (demo) {
      const recent = await ctx.db.query("reports").order("desc").take(DEMO_REPORT_LIMIT);
      const oldest = recent[DEMO_REPORT_LIMIT - 1];
      if (oldest && now - oldest._creationTime < DEMO_REPORT_WINDOW_MS)
        throw new ConvexError("The demo is busy. Try again in a few minutes.");
    }

    const report = {
      category: raw.category,
      description: raw.description ?? undefined,
      phone: raw.phone ? (demo ? maskPhone(raw.phone) : raw.phone) : undefined,
      zone: raw.zone ?? undefined,
      photoId: demo ? undefined : raw.photoId ?? undefined,
      lat: raw.lat ?? undefined,
      lng: raw.lng ?? undefined,
    };

    const { zone, lat, lng } = await locate(ctx, report);

    // A report of the same category in the same zone within the window is the
    // same event: attach it to the open incident instead of opening a new one.
    const twin = await findOpenTwin(ctx, report.category, zone, now);
    if (twin) {
      const reportCount = twin.reportCount + 1;
      await ctx.db.insert("reports", { ...report, zone, incidentId: twin._id });
      await ctx.db.patch(twin._id, { reportCount, confidence: corroboration(reportCount) });
      await ctx.db.insert("events", {
        incidentId: twin._id,
        msg: `Duplicate report merged (now ${reportCount} reports)`,
      });
      return { incidentId: twin._id, merged: true };
    }

    const incidentId = await ctx.db.insert("incidents", {
      category: report.category,
      priority: 3,
      headline: "Analyzing...",
      summary: "",
      confidence: corroboration(1),
      sopSteps: [],
      sopSource: "",
      reportCount: 1,
      lat, lng, zone,
      status: "ai_processing",
    });
    await ctx.db.insert("reports", { ...report, zone, incidentId });
    await ctx.db.insert("events", { incidentId, msg: "Report received" });
    await ctx.scheduler.runAfter(0, internal.ai.triage, { incidentId });
    await ctx.scheduler.runAfter(ESCALATE_AFTER_MS, internal.incidents.escalateIfUnhandled, { incidentId });
    return { incidentId, merged: false };
  },
});

/* Where a report is. With GPS: the nearest named gate or zone of the venue.
   Without GPS: the zone the reporter picked, else the venue centre. A report is
   never rejected for lacking a location. */
async function locate(ctx: QueryCtx, report: { lat?: number; lng?: number; zone?: string }) {
  const venue = await ctx.db.query("venue").first();
  if (!venue) return { zone: report.zone ?? "Unknown zone", lat: report.lat ?? 0, lng: report.lng ?? 0 };

  if (report.lat !== undefined && report.lng !== undefined) {
    let nearest = venue.gates[0];
    let best = Infinity;
    for (const gate of venue.gates) {
      const d = haversineMeters(report.lat, report.lng, gate.lat, gate.lng);
      if (d < best) { best = d; nearest = gate; }
    }
    return { zone: "Near " + nearest.name, lat: report.lat, lng: report.lng };
  }

  const picked = venue.gates.find((g) => report.zone?.includes(g.name));
  return {
    zone: report.zone ?? "Unknown zone",
    lat: picked ? picked.lat : venue.centerLat,
    lng: picked ? picked.lng : venue.centerLng,
  };
}

async function findOpenTwin(ctx: QueryCtx, category: string, zone: string, now: number) {
  const recent = ctx.db
    .query("incidents")
    .withIndex("by_category_zone", (q) => q.eq("category", category).eq("zone", zone))
    .order("desc");
  for await (const incident of recent) {
    if (now - incident._creationTime > DEDUP_WINDOW_MS) return null;
    if (incident.status !== "resolved") return incident;
  }
  return null;
}

// ---------- triage and escalation (called by the scheduler) ----------

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
    const incident = await ctx.db.get(incidentId);
    if (!incident) return;
    await ctx.db.patch(incidentId, {
      ...fields,
      status: incident.status === "ai_processing" ? "verified" : incident.status,
    });
    await ctx.db.insert("events", {
      incidentId,
      msg: fields.aiFailed
        ? "AI unavailable, manual mode (rule based severity applied)"
        : "Triage complete",
    });
  },
});

export const escalateIfUnhandled = internalMutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const incident = await ctx.db.get(incidentId);
    const unhandled = incident?.status === "ai_processing" || incident?.status === "verified";
    if (incident?.priority === 1 && unhandled) {
      await ctx.db.insert("events", {
        incidentId,
        msg: "ESCALATED to control lead, P1 unacknowledged for 60 s",
      });
    }
  },
});

// ---------- dispatch and lifecycle ----------

/* Nearest available responder whose role matches the category, else the nearest
   available responder of any role. Distance decides, not a model. */
export const dispatch = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const incident = await ctx.db.get(incidentId);
    if (!incident || incident.assignedResponderId) return { ok: false, reason: "already assigned" };

    const available = await ctx.db
      .query("responders")
      .withIndex("by_available", (q) => q.eq("available", true))
      .collect();

    const nearest = (candidates: typeof available) => {
      let pick = null;
      let pickDistance = Infinity;
      for (const r of candidates) {
        const d = haversineMeters(incident.lat, incident.lng, r.lat, r.lng);
        if (d < pickDistance) { pick = r; pickDistance = d; }
      }
      return pick ? { responder: pick, meters: pickDistance } : null;
    };

    const role = ROLE_FOR_CATEGORY[incident.category];
    const chosen = (role && nearest(available.filter((r) => r.role === role))) || nearest(available);
    if (!chosen) return { ok: false, reason: "no responders available" };

    const { responder, meters } = chosen;
    await ctx.db.patch(responder._id, { available: false });
    await ctx.db.patch(incidentId, { assignedResponderId: responder._id, status: "dispatched" });
    await ctx.db.insert("events", {
      incidentId,
      msg: `${responder.role} ${responder.code} dispatched, ETA ${etaMinutes(meters)} min`,
    });
    return { ok: true, responder: responder.code };
  },
});

export const acceptAssignment = mutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const incident = await ctx.db.get(incidentId);
    if (incident?.status !== "dispatched") return;
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
    const incident = await ctx.db.get(incidentId);
    if (!incident) return;
    if (incident.assignedResponderId) await ctx.db.patch(incident.assignedResponderId, { available: true });
    await ctx.db.patch(incidentId, { status: "resolved" });
    await ctx.db.insert("events", { incidentId, msg: "Incident resolved, audit log closed" });
  },
});

// ---------- exit guidance broadcasts ----------

export const sendBroadcast = mutation({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    if (isDemo() && !DEMO_BROADCASTS.includes(message))
      throw new ConvexError("The public demo only sends the preset messages.");
    await deactivateBroadcasts(ctx);
    await ctx.db.insert("broadcasts", { message, active: true });
  },
});

export const clearBroadcast = mutation({
  args: {},
  handler: async (ctx) => deactivateBroadcasts(ctx),
});

async function deactivateBroadcasts(ctx: MutationCtx) {
  const active = await ctx.db
    .query("broadcasts")
    .withIndex("by_active", (q) => q.eq("active", true))
    .collect();
  for (const b of active) await ctx.db.patch(b._id, { active: false });
}

// ---------- screen access ----------

/* These checks decide which screens a device may open. They do not protect data:
   the functions themselves are public, and a production deployment would use
   Convex Auth with role-scoped functions. Both fail closed, so with no password
   or passcode set on the deployment nobody gets in. */
export const login = query({
  args: { email: v.string(), password: v.string() },
  handler: async (_ctx, { email, password }) => {
    const expectedId = (process.env.OPERATOR_EMAIL ?? "operator").toLowerCase();
    const expectedPassword = process.env.OPERATOR_PASSWORD;
    if (!expectedPassword) return { ok: false };
    const ok = email.toLowerCase() === expectedId && password === expectedPassword;
    return ok ? { ok: true, name: "Control Room" } : { ok: false };
  },
});

export const responderLogin = query({
  args: { passcode: v.string() },
  handler: async (_ctx, { passcode }) => {
    const expected = process.env.RESPONDER_PASSCODE;
    return { ok: !!expected && passcode === expected };
  },
});

/* In the public demo the web app shows one-click entry to every screen. */
export const demoInfo = query({
  args: {},
  handler: async () => ({ demo: isDemo(), broadcasts: DEMO_BROADCASTS }),
});

// ---------- live queries ----------

export const liveBoard = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").order("desc").take(60);
    return Promise.all(incidents.map(async (incident) => {
      const r = incident.assignedResponderId ? await ctx.db.get(incident.assignedResponderId) : null;
      return { ...incident, responder: r ? { code: r.code, role: r.role, lat: r.lat, lng: r.lng } : null };
    }));
  },
});

export const incidentDetail = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const incident = await ctx.db.get(incidentId);
    if (!incident) return null;
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId))
      .collect();
    const events = await ctx.db
      .query("events")
      .withIndex("by_incident", (q) => q.eq("incidentId", incidentId))
      .collect();
    const photoUrls = await Promise.all(
      reports.flatMap((r) => (r.photoId ? [ctx.storage.getUrl(r.photoId)] : [])),
    );
    const responder = incident.assignedResponderId ? await ctx.db.get(incident.assignedResponderId) : null;
    return { ...incident, reports, events, photos: photoUrls.filter(Boolean), responder };
  },
});

/* What the reporter's phone shows: status, guidance and who is coming. */
export const trackIncident = query({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, { incidentId }) => {
    const incident = await ctx.db.get(incidentId);
    if (!incident) return null;
    const r = incident.assignedResponderId ? await ctx.db.get(incident.assignedResponderId) : null;
    return {
      status: incident.status,
      priority: incident.priority,
      headline: incident.headline,
      sopSteps: incident.sopSteps,
      sopSource: incident.sopSource,
      lat: incident.lat,
      lng: incident.lng,
      zone: incident.zone,
      responder: r
        ? {
            code: r.code, role: r.role, lat: r.lat, lng: r.lng,
            etaMin: etaMinutes(haversineMeters(incident.lat, incident.lng, r.lat, r.lng)),
          }
        : null,
    };
  },
});

export const activeBroadcast = query({
  args: {},
  handler: async (ctx) =>
    await ctx.db.query("broadcasts").withIndex("by_active", (q) => q.eq("active", true)).first(),
});

export const respondersList = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("responders").collect(),
});

export const venueInfo = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("venue").first(),
});
