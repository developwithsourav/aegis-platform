/* Plain helpers shared by the Convex functions. Nothing here touches the database. */

const EARTH_RADIUS_M = 6_371_000;
const WALK_SPEED_M_PER_MIN = 84; // about 1.4 m/s

/** Great-circle distance between two coordinates, in metres. */
export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
}

/** Walking ETA in whole minutes, never less than one. */
export const etaMinutes = (meters: number) => Math.max(1, Math.round(meters / WALK_SPEED_M_PER_MIN));

/** How strongly independent reports back an incident: 25 for one report, 20 more
    for each additional one, capped at 90. This is the percentage the control room
    sees. It counts corroboration and makes no claim about model confidence. */
export const corroboration = (reportCount: number) =>
  Math.min(90, 25 + Math.max(0, reportCount - 1) * 20);

/** Which responder role a category calls for. Unlisted categories take anyone. */
export const ROLE_FOR_CATEGORY: Record<string, string> = {
  medical: "medic",
  fire: "fire",
  crowd: "marshal",
  violence_security: "security",
};
