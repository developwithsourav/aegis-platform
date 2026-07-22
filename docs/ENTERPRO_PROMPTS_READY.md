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

DESIGN SYSTEM "Guardian Red" — a professional emergency product, dark UI.
Colors: background #0A0A0C, surface #141417, card #1B1B1F, border #2A2A30,
primary red #E11D2E, soft red rgba(225,29,46,0.12), text #F5F5F6,
muted #8E8E96, success green #22C55E, warning amber #F59E0B.
NEVER use blue anywhere.
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
the central store. Optimize it so a frightened person gets help in under 10
seconds, one-handed.

SCREEN A — Report (the default view):
- A calm headline "What's happening?" and one line of guidance:
  "Tap once. Help is dispatched immediately. Details can come after."
- SIX large category tiles in a 2x3 grid, each at least 100px tall, with a clear
  icon and label: Fire, Medical, Crowd Crush, Accident, Violence, Other.
- A single tap on a tile IMMEDIATELY submits the report. No confirmation dialog
  and no second screen. Show a brief pressed state on the tapped tile.
- Beneath the grid, a quiet status line for location:
  "Location locked" / "Locating..." / "Location unavailable — choose a zone".
  Only when unavailable, reveal a zone dropdown.
- Fixed at the bottom, an emergency helpline strip: four tap-to-call buttons
  linking to tel:112, tel:100, tel:101 and tel:102, labelled
  112 ALL / 100 POLICE / 101 FIRE / 102 AMBULANCE.

SCREEN B — Tracking (replaces Screen A after submitting):
- A large reassuring status line driven by incident status, in this order:
  "Analyzing your report..." -> "Verified. Finding the nearest responder..." ->
  "Responder assigned" -> "Help is on the way" -> "Responder has arrived" ->
  "Resolved. Stay safe."
- A priority chip (P1 red, P2 amber, P3 and P4 green) plus the incident headline
  and zone.
- Once assigned, a responder card: role and unit code, a vehicle icon, and a
  large ETA in minutes that updates live.
- "While you wait" — the AI-retrieved guidance steps as a numbered checklist of
  cards, with a small source caption underneath.
- An OPTIONAL enrichment card, collapsed by default, titled "Add details
  (optional)": a 140-character description field, a photo capture button, and a
  callback number field, each with its own small save action. Caption it:
  "Your report is already helping. Add these only if it's safe to."
- A red "CALL 112" button that is always visible.
- A quiet text link "Report something else" returning to Screen A.

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
