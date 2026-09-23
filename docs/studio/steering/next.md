# Shadow Studio — Next step

**Next:** `review` — sprint 06's independent review, one round (QA and the Independent Reviewer)
**Say:** `studio next` (in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 06 · power-ups on the river, and ticket numbers you can click |
| Steps | plan ✓ · build ✓ ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) ✓ → [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) ✓ → [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md) ✓) · **review ▶** · close · retro |
| Waiting on you | Nothing blocks. The fork is live to play: https://yevrap.github.io/KamekoStudio/studio/games/river-run/ |

## Notes for the next session

- Review diff: `git diff studio-iteration-05..HEAD`. Record ticket: [SHS-062](../iterations/06/tickets/SHS-062-iteration-record.md). No production
  fix this sprint, so no `reviews/<TICKET>.md` is needed.
- [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md) found the Tone throw froze the restarted run (not just noise). Production's
  `games/river-run/index.html` has the same freeze: backlog #33, a candidate for the top of
  sprint 07's plan. Reviewers may want to weigh that.
- The fork's music restart is now in a `try` that logs via `console.error`; the browser
  tests treat any logged error as a failure.
- The next new backlog item is #36, the next ticket SHS-063.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
