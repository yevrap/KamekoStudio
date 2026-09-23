# Shadow Studio — Next step

**Next:** `build SHS-061` — River Run fork: the music never schedules a Tone.js start below `Tone.now()`
**Say:** `studio next` (in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 06 · power-ups on the river, and ticket numbers you can click |
| Steps | plan ✓ · **build ▶** ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) ✓ → [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) ✓ → [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md)) · review · close · retro |
| Waiting on you | Nothing blocks. The power-ups are live to play: https://yevrap.github.io/KamekoStudio/studio/games/river-run/ |

## Notes for the next session

- Plan is in `docs/studio/iterations/06/plan.md`; the record ticket is [SHS-062](../iterations/06/tickets/SHS-062-iteration-record.md). Gate base:
  `studio-iteration-05`.
- The equality test is retired ([SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md)). `INHERITED_TONE_RANGE` in
  `tests/studio/river-run-fork.test.mjs` is the exemption [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md) removes. The fork now has
  two Tone synths: `playSfx` already schedules from `Tone.now()`, so the music's sequence
  restart in `initGame` is the only suspect.
- `openFork()` in that test file drives a fresh fork page (start, quiet the river); reuse
  it for the 20-run test.
- The next new backlog item is #36, the next ticket SHS-063.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
