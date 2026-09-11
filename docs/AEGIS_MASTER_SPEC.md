# AEGIS MASTER BUILD SPEC (v3, FINAL)

This document is the single source of truth for building AEGIS end to end. It is written so that any developer or any LLM coding assistant can implement the system from this file alone. Read fully before writing code.

Team Ninja Coders · Cognitive Chaos 2026 Finale · 25 July 2026, Microsoft Office Noida, 8 hours on site.
Live prototype of the old demo: https://aegis-cchaos.netlify.app · Repo: github.com/developwithsourav/aegis-platform

---

## 1. What we are building and why

AEGIS is an AI powered emergency operating system for mass gatherings (stadium events, concerts, campus fests, religious gatherings). It compresses emergency response from minutes to seconds.

The problem: venues already have police, medics, fire and security on site. What fails is information: delayed reporting, fragmented channels, duplicate unverified reports, no prioritization, slow dispatch. In a crowd crush or cardiac arrest the survivable window is 5 to 10 minutes. Evidence: Hathras 2024 (121 deaths), Bengaluru stadium 2025 (11 deaths).

The loop: REPORT (any phone, one tap) → AI TRIAGE (severity, dedup, SOP retrieval) → COORDINATE (live dashboard, role aware dispatch, live responder tracking) → LEARN (audit trail).

Product principles (locked):
1. Reporting takes under 10 seconds, start to finish.
2. Zero friction for reporters: no login, no OTP. Optional phone number only.
3. AI assists, humans decide. AI never auto dispatches.
4. Operators see exactly what a decision needs, nothing more.
5. Speed beats features. A feature that does not make reporting, triage or dispatch faster is out of scope.

---

## 2. Locked decisions (do not reopen)

| Decision | Ruling |
|---|---|
| Backend | Convex only (mandatory for track eligibility). TypeScript. No Python, no Express, no Next.js API routes |
| Frontend, event day | Built with EnterPro (mandatory competition rule). Credits available on 25 July at venue |
| Frontend, home build | Plain HTML/JS or minimal Vite React app used ONLY as a dev harness to test the backend. It is throwaway; the real UI is generated in EnterPro on event day to match the mockups |
| Priorities | P1 critical, P2 urgent, P3 standard, P4 logged |
| Categories | fire, medical, crowd, accident_infra, violence_security, other (lost child lives under other) |
| Product UI theme | Guardian Red: near black background #0A0A0C, surface #141417, red #E11D2E, red dark #B3121F, white text, success green #22C55E, warning amber #F59E0B. Matches approved mockups |
| Docs and deck theme | Ember & Paper (unchanged, print only) |
| Dashboard access | Operator login required (single shared operator credential). Reporter and responder pages stay open |
| Maps | Leaflet + OpenStreetMap tiles. NOT Google Maps (requires card on file). Venue map with gate markers |
| Incident location | Device GPS via browser geolocation at report time. Never from phone number (technically impossible for us; only carriers can do that) |
| Phone number | Optional field on report, enter or skip, used for callback display only |
| LLM | Primary: one fast cheap hosted model (Claude Haiku or GPT-4o mini class, key funded ~5 USD). Backup: Google Gemini Flash free tier. One env switch flips provider |
| Emergency helplines | Static strip with tel links: 112 (national), 100 (police), 101 (fire), 102/108 (ambulance). No API exists; a call button is the honest integration |
| OTP, offline sync, CCTV, IoT, payments, analytics | OUT OF SCOPE. If judges ask: production roadmap |

---

## 3. System architecture

```
 REPORTER (phone web app)         RESPONDER (phone web app)
   one tap report                   accept · navigate · share GPS
   photo · optional phone           status updates
        \                              /
         \                            /
          CONVEX BACKEND (TypeScript)
          ├── DB tables (reactive: every change pushes to subscribed screens)
          ├── Mutations  submitReport · dispatch · acceptAssignment · resolve ·
          │              updateResponderLocation · sendBroadcast
          ├── Queries    liveBoard · incidentDetail · trackIncident · activeBroadcast
          ├── Actions    aiTriage (LLM call + vector search RAG) · photoCheck (stretch)
          ├── Vector idx sops table (real NDMA text, embeddings)
          ├── Scheduler  escalateIfUnhandled (60 s on P1)
          └── Storage    incident photos
                 |
          COMMAND DASHBOARD (operator login required)
          live map · queue · AI panel · dispatch · broadcast exit guidance
```

