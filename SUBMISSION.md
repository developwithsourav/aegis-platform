# Cognitive Chaos 2026 — what we submitted

This file is the permanent record of the hackathon entry. Everything described
here is frozen at the git tag **`v1.0-hackathon`** and on the branch
**`hackathon-submission`**. Development after the event continues on `main` and
does not touch either.

```bash
git checkout v1.0-hackathon      # exactly what was judged
git checkout main                # ongoing development
```

## The entry

| | |
|---|---|
| Project | **AEGIS — AI Emergency Grid & Incident System** |
| Team | Ninja Coders |
| Members | Sourav Kumar · Manish Joshi · Siddharth Singh · Rajat Kushwaha |
| Event | Cognitive Chaos 2026 Finale, Microsoft Office Sovereign Noida |
| Date | 25 July 2026 |
| Track | Convex — Open Innovation (self proposed problem) |
| Result | Reached the final rounds. Did not win. |

## What was live on the day

| | |
|---|---|
| Deployed app (EnterPro) | `https://490cbec14e504e7aa506bc0208460713.prod.enterapp.pro` |
| Reporter · Command · Responder | `/` · `/command` · `/responder` |
| Backend (Convex) | `judicious-oyster-529` |
| Deck | `AEGIS_Finale_Deck.pdf` and `.pptx` at the repo root |

Frontend generated and deployed on **EnterPro**, per the competition rule.
Backend entirely on **Convex**: reactive queries, actions, vector search,
scheduler and file storage.

## What worked, verified end to end on the day

One tap reporting with GPS and a zone fallback · AI triage with priority,
summary and NDMA grounded steps · de-duplication of repeat reports · role
matched nearest dispatch · responder accept and live ETA · exit guidance
broadcast · immutable audit trail · photo evidence and reporter callback ·
50 simultaneous reports with zero failures.

On the morning of the finale the EnterPro deployment went down with a TLS
connection reset while their platform stayed up. The demo ran from an identical
local build against the same live Convex backend, which never went down.

## What the judges criticised, and it was fair

1. **Photo upload did not work on mobile.** The file input carried
   `capture="environment"`, which on Android forces the camera and removes the
   gallery picker.
2. **The confidence score was fabricated.** It was the LLM reporting its own
   confidence, so a blank photo scored 95%. Nothing was calibrated or measured.
3. **112 already covers this.** India's ERSS has a call line, SMS, an app and
   location sharing, and the pitch did not draw a clear line between the two.

All three are addressed on `main` from commit `f525ae5` onward. The tagged
submission deliberately still contains them, because that is what was judged.

## Where it goes next

`main` continues as a personal project: migrating off Convex and EnterPro onto
a self hosted FastAPI and Postgres stack, replacing the fabricated confidence
with a trained classifier evaluated on a held out set, and repositioning as a
venue operations layer that escalates to 112 rather than competing with it.
See `ROADMAP.md`.
