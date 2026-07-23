# AEGIS — Live demo script & judge Q&A

Cognitive Chaos 2026 finale. Read this the morning of, once through, out loud.

## Setup (do this before you're called)

- **Phone A** (reporter) — open the deployed URL at `/`. Fresh, on the home SOS screen.
- **Phone B** (responder) — open `/responder`, enter passcode `<responder passcode>`, select unit **E-02 Medic Team 2**. Leave it on standby.
- **Laptop** (projector) — open `/command`, log in `operator` / `<operator password>`. Leave it on the (empty) dashboard.
- **Reset the board 2 minutes before**: `npx convex run seed:resetIncidents` so you start clean.
- Have the **audit trail** ready to scroll at the end.

One person drives the laptop and narrates. One person drives the phones. Rehearse the handoff twice.

---

## The 3-minute run

### 0:00 — Hook (spoken, no clicks)
> "At Hathras in 2024, 121 people died in a crowd crush. At a Bengaluru stadium in 2025, 11 more. Both had police, medics and fire on site. What they didn't have was a **shared live picture**. In a crush, you have five to ten minutes. AEGIS turns every phone in the crowd into a sensor, triages with AI in about a second, and puts the whole venue on one screen. Let me show you."

### 0:20 — Report (Phone A, held up to the room)
- Tap **SOS** → tap **Medical**. *(One tap. The report is already sent.)*
> "One tap. A frightened person in a crowd doesn't fill forms. GPS is already attached — no login, no OTP."
- *(Optional, while it processes)* add the line "woman collapsed, not breathing" and a photo.

### 0:35 — AI triage lands (Laptop, on the projector)
- The incident appears in the queue. Select it.
> "Under a second. The AI read it, scored it **P1 critical**, wrote this summary itself, and pulled these response steps from **real NDMA guidance** using vector search — not a hardcoded list. AI recommends; the operator decides."
- Point to: priority badge, AI summary, the SOP steps, the source line.

### 1:05 — Dedup (Phone A again)
- Send a **second** Medical report from the same spot.
> "A second person reports the same thing. Watch — it doesn't create a duplicate. Same category, same zone, within two minutes: it **merges**, the report count rises, confidence goes up. One incident, not chaos."
- Point to the count going 1 → 2 on the card.

### 1:30 — Dispatch (Laptop)
- Hit **DISPATCH NEAREST UNIT**.
> "One click. It picked the nearest **medic** — role-matched, a medic for a medical call, not just anyone — and started the clock."

### 1:45 — Responder accepts (Phone B)
- Tap **ACCEPT** → **ON SCENE**.
> "The assigned unit gets it on their phone, accepts, and moves."

### 1:55 — The reporter sees help coming (Phone A)
- Show the tracking screen: "Responder assigned · ETA".
> "And here's the part that matters for the person in the crowd — they're not staring at a spinner. They can see help is assigned, with an ETA. **Live. No refresh.** This is Convex — every screen is a live subscription."

### 2:20 — Broadcast (Laptop → Phone A)
- Type/select **"Evacuate via Gate 3B"** → **SEND**.
> "And the control room can push exit guidance to every phone on site in one second."
- The amber banner appears on Phone A. Hold it up.

### 2:35 — Audit trail (Laptop)
- Scroll the activity feed.
> "Every action is logged — reported, triaged, escalated, dispatched, resolved — an immutable timeline for accountability and post-event review."

### 2:50 — Close
> "From a tap in the crowd to a coordinated response, in real time. That's AEGIS. Thank you."

---

## The honesty line — say it proactively, don't wait to be caught

> "To be straight with you: the reports, the AI triage, the dedup, the dispatch and the live tracking are all **real and live** right now. The SOP text is **genuine NDMA guidance**. The venue responders are **simulated** for this demo — in production they're staff with the responder app. And we never locate anyone by phone number; location is **device GPS only**. The phone number is just a callback."

Saying this first builds more trust than any feature. Judges respect teams who mark their own line.

---

## Judge Q&A — know these cold

**"How does dedup actually work?"**
Same category + same zone within a 120-second window merges into one incident; report count increments and confidence rises. Production would add semantic + geospatial clustering, but this is deterministic and fast.

**"Why Convex? Isn't it just a database?"**
It replaces four things with one typed backend: the database, the serverless functions, the vector database (for our SOP RAG), and the job scheduler (our 60-second escalation). And every query is a live subscription — the dashboard updates with zero websocket code or polling. For real-time incident command, that's the whole game.

**"What's AI versus rules here?"**
The LLM (Gemini) does severity, the summary, and picks the SOP steps — grounded in retrieved NDMA documents, so it can't hallucinate procedure. Dispatch is deterministic: nearest available, role-matched. Escalation is a timer. We use AI where judgement helps and rules where predictability matters.

**"You said vector search — prove it."**
The SOP knowledge base is embedded (1536-dim) and stored in a Convex vector index. At triage we embed the report and do a semantic search. We tested it: a report filed under category "other" that describes smoke retrieves the **fire** protocols, not the lost-child ones — because it matches on meaning, not the category label. *(Show the Convex logs line: "SOP retrieval via vector search" if asked.)*

**"What if the AI is down or rate-limited?"**
It degrades, it doesn't fail. If the LLM times out or errors, triage falls back to deterministic rules plus category-based SOP lookup, and the incident is flagged "AI unavailable — manual mode" so the operator knows. The system stays fully usable with zero API keys. *(This is visible on the dashboard right now.)*

**"How does it scale / what does it cost?"**
Serverless Convex on the free tier for a pilot, pay-as-you-scale. Multi-event and multi-tenant by design. The frontend is static. No fixed infrastructure to run per venue.

**"What if the network dies at the venue?"**
The command room runs on wired or backup uplink. The reporter is a web app that queues a report and syncs on reconnect. It's a known gap we'd harden for production with a full offline PWA — we cut it from scope deliberately to ship the core well.

**"Can't someone spam fake reports?"**
For the demo, reporting is open by design — speed beats friction in an emergency. Production adds lightweight abuse controls (rate limiting, optional venue-ticket binding) without adding an OTP wall that a panicking person can't get through. The responder and command surfaces are already gated (passcode and operator login).

**"Is this actually built on EnterPro?"**
Yes — the entire frontend is built and deployed on EnterPro; you're looking at the EnterPro deployment. The backend is Convex, which is the track requirement. We can open the EnterPro build history if you'd like to see it.

**"Why should we pick you?"**
A real, timely, India-specific problem with body counts behind it. Deep, genuine use of Convex — reactive DB, actions, vector search, scheduler, storage, auth. A working end-to-end product, not slides. And a demo you just watched work live.

---

## If something breaks on stage

- **An incident won't triage / shows manual mode** — that's the *designed* fallback. Say so: "That's our AI-unavailable path — notice it still triaged and pulled SOPs." It reads as resilience, not failure.
- **Tracking looks frozen** — refresh the reporter tab once; the subscription re-attaches.
- **A phone lost wifi** — narrate from the laptop, which has the whole picture. The point of AEGIS is that the command screen is the source of truth.
- **Total backend hiccup** — you have this reference implementation and the recorded run; fall back to narrating the deck's screenshots. Don't stall — keep talking through the flow.
