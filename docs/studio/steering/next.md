# Shadow Studio — Next step

**Next:** `build SHS-057`: the 3D landing page's River Run portal opens the studio fork
**Say:** `studio next` (in a new session) · or `studio next — focus: <what you want>`

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 1 of 3 (+1 reserve) |
| Sprint | 05 · the River Run portal opens the studio's fork of River Run |
| Steps | plan ✓ · **build ▶** (SHS-055 ✓ → SHS-056 ✓ → SHS-057) · review · close · retro |
| Waiting on you | Nothing blocks. Q12 (first River Run experiment) takes ⭐ power-ups if blank at plan 06 |

## Notes for the next session

- The fork is live at `studio/games/river-run/`. SHS-057 points the River Run entry's `url`
  in `shared/3d/constants.js` at it, under a recorded exception checked like
  `frontPositions` (the plan's risk table has the shape).
- The fork's differences are data in `tests/studio/lib/river-run-fork.mjs`. Don't edit the
  fork by hand without updating that list, or the equality test fails.
- Backlog #22: the browser test exempts one named, inherited Tone.js `RangeError`.
- An executive edit to `docs/studio/steering/` has no passing commit form yet (#21); if one
  lands, record its hash in `COMMIT_EXEMPTIONS` with a reason.
- The next ticket number after SHS-058 is SHS-059.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
