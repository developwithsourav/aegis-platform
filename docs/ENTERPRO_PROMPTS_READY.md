# AEGIS — EnterPro prompts, ready to paste

Five prompts, in order. Each is **self-contained** — copy the whole block.

The important rule baked into these prompts: **the mock store uses the exact
function names, arguments and field names of the real Convex backend.** So the
final wiring step replaces the *inside* of one module and nothing else — no route
changes, no renamed props, no restructured components. Build once, wire once.

Run them one at a time. For small visual fixes, edit the code directly rather
than re-prompting — that is where credits disappear.

---

## §0 BACKEND CONTRACT — already inlined into Prompt 1, kept here for reference

Live and deployed at `https://judicious-oyster-529.convex.cloud`.

**Reads (live subscriptions)**

| Call | Returns |
|---|---|
| `useBoard()` | `incident[]`, newest first |
| `useDetail(incidentId)` | incident + `reports[]`, `events[]`, `photos[]` (URLs), `responder` |
| `useTrack(incidentId)` | `{status, priority, headline, sopSteps[], sopSource, lat, lng, zone, responder}` |
| `useBroadcast()` | `{message, active}` or `null` |
| `useResponders()` | `responder[]` |
| `useVenue()` | `{name, centerLat, centerLng, zoomLevel, gates[]}` |

**Writes**

`submitReport({category, description?, phone?, lat?, lng?, zone?, photoId?})` → `{incidentId, merged}`
`dispatch(incidentId)` → `{ok, responder}` · `accept(incidentId)` · `onScene(incidentId)` · `resolve(incidentId)`
`sendBroadcast(message)` · `clearBroadcast()` · `moveResponder(responderId, lat, lng)`
`login(email, password)` → `{ok, name}` · `uploadPhoto(file)` → `photoId` · `getPosition()` → `{lat, lng} | null`

**Object shapes**

`incident` = `_id, _creationTime, category, priority, headline, summary, confidence, sopSteps[], sopSource, reportCount, lat, lng, zone, status, assignedResponderId, aiFailed, responder{code,role,lat,lng}`
`responder` = `_id, code, name, role, lat, lng, available, lastSeen` (plus `etaMin` inside `useTrack`)
`event` = `_id, _creationTime, msg`

**Fixed enums — never invent new ones**

- category: `fire` `medical` `crowd` `accident_infra` `violence_security` `other`
- status: `ai_processing` `verified` `dispatched` `en_route` `on_scene` `resolved`
- role: `fire` `medic` `marshal` `security` (there is no police role)
- priority: `1` Critical · `2` Urgent · `3` Standard · `4` Logged

**Seeded units:** F-12 Fire Squad 12 · E-02 Medic Team 2 · E-05 Medic Team 5 · M-07 Marshal 7 · S-04 Security 4
**Dispatch is one unit per incident**, chosen by role match then nearest.

---

## PROMPT 1 — App shell and the data contract

