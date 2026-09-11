import { internalMutation, type MutationCtx } from "./_generated/server";

/* One time demo seeding: venue (Microsoft Office Noida area), 5 responders,
   SOP knowledge base distilled from NDMA "Managing Crowd at Events" guidance,
   fire safety and first aid guidance (team curated excerpts of public documents).
   Run: npx convex run seed:all */

const VENUE = {
  name: "Microsoft Office, Sovereign Noida (demo venue)",
  centerLat: 28.5355, centerLng: 77.3910, zoomLevel: 17,
  gates: [
    { name: "Gate 1", lat: 28.5361, lng: 77.3899, isExit: true },
    { name: "Gate 2", lat: 28.5347, lng: 77.3901, isExit: false },
    { name: "Gate 3", lat: 28.5349, lng: 77.3921, isExit: true },
    { name: "Gate 3B", lat: 28.5352, lng: 77.3928, isExit: true },
    { name: "Main Stage", lat: 28.5356, lng: 77.3912, isExit: false },
    { name: "Food Court", lat: 28.5362, lng: 77.3918, isExit: false },
    { name: "Medical Post", lat: 28.5359, lng: 77.3925, isExit: false },
  ],
};

const RESPONDERS = [
  { code: "E-02", name: "Medic Team 2", role: "medic", lat: 28.5359, lng: 77.3925 },
  { code: "E-05", name: "Medic Team 5", role: "medic", lat: 28.5362, lng: 77.3918 },
  { code: "M-07", name: "Marshal 7", role: "marshal", lat: 28.5349, lng: 77.3921 },
  { code: "F-12", name: "Fire Squad 12", role: "fire", lat: 28.5347, lng: 77.3901 },
  { code: "S-04", name: "Security 4", role: "security", lat: 28.5361, lng: 77.3899 },
];

const SRC_CROWD = "NDMA, Managing Crowd at Events and Venues of Mass Gathering (team curated excerpt)";
const SRC_FIRE = "NDMA fire safety guidance (team curated excerpt)";
const SRC_AID = "Indian Red Cross first aid guidance (team curated excerpt)";

const SOPS = [
  { category: "crowd", title: "Stop inflow first", text: "Halt entry at the affected gate immediately and divert incoming queues to alternate gates. Reducing inflow lowers density faster than any other action.", source: SRC_CROWD },
  { category: "crowd", title: "Open secondary egress", text: "Open the nearest secondary exit and enforce one way movement. Never let exit and entry flows share the same gate during high density.", source: SRC_CROWD },
  { category: "crowd", title: "Corridor and calm", text: "Deploy at least two marshals to form a corridor. Avoid whistles and sirens near dense crowds; use calm public address announcements and lower music volume.", source: SRC_CROWD },
  { category: "crowd", title: "Medics at the edge", text: "Stage medical teams at the edge of the density zone, not inside it. Extract casualties to the edge for treatment.", source: SRC_CROWD },
  { category: "medical", title: "Nearest medic with AED", text: "Dispatch the nearest medical team with AED and trauma kit. For suspected cardiac arrest every minute without CPR reduces survival by about ten percent.", source: SRC_AID },
  { category: "medical", title: "Clear and control", text: "Clear a three metre radius around the casualty and assign one marshal for crowd control. Prepare an ambulance corridor from the medical post to the nearest exit gate.", source: SRC_AID },
  { category: "medical", title: "CPR guidance", text: "If the person is unresponsive and not breathing normally, begin chest compressions at 100 to 120 per minute and continue until medics arrive.", source: SRC_AID },
  { category: "fire", title: "Contain and alert", text: "Dispatch the fire marshal with an extinguisher and alert the fire brigade immediately. Isolate electrical supply to the affected zone if the source may be electrical.", source: SRC_FIRE },
  { category: "fire", title: "Staged evacuation", text: "Evacuate the affected zone and adjacent zones only, in stages. A full venue announcement of fire can trigger a more dangerous crowd rush than the fire itself.", source: SRC_FIRE },
  { category: "fire", title: "Keep lanes clear", text: "Clear the emergency vehicle lane immediately and post a marshal to keep it open.", source: SRC_FIRE },
  { category: "violence_security", title: "Contain, do not chase", text: "Send the nearest security pair to contain the altercation and separate parties. Avoid pursuit through dense crowd; track via marshals at fixed points.", source: SRC_CROWD },
  { category: "accident_infra", title: "Isolate the hazard", text: "Cordon the hazard area, isolate power or water to the affected structure and reroute foot traffic away from it before inspection.", source: SRC_CROWD },
  { category: "other", title: "Lost person protocol", text: "Broadcast the description to all marshals over the staff channel, not the public address system when a minor is involved. Post staff at all exits with the description.", source: SRC_CROWD },
  { category: "other", title: "Escalate missing child", text: "If a missing child is not located within ten minutes, escalate to the police liaison and initiate gate checks.", source: SRC_CROWD },
];

/* Internal, so they run from `npx convex run` but a visitor to the public demo
   cannot wipe the knowledge base from a browser console. */
export const all = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const t of ["venue", "responders", "sops"] as const)
      for (const row of await ctx.db.query(t).collect()) await ctx.db.delete(row._id);
    await ctx.db.insert("venue", VENUE);
    for (const r of RESPONDERS)
      await ctx.db.insert("responders", { ...r, available: true, lastSeen: Date.now() });
    for (const s of SOPS) await ctx.db.insert("sops", s);
    return { venue: 1, responders: RESPONDERS.length, sops: SOPS.length };
  },
});

async function wipeIncidents(ctx: MutationCtx) {
  for (const r of await ctx.db.query("reports").collect())
    if (r.photoId) await ctx.storage.delete(r.photoId);
  for (const t of ["incidents", "reports", "events", "broadcasts"] as const)
    for (const row of await ctx.db.query(t).collect()) await ctx.db.delete(row._id);
  for (const r of await ctx.db.query("responders").collect())
    await ctx.db.patch(r._id, { available: true });
  return "clean";
}

export const resetIncidents = internalMutation({
  args: {},
  handler: wipeIncidents,
});

/* Hourly wipe for the public demo (crons.ts). Does nothing unless DEMO_MODE=1,
   so a real deployment never loses its incident history to a timer. */
export const demoReset = internalMutation({
  args: {},
  handler: async (ctx) => (process.env.DEMO_MODE === "1" ? wipeIncidents(ctx) : "skipped"),
});