Realtime is free: Convex queries are live subscriptions. Any client using a query re-renders automatically when data changes. No websocket code, no polling.

---

## 4. Convex schema (convex/schema.ts)

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  reports: defineTable({
    category: v.string(),          // fire | medical | crowd | accident_infra | violence_security | other
    description: v.optional(v.string()),
    phone: v.optional(v.string()), // optional callback number, never verified
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    zone: v.optional(v.string()),  // manual fallback if GPS denied
    photoId: v.optional(v.id("_storage")),
    incidentId: v.optional(v.id("incidents")),
  }),

  incidents: defineTable({
    category: v.string(),
    priority: v.number(),          // 1..4, set by AI, editable by operator
    headline: v.string(),
    summary: v.string(),           // AI generated
    confidence: v.number(),        // 0..100 from AI
    sopSteps: v.array(v.string()), // retrieved via RAG
    sopSource: v.string(),         // e.g. "NDMA Crowd Management Guide, sec 4.2"
    reportCount: v.number(),
    lat: v.number(), lng: v.number(), zone: v.string(),
    status: v.string(),            // new | ai_processing | verified | dispatched | en_route | on_scene | resolved
    assignedResponderId: v.optional(v.id("responders")),
    photoVerified: v.optional(v.boolean()),   // stretch
    aiFailed: v.optional(v.boolean()),        // true => show raw report, manual mode
  }).index("by_status", ["status"]),

  events: defineTable({            // append only audit trail
    incidentId: v.id("incidents"),
    msg: v.string(),
  }).index("by_incident", ["incidentId"]),

  responders: defineTable({
    code: v.string(),              // M-07, E-02 ...
    name: v.string(),
    role: v.string(),              // medic | marshal | fire | security
    lat: v.number(), lng: v.number(),
    available: v.boolean(),
    lastSeen: v.number(),          // Date.now() of last location ping
  }).index("by_available", ["available"]),

  sops: defineTable({
    category: v.string(),
    title: v.string(),
    text: v.string(),              // REAL paragraph from ndma.gov.in guidelines
    source: v.string(),
    embedding: v.array(v.float64()),
  }).vectorIndex("by_embedding", { vectorField: "embedding", dimensions: 1536 }),

  broadcasts: defineTable({        // exit guidance / safety instructions to all reporters
    message: v.string(),           // "Move to Gate 3B. Avoid the east concourse."
    active: v.boolean(),
  }),

  venue: defineTable({             // one document describing the event venue
    name: v.string(),              // "Microsoft Office Noida" or "Narendra Modi Stadium"
    centerLat: v.number(), centerLng: v.number(), zoomLevel: v.number(),
    gates: v.array(v.object({ name: v.string(), lat: v.number(), lng: v.number(), isExit: v.boolean() })),
  }),

  operators: defineTable({         // dashboard login
    email: v.string(),
    passwordHash: v.string(),      // sha256 of password + fixed salt is enough for hackathon
    name: v.string(),
  }).index("by_email", ["email"]),
});
```

---

## 5. Backend functions, one by one

### Mutations (convex/incidents.ts)

submitReport(category, description?, phone?, lat?, lng?, zone?, photoId?)
1. Resolve zone: if lat/lng given, map to nearest venue gate/zone name; else use manual zone.
2. Dedup: find open incident with same category and same zone whose _creationTime is within 120 s. If found: insert report linked to it, increment reportCount, bump confidence by +5 (cap 99), append event "Duplicate report merged (now N)". Return { incidentId, merged: true }.
3. Else insert incident { status: "ai_processing", priority: 3, confidence: 40, headline: "Analyzing...", reportCount: 1 } and the report linked to it.
4. Schedule: ctx.scheduler.runAfter(0, internal.ai.triage, { incidentId }) and ctx.scheduler.runAfter(60000, internal.incidents.escalateIfUnhandled, { incidentId }).
5. Append event "Report received". Return { incidentId, merged: false }.

dispatch(incidentId)  [operator action]
1. Load incident; abort if already assigned.
2. Pick nearest available responder with role preference: medical→medic, fire→fire, crowd→marshal, violence_security→security, else any. Distance = haversine(incident, responder).
3. Set responder.available=false, incident.assignedResponderId, incident.status="dispatched". Append event "ROLE CODE dispatched, ETA X min" (ETA = distance / 1.4 m/s walking, minimum 1 min).

acceptAssignment(responderId) → incident.status="en_route"; append event. First accept locks (mutation is atomic, later calls see assigned and no-op).

updateResponderLocation(responderId, lat, lng) → patch responder lat/lng/lastSeen. Called every 4 s by the responder page while en_route. THIS is live tracking.

markOnScene / resolve(incidentId) → status transitions + events; on resolve set responder available=true.

sendBroadcast(message) / clearBroadcast() [operator]. One active broadcast at a time.

escalateIfUnhandled(incidentId) [internal] → if priority===1 and status still "ai_processing"|"verified": append event "ESCALATED to control lead, P1 unacknowledged 60 s".

login(email, password) [convex/auth.ts] → look up operator by email, compare sha256(password+SALT) to stored hash. Return { ok, name } or { ok:false }. Client stores a session flag in localStorage. Dashboard components render only when session flag present; every operator mutation double-checks nothing sensitive is exposed to reporter queries anyway. Seed one operator: ID "operator", password chosen by team, hash generated by the seed script.

### Queries (all reactive; the dashboard subscribes)

liveBoard() → all incidents not resolved, newest first, joined with assigned responder code/role.
incidentDetail(incidentId) → incident + its reports + events + photo URLs (ctx.storage.getUrl).
trackIncident(incidentId) → { status, responder: { code, role, lat, lng, lastSeen }, incident lat/lng } for the reporter tracking screen.
activeBroadcast() → the active broadcast if any (reporter app shows it as a banner).
respondersList() → for the dashboard map.
venueInfo() → the venue document (map center, gates).

### Actions (convex/ai.ts). Actions may call external APIs; they read/write via ctx.runQuery / ctx.runMutation.

triage(incidentId)
1. Load incident + latest report text.
2. Embed "CATEGORY emergency: DESCRIPTION" via embeddings API (text-embedding-3-small, 1536 dims).
3. ctx.vectorSearch("sops", "by_embedding", { vector, limit: 4 }); fetch those SOP docs.
4. Call the LLM with the prompt in section 6. Parse strict JSON.
5. ctx.runMutation(internal.incidents.applyTriage, { incidentId, priority, headline, summary, confidence, sopSteps, sopSource, status: "verified" }).
6. On ANY failure (timeout 10 s, bad JSON, key error): applyTriage with { aiFailed: true, status: "verified", priority: category==="fire"||category==="crowd" ? 1 : 2, headline: "CATEGORY at ZONE (AI unavailable, manual mode)" }. The system must remain fully usable without AI. This is a judged edge case.

photoCheck(incidentId) [stretch] → vision call: "Does this image plausibly show CATEGORY? Answer JSON {match: boolean}". Sets photoVerified.

Provider switch: env LLM_PROVIDER = "anthropic" | "openai" | "gemini". Implement one thin callLLM(prompt) helper with all three, plus EMBEDDINGS fallback (if gemini, use its embedding model, adjust dimensions accordingly; keep 1536 by padding or use a second vector index; simplest: always use OpenAI embeddings since the key is funded).

---

## 6. AI prompt contracts (copy verbatim)

Triage prompt (user message to LLM):
```
You are the triage engine of an emergency command system at a crowded venue.
Incident category: {category}. Zone: {zone}. Reporter said: "{description}".
Number of merged reports: {reportCount}. Photo attached: {yes/no}.
Official SOP excerpts (the ONLY allowed source for steps):
{4 retrieved NDMA paragraphs, each prefixed with its source label}

