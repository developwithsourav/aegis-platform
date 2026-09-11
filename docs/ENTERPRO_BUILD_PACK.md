# AEGIS — EnterPro Build Pack (v4, FINAL)

Reference only: strategy, the REST fallback contract, and credit guardrails.

> ## 👉 The prompt you paste is [`ENTERPRO_MASTER_PROMPT.md`](ENTERPRO_MASTER_PROMPT.md)
>
> That file is the single source of truth for the build. Come back here only for
> the REST fallback endpoints (§7) if `esm.sh` is blocked inside EnterPro.
> The per-screen prompts below are superseded — they describe an earlier
> mock-first plan and an all-dark theme.

**Rules this satisfies:** built with EnterPro ✅ · deployed via EnterPro ✅ · Convex is the real backend ✅ · one public URL to submit ✅ · same AEGIS project as the PPT round ✅

---

## 0. Live backend (already deployed, seeded, verified)

| Thing | Value |
|---|---|
| Convex deployment | `judicious-oyster-529` |
| **WebSocket URL** (use this for real-time) | `https://judicious-oyster-529.convex.cloud` |
| **REST URL** (fallback only) | `https://judicious-oyster-529.convex.site` |
| Operator login | operator ID and password, set as deployment environment variables (never in this repo) |

Seeded and live: 1 venue (7 gates), 5 responders, 14 NDMA/Red-Cross SOP protocols.

---

## 1. Strategy: ONE app, three routes, one URL

Build **a single EnterPro project** with three routes. This is one deployed URL (which is all you submit), one design system to get right, and roughly a third of the credits of three separate apps.

```
/            Reporter   public, no login   ← the emergency path, must be brutally fast
/command     Dashboard  operator login     ← the projector screen
/responder   Responder  public, no login   ← the second phone
```

### Credit budget (4,000 available)

Five prompts, in order. **Do not iterate mid-sequence** — finish a step, look at it, then move on. Each re-generation costs credits; a precise first prompt is worth ten nudges.

| Step | Prompt | Purpose |
|---|---|---|
| 1 | Shell | design system + routing + layout skeleton |
| 2 | Reporter | the one-tap emergency flow |
| 3 | Command | dashboard, queue, AI panel, dispatch |
| 4 | Responder | accept → on scene → resolved |
| 5 | Wiring | replace mock store with real Convex (exact code given in §7) |

Keep ~40% of credits in reserve for fixes on the 24th. If a screen is 90% right, **fix it in the code editor, not by re-prompting.**

---

## 2. The product principle that drives every screen

> **Reporting must take under 10 seconds, from panic to "help is coming".**

So the Reporter home is **not** a form. It is six big category buttons. **One tap sends the report** with GPS attached. Description, photo and callback number are offered *afterwards*, on the tracking screen, clearly marked optional. Help is already moving while the reporter types.

Everything else (AI triage, dedup, dispatch) happens server-side with no user input.

---

## 3. THEME BLOCK — paste at the top of every prompt

```
Design system "Guardian Red" — a professional emergency response product, dark UI.

Colors: background #0A0A0C, surface #141417, card #1B1B1F, border #2A2A30,
primary red #E11D2E, soft red rgba(225,29,46,0.12), text #F5F5F6,
muted #8E8E96, success green #22C55E, warning amber #F59E0B.
NEVER use blue anywhere.

Type: Inter or system font. Tight, confident, high contrast. Numbers and codes
in tabular/mono. Uppercase micro-labels with letter-spacing for status chips.

Form: rounded corners 12–16px, generous padding, 1px borders not shadows,
subtle red glow only on the primary emergency action. Calm, not flashy —
this is a tool used by professionals under stress, and by scared members of
the public. No decorative illustrations, no emoji, no marketing copy.

Motion: fast and purposeful. 150ms transitions. A slow pulse on P1 items only.
Respect prefers-reduced-motion.

Accessibility: minimum 44px touch targets, WCAG AA contrast, visible focus
rings, full keyboard navigation, aria-live on status changes.

Mobile-first. The Reporter route must be usable one-handed, at arm's length,
in bright sunlight, by someone whose hands are shaking.
```

