# AEGIS — EnterPro prompts, ready to paste

Five prompts, in order. Each one is **self-contained** — the design system is already
inlined, so just copy the whole block. Strategy and guardrails live in
`ENTERPRO_BUILD_PACK.md`; this file is only the paste-ready text.

**Run them one at a time.** Finish a prompt, look at the result, then move to the next.
Re-prompting to nudge small things is the single biggest waste of credits — for minor
visual fixes, edit the code directly instead.

---

## PROMPT 1 — App shell

```
Build a React app called AEGIS — an AI emergency response system for crowded
venues such as concerts, festivals and stadiums.

DESIGN SYSTEM "Guardian Red" — a professional emergency product, TWO surfaces.

PUBLIC SURFACE (the Reporter route) is LIGHT, so it stays readable outdoors in
direct sunlight: page #FFFFFF, subtle panel #F7F8FA, border #E8E9EC,
text #0A0A0C, muted #6B6C72, primary red #E11D2E, soft red #FDECEE.
The Reporter HOME screen is the one exception: a dark cinematic hero
(#0A0A0C with a dimmed crowd photograph) carrying the round red SOS button.
Every screen after it is light.

OPERATIONAL SURFACE (Command and Responder routes) is DARK, for a control room
and a projector: background #0A0A0C, surface #141417, card #1B1B1F,
border #2A2A30, text #F5F5F6, muted #8E8E96.

Shared accents on both: primary red #E11D2E, success green #22C55E,
warning amber #F59E0B. Priority colors: P1 red, P2 amber, P3 and P4 green.
Responder role colors are allowed and only used for the role badge and route
line: fire red, medical green, security purple, police blue. Outside of that
role badge, never use blue as a UI color.

Type: Inter or system font. Tight, confident, high contrast. Numbers and unit
codes in tabular/mono. Uppercase micro-labels with letter-spacing for status chips.
Form: rounded corners 12-16px, generous padding, 1px borders rather than shadows,
a subtle red glow only on the primary emergency action. Calm, not flashy — this is
used by professionals under stress and by frightened members of the public. No
decorative illustrations, no emoji, no marketing copy.
Motion: fast and purposeful, 150ms transitions. A slow pulse on P1 items only.
Respect prefers-reduced-motion.
Accessibility: minimum 44px touch targets, WCAG AA contrast, visible focus rings,
full keyboard navigation, aria-live on status changes.
Mobile-first.

Create three routes with client-side routing:
  /           Reporter (public)
  /command    Command dashboard (public route, gated by a login screen)
  /responder  Responder (public)

Shared shell:
- A slim top bar: a red dot that slowly pulses, the wordmark "AEGIS" in
  letter-spaced caps, and on the right a live connection indicator and clock.
- An announcement banner slot directly beneath the top bar: when an announcement
  is active, show a full-width amber bar with the message. Hidden otherwise.
- The Reporter route hides the clock; it should feel like an app, not a console.

Create ONE central store module (React context plus hooks) exposing:
  broadcast, submitReport(), incidents[], selectedIncident, responders[], venue,
  myIncident, trackData, login(), dispatch(), resolve(), sendBroadcast(),
  acceptAssignment(), markOnScene(), updateResponderLocation()
Back these with realistic MOCK data for now so the UI is fully clickable.
I will replace the store internals with a real backend in a later step, so keep
ALL data access inside that one module and never fetch inside components.

Do not build a landing page, a marketing site, or a sign-up flow.
```

---

## PROMPT 2 — Reporter (the emergency path)

