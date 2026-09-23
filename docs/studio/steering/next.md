# Shadow Studio — Next step

**Next:** `build SHS-064` — the River Run fork's power-up HUD: readable at phone width, real seconds
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 3 of 3 (+1 reserve, unclaimed) — the last granted sprint |
| Sprint | 07 · power-ups you can read, and a River Run that restarts ([plan.md](../iterations/07/plan.md)) |
| Steps | plan ✓ · build [SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md) · build [SHS-065](../iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md) · build [SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md) · review · close · retro |
| Waiting on you | Nothing. The Playtester's verdicts (Iterate on the power-ups, Keep on the fork's restart fix) are in [06's review](../iterations/06/review.md); yours overrides |

## Notes for the next session

- [SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md) is #35 + #38 as one M. If it grows, land the layout
  first and send the real-time timers back to the backlog as #38.
- [SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md) (production, ADR-0008) is built last on purpose: its session
  commits locally and pushes nothing, records included; review pushes after
  `reviews/SHS-066.md`.
- Layout evidence at 320 as well as 390; a regression test gives its red count.
- Sprint 07's retro writes E1's epic review and puts E2 (game-first) under *Proposed next
  epic* in `direction.md`; it can land its workflow change in the skills once [SHS-065](../iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md) is Done.
- The next new backlog item is #43, the next ticket SHS-068.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
