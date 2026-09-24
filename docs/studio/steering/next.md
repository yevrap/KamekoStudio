# Shadow Studio — Next step

**Next:** `retro` — sprint 07's retrospective, E1's epic review, E2 under *Proposed next epic*, and the steering views
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 3 of 3 (+1 reserve, unclaimed) — the last granted sprint |
| Sprint | 07 · power-ups you can read, and a River Run that restarts ([plan.md](../iterations/07/plan.md)) |
| Steps | plan ✓ · build [SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md) ✓ · build [SHS-065](../iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md) ✓ · build [SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md) ✓ · review ✓ · close ✓ · retro |
| Waiting on you | Nothing blocks. Q13 (`version.json` for production fixes, backlog #43) waits for your tick; the Playtester's two phone questions are in [07's review](../iterations/07/review.md) |

## Notes for the next session

- Closed and live: tagged `studio-iteration-07`, gate 11/11, postdeploy found all three
  markers (fork, arcade River Run, realm pulse) on the first attempt.
- The gate's `docs-current` was red once on [SHS-063](../iterations/06/tickets/SHS-063-exempt-adr-0011-commits.md) (a between-sprints ticket without the
  Result fields): a retro lesson — tickets built outside a sprint skip the template.
- The retro writes E1's epic review, puts E2 (game-first) under *Proposed next epic* in
  `direction.md`, lands its workflow change in the skills under [SHS-067](../iterations/07/tickets/SHS-067-iteration-record.md), updates
  `LEARNED` in `studio/shelf-data.js`, and removes backlog #33, #35, #38, #41.
- The next new backlog item is #47, the next ticket SHS-068.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
