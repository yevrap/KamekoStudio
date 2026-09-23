# Shadow Studio — Next step

**Next:** `build SHS-060` — River Run fork: a shield and rapid-fire / spread shot float on the river
**Say:** `studio next` (in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 06 · power-ups on the river, and ticket numbers you can click |
| Steps | plan ✓ · **build ▶** ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) ✓ → [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) → [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md)) · review · close · retro |
| Waiting on you | Nothing blocks |

## Notes for the next session

- Plan is in `docs/studio/iterations/06/plan.md`; the record ticket is [SHS-062](../iterations/06/tickets/SHS-062-iteration-record.md). Gate base:
  `studio-iteration-05`.
- [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) retires the fork's byte-for-byte equality test (`river-run-fork.test.mjs`
  claim 1). Keep `EDITS` and the source commit as the record of the copy, with a note in
  the test saying why equality stopped here. If the session can't hold both power-ups,
  land the shield and put rapid-fire back in the backlog as its own row.
- Write ticket mentions as links; `node tests/studio/link-tickets.mjs` links any you
  miss and changes nothing when there are none ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md), `process.md`).
- The next new backlog item is #35, the next ticket SHS-063.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