---

## 4. PROMPT 1 — App shell

```
Build a React app called AEGIS — an AI emergency response system for crowded
venues (concerts, festivals, stadiums).

[PASTE THEME BLOCK]

Create three routes with client-side routing:
  /           Reporter  (public)
  /command    Command dashboard (public route, gated by a login screen)
  /responder  Responder (public)

Shared shell:
- A slim top bar: a red dot that slowly pulses, the wordmark "AEGIS" in
  letter-spaced caps, and on the right a live connection indicator + clock.
- An announcement banner slot directly under the top bar: when an announcement
  is active it shows a full-width amber bar with the message. Hidden otherwise.
- The Reporter route hides the clock; it must feel like an app, not a console.

Create a single central store module (plain React context + hooks) exposing:
  broadcast, submitReport(), incidents[], selectedIncident, responders[], venue,
  myIncident, trackData, login(), dispatch(), resolve(), sendBroadcast(),
  acceptAssignment(), markOnScene(), updateResponderLocation()
For now back these with realistic MOCK data so the UI is fully clickable.
I will replace the store internals with a real backend in a later step —
so keep ALL data access inside that one store module and never fetch in components.

Do not build a landing page, marketing site, or sign-up flow.
```

---

## 5. PROMPT 2 — Reporter (the emergency path)

```
[PASTE THEME BLOCK]

Build the Reporter route (/) — optimized so a frightened person can get help in
under 10 seconds, one-handed.

SCREEN A — Report (the default view):
- A short, calm headline: "What's happening?" and one line: "Tap once. Help is
  dispatched immediately. Details can come after."
- SIX large category tiles in a 2x3 grid, each at least 100px tall, with a clear
  icon and label: Fire, Medical, Crowd Crush, Accident, Violence, Other.
- A single tap on a tile IMMEDIATELY submits the report — no confirm dialog, no
  second screen. Show a brief pressed state on that tile.
- Under the grid, a quiet status line showing location state:
  "Location locked" / "Locating…" / "Location unavailable — choose a zone"
  and only if unavailable, reveal a zone dropdown.
- Fixed at the bottom: an emergency helpline strip, four tap-to-call buttons
  linking to tel:112, tel:100, tel:101, tel:102, labelled 112 ALL / 100 POLICE /
  101 FIRE / 102 AMBULANCE.

SCREEN B — Tracking (replaces Screen A after submitting):
- Big reassuring status line driven by the incident status, in this order:
  "Analyzing your report…" → "Verified. Finding the nearest responder…" →
  "Responder assigned" → "Help is on the way" → "Responder has arrived" →
  "Resolved. Stay safe."
- A priority chip (P1 red / P2 amber / P3 and P4 green) and the incident's
  short headline and zone.
- A responder card once assigned: role and unit code, a vehicle icon, and a
  large ETA in minutes that updates live.
- "While you wait" — the AI-retrieved guidance steps rendered as a numbered
  checklist of cards, with a small source caption underneath.
- An OPTIONAL enrichment card, collapsed by default, titled
  "Add details (optional)": a 140-char description field, a photo capture
  button, and a callback number field, each with its own small save action.
  Caption it: "Your report is already helping. Add these only if it's safe to."
- A red "CALL 112" button always visible.
- A quiet text link "Report something else" that returns to Screen A.

Use aria-live so status changes are announced to screen readers.
```

---

## 6. PROMPT 3 — Command, PROMPT 4 — Responder

**Prompt 3:**