```
Build the Reporter route (/) using the existing Guardian Red design system and
the central store. Five screens in sequence. The Reporter is the LIGHT surface,
except screen 1. Everything must work one-handed on a phone.

SCREEN 1 — HOME (the only dark screen):
Dark cinematic background (#0A0A0C over a dimmed crowd photograph). Centered:
the AEGIS shield mark, "AEGIS", and the subtitle "Smart Emergency Response
System". Below it a large circular red SOS button, at least 190px across, with a
soft red glow and a slow breathing pulse, labelled "SOS" over "REPORT EMERGENCY".
Beneath the button a small pill: a location icon, "Location Access", and a green
"Enabled" check. A caption underneath: "Your location helps us respond faster."
Top bar has a menu icon on the left and a notification bell on the right.
Tapping SOS goes to screen 2. Begin resolving GPS the moment this screen loads,
never on submit.

SCREEN 2 — REPORT EMERGENCY (light):
Back chevron and the title "Report Emergency". Heading "What's happening?".
A 3x2 grid of six category tiles with icon above label: Fire, Medical, Crowd,
Accident, Violence, Other. The selected tile fills soft red #FDECEE with a red
border and red label. Then:
- "Location (Auto)" — a bordered field showing the resolved zone (for example
  "Gate 3, Block B") with a pin icon and a re-locate button on the right. If GPS
  is unavailable, turn this into a zone dropdown and say so plainly.
- "Description (Optional)" — a textarea with a live character counter, max 150.
- "Add Photo (Optional)" — a thumbnail preview beside a camera capture tile.
- A full-width red "SUBMIT REPORT" button, enabled as soon as a category is
  chosen. Never require the description or the photo.

SCREEN 3 — REPORT SUBMITTING (light):
A centered red shield mark inside concentric pulsing rings. "Report is
submitting..." and "Please don't close the app." Below, a staged checklist that
ticks green in order as the real status advances: Sending report, Verifying
information, Analyzing incident, Finding nearest responders, Preparing response.
The active row shows a spinner. A soft red footer card: "Help is on the way.
Please stay calm."

SCREEN 4 — TRACK REPORT (light), two states of one screen:
Header "Track Report" with an info icon. A card showing "Incident ID" in red
mono and "Status".
(a) Awaiting assignment: status "Finding Responder" in amber with a spinner, a
    centered illustration, "We are finding the nearest available responder." and
    "This may take a few moments."
(b) Assigned: status "Responder Assigned" in green with a check. A responder
    card showing the unit name (for example "Fire Squad 12") with a vehicle icon,
    and "ETA" as a large red number in minutes, updating live. Caption: "We've
    assigned the nearest responder to your location." Then an outlined red
    "VIEW LIVE TRACKING" button opening a map with the responder marker moving.
Both states keep the footer card "Help is on the way. Stay calm and stay safe."

SCREEN 5 — WHAT TO DO NEXT (light):
Header "What to do next". A soft red banner showing the category with its icon,
and "AI Severity: High (P1)" using the real priority. Heading "Follow these
guidelines", then the AI-retrieved steps as cards, each with an icon on the left
and the step text. A small caption naming the source document. At the bottom a
full-width red "EMERGENCY HELPLINE" button that calls tel:112, plus a compact
row of three smaller call buttons: 100 POLICE, 101 FIRE, 102 AMBULANCE.
Use the real Indian emergency numbers, never a placeholder number.

Use aria-live so status changes are announced to screen readers.
```

---

## PROMPT 3 — Command dashboard

```
Build the Command dashboard route (/command) using the existing Guardian Red
design system and the central store. This is shown on a projector in a venue
control room.

First a centered login card: email field, password field, "LOG IN" button, the
AEGIS mark, and the caption "Authorized venue operators only." Nothing else
renders until login succeeds. Show a clear inline error on failure.

After login, a three-column desktop layout that stacks vertically below 1000px:

HEADER STRIP: four stat tiles — Active Incidents, Critical (P1), Units Online,
Resolved Today. The P1 tile turns red and pulses slowly when its count is above 0.

LEFT COLUMN — venue map panel: a map area with incident pins colored by priority,
small dots for responders, and labelled gate markers. If a map library is not
available, render a clean schematic venue plan instead. Never leave an empty box.

MIDDLE COLUMN — incident queue, newest first. Each card shows: priority badge,
headline, zone, report count, AI confidence percentage, status chip, and assigned
unit code. The selected card gets a red left border. P1 cards pulse slowly.

RIGHT COLUMN — detail panel for the selected incident:
- An AI SUGGESTION panel with the AI summary and a confidence bar showing the
  percentage.
- "RECOMMENDED ACTIONS" — the SOP steps as a numbered list, with a small caption
  naming the source document beneath.
- A photo thumbnail area shown when a photo exists.
- Two primary buttons: "DISPATCH NEAREST" (green) and "MARK RESOLVED". Hide
  DISPATCH once a unit is assigned and show the assigned unit and ETA instead.
- An activity feed of timestamped events, newest last, monospace timestamps.
- A broadcast composer titled "Exit guidance broadcast": a text input, quick
  template chips ("Evacuate via Gate 3B", "Avoid the east concourse",
  "Medical corridor in use — keep Gate 2 clear"), and SEND and CLEAR buttons.

Add a small caption beneath the AI panel: "AI recommends. Operators decide."
```

