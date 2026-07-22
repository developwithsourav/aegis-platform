# AEGIS reference app

A complete, working implementation of all three AEGIS routes, running against the
live Convex backend. **This is not the competition submission** — the submitted
build must be created and deployed with EnterPro. This exists to:

1. prove the backend contract end to end before spending EnterPro credits,
2. give the team something real to click through, and
3. serve as the visual and behavioural target for the EnterPro build
   (`docs/ENTERPRO_MASTER_PROMPT.md`).

## Run it

```bash
npm run app        # http://localhost:4320
```

Routes are hash-based so it works from a plain static server:

| Route | Access |
|---|---|
| `#/` | Reporter — public |
| `#/responder` | Responder — venue passcode |
| `#/command` | Command — operator login |

Credentials live in the Convex deployment's environment variables, never here.
Read them with `npx convex env get OPERATOR_PASSWORD` / `RESPONDER_PASSCODE`.

## Shape

One file, `index.html`. Every backend call is confined to the adapter block at
the top of the module script — the same boundary the EnterPro build uses
(`src/aegis-backend.js`), so behaviour can be compared directly.

Two things worth knowing if you extend it:

- `anyApi` is a Proxy, so `api.incidents.foo` returns a **new object on every
  access**. The function references are resolved once into `F` — passing them
  inline would make each `useEffect` dependency change every render and the
  subscription would tear down and re-create forever.
- htm passes props through verbatim, but React wants a style **object** and
  `className`. The `h()` wrapper normalises both so the markup can stay
  HTML-shaped.

## Verified end to end

Report with GPS-denied zone fallback · live AI triage (P1, LLM headline and
summary, 90% confidence) · NDMA SOP steps via vector search · role-matched
dispatch (medical → medic E-05) · 60 s P1 escalation in the audit trail · live
ETA on the reporter with no refresh · exit-guidance broadcast appearing on every
route within a second.
