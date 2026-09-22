# Skazka Trail — Improvements

> Idea inbox for `drafts/skazka-trail/`. See [Skazka Trail — Concept & Directions](plans/concept-and-directions.md) for the overview and [Backlog](backlog.md) for what's shipped.

## Inbox

- **"The player cannot go back in the story."** *(moved here from an orphaned raw capture at the top of this file, 2026-07-29 morning-brief — not yet root-caused.)* Likely the same complaint as [Backlog](backlog.md)'s Inbox item about wanting an on-screen (not just browser-Back) way to return to story select — triage both together.
- **Embedded display typeface** — [Skazka Trail Questionnaire — Visual Design](../../archive/questionnaires/skazka-trail-visual-design.md) Q5=B asked for a display face on the tale title + ending titles, with a self-host-vs-CDN preference left blank. The 2026-07-22 visual pass implemented this as a **system serif display stack** (Iowan Old Style/Palatino/Book Antiqua/Georgia) instead of embedding an actual custom font file — adding a font binary to the repo is a file download, which needs Yev's explicit go-ahead in chat before an agent can do it (safety-rule boundary, not a technical one), and the session didn't stop mid-pass to ask. If Yev wants a real embedded typeface (more consistent cross-device look than a system-font stack), that's a small follow-up: pick a face, get the go-ahead to download it into the repo, self-host it under a `fonts/` path per the questionnaire's stated preference for offline-capability over a CDN link.
