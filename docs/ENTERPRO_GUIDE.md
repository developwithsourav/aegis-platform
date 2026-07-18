# EnterPro Prompt Pack (run on 25 July, screen by screen)

Model choice inside EnterPro: pick the strongest Claude/GPT option it offers; defaults are fine. Quality comes from these prompts, not the model toggle. Paste the THEME block into every prompt.

## THEME BLOCK (paste at the top of every prompt)

```
Design system "Guardian Red" (emergency product, dark):
background #0A0A0C, surface #141417, cards #1B1B1F, borders #2A2A30,
primary red #E11D2E (buttons, alerts), soft red rgba(225,29,46,0.12),
text #F5F5F6, muted #8E8E96, success green #22C55E, warning amber #F59E0B.
Rounded corners 12 to 16 px, generous padding, Inter or system font.
Mobile first, no blue anywhere, minimal and calm, like a professional SOS app.
```

## PROMPT 1: Reporter app

```
Build a mobile web app called AEGIS Reporter with 4 screens.
[THEME BLOCK]
Screen 1 Home: AEGIS shield logo, subtitle "Smart Emergency Response System",
one huge round red SOS button labeled REPORT EMERGENCY, a chip showing
"Location Access Enabled", a helpline row of 4 buttons that call tel:112, tel:100,
tel:101, tel:102, and an announcement banner slot at top (amber) that shows a
message when one exists.
Screen 2 Report: 6 category tiles with icons (Fire, Medical, Crowd, Accident,
Violence, Other), an auto location line "Gate 3, Block B" with a manual zone
dropdown fallback, optional description textarea (140 chars), optional photo
capture labeled "Skip if it causes delay. Your report already helps.", optional
phone number field with a Skip button, big SUBMIT REPORT button.
Screen 3 Submitting: staged checklist animation (Sending report, Verifying
information, Analyzing incident, Finding nearest responders) and the card
"Help is on the way. Please stay calm."
Screen 4 Track: incident ID, status chip, responder card (role, code, vehicle
icon, ETA minutes), a mini map placeholder square, and a section "What to do
next" that renders a list of AI guideline steps with a source line, plus a red
EMERGENCY HELPLINE 112 button.
Use clean state management so I can wire real data later: one central store
with fields status, responder, etaMin, sopSteps, sopSource, broadcast.
```

## PROMPT 2: Command dashboard

```
Build a desktop web dashboard called AEGIS Command.
[THEME BLOCK]
First a login card (email, password, LOG IN) gating everything.
Then a three column layout:
left: live venue map placeholder with colored incident pins and small responder
dots plus gate labels; header stat cards Active Incidents, Critical P1, Units
Online, Resolved Today.
middle: incident queue, each card shows priority badge (P1 red, P2 amber,
P3/P4 green), headline, report count, confidence percent, status, assigned unit.
right: incident detail with AI SUGGESTION panel (summary + confidence bar),
SOP RECOMMENDED ACTIONS numbered list with a source caption, photo thumbnail
slot, buttons DISPATCH NEAREST (green) and MARK RESOLVED, an activity feed of
timestamped events, and a broadcast composer (text input + SEND + CLEAR) titled
"Exit guidance broadcast".
Include a live clock and connection dot in the header.
```

## PROMPT 3: Responder app

```
Build a mobile web app called AEGIS Responder.
[THEME BLOCK]
Screen 1: dropdown to choose my unit (M-07 Marshal, E-02 Medic, F-12 Fire,
S-04 Security, E-05 Medic).
Screen 2 Assignment: incident card with category icon, priority badge, headline,
zone, big buttons ACCEPT (green), then ON THE WAY, ON SCENE, RESOLVED as the
status advances; a map placeholder showing a route line; a toggle labeled
"simulate movement (demo)".
Keep a central store with fields assignment, status so wiring is easy.
```

## WIRING (after generation, Manish + me)

Plan A (preferred): add the convex npm package, wrap app in ConvexProvider with
our deployment URL, replace store reads with useQuery(api.incidents.trackIncident /
liveBoard / respondersList / activeBroadcast) and button handlers with
useMutation(api.incidents.submitReport / dispatch / acceptAssignment /
markOnScene / resolve / sendBroadcast / updateResponderLocation).

Plan B (if npm blocked): use fetch against the REST bridge in convex/http.ts:
POST /report · GET /board · GET /track?id= · POST /dispatch ·
POST /responder-location · POST /login · GET /broadcast, polling every 3 s.

Geolocation: reporter uses navigator.geolocation.getCurrentPosition on submit;
responder uses watchPosition every few seconds while en route.

Everything the frontend needs already exists and is tested in the backend
(see harness/index.html for a working reference of every call).
