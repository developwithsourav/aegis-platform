import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

/* Venue catalogue and live venue switching.

   A venue, its zones and its responding units are data, so the same backend can
   run any site. One venue is active at a time. Switching replaces the venue
   document and its responder roster and clears the incident board.

   About the data: these are real places at approximate coordinates, accurate to
   a few hundred metres. That is enough to show nearest-unit dispatch, but it is
   not a verified facility feed. A real deployment would load venue and facility
   data from data.gov.in or OpenStreetMap. */

type Gate = { name: string; lat: number; lng: number; isExit: boolean };
type Unit = { code: string; name: string; role: string; lat: number; lng: number };

export const CATALOG: Record<string, {
  state: string; name: string; centerLat: number; centerLng: number;
  zoomLevel: number; gates: Gate[]; responders: Unit[];
}> = {
  noida_msoffice: {
    state: "Uttar Pradesh",
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
    responders: [
      { code: "E-02", name: "Medic Team 2", role: "medic", lat: 28.5359, lng: 77.3925 },
      { code: "E-05", name: "Medic Team 5", role: "medic", lat: 28.5362, lng: 77.3918 },
      { code: "M-07", name: "Marshal 7", role: "marshal", lat: 28.5349, lng: 77.3921 },
      { code: "F-12", name: "Fire Squad 12", role: "fire", lat: 28.5347, lng: 77.3901 },
      { code: "S-04", name: "Security 4", role: "security", lat: 28.5361, lng: 77.3899 },
    ],
  },

  delhi_central: {
    state: "Delhi",
    name: "Central Delhi: VVIP & Mass Gathering Zone",
    centerLat: 28.6220, centerLng: 77.2150, zoomLevel: 14,
    gates: [
      { name: "Jantar Mantar (protest ground)", lat: 28.6270, lng: 77.2166, isExit: false },
      { name: "Connaught Place, Inner Circle", lat: 28.6315, lng: 77.2167, isExit: false },
      { name: "Parliament House", lat: 28.6172, lng: 77.2082, isExit: false },
      { name: "PMO / South Block", lat: 28.6143, lng: 77.2095, isExit: false },
      { name: "Central Secretariat", lat: 28.6146, lng: 77.2119, isExit: false },
      { name: "RBI, Sansad Marg", lat: 28.6265, lng: 77.2190, isExit: false },
      { name: "Kartavya Path", lat: 28.6129, lng: 77.2295, isExit: false },
      { name: "Patel Chowk Metro (dispersal)", lat: 28.6226, lng: 77.2145, isExit: true },
      { name: "Rajiv Chowk Metro (dispersal)", lat: 28.6330, lng: 77.2197, isExit: true },
      { name: "Central Secretariat Metro (dispersal)", lat: 28.6155, lng: 77.2120, isExit: true },
    ],
    responders: [
      { code: "AMB-RML", name: "RML Hospital Ambulance", role: "medic", lat: 28.6255, lng: 77.2050 },
      { code: "AMB-LHMC", name: "Lady Hardinge Ambulance", role: "medic", lat: 28.6395, lng: 77.2100 },
      { code: "AMB-LNJP", name: "LNJP Hospital Ambulance", role: "medic", lat: 28.6395, lng: 77.2340 },
      { code: "PS-PARL", name: "Parliament Street Police", role: "security", lat: 28.6258, lng: 77.2160 },
      { code: "PS-CP", name: "Connaught Place Police", role: "security", lat: 28.6330, lng: 77.2200 },
      { code: "FIRE-CP", name: "Connaught Place Fire Station", role: "fire", lat: 28.6290, lng: 77.2200 },
      { code: "MRS-JM", name: "Marshal Unit, Jantar Mantar", role: "marshal", lat: 28.6272, lng: 77.2170 },
      { code: "MRS-CP", name: "Marshal Unit, Connaught Place", role: "marshal", lat: 28.6318, lng: 77.2172 },
    ],
  },

  delhi_stadium: {
    state: "Delhi",
    name: "Arun Jaitley Stadium, Feroz Shah Kotla",
    centerLat: 28.6379, centerLng: 77.2432, zoomLevel: 16,
    gates: [
      { name: "Gate 1, Bhishma Pitamah Marg", lat: 28.6388, lng: 77.2419, isExit: true },
      { name: "Gate 3, North Stand", lat: 28.6392, lng: 77.2441, isExit: true },
      { name: "Gate 6, Pavilion End", lat: 28.6368, lng: 77.2444, isExit: false },
      { name: "Gate 9, Old Clubhouse", lat: 28.6366, lng: 77.2420, isExit: true },
      { name: "Player Pavilion", lat: 28.6377, lng: 77.2430, isExit: false },
      { name: "Concourse Food Zone", lat: 28.6383, lng: 77.2436, isExit: false },
      { name: "Delhi Gate Metro (dispersal)", lat: 28.6395, lng: 77.2400, isExit: true },
    ],
    responders: [
      { code: "AMB-LNJP", name: "LNJP Hospital Ambulance", role: "medic", lat: 28.6395, lng: 77.2340 },
      { code: "AMB-GBP", name: "GB Pant Hospital Ambulance", role: "medic", lat: 28.6408, lng: 77.2385 },
      { code: "PS-IPE", name: "IP Estate Police", role: "security", lat: 28.6338, lng: 77.2445 },
      { code: "PS-DG", name: "Delhi Gate Police", role: "security", lat: 28.6402, lng: 77.2395 },
      { code: "FIRE-DG", name: "Delhi Gate Fire Station", role: "fire", lat: 28.6410, lng: 77.2402 },
      { code: "MRS-N", name: "Stadium Marshal, North Stand", role: "marshal", lat: 28.6390, lng: 77.2440 },
      { code: "MRS-S", name: "Stadium Marshal, Pavilion", role: "marshal", lat: 28.6370, lng: 77.2432 },
    ],
  },
};