```
[PASTE THEME BLOCK]

Build the Command dashboard route (/command) — the screen shown on a projector
in a venue control room.

First, a centered login card: email, password, "LOG IN" button, AEGIS mark,
and the caption "Authorized venue operators only." Nothing else renders until
login succeeds. Show a clear inline error on failure.

After login, a three-column desktop layout (stack vertically under 1000px):

HEADER STRIP: four stat tiles — Active Incidents, Critical (P1), Units Online,
Resolved Today. The P1 tile turns red and slowly pulses when the count is > 0.

LEFT COLUMN — venue map panel: a map area with incident pins colored by
priority, small dots for responders, and labelled gate markers. If a map
library is unavailable, render a clean schematic venue plan instead — do not
leave an empty box.

MIDDLE COLUMN — incident queue, newest first. Each card: priority badge,
headline, zone, report count, AI confidence %, status chip, assigned unit code.
Selected card gets a red left border. P1 cards pulse slowly.

RIGHT COLUMN — detail panel for the selected incident:
- AI SUGGESTION panel: the AI summary, and a confidence bar with the percentage.
- "RECOMMENDED ACTIONS" — the SOP steps as a numbered list, with a small
  caption naming the source document underneath.
- A photo thumbnail area when a photo exists.
- Two primary buttons: "DISPATCH NEAREST" (green) and "MARK RESOLVED".
  Hide DISPATCH once a unit is assigned; show the assigned unit and ETA instead.
- An activity feed: timestamped events, newest last, monospace timestamps.
- A broadcast composer titled "Exit guidance broadcast": a text input, quick
  template chips ("Evacuate via Gate 3B", "Avoid the east concourse",
  "Medical corridor in use — keep Gate 2 clear"), and SEND / CLEAR buttons.

Add a small caption under the AI panel: "AI recommends. Operators decide."
```

**Prompt 4:**

```
[PASTE THEME BLOCK]

Build the Responder route (/responder) — used on a phone by venue staff.

Top: a unit selector dropdown listing available units by code and role.
Once selected, remember it in localStorage.

If no assignment: a calm standby card — "Standing by" plus the unit code and
role, and a small "on duty" indicator.

When assigned, an assignment card showing: category icon, priority badge,
headline, zone, distance and ETA, and the SOP steps as a compact checklist.

One large primary action button that advances through the lifecycle, showing
only the next valid step:
  dispatched -> "ACCEPT"     en_route -> "ON SCENE"     on_scene -> "RESOLVED"
Each press is a single confident tap; disable the button while in flight.

Below it, a map area showing a route line from the unit to the incident.

At the bottom, a small toggle labelled "Simulate movement (demo)" — when on,
the unit's position interpolates toward the incident every 3 seconds. When off,
use the device's real GPS via watchPosition while en route.

Buttons must be reachable with a thumb. This is used while walking fast.
```

---

## 7. PROMPT 5 — Wiring to real Convex (the important one)

This is where builds usually break, so hand EnterPro **finished code** rather than a description. Create a file `src/aegis-backend.js` with exactly this:

```js
// AEGIS -> Convex live backend. Real-time subscriptions, no polling.
import { ConvexClient } from "https://esm.sh/convex@1.42.3/browser";
import { anyApi } from "https://esm.sh/convex@1.42.3/server";
import { useEffect, useState } from "react";

export const client = new ConvexClient("https://judicious-oyster-529.convex.cloud");
export const api = anyApi;

/** Live subscription hook. Re-renders automatically whenever the data changes. */
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

// ---- reads (live) ----
export const useBoard      = ()   => useLive(api.incidents.liveBoard);
export const useBroadcast  = ()   => useLive(api.incidents.activeBroadcast);
export const useResponders = ()   => useLive(api.incidents.respondersList);
export const useVenue      = ()   => useLive(api.incidents.venueInfo);
export const useTrack      = (id) => useLive(api.incidents.trackIncident, { incidentId: id }, !!id);
export const useDetail     = (id) => useLive(api.incidents.incidentDetail, { incidentId: id }, !!id);

// ---- writes ----
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

/** Photo upload: get a signed URL, PUT the file, return the storage id. */
export async function uploadPhoto(file) {
  const url = await client.mutation(api.incidents.generateUploadUrl, {});
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
  const { storageId } = await res.json();
  return storageId;
}

/** Browser GPS with a venue fallback so a denied permission never blocks a report. */
export function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, enableHighAccuracy: true });
  });
}
```

Then prompt:

