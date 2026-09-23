# Shadow Studio — Next step

**Next:** `review` — sprint 07's one review round: QA, the Independent Reviewer, the Playtester; then push SHS-066
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 3 of 3 (+1 reserve, unclaimed) — the last granted sprint |
| Sprint | 07 · power-ups you can read, and a River Run that restarts ([plan.md](../iterations/07/plan.md)) |
| Steps | plan ✓ · build [SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md) ✓ · build [SHS-065](../iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md) ✓ · build [SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md) ✓ · review · close · retro |
| Waiting on you | Nothing. The Playtester's verdicts (Iterate on the power-ups, Keep on the fork's restart fix) are in [06's review](../iterations/06/review.md); yours overrides |

## Notes for the next session

- **Not pushed (ADR-0008):** `1414dab` (the fix: `games/river-run/index.html` +
  `scripts/e2e.mjs`), `61e69c6` (arcade `docs:` commit, roadmap p0-17 ✅), and the SHS-066
  build records. Review `1414dab`, write `iterations/07/reviews/SHS-066.md` with
  `**Reviewed:** <full hash of 1414dab>` and `**Verdict:** APPROVED …`, then `--stage=push`
  and `git push origin main`; tick SHS-066's fifth criterion.
- Player-visible for the Playtester, served locally: `studio/games/river-run/` (SHS-064,
  score and power-up HUD at 320/390, real-second timers) and `games/river-run/` (SHS-066,
  die and restart many times, every run starts with music).
- Close's postdeploy markers: fork `POWERUP_MAX_STEP_S`; arcade River Run
  `River Run music failed to restart`. #35, #38, #41 close with the sprint.
- Sprint 07's retro writes E1's epic review, puts E2 (game-first) under *Proposed next
  epic* in `direction.md`, and lands its workflow change in the skills under SHS-067.
- The next new backlog item is #43, the next ticket SHS-068.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