```
Build a React app called AEGIS — an AI emergency response system for crowded
venues such as concerts, festivals and stadiums.

DESIGN SYSTEM "Guardian Red" — a professional emergency product, TWO surfaces.
PUBLIC SURFACE (the Reporter route) is LIGHT, so it stays readable outdoors in
direct sunlight: page #FFFFFF, subtle panel #F7F8FA, border #E8E9EC,
text #0A0A0C, muted #6B6C72, primary red #E11D2E, soft red #FDECEE.
The Reporter HOME screen is the one exception: a dark cinematic hero (#0A0A0C
over a dimmed crowd photograph) carrying the round red SOS button. Every screen
after it is light.
OPERATIONAL SURFACE (Command and Responder routes) is DARK, for a control room
and a projector: background #0A0A0C, surface #141417, card #1B1B1F,
border #2A2A30, text #F5F5F6, muted #8E8E96.
Shared accents: primary red #E11D2E, success green #22C55E, warning amber
#F59E0B. Priority colors: P1 red, P2 amber, P3 and P4 green. Role colors are
used ONLY on a responder role badge and route line: fire red, medic green,
marshal amber, security purple. Never use blue as a UI color.
Type: Inter or system font. Tight, confident, high contrast. Unit codes and
numbers in tabular/mono. Uppercase letter-spaced micro-labels for status chips.
Form: rounded 12-16px, generous padding, 1px borders rather than shadows, a red
glow only on the primary emergency action. Calm and professional. No decorative
illustrations beyond the two empty states, no emoji, no marketing copy.
Motion: 150ms transitions, a slow pulse on P1 only, respect prefers-reduced-motion.
Accessibility: 44px minimum touch targets, WCAG AA contrast, visible focus
rings, keyboard navigable, aria-live on status changes. Mobile-first.

EXACTLY three routes, client-side routed. Do not add any others:
  /           Reporter (public)
  /command    Command dashboard (public route, gated by a login screen)
  /responder  Responder (public)

Shared shell: a slim top bar with a slowly pulsing red dot, the wordmark AEGIS
in letter-spaced caps, and on the right a connection indicator and live clock.
Directly beneath it an announcement banner slot: when an announcement is active,
a full-width amber bar with its message; hidden otherwise. The Reporter route
hides the clock.

Create ONE module `src/aegis-store.js` holding ALL data access. Components must
never fetch. Back it with realistic MOCK data for now, but it must expose
EXACTLY these names, arguments and field names, because I will later swap its
internals for a real backend and nothing else may change:

  useBoard()                -> array of incident
  useDetail(incidentId)     -> incident plus reports[], events[], photos[], responder
  useTrack(incidentId)      -> { status, priority, headline, sopSteps[], sopSource,
                                 lat, lng, zone, responder }
  useBroadcast()            -> { message, active } or null
  useResponders()           -> array of responder
  useVenue()                -> { name, centerLat, centerLng, zoomLevel, gates[] }
  submitReport({ category, description, phone, lat, lng, zone, photoId })
                            -> { incidentId, merged }
  dispatch(incidentId) / accept(incidentId) / onScene(incidentId) / resolve(incidentId)
  sendBroadcast(message) / clearBroadcast()
  moveResponder(responderId, lat, lng)
  login(email, password)    -> { ok, name }
  uploadPhoto(file)         -> photoId
  getPosition()             -> { lat, lng } or null

  incident   = _id, _creationTime, category, priority, headline, summary,
               confidence, sopSteps[], sopSource, reportCount, lat, lng, zone,
               status, assignedResponderId, aiFailed, responder{code,role,lat,lng}
  responder  = _id, code, name, role, lat, lng, available, lastSeen
               (useTrack's responder also carries etaMin)
  event      = _id, _creationTime, msg

FIXED ENUMS — never invent values outside these:
  category: fire | medical | crowd | accident_infra | violence_security | other
  status:   ai_processing | verified | dispatched | en_route | on_scene | resolved
  role:     fire | medic | marshal | security      (there is no police role)
  priority: 1 Critical | 2 Urgent | 3 Standard | 4 Logged

Mock units: F-12 Fire Squad 12 (fire), E-02 Medic Team 2 (medic), E-05 Medic
Team 5 (medic), M-07 Marshal 7 (marshal), S-04 Security 4 (security).
One incident is assigned ONE unit. Treat these hooks as live: they update on
their own, so never write polling or setInterval refresh logic.

Display rule: show a Convex _id to users as "AEGIS-" plus its last 8 characters
uppercased. Keep the raw _id for all calls.

Do not build a landing page, a marketing site, or a sign-up flow.
```

---

## PROMPT 2 — Reporter (light surface, five screens)

