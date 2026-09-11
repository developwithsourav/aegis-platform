# Cognitive Chaos 2026 entry

A record of what the team submitted to the finale, what ran on the day and what the judges said.

The exact code that was judged is frozen at the tag `v1.0-hackathon`, which also holds the full working material from the event: the build spec, the prompt packs used to generate the EnterPro frontend, the demo script, the deck sources and a developer test client. `main` keeps only what is needed to run and read the project.

```bash
git checkout v1.0-hackathon      # exactly what was judged
git checkout main                # the project as it is now
```

## The entry

| | |
|---|---|
| Project | AEGIS, AI Emergency Grid & Incident System |
| Team | Ninja Coders: Sourav Kumar, Manish Joshi, Siddharth Singh, Rajat Kushwaha |
| Event | Cognitive Chaos 2026 finale, Microsoft Office, Sovereign Noida |
| Date | 25 July 2026 |
| Track | Convex Open Innovation (self-proposed problem) |
| Result | Finalist |
| Deck | [`docs/AEGIS_Finale_Deck.pdf`](docs/AEGIS_Finale_Deck.pdf) |

## What ran on the day

The competition required the frontend to be built and deployed on EnterPro. That build had reporter, command and responder routes at `/`, `/command` and `/responder`, and it is still online at https://490cbec14e504e7aa506bc0208460713.prod.enterapp.pro/. The backend ran entirely on Convex, using reactive queries, actions, vector search, the scheduler and file storage.

These worked end to end during judging: one-tap reporting with GPS and a zone fallback, triage with a priority, a summary and steps drawn from NDMA guidance, merging of repeat reports, role-matched nearest dispatch, responder accept with a live ETA, exit guidance broadcasts, the audit trail, photo evidence and a reporter callback number. A load test sent 50 simultaneous reports with no failures.

On the morning of the finale the EnterPro deployment started failing with a TLS connection reset. The team ran the demo from an identical local build connected to the same Convex backend, which stayed up throughout.

## What the judges criticised

The judges raised three problems, and all three were fair.

1. Photo upload failed on Android phones. The file input had `capture="environment"`, which forces the camera and hides the gallery picker.
2. The confidence score wasn't measured. The LLM reported its own confidence, so a blank photo came back at 95%.
3. The pitch didn't separate AEGIS from 112. India's ERSS already offers a call line, SMS, an app and location sharing.

All three are fixed on `main`, starting with the commit "Fix the three problems the finale judges found". Photo upload now offers the gallery, the card shows corroboration from independent reports, and the README explains that AEGIS works inside a venue and hands off to 112. The tagged submission still has the original problems, since that is the version the judges saw.