---

## PROMPT 4 — Responder

```
Build the Responder route (/responder) using the existing Guardian Red design
system and the central store. This is used on a phone by venue staff.

At the top, a unit selector dropdown listing units by code and role. Once chosen,
remember the selection in localStorage.

With no assignment, show a calm standby card: "Standing by", the unit code and
role, and a small on-duty indicator.

When assigned, show an assignment card with: category icon, priority badge,
headline, zone, distance and ETA, and the SOP steps as a compact checklist.

One large primary action button advances the lifecycle, showing only the next
valid step:
  dispatched -> "ACCEPT"      en_route -> "ON SCENE"      on_scene -> "RESOLVED"
Each press is a single confident tap. Disable the button while a press is in
flight so it cannot be double-fired.

Below that, a map area showing a route line from the unit to the incident.

At the bottom, a small toggle labelled "Simulate movement (demo)". When it is on,
the unit's position interpolates toward the incident every 3 seconds. When it is
off, use the device's real GPS via watchPosition while en route.

Buttons must be reachable with a thumb. This is used while walking fast.
```

---

## PROMPT 5 — Wire to the real Convex backend

**First** create the file `src/aegis-backend.js` with exactly the contents in
`ENTERPRO_BUILD_PACK.md` §7 (it connects to `https://judicious-oyster-529.convex.cloud`).
**Then** send this prompt:

```
I've added src/aegis-backend.js, which connects to our real Convex backend and
exports live subscription hooks and mutation functions.

Replace the mock central store with these. Specifically:
- Reporter: on a category tap, call getPosition() then submitReport({ category,
  lat, lng }), keep the returned incidentId, and switch to the tracking screen
  driven by useTrack(incidentId). Never block submission on GPS for more than 4
  seconds — submit without coordinates if it takes longer.
- Command: useBoard() for the queue and the stat tiles, useDetail(selectedId) for
  the detail panel, login() to gate the dashboard (keep the session in
  localStorage), and dispatch / resolve / sendBroadcast / clearBroadcast for the
  buttons.
- Responder: useResponders() for the unit dropdown, useBoard() to find this unit's
  active assignment, and accept / onScene / resolve for the action button.
- The announcement banner on every route: useBroadcast().

These hooks are LIVE and push updates automatically. Do not add polling,
setInterval refreshes, or any manual refetching.
Keep all existing styling and layout exactly as it is. Only swap the data layer.
```

If EnterPro guesses field names wrong, paste the field table from
`ENTERPRO_BUILD_PACK.md` §7. Categories are exactly `fire`, `medical`, `crowd`,
`accident_infra`, `violence_security`, `other`. Statuses are exactly
`ai_processing`, `verified`, `dispatched`, `en_route`, `on_scene`, `resolved`.

---

## After prompt 5

1. Deploy through EnterPro (deployment must be on EnterPro — disqualification rule).
2. On a phone, allow location and tap **Medical**. Within about a second it should
   appear on `/command` with a P-level, an AI summary, and NDMA-sourced steps.
3. Tap **DISPATCH NEAREST** — a role-matched unit is assigned.
4. On a second phone open `/responder`, pick that unit, tap **ACCEPT** — phone 1
   shows "Help is on the way" with a live ETA.
5. Send a broadcast — the amber banner appears on phone 1 within a second.
6. Before pitching, reset the data: `npx convex run seed:resetIncidents`
