# Shadow Studio — Next step

**Next:** `retro` — sprint 06's retrospective and the steering views
**Say:** `studio next` (in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 06 · power-ups on the river, and ticket numbers you can click · shipped `studio-iteration-06` |
| Steps | plan ✓ · build ✓ ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) ✓ → [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) ✓ → [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md) ✓) · review ✓ · close ✓ · **retro ▶** |
| Waiting on you | A Keep / Iterate / Kill on the power-ups ([review.md](../iterations/06/review.md)); it doesn't block the retro. Play: https://yevrap.github.io/KamekoStudio/studio/games/river-run/ |

## Notes for the next session

- The retro's work under [SHS-062](../iterations/06/tickets/SHS-062-iteration-record.md): `retro.md`, the realm's `LEARNED` line
  (iteration `'06'`), `learning-log.md`, `tech-debt.md` (TD-014 closed at [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md)), run
  `node tests/studio/link-tickets.mjs` before regenerating the board, scorecard and handoff.
- The gate's first run was red only on `docs-current` (the record ticket open at the gate):
  the close records have to land before the gate, not after. A retro lesson.
- E1's done-when still needs the executive's verdict on one experiment; the team's
  proposal is Iterate (#35's HUD overlap, QA F5's frame-counted timers). Sprint 07 is E1's
  last granted sprint, so its plan should leave room to act on the verdict.
- Sprint 07's plan: #33 first (production restart freeze) unless the arcade has shipped
  🐞 p0-17; #37 is its deterministic test; #21 has the process slot.
- The next new backlog item is #38, the next ticket SHS-063.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
