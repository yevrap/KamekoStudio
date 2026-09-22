# Shadow Studio — Next step

**Next:** `build SHS-056`: River Run is forked into `studio/games/river-run/` with only `studio_` saves
**Say:** `studio next` (in a new session) · or `studio next — focus: <what you want>`

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 1 of 3 (+1 reserve) |
| Sprint | 05 · the River Run portal opens the studio's fork of River Run |
| Steps | plan ✓ · **build ▶** (SHS-055 ✓ → SHS-056 → SHS-057) · review · close · retro |
| Waiting on you | Nothing blocks. Q12 (first River Run experiment) takes ⭐ power-ups if blank at plan 06 |

## Notes for the next session

- Tickets are in `docs/studio/iterations/05/tickets/`; the plan names the fork's storage
  traps (`theme` read, unnamespaced `muted`, the Watch Mode prefix).
- SHS-055 landed: commits are sorted by `commitKind` (`tests/studio/lib/rules.mjs`). Scope
  every studio commit `(studio)`; an unscoped commit touching `studio/**` now fails.
- An executive edit to `docs/studio/steering/` has no passing commit form yet (backlog #21);
  if one lands, record its hash in `COMMIT_EXEMPTIONS` with a reason rather than rewording.
- The next ticket number after SHS-058 is SHS-059.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
