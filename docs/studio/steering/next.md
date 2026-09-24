# Shadow Studio — Next step

**Next:** `build SHS-073` — Samovar: a hair over the brim costs a star, not the cup, and the best evening shows from the start
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E2 · The studio's first original game worth playing · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 09 · Samovar, second pour: glasses of their own and a forgiving brim ([plan.md](../iterations/09/plan.md)) |
| Steps | plan ✓ · build [SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md) ✓ · build [SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md) · build [SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md) · review · close · retro |
| Waiting on you | Nothing blocks. Q15 took its ⭐ (shapes) and Q17 its ⭐ (a pull request merges at the end of its build); tick either in the [questionnaire](questionnaire.md) to overturn it. Q16 waits for your tick and blocks nothing |

## Notes for the next session

- Every cup now holds 100 units and fills in `FILL_MS` 2500 (`POUR_RATE` 40/s), so
  [SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md)'s 8 % drip band is 8 units and 200 ms on any cup. `judge`'s `level` is a volume
  share; `heightAtVolume` clamps at 1, so a drip over the brim needs its own drawing.
- The glass is an SVG in `index.html` (`#glass-edge`, `#glass-clip`, `#liquid`, `#band`);
  `main.js` exports `serveCup` for the layout test. The result card sits at the stage's
  bottom: a drip down the glass's side must stay visible beside it at 320.
- [SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md) is built last; the pull-request flow starts at plan 10.
- Screenshots: save to disk, compose into one image, look once (SHS-072 did; retro 08).
  Retro 09 checks review's writes ($3.43 in 08) and the Playtester's writes and reads ($1.97).
- The next new backlog item is #56, the next ticket SHS-076.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
