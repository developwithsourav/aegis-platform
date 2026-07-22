# AEGIS · AI Emergency Grid & Incident System

**Every second saves a life.** AEGIS is an AI powered emergency operating system for mass gatherings. It turns every phone in a crowd into a sensor, triages reports with AI in about one second, and coordinates the nearest responder on a live command dashboard, with the reporter watching help approach in real time.

Built by **Team Ninja Coders** (Sourav Kumar · Manish Joshi · Siddharth Singh · Rajat Kushwaha, ARSD Delhi University) for the **Cognitive Chaos 2026 Finale** · Convex Open Innovation track · Microsoft Office Noida · 25 July 2026.

Early prototype (idea round): https://aegis-cchaos.netlify.app

---

## Why

Venues already have police, medics and fire teams on site. What fails is information: delayed reporting, fragmented WhatsApp and walkie channels, duplicate unverified reports, no prioritization, slow dispatch. In a crowd crush or cardiac arrest the survivable window is **5 to 10 minutes**. Hathras 2024 (121 lives) and Bengaluru stadium 2025 (11 lives) both had staff on site. Neither had a shared live picture.

## How it works

```
REPORT        one tap: category + photo + auto GPS + optional callback number. No login, no OTP.
   |
AI TRIAGE     LLM scores severity P1 to P4, merges duplicate reports, retrieves response steps
   |          from real NDMA guidance (RAG). AI assists, humans decide. Rule fallback if AI is down.
   |
COORDINATE    live dashboard (operator login), role aware nearest dispatch,
   |          live responder tracking with ETA, exit guidance broadcasts to every phone.
   |
LEARN         immutable audit timeline per incident.
```

## Repository layout

```
convex/               The entire backend (TypeScript on Convex)
  schema.ts           7 tables + indexes + vector index
  incidents.ts        ingestion with dedup, dispatch, tracking, lifecycle, login, broadcasts
  ai.ts               AI triage action: provider switch (anthropic | openai | gemini) + rule fallback
  seed.ts             demo venue, 5 responders, 14 NDMA derived SOPs
  http.ts             REST bridge with CORS (Plan B for the EnterPro frontend)
harness/index.html    dev client exercising every function (Reporter / Command / Responder tabs)
docs/
  AEGIS_MASTER_SPEC.md   the complete build spec (source of truth)
  CONVEX_GUIDE.md        team tutorial: mental model, commands, gotchas
  ENTERPRO_GUIDE.md      event day prompt pack + wiring plan for the EnterPro frontend
  mockups/               approved UI designs (Guardian Red)
.env.example          documented environment variables (no secrets in this repo)
```

The event day frontend is generated with **EnterPro** (competition requirement) from the prompts in `docs/ENTERPRO_GUIDE.md` and wired to this backend. The `harness/` client is a development tool and wiring reference, not the product UI.

## Quickstart

```bash
npm install
npx convex dev            # keeps the backend live and pushes functions on save
npm run seed              # venue + responders + NDMA SOP knowledge base
npm run harness           # dev client at http://localhost:4300
```

No Convex account? Develop fully locally: `CONVEX_AGENT_MODE=anonymous npx convex dev`.

Open two browser windows on the harness: **Reporter** in one, **Command** in the other. The dashboard is gated by an operator login set via the `OPERATOR_EMAIL` / `OPERATOR_PASSWORD` environment variables on the deployment (never committed). Send a report and watch it appear, triage, merge duplicates, dispatch and track, live, no refresh.

Optional AI upgrade: set `LLM_PROVIDER` and the matching API key in the Convex dashboard (see `.env.example`). Without a key the deterministic triage + SOP lookup path runs, which is also our designed "AI unavailable" mode.

## Verified end to end

Report ingestion with GPS to zone resolution · duplicate merge (category + zone within 120 s) · AI triage with NDMA grounded SOP steps · role aware nearest dispatch (fire team to fires, medics to medical) · 60 second P1 escalation timer · live responder tracking with ETA · operator login · exit guidance broadcast · full audit timeline.

## Team

| Member | Lane |
|---|---|
| Sourav Kumar | EnterPro frontend, design system, pitch |
| Siddharth Singh | Convex data core: schema, dedup, dispatch |
| Rajat Kushwaha | AI triage, RAG, LLM providers |
| Manish Joshi | Integration, deployment, EnterPro to Convex bridge |

*AEGIS assists responders. It never replaces human judgment: the AI recommends, operators decide.*