```
Build the Reporter route (/) using the Guardian Red design system and
src/aegis-store.js. Five screens in sequence, light surface except screen 1.
One-handed on a phone throughout.

SCREEN 1 — HOME (the only dark screen):
Dark cinematic background over a dimmed crowd photograph. Centered: the AEGIS
shield mark, "AEGIS", subtitle "Smart Emergency Response System". Below it a
circular red SOS button at least 190px across with a soft glow and slow
breathing pulse, labelled "SOS" over "REPORT EMERGENCY". Beneath it a pill with
a location icon, "Location Access", and a green "Enabled" check driven by the
real permission state. Caption: "Your location helps us respond faster."
Top bar: menu icon left, notification bell right.
Call getPosition() as soon as this screen mounts, never at submit time.
Tapping SOS goes to screen 2.

SCREEN 2 — REPORT EMERGENCY (light):
Back chevron, title "Report Emergency", heading "What's happening?".
A 3x2 grid of six category tiles, icon above label, mapping exactly to:
  Fire=fire, Medical=medical, Crowd=crowd, Accident=accident_infra,
  Violence=violence_security, Other=other
The selected tile fills #FDECEE with a red border and red label. Then:
- "Location (Auto)": a bordered field showing the zone resolved from
  getPosition(), with a pin icon and a re-locate button. If position is null,
  turn it into a zone dropdown of the venue gate names from useVenue() and say
  so plainly.
- "Description (Optional)": textarea, live character counter, max 150.
- "Add Photo (Optional)": thumbnail preview beside a camera capture tile;
  on selection call uploadPhoto(file) and keep the returned photoId.
- Full-width red "SUBMIT REPORT", enabled as soon as a category is chosen.
  Never require description or photo.
On submit call submitReport({ category, description, phone, lat, lng, zone,
photoId }), keep the returned incidentId, and go to screen 3. If merged is true,
add the line "Merged with nearby reports" on screen 4.

SCREEN 3 — REPORT SUBMITTING (light):
Centered red shield inside concentric pulsing rings. "Report is submitting..."
and "Please don't close the app." Below, a five-row checklist ticking green
driven by the REAL status from useTrack(incidentId), mapped exactly:
  Sending report            -> done once submitReport resolves
  Verifying information     -> status ai_processing
  Analyzing incident        -> status ai_processing
  Finding nearest responders-> status verified
  Preparing response        -> status dispatched
The active row shows a spinner. Soft red footer card: "Help is on the way.
Please stay calm." Advance to screen 4 once status reaches verified.

SCREEN 4 — TRACK REPORT (light), two states of one screen:
Header "Track Report" with an info icon. A card with "Incident ID" shown in red
mono using the AEGIS- display format, and "Status".
(a) status verified: "Finding Responder" in amber with a spinner, a centered
    illustration, "We are finding the nearest available responder." and
    "This may take a few moments."
(b) status dispatched, en_route or on_scene: "Responder Assigned" in green with
    a check. A responder card with responder.code and responder.role rendered as
    a friendly name and a vehicle icon, and responder.etaMin as a large red
    number of minutes that updates live. Caption "We've assigned the nearest
    responder to your location." An outlined red "VIEW LIVE TRACKING" button
    opens a map with the responder marker moving as its lat/lng change.
When status is resolved show "Resolved. Stay safe."
Both states keep a footer card: "Help is on the way. Stay calm and stay safe."
A quiet link "What to do next" opens screen 5.

SCREEN 5 — WHAT TO DO NEXT (light):
Header "What to do next". A soft red banner with the category icon and label,
and "AI Severity:" using the priority label (1 Critical, 2 Urgent, 3 Standard,
4 Logged) plus "(P1)" style suffix. Heading "Follow these guidelines", then
every string in sopSteps as its own card with an icon on the left. Beneath them
a small caption reading sopSource. At the bottom a full-width red "EMERGENCY
HELPLINE" button calling tel:112, and a compact row of three smaller buttons:
100 POLICE (tel:100), 101 FIRE (tel:101), 102 AMBULANCE (tel:102).
Use these real Indian numbers, never a placeholder.

Show the announcement banner from useBroadcast() on every screen.
Use aria-live so status changes are announced to screen readers.
```

---

## PROMPT 3 — Command dashboard (dark surface)

