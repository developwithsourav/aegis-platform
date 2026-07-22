# AEGIS — the single EnterPro build prompt

One paste. Copy everything inside the fence below, top to bottom, into EnterPro.

It wires to the live Convex backend from the first generation — there is no mock
phase and therefore no rewiring pass, which is the step that normally costs the
most credits. Every data call is confined to one file, so if the transport ever
needs changing, that one file changes and the UI does not.

**After it generates:** fix small things in the code editor, not by re-prompting.
Re-prompting to move a button is the fastest way to burn 4,000 credits. If
something is structurally wrong, prompt only for that one route.

**Live credentials** (do not put them in the prompt — type them at runtime):
operator `operator` / `<operator password>` · responder passcode `<responder passcode>`

---

```
Build a production-quality React web app called AEGIS — an AI emergency response
system for crowded venues (concerts, festivals, stadiums). It is already backed
by a live Convex backend; connect to it, do not invent one.

════════ HARD CONSTRAINTS ════════
- EXACTLY three client-side routes. Never create others:
    /           Reporter  (public, no login)
    /responder  Responder (venue staff passcode)
    /command    Command   (operator login)
- No landing page, no marketing site, no sign-up, no user accounts, no backend
  code, no API routes, no database. The backend exists and is live.
- ALL data access lives in one file, src/aegis-backend.js, given verbatim below.
  Components never fetch. Never add polling, setInterval refreshing or manual
  refetching — the hooks are live subscriptions that push updates themselves.
- Use the exact field names and enum values given. Never rename or invent them.

════════ DESIGN SYSTEM "Guardian Red" — two surfaces ════════
PUBLIC SURFACE (Reporter) is LIGHT so it stays readable outdoors in direct
sunlight: page #FFFFFF, panel #F7F8FA, border #E8E9EC, text #0A0A0C,
muted #6B6C72, red #E11D2E, soft red #FDECEE.
Exception: the Reporter HOME screen is a dark cinematic hero, #0A0A0C over a
dimmed crowd photograph. Every screen after it is light.

OPERATIONAL SURFACE (Responder, Command) is DARK for a control room and
projector: bg #0A0A0C, surface #141417, card #1B1B1F, border #2A2A30,
text #F5F5F6, muted #8E8E96.

Shared: red #E11D2E, green #22C55E, amber #F59E0B.
Priority colors: P1 red, P2 amber, P3/P4 green.
Role colors, used ONLY on a role badge and route line: fire red, medic green,
marshal amber, security purple. Never use blue as a UI color.

Type: Inter or system font, high contrast, confident. Unit codes and numbers in
tabular/mono. Uppercase letter-spaced micro-labels on status chips.
Form: rounded 12–16px, generous padding, 1px borders instead of shadows, a red
glow only on the primary emergency action. Calm and professional — used by staff
under stress and by frightened members of the public. No emoji, no marketing
copy, no decorative illustration beyond the two named empty states.
Motion: 150ms transitions; a slow pulse on P1 only; respect prefers-reduced-motion.
Accessibility: 44px minimum touch targets, WCAG AA contrast, visible focus
rings, keyboard navigable, aria-live on status changes. Mobile-first.

Shared shell: a slim top bar with a slowly pulsing red dot, "AEGIS" in
letter-spaced caps, and a connection dot plus live clock on the right (clock
hidden on Reporter). Directly beneath it, an announcement banner: when
useBroadcast() returns a value, show a full-width amber bar with its message on
every route; hidden otherwise.

════════ STEP 1 — run `npm install convex`, then create src/aegis-backend.js
         with EXACTLY this ════════
// AEGIS -> live Convex backend. Real-time subscriptions, no polling.
import { ConvexClient } from "convex/browser";
import { anyApi } from "convex/server";
import { useEffect, useState } from "react";

export const client = new ConvexClient("https://judicious-oyster-529.convex.cloud");
export const api = anyApi;

export function useLive(fn, args = {}, enabled = true) {
  const [data, setData] = useState(undefined);
  const key = JSON.stringify(args);
  useEffect(() => {
    if (!enabled) return;
    const unsub = client.onUpdate(fn, args, setData);
    return () => unsub();
  }, [fn, key, enabled]);
  return data;
}

export const useBoard      = ()   => useLive(api.incidents.liveBoard);
export const useBroadcast  = ()   => useLive(api.incidents.activeBroadcast);
export const useResponders = ()   => useLive(api.incidents.respondersList);
export const useVenue      = ()   => useLive(api.incidents.venueInfo);
export const useTrack      = (id) => useLive(api.incidents.trackIncident, { incidentId: id }, !!id);
export const useDetail     = (id) => useLive(api.incidents.incidentDetail, { incidentId: id }, !!id);

export const submitReport = (a)  => client.mutation(api.incidents.submitReport, a);
export const dispatch     = (id) => client.mutation(api.incidents.dispatch, { incidentId: id });
export const accept       = (id) => client.mutation(api.incidents.acceptAssignment, { incidentId: id });
export const onScene      = (id) => client.mutation(api.incidents.markOnScene, { incidentId: id });
export const resolve      = (id) => client.mutation(api.incidents.resolve, { incidentId: id });
export const sendBroadcast  = (message) => client.mutation(api.incidents.sendBroadcast, { message });
export const clearBroadcast = ()        => client.mutation(api.incidents.clearBroadcast, {});
export const moveResponder  = (responderId, lat, lng) =>
  client.mutation(api.incidents.updateResponderLocation, { responderId, lat, lng });

export const login = (email, password) =>
  client.query(api.incidents.login, { email, password });
export const responderLogin = (passcode) =>
  client.query(api.incidents.responderLogin, { passcode });

export async function uploadPhoto(file) {
  const url = await client.mutation(api.incidents.generateUploadUrl, {});
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
  const { storageId } = await res.json();
  return storageId;
}

export function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, enableHighAccuracy: true });
  });
}

export const displayId = (id) => "AEGIS-" + String(id).slice(-8).toUpperCase();

════════ DATA CONTRACT ════════
incident  = _id, _creationTime, category, priority, headline, summary,
            confidence, sopSteps[], sopSource, reportCount, lat, lng, zone,
            status, assignedResponderId, aiFailed, responder{code,role,lat,lng}
useDetail also returns reports[], events[{_creationTime,msg}], photos[] (URLs)
useTrack  returns { status, priority, headline, sopSteps[], sopSource, lat, lng,
            zone, responder{code,role,lat,lng,etaMin} }
responder = _id, code, name, role, lat, lng, available, lastSeen
venue     = { name, centerLat, centerLng, zoomLevel, gates[{name,lat,lng,isExit}] }

ENUMS — never invent values outside these:
  category: fire | medical | crowd | accident_infra | violence_security | other
  status:   ai_processing | verified | dispatched | en_route | on_scene | resolved
  role:     fire | medic | marshal | security          (there is NO police role)
  priority: 1 Critical | 2 Urgent | 3 Standard | 4 Logged

Show any _id to users via displayId(). Keep the raw _id for all calls.
One incident is assigned exactly ONE unit. There is no multi-unit dispatch and
no decline action.

════════ STEP 2 — ROUTE / : REPORTER (light, 5 screens) ════════
SCREEN 1 HOME (the only dark screen): dark hero over a dimmed crowd photo.
Centered AEGIS shield mark, "AEGIS", subtitle "Smart Emergency Response System".
A circular red SOS button at least 190px across with a soft glow and slow
breathing pulse, labelled "SOS" over "REPORT EMERGENCY". Below it a pill showing
a location icon, "Location Access" and a green "Enabled" check reflecting the
real permission state. Caption: "Your location helps us respond faster." Menu
icon left, bell right. Call getPosition() on mount, never at submit time.

SCREEN 2 REPORT EMERGENCY (light): back chevron, title "Report Emergency",
heading "What's happening?". A 3x2 grid of six tiles, icon above label, mapping
exactly: Fire=fire, Medical=medical, Crowd=crowd, Accident=accident_infra,
Violence=violence_security, Other=other. Selected tile fills #FDECEE with a red
border and red label. Then:
 - "Location (Auto)": bordered field showing the zone from getPosition() with a
   pin icon and re-locate button. If position is null, show a dropdown of gate
   names from useVenue() and say location is unavailable.
 - "Description (Optional)": textarea, live counter, max 150 chars.
 - "Add Photo (Optional)": thumbnail beside a camera capture tile; on selection
   call uploadPhoto(file) and hold the returned photoId.
 - Full-width red "SUBMIT REPORT", enabled the moment a category is chosen.
   Never require description or photo.
On submit call submitReport({category, description, phone, lat, lng, zone,
photoId}), keep the returned incidentId, go to screen 3. If merged is true, show
"Merged with nearby reports" on screen 4.

SCREEN 3 REPORT SUBMITTING (light): centered red shield in concentric pulsing
rings, "Report is submitting..." and "Please don't close the app." Below it a
five-row checklist ticking green from the REAL status via useTrack(incidentId):
   Sending report             -> submitReport resolved
   Verifying information      -> status ai_processing
   Analyzing incident         -> status ai_processing
   Finding nearest responders -> status verified
   Preparing response         -> status dispatched
Active row shows a spinner. Soft red footer card: "Help is on the way. Please
stay calm." Advance to screen 4 once status reaches verified.

SCREEN 4 TRACK REPORT (light), one screen with two states. Header "Track Report"
plus info icon. Card showing "Incident ID" in red mono via displayId() and "Status".
 (a) status verified: "Finding Responder" in amber with a spinner, a centered
     illustration, "We are finding the nearest available responder." and
     "This may take a few moments."
 (b) status dispatched | en_route | on_scene: "Responder Assigned" in green with
     a check. Responder card showing responder.code and a friendly name for
     responder.role with a vehicle icon, and responder.etaMin as a large red
     number of minutes updating live. Caption "We've assigned the nearest
     responder to your location." An outlined red "VIEW LIVE TRACKING" button
     opens a map where the responder marker moves as its lat/lng change.
 status resolved: "Resolved. Stay safe."
Footer card on both: "Help is on the way. Stay calm and stay safe."
A quiet link "What to do next" opens screen 5.

SCREEN 5 WHAT TO DO NEXT (light): header "What to do next". Soft red banner with
the category icon and label and "AI Severity: <label> (P<priority>)". Heading
"Follow these guidelines", then every string in sopSteps as its own card with a
left icon. Small caption beneath reading sopSource. Bottom: full-width red
"EMERGENCY HELPLINE" calling tel:112, then a compact row of three buttons —
100 POLICE (tel:100), 101 FIRE (tel:101), 102 AMBULANCE (tel:102). Use these
real Indian numbers, never a placeholder.

════════ STEP 3 — ROUTE /responder : RESPONDER (dark) ════════
Gate the route with a small passcode card: one field, "ENTER", calling
responderLogin(passcode). Render nothing else until ok is true. Remember success
in localStorage so a device types it once. Show an inline error when ok is false.

Then a unit selector listing useResponders() as "code — name (role)", persisted
in localStorage. Find this unit's job from useBoard(): the incident whose
responder.code equals the selected unit's code and whose status is not resolved.

No job: a calm standby card — "Standing by", the unit code, a coloured role
badge, and a small on-duty dot.
With a job: an assignment card with category icon, priority badge, headline,
zone, ETA, and sopSteps as a compact checklist.

ONE large primary button showing only the next valid step:
   dispatched -> "ACCEPT"    calls accept(incidentId)
   en_route   -> "ON SCENE"  calls onScene(incidentId)
   on_scene   -> "RESOLVED"  calls resolve(incidentId)
Disable it while a call is in flight so it cannot double-fire.

Below it a map with a route line from the unit to the incident in the role colour.
At the bottom a toggle "Simulate movement (demo)": while on and status is
en_route, call moveResponder(responderId, lat, lng) every 3 seconds with the
position interpolated 25% closer to the incident each time; while off, use
navigator.geolocation.watchPosition and send real coordinates. Thumb-reachable.

════════ STEP 4 — ROUTE /command : COMMAND DASHBOARD (dark) ════════
Centered login card first: email, password, "LOG IN", AEGIS mark, caption
"Authorized venue operators only." Call login(email, password); render nothing
else until ok. Persist the session in localStorage. Inline error when ok is false.

Then a three-column layout, stacking vertically below 1000px.

HEADER STRIP — four stat tiles from useBoard() and useResponders():
  Active Incidents = status not resolved · Critical (P1) = priority 1 and not
  resolved · Units Online = responders.length · Resolved Today = status resolved.
The Critical tile turns red and pulses slowly when above zero.

LEFT — LIVE INCIDENT MAP centred on useVenue() centerLat/centerLng: an incident
pin per active incident coloured by priority, a dot per responder coloured by
role, and a labelled marker per gate with exit gates marked distinctly. If no map
library is available, draw a clean schematic venue plan — never an empty box.
Beneath it a RECENT INCIDENTS table: ID (displayId), Type, Location (zone),
Priority, Reported At, Status.

MIDDLE — incident queue from useBoard(), newest first, excluding resolved. Each
card: priority badge, headline, zone, "N reports" from reportCount, confidence as
a percentage, status chip, and responder.code when assigned. Selected card gets a
red left border. P1 cards pulse slowly.

RIGHT — detail panel from useDetail(selectedId):
 - Title row: category icon, headline, priority badge, status chip.
 - Meta row: reported time, "Reported by Anonymous", displayId.
 - The summary text.
 - "AI SUGGESTION" panel captioned "Based on incident analysis": the summary and
   a confidence bar showing confidence as a percentage. If aiFailed is true,
   replace it with an amber notice: "AI unavailable — manual mode. Rule-based
   severity applied."
 - "RECOMMENDED ACTIONS": each string in sopSteps as a numbered row, with a small
   caption beneath reading sopSource.
 - Photos as thumbnails when present.
 - A red "DISPATCH NEAREST UNIT" calling dispatch(_id). Once assignedResponderId
   exists, hide it and show the assigned unit's code, role and status instead.
 - "MARK RESOLVED" calling resolve(_id).
 - ACTIVITY FEED from events[], oldest first, each row a mono timestamp and msg.
 - Broadcast composer "Exit guidance broadcast": text input, template chips
   ("Evacuate via Gate 3B", "Avoid the east concourse", "Medical corridor in use
   — keep Gate 2 clear"), SEND calling sendBroadcast(message), CLEAR calling
   clearBroadcast().
Caption beneath the AI panel: "AI recommends. Operators decide."

A left sidebar may render navigation labels (Dashboard, Incidents, Map View,
Units, Activity) as visual chrome ONLY. Do not create routes or pages for them.

════════ FINALLY ════════
Make it feel like a real emergency product a venue would actually deploy:
restrained, fast, legible at a glance, nothing decorative. Ship all three routes
fully working against the live backend.
```

---

## After the build

1. Check `/` on a phone → tap SOS → Medical → submit. It must appear on
   `/command` within about a second with a priority, AI summary and NDMA steps.
2. `DISPATCH NEAREST UNIT` → a role-matched unit is assigned.
3. Second phone on `/responder` → passcode `<responder passcode>` → pick the unit → `ACCEPT`
   → phone 1 flips to "Responder Assigned" with a live ETA.
4. Broadcast from `/command` → amber banner on phone 1 within a second.
5. Deploy on EnterPro. Reset data before pitching:
   `npx convex run seed:resetIncidents`

**If `npm install convex` is unavailable**, change only the two import lines in
`src/aegis-backend.js` to the CDN build — the rest of the file is identical:

```js
import { ConvexClient } from "https://esm.sh/convex@1.42.3/browser";
import { anyApi } from "https://esm.sh/convex@1.42.3/server";
```

Prefer the npm package: the CDN version fetches the client at runtime, so flaky
venue wifi would break the app on stage.

**If neither works**, swap that one file for REST calls against
`https://judicious-oyster-529.convex.site` with a 3 second poll. Every function
has an endpoint; see `ENTERPRO_BUILD_PACK.md` §7. The UI never changes, because
nothing else touches data.
