# AEGIS

AI Emergency Grid & Incident System, a venue operations prototype for crowd emergencies.

Someone inside a crowded venue taps SOS on their phone. AEGIS works out which zone they are in, scores how urgent it is, folds repeat reports of the same event into one incident, and puts it on the venue control room's live board so staff can send the nearest marshal, medic or fire team.

Finalist at Cognitive Chaos 2026 (Convex Open Innovation track). The finale was held at Microsoft Office, Noida, on 25 July 2026. Built by Team Ninja Coders.

**Live demo: https://developwithsourav.github.io/aegis-platform/**

![AEGIS command dashboard, reporter screen and guidance screen](docs/assets/gallery_aegis.png)

## Try it

Open the demo in two tabs, or on a phone and a laptop.

| Screen | Route | What to do |
|---|---|---|
| Reporter | [`#/`](https://developwithsourav.github.io/aegis-platform/#/) | Tap SOS, pick a category and a zone, submit |
| Control room | [`#/command`](https://developwithsourav.github.io/aegis-platform/#/command) | Open the demo control room, select the incident, dispatch |
| Responder | [`#/responder`](https://developwithsourav.github.io/aegis-platform/#/responder) | Use the demo unit, pick the unit that was dispatched, accept |

The report reaches the board in about a second. Once a unit is dispatched, the reporter's screen shows who is coming and a live ETA, and none of the screens need a refresh.

Anyone can open the demo, so it runs with some limits. Everything resets every hour. Only the last two digits of a callback number are stored, photo upload is off, exit guidance is limited to the preset messages, and reports are rate limited. The demo has no LLM key, so triage uses the rules and the guidance lookup. Please don't type real names or phone numbers into it.

## The problem

Venues already have police, medics and fire teams on site. What breaks down is information. Reports arrive late and get split across WhatsApp groups and walkie channels, one event gets reported thirty times, nothing is ranked by urgency, and dispatch is worked out by hand. In a crowd crush or a cardiac arrest, help still makes a difference for roughly 5 to 10 minutes. Hathras in 2024 (121 dead) and the Bengaluru stadium crush in 2025 (11 dead) both had staff on the ground, and neither had a shared live picture of what was happening.

In a dense crowd you can't hear or be heard, and the mobile network jams. A tap is a few hundred bytes, so it gets through when a voice call won't.

## What about 112?

AEGIS does not replace 112. India's ERSS already connects a citizen to the state emergency system by call, SMS, app, panic button and location sharing.

112 doesn't give one venue a live view of its own ground. It doesn't dispatch that venue's marshals and medics, merge thirty reports of one crush into a single incident, or push exit guidance to the people standing inside. AEGIS is built for that venue-level job, and anything beyond the venue's own capacity should go to 112. That escalation is on the roadmap and isn't built yet.

## How it works

```
REPORT       One tap: category, zone (GPS or picked), optional note and callback number.
    |        No login, no OTP.
TRIAGE       Priority P1 to P4. Rules always run; an LLM can refine the summary when a key
    |        is configured. Response steps are retrieved from NDMA and first aid guidance.
DEDUPLICATE  Same category, same zone, within 2 minutes: merged into one incident with a
    |        report count.
DISPATCH     Nearest available unit whose role matches the category (medic for medical,
    |        fire squad for fire). Live ETA for the reporter.
ESCALATE     P1 incidents nobody has picked up after 60 seconds are escalated.
    |
AUDIT        Every step is written to an append-only timeline per incident.
```

## Design decisions

The percentage on an incident card measures corroboration. In the build that was judged, the LLM graded its own confidence and gave a blank photo 95%. The card now counts how many people independently reported the same thing in the same place, and says so.

Dispatch picks the nearest available unit by distance. The AI suggests a priority and response steps, and an operator decides what to do with them.

If the LLM fails or no key is set, triage falls back to the rules and keeps working.

## Stack

The backend runs on [Convex](https://convex.dev): reactive queries, mutations, scheduled functions, a cron job, vector search and file storage. The web app is a single static `index.html` (React with htm, no build step) served from GitHub Pages. Triage can use Gemini, OpenAI or Anthropic, with the rules as the fallback.

The frontend that was judged had to be generated on EnterPro under the competition rules. That build is still up at https://490cbec14e504e7aa506bc0208460713.prod.enterapp.pro/

## Repository layout

```
convex/
  schema.ts          7 tables, indexes and a vector index
  incidents.ts       intake, deduplication, dispatch, lifecycle, broadcasts, demo guards
  ai.ts              triage: LLM provider switch and rules fallback, SOP retrieval
  seed.ts            demo venue, 5 units, 14 SOPs drawn from NDMA guidance
  venues.ts          venue catalogue and live venue switching
  crons.ts           hourly reset for the public demo
  http.ts            REST bridge with CORS
reference-app/       the web app: reporter, responder and control room in one file
harness/             developer client that exercises every function
docs/                build spec, Convex guide, demo script, deck sources, screenshots
AEGIS_Finale_Deck.*  the finale deck (PDF and editable PPTX)
SUBMISSION.md        what was submitted and what the judges said
```

## Run it yourself

```bash
npm install
npx convex dev          # creates a dev deployment and pushes functions on save
npm run seed            # venue, units and the SOP knowledge base
npm run app             # web app at http://localhost:4320
```

Point `CONVEX_URL` near the top of `reference-app/index.html` at your own deployment.

Environment variables live on the Convex deployment and never in this repo. See [`.env.example`](.env.example).

| Variable | Purpose |
|---|---|
| `OPERATOR_EMAIL`, `OPERATOR_PASSWORD` | Control room login. With no password set, nobody can log in. |
| `RESPONDER_PASSCODE` | Shared passcode for responder devices |
| `LLM_PROVIDER` and the matching key | Turns on LLM triage. Leave empty for rules only. |
| `DEMO_MODE=1` | Public demo limits and the hourly reset |

## The competition build

The code that was judged is frozen at the tag [`v1.0-hackathon`](https://github.com/developwithsourav/aegis-platform/tree/v1.0-hackathon). [`SUBMISSION.md`](SUBMISSION.md) records what ran on the day, what the judges criticised (photo upload on Android, the self-graded confidence score, the overlap with 112) and how each point was fixed afterwards.

## Team

| Member | Worked on |
|---|---|
| Sourav Kumar | Frontend, design system, pitch |
| Siddharth Singh | Convex data core: schema, deduplication, dispatch |
| Rajat Kushwaha | AI triage, retrieval, LLM providers |
| Manish Joshi | Integration, deployment, frontend to Convex bridge |

ARSD College, University of Delhi.