```
Build the Command dashboard route (/command) using the Guardian Red dark surface
and src/aegis-store.js. This is projected in a venue control room.

First a centered login card: email, password, "LOG IN", the AEGIS mark, and the
caption "Authorized venue operators only." Call login(email, password); render
nothing else until it returns ok. Keep the session in localStorage. Show a clear
inline error when ok is false.

After login, a three-column layout that stacks vertically below 1000px.

HEADER STRIP — four stat tiles computed from useBoard() and useResponders():
  Active Incidents  = incidents whose status is not resolved
  Critical (P1)     = those with priority 1 and status not resolved
  Units Online      = responders.length
  Resolved Today    = incidents with status resolved
The Critical tile turns red and pulses slowly when above zero.

LEFT COLUMN — LIVE INCIDENT MAP. Center it on useVenue() centerLat/centerLng.
Plot an incident pin per active incident coloured by priority, a small dot per
responder coloured by role, and a labelled marker per venue gate, marking exit
gates distinctly. If a map library is unavailable, draw a clean schematic venue
plan instead — never leave an empty box.
Below the map, a RECENT INCIDENTS table: ID (AEGIS- display format), Type,
Location (zone), Priority, Reported At, Status.

MIDDLE COLUMN — incident queue from useBoard(), newest first, excluding
resolved. Each card: priority badge, headline, zone, reportCount as "N reports",
confidence as a percentage, status chip, and responder.code when assigned.
The selected card gets a red left border. P1 cards pulse slowly.

RIGHT COLUMN — detail panel for the selected incident, from useDetail(id):
- Title row: category icon, headline, priority badge, status chip.
- A meta row: reported time, "Reported by Anonymous", and the AEGIS- incident ID.
- The summary text.
- An "AI SUGGESTION" panel captioned "Based on incident analysis", showing the
  summary and a confidence bar rendering confidence as a percentage. If aiFailed
  is true, replace the panel with an amber notice: "AI unavailable — manual mode.
  Rule-based severity applied."
- "RECOMMENDED ACTIONS": every string in sopSteps as a numbered row, with a
  small caption beneath reading sopSource.
- Any photos as thumbnails.
- A red "DISPATCH NEAREST UNIT" button calling dispatch(_id). One incident gets
  ONE unit. Once assignedResponderId exists, hide the button and show the
  assigned unit's code, role and status instead.
- A "MARK RESOLVED" button calling resolve(_id).
- An ACTIVITY FEED from events[], newest last, each row a monospace timestamp
  and msg.
- A broadcast composer titled "Exit guidance broadcast": a text input, quick
  template chips ("Evacuate via Gate 3B", "Avoid the east concourse",
  "Medical corridor in use — keep Gate 2 clear"), a SEND button calling
  sendBroadcast(message) and a CLEAR button calling clearBroadcast().

A left sidebar may show navigation labels (Dashboard, Incidents, Map View,
Units, Activity) purely as visual chrome — do NOT create routes or pages for
them. Only /command exists.

Caption beneath the AI panel: "AI recommends. Operators decide."
```

---

## PROMPT 4 — Responder (dark surface)

```
Build the Responder route (/responder) using the Guardian Red dark surface and
src/aegis-store.js. Used on a phone by venue staff while walking fast.

At the top a unit selector listing useResponders() as "code — name (role)".
Persist the choice in localStorage.

Find this unit's active job from useBoard(): the incident whose responder.code
matches the selected unit and whose status is not resolved.

With no job, show a calm standby card: "Standing by", the unit code, its role as
a coloured role badge, and a small on-duty indicator.

With a job, show an assignment card: category icon, priority badge, headline,
zone, ETA in minutes, and sopSteps as a compact checklist.

ONE large primary action button showing only the next valid step:
  status dispatched -> "ACCEPT"   calls accept(incidentId)
  status en_route   -> "ON SCENE" calls onScene(incidentId)
  status on_scene   -> "RESOLVED" calls resolve(incidentId)
Disable it while a call is in flight so it cannot double-fire. There is no
decline action — do not add one.

Below it a map showing a route line from the unit to the incident, using the
role colour.

At the bottom a small toggle "Simulate movement (demo)". While it is on and the
status is en_route, call moveResponder(responderId, lat, lng) every 3 seconds
with the position interpolated 25% closer to the incident each time. While it is
off, use navigator.geolocation.watchPosition and send real coordinates instead.

Buttons must be thumb-reachable.
```

---

## PROMPT 5 — Swap the mock store for the live backend

Because Prompt 1 defined the mock store with the real contract, this step
replaces one file and touches nothing else.

**First** create `src/aegis-backend.js` with the code in
`ENTERPRO_BUILD_PACK.md` §7. **Then** send:

```
I've added src/aegis-backend.js, which connects to our real Convex backend at
https://judicious-oyster-529.convex.cloud and exports exactly the same names,
arguments and field names that src/aegis-store.js already exposes.

Re-point src/aegis-store.js at it: every hook and function should now delegate
to aegis-backend.js instead of the mock data. Delete the mock data.

Change nothing else. Do not touch routes, components, props, styling or layout.
Do not rename anything. These hooks are live subscriptions that push updates on
their own, so do not add polling, setInterval refreshes or manual refetching.
```

---

## Verify, then submit

1. Deploy through EnterPro. Deployment must be on EnterPro — disqualification rule.
2. On a phone, allow location, tap SOS, pick **Medical**, submit. Within about a
   second it appears on `/command` with a priority, an AI summary and
   NDMA-sourced steps.
3. Hit **DISPATCH NEAREST UNIT** — a role-matched unit is assigned.
4. Second phone on `/responder`: pick that unit, **ACCEPT** — phone 1 flips to
   "Responder Assigned" with a live ETA.
5. Send a broadcast — the amber banner appears on phone 1 within a second.
6. Reset before pitching: `npx convex run seed:resetIncidents`

Submit the deployed EnterPro URL.
