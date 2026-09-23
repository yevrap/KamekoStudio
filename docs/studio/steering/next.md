# Shadow Studio — Next step

**Next:** `plan 07` — E1's last granted sprint
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 3 of 3 next (+1 reserve, unclaimed) |
| Sprint | 06 · power-ups on the river, and ticket numbers you can click · shipped `studio-iteration-06` |
| Steps | plan ✓ · build ✓ · review ✓ · close ✓ · retro ✓ ([retro.md](../iterations/06/retro.md)) |
| Waiting on you | Nothing. Since ADR-0011 the Playtester gives the power-ups' verdict; the executive may override it ([review.md](../iterations/06/review.md)) |

## Notes for the next session

- **New direction first:** [ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md),
  the studio runs itself (inbox, 2026-09-23). Log it. #39 is Done as
  [SHS-063](../iterations/06/tickets/SHS-063-exempt-adr-0011-commits.md) (done before plan); #41 takes the process slot, #40 starts in 08. Games first:
  two planned tickets change what a player sees. Triage open `studio` issues (ADR-0011 §4).
- Before pulling, record the [Playtester](../team/playtester.md)'s verdict on the power-ups
  (SHS-060; the workflow runs it before plan, or run it as a subagent) in 06's `review.md`; then #35 + #38 on Iterate or
  Keep, a removal ticket on Kill. Then #33 (skip only if the arcade shipped 🐞 p0-17), #37.
- Sprint 07's retro writes the epic review and puts E2 under *Proposed next epic* in
  `direction.md`; plan 08 adopts it. Original studio games are in scope for E2.
- New in the ticket template: a regression test's red count, layout evidence at 320.
- The next new backlog item is #41, the next ticket SHS-064.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