```
I've added src/aegis-backend.js, which connects to our real Convex backend and
exposes live subscription hooks and mutation functions.

Replace the mock central store with these. Specifically:
- Reporter: on category tap, call getPosition() then submitReport({ category,
  lat, lng }), store the returned incidentId, and switch to the tracking screen
  driven by useTrack(incidentId). Never block the submit on GPS for more than
  4 seconds — submit without coordinates if it takes longer.
- Command: useBoard() for the queue and stats, useDetail(selectedId) for the
  detail panel, login() to gate the dashboard (keep the session in localStorage),
  and dispatch/resolve/sendBroadcast/clearBroadcast for the buttons.
- Responder: useResponders() for the unit dropdown, useBoard() to find this
  unit's active assignment, and accept/onScene/resolve for the action button.
- The announcement banner everywhere: useBroadcast().

These hooks are LIVE — they push updates automatically. Do not add polling,
setInterval refreshes, or manual refetching anywhere.
Keep all existing styling and layout exactly as it is. Only swap the data layer.
```

**Field names the backend actually returns** — give EnterPro this table if it guesses wrong:

| Source | Fields |
|---|---|
| `liveBoard[]` | `_id, _creationTime, category, priority, headline, summary, confidence, sopSteps[], sopSource, reportCount, lat, lng, zone, status, responder{code,role,lat,lng}` |
| `trackIncident` | `status, priority, headline, sopSteps[], sopSource, lat, lng, zone, responder{code,role,lat,lng,etaMin}` |
| `incidentDetail` | everything in `liveBoard`, plus `reports[], events[{msg,_creationTime}], photos[] (URLs), responder` |
| `activeBroadcast` | `{message, active}` or `null` |
| `respondersList[]` | `_id, code, name, role, lat, lng, available, lastSeen` |
| `venueInfo` | `name, centerLat, centerLng, zoomLevel, gates[{name,lat,lng,isExit}]` |
| `login` | `{ok: true, name}` or `{ok: false}` |

Categories are exactly: `fire` · `medical` · `crowd` · `accident_infra` · `violence_security` · `other`
Statuses are exactly: `ai_processing` · `verified` · `dispatched` · `en_route` · `on_scene` · `resolved`

### If `esm.sh` imports are blocked in EnterPro

Fallback to REST against `https://judicious-oyster-529.convex.site` with 3-second polling. Every function has an endpoint:

`POST /report` · `GET /board` · `GET /track?id=` · `GET /incident?id=` · `GET /responders` · `GET /venue` · `POST /dispatch` · `POST /accept` · `POST /on-scene` · `POST /resolve` · `POST /responder-location` · `POST /login` · `GET /broadcast` · `POST /broadcast` · `POST /broadcast-clear` · `POST /upload-url`

All accept and return JSON and are CORS-open. Tracking still feels live at a 3-second interval. **Try the real-time path first** — it is both a better demo and a stronger Convex-track story.

---

## 8. Deploy and verify

1. Deploy through EnterPro. **Deployment must be on EnterPro** — this is a disqualification rule.
2. Open the deployed URL on a phone, allow location, tap **Medical**. A report should appear on `/command` within about a second, with a P-level, an AI summary and NDMA-sourced steps.
3. Tap **DISPATCH NEAREST** → a role-matched unit is assigned (medic for medical, fire squad for fire).
4. On a second phone open `/responder`, pick that unit, tap **ACCEPT** → phone 1 shows "Help is on the way" with a live ETA.
5. Send a broadcast → the amber banner appears on phone 1 within a second.
6. Reset demo data before the pitch: `npx convex run seed:resetIncidents`

**Submit the deployed EnterPro URL.**

---

## 9. Guardrails (protect the credits)

- One prompt per step. Read the result before prompting again.
- Small visual fixes: edit the code directly. Re-prompting to move a button is the single biggest credit waste.
- Never let EnterPro invent a backend, a database, or auth. It builds UI; Convex is the backend. If it scaffolds an API folder, delete it.
- Keep the theme block identical every time — drift between routes costs a re-generation to fix.
- Do not add features not in this pack. The five in the deck are the whole scope.
- Commit working states to GitHub as you go, so a bad generation is never fatal.