/** Venue options for the operator's picker, grouped by state. */
export const listVenues = query({
  args: {},
  handler: async (ctx) => {
    const active = await ctx.db.query("venue").first();
    return Object.entries(CATALOG).map(([key, v]) => ({
      key,
      state: v.state,
      name: v.name,
      zones: v.gates.length,
      units: v.responders.length,
      isActive: active?.name === v.name,
    }));
  },
});

/** Switch the live venue and clear the board so it reflects the new site. */
export const setActiveVenue = mutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const target = CATALOG[key];
    if (!target) return { ok: false, reason: `unknown venue "${key}"` };
    await clearIncidents(ctx);
    await installVenue(ctx, key);
    return { ok: true, venue: target.name, state: target.state, units: target.responders.length };
  },
});

/** Replace the active venue and its responder roster with a catalogue entry. */
export async function installVenue(ctx: MutationCtx, key: keyof typeof CATALOG) {
  const { name, centerLat, centerLng, zoomLevel, gates, responders } = CATALOG[key];
  for (const table of ["venue", "responders"] as const)
    for (const row of await ctx.db.query(table).collect()) await ctx.db.delete(row._id);
  await ctx.db.insert("venue", { name, centerLat, centerLng, zoomLevel, gates });
  for (const r of responders)
    await ctx.db.insert("responders", { ...r, available: true, lastSeen: Date.now() });
  return responders.length;
}

/** Delete every incident, report, photo, event and broadcast, and free all responders. */
export async function clearIncidents(ctx: MutationCtx) {
  for (const report of await ctx.db.query("reports").collect())
    if (report.photoId) await ctx.storage.delete(report.photoId);
  for (const table of ["incidents", "reports", "events", "broadcasts"] as const)
    for (const row of await ctx.db.query(table).collect()) await ctx.db.delete(row._id);
  for (const r of await ctx.db.query("responders").collect())
    await ctx.db.patch(r._id, { available: true });
}