Return ONLY valid JSON, no markdown:
{"priority": 1|2|3|4,
 "headline": "max 8 words, format: CATEGORY, zone",
 "summary": "2 sentences for the operator: what is happening and what matters",
 "confidence": 0-100,
 "sopSteps": ["3 to 6 imperative steps taken ONLY from the excerpts"],
 "sopSource": "the source label of the excerpt you mainly used"}

Priority rules: crowd crush, fire, cardiac/breathing = 1. Violence, injury, smoke = 2.
Lost adult, minor hazard = 3. Complaints = 4. Lost child = 2.
More merged reports and an attached photo increase confidence.
```

SOP seeding (convex/seed.ts + seeds/sops-ndma.ts): 15 to 20 real paragraphs manually copied from ndma.gov.in "Managing Crowd at Events and Venues" guide plus fire and first aid guidance. Each entry { category, title, text, source }. A one time action embeds and inserts them. Rajat owns collecting the text at home.

---

## 7. Frontend spec (EnterPro on event day; dev harness at home)

Theme tokens (Guardian Red): bg #0A0A0C, surface #141417, card #1B1B1F, border #2A2A30, red #E11D2E, red soft rgba(225,29,46,.12), text #F5F5F6, muted #8E8E96, green #22C55E, amber #F59E0B, blue only forbidden. Rounded 12 to 16 px, SF/Inter system font.

### Screens (match the approved mockups exactly)

REPORTER (public, no login):
1. Home: AEGIS shield logo, big red SOS button "REPORT EMERGENCY", location access chip, helpline strip (112 · 100 · 101 · 102 as tel: links), broadcast banner slot (shows activeBroadcast when set: amber, "Announcement: ...").
2. Report form: 6 category tiles (Fire, Medical, Crowd, Accident, Violence, Other), auto location line ("Gate 3, Block B" from GPS with manual zone dropdown fallback), optional description (140 chars), optional photo (camera capture; label: "Skip if it causes delay. Your report already helps."), optional phone with Skip button, SUBMIT.
3. Submitting: staged progress (Sending → Verifying → Analyzing → Finding responders) driven by real status via trackIncident query.
4. Track: incident ID, status chip, assigned responder card (role, code, vehicle icon), ETA, mini Leaflet map with responder dot moving (updates every 4 s), "Help is on the way. Stay calm." card.
5. AI guidance: the incident's sopSteps rendered as checklist cards + "AI severity: P1 High" + helpline button. (This is the mockup screen 5.)

RESPONDER (public URL, no login, chosen from a dropdown of seeded responders for the demo):
assignment card (category, zone, priority, ACCEPT / ON THE WAY / ON SCENE / RESOLVED buttons), Leaflet map with route line to incident, and while en_route the page calls updateResponderLocation every 4 s using navigator.geolocation.watchPosition. Demo fallback: a "simulate movement" toggle that interpolates toward the incident if indoor GPS is bad. Be honest on stage about which mode is running.

COMMAND DASHBOARD (operator login gate first):
login card (email + password → login query, store session in localStorage). Then: header (AEGIS COMMAND, live clock, event name, connection dot), stat cards (Active, P1 count, Units online, Resolved today), Leaflet venue map with incident pins (pulse by priority color) + responder dots + gate markers, incident queue (cards: category icon, P badge, headline, reportCount, confidence, time), detail panel (AI summary, confidence bar, SOP steps with source line, photo thumbnail, DISPATCH NEAREST, MARK RESOLVED, escalation timer on P1), broadcast composer ("Send exit guidance": free text + quick templates like "Evacuate via Gate 3B"), activity feed (events stream).

### Home build vs event day

At home: build ALL backend + a minimal dev harness frontend (plain HTML/JS or tiny Vite React) that exercises every function. The harness is throwaway and never shown to judges as our frontend.
Event day: regenerate the three apps in EnterPro from the mockup images + this spec (the EnterPro prompt pack lives in docs/enterpro-prompts.md; write prompts screen by screen, paste theme tokens, then wire to Convex).
Bridge Plan A: EnterPro project accepts the convex npm client → use ConvexProvider + useQuery/useMutation directly.
Bridge Plan B: expose HTTP actions (convex/http.ts) as REST endpoints (POST /report, GET /board, POST /dispatch ...) and the EnterPro app uses fetch + 2 to 4 s polling for queries (tracking still feels live at 4 s).
Manish tests A vs B in hour one on 25 July. Decision by 10:00.

---

## 8. Live location, exactly how it works

Incident location: reporter's browser asks geolocation permission; navigator.geolocation.getCurrentPosition gives lat/lng (±5 to 20 m outdoors); attached to the report. If denied or unavailable: manual zone dropdown (edge case, judged). The phone number gives us NOTHING technically; only telecom carriers can locate a number. We store it purely as a callback contact.

Responder tracking: the responder page runs watchPosition; every 4 s it calls updateResponderLocation. Every screen subscribed to trackIncident or respondersList re-renders with the new dot position automatically (reactive queries). ETA = haversine distance / walking speed, recomputed client side each update.

Exit guidance: venue doc contains gates with isExit flags. Operator hits broadcast template; every reporter Home/Track screen shows the amber banner within a second. Optionally the reporter map highlights the named exit gate marker in green.

---

## 9. Environment variables (set in Convex dashboard, never in frontend)

ANTHROPIC_API_KEY or OPENAI_API_KEY (primary LLM + embeddings, funded ~5 USD) · GEMINI_API_KEY (free backup) · LLM_PROVIDER · OPERATOR_SALT (random string for password hashing). Frontend needs only the Convex deployment URL.

---

## 10. Build order with time estimates

HOME, before 24 July (owners in brackets):
| # | Task | Est |
|---|---|---|
| 1 | Repo restructure: convex/ + seeds/ + harness/ + docs/, delete Vite starter, new README [Manish] | 1 h |
| 2 | Schema + submitReport with dedup + liveBoard + events [Siddharth] | 3 h |
| 3 | Dev harness: report form + board list against real Convex [Sourav] | 2 h |
| 4 | triage action with provider switch + fallback rules [Rajat] | 3 h |
| 5 | NDMA SOP collection + embed + seed script [Rajat] | 2 h |
| 6 | dispatch + acceptAssignment + updateResponderLocation + resolve + escalation [Siddharth] | 3 h |
| 7 | Responder harness page with watchPosition + simulate toggle [Manish] | 2 h |
| 8 | Operator login + seed operator + dashboard gate in harness [Siddharth] | 1.5 h |
| 9 | Venue doc for demo venue + Leaflet map in harness + broadcast [Sourav] | 2 h |
| 10 | Photo upload via Convex storage [Manish] | 1.5 h |
| 11 | End to end drill on two phones + laptop, fix, repeat [all] | 2 h |
Total ≈ 23 team hours ≈ 3 evenings for 4 people. Backend is DONE before event day.

EVENT DAY (8 h): 0:00 bridge test → 0:30 EnterPro Reporter → 2:00 Dashboard → 4:00 Responder + tracking polish → 5:30 stretch (photoCheck, broadcast templates) → 6:30 freeze, deploy, rehearse twice → 8:00 pitch.

---

## 11. Demo script (3 minutes, two phones + laptop on projector)

1. Hook (20 s): problem + Hathras/Bengaluru line.
2. Phone 1 reports Fire at Gate 3 with photo + phone number skipped. Under 10 seconds, out loud.
3. Dashboard (projector): incident appears, AI panel fills in (priority P1, summary, NDMA steps with source), second phone sends duplicate → merges, count 2, confidence rises.
4. Operator logs in already; hits DISPATCH → Fire Squad assigned; Phone 2 (responder view) ACCEPTs; Phone 1 shows the dot approaching with ETA.
5. Operator broadcasts "Evacuate via Gate 3B" → banner appears on Phone 1. Close with audit trail flash.
Honesty line, said proactively: reports, AI triage and tracking are fully live; SOP text is real NDMA guidance; venue responders are simulated for the demo.

## 12. Definition of done (from the PRD, adopted verbatim)

Report in under 10 s · appears live on dashboard · AI produces priority + summary + SOP · operator dispatches · reporter sees responder moving. All five yes = stop building, polish the demo.
