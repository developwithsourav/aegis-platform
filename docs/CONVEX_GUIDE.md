# Convex Guide for Team Ninja Coders

Everything the team must know to work on the AEGIS backend. Read this once fully, then keep it open while coding. Official tutorial (organizers asked us to do it): https://convex.link/cchack · Docs: https://docs.convex.dev

## 1. The mental model

Convex is our entire backend: database, server functions, realtime, file storage, scheduler and vector search in one platform, all written in TypeScript inside the `convex/` folder. There is no Express server, no REST layer we maintain, no websocket code.

The one idea that matters most: **queries are live subscriptions**. When a client uses a query and any data that query read changes, Convex pushes the new result and the UI re-renders. That is why the dashboard updates the instant a report arrives, with zero polling code.

## 2. The three function types (never mix their jobs)

| Type | Can do | Cannot do | Ours |
|---|---|---|---|
| **query** | read DB, subscribe clients | write, call external APIs | `liveBoard`, `incidentDetail`, `trackIncident`, `activeBroadcast`, `respondersList`, `venueInfo`, `login` |
| **mutation** | read + write DB atomically, schedule work | call external APIs | `submitReport`, `dispatch`, `acceptAssignment`, `updateResponderLocation`, `markOnScene`, `resolve`, `sendBroadcast` |
| **action** | call external APIs (the LLM) | touch DB directly (must use `ctx.runQuery` / `ctx.runMutation`) | `ai.triage` |

The flow for every report: `submitReport` (mutation, atomic write + dedup) schedules `ai.triage` (action, calls LLM) which writes results back through `applyTriage` (internal mutation). Judges may ask exactly this. 

## 3. Commands you will actually run

```bash
npm install                # once
npx convex dev             # start developing: pushes functions on save, keeps backend live
npx convex run seed:all    # seed venue, responders, NDMA SOPs
npx convex run seed:resetIncidents   # clean slate between demo runs
npx convex run incidents:liveBoard   # poke any function from the CLI
npx convex deploy          # production deployment (event day)
```

No Convex account yet? `CONVEX_AGENT_MODE=anonymous npx convex dev` runs a full local backend with zero login (this is how the whole system was first built and tested). When ready for the shared cloud deployment: `npx convex login` once, then `npx convex dev` links the project.

## 4. Environment variables

Set in the Convex dashboard (Settings → Environment Variables), never in frontend code, never committed. See `.env.example` for the list. With no LLM key set the system still works fully: triage falls back to deterministic rules + SOP lookup by category (this is also our judged "AI fails" edge case).

## 5. Gotchas that cost teams hours

- Actions cannot touch the database. Use `ctx.runQuery` / `ctx.runMutation` with `internal.*` references.
- Mutations cannot `fetch`. The LLM call lives in the action, always.
- `npx convex dev` must be running while you develop; it deploys on every save.
- Scheduled jobs (`ctx.scheduler.runAfter`) need the backend running to fire. One-shot `npx convex run` commands boot and kill the backend too fast for the 0 ms triage job; keep `convex dev` running in another terminal.
- The vector index declares 1536 dimensions; only seed embeddings from a model with that output size (OpenAI text-embedding-3-small). Until embeddings are seeded, SOP retrieval uses the `by_category` index, which is fine for the demo.
- Convex env vars are read with `process.env.X` inside functions; the frontend only ever gets the deployment URL.

## 6. Where things live

```
convex/schema.ts      tables + indexes (reports, incidents, events, responders, sops, broadcasts, venue)
convex/incidents.ts   all mutations + queries (ingestion, dedup, dispatch, tracking, login, broadcast)
convex/ai.ts          triage action: LLM provider switch (anthropic | openai | gemini) + rule fallback
convex/seed.ts        demo venue, 5 responders, 14 NDMA-derived SOPs
convex/http.ts        REST bridge (Plan B for the EnterPro frontend) + CORS
harness/index.html    working reference client for every function (Reporter / Command / Responder tabs)
```

## 7. The judge line

"We did not build realtime infrastructure. Convex queries are reactive by default, so every screen is a live subscription, and our whole backend is typed TypeScript functions on one platform."
