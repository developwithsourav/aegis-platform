import { internalMutation } from "./_generated/server";
import { installVenue, clearIncidents } from "./venues";

/* Seed data and resets. All of these are internal functions: they run from the
   command line (`npx convex run seed:all`) and cannot be called from a browser.

   The response procedures below are short excerpts the team condensed from
   public NDMA crowd management and fire safety guidance and Indian Red Cross
   first aid guidance. */

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

/** Demo venue, its five responders and the procedure library. Safe to re-run. */
export const all = internalMutation({
  args: {},
  handler: async (ctx) => {
    const responders = await installVenue(ctx, "noida_msoffice");
    for (const sop of await ctx.db.query("sops").collect()) await ctx.db.delete(sop._id);
    for (const sop of SOPS) await ctx.db.insert("sops", sop);
    return { venue: 1, responders, sops: SOPS.length };
  },
});

export const resetIncidents = internalMutation({
  args: {},
  handler: async (ctx) => {
    await clearIncidents(ctx);
    return "clean";
  },
});

/** Hourly wipe for the public demo (see crons.ts). Does nothing unless DEMO_MODE=1. */
export const demoReset = internalMutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.DEMO_MODE !== "1") return "skipped";
    await clearIncidents(ctx);
    return "clean";
  },
});
