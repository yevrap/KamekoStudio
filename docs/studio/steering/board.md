# Shadow Studio — Board

*Regenerated from the repo by each run. Don't hand-edit — add anything you want to say to
[Shadow Studio — Feedback Inbox](inbox.md) instead.*

**Epic E1 · The Studio Wing opens · sprint 2 of 3 spent (+1 reserve, unclaimed).**

**Iteration 06 · shipped.** River Run's first experiment: a shield and a spread shot float
down the fork's river. A restart can no longer freeze the fork, and every studio ticket
number in the docs links to its ticket. Tag `studio-iteration-06`. Live:
https://yevrap.github.io/KamekoStudio/studio/games/river-run/ (or the River Run portal on
https://yevrap.github.io/KamekoStudio/3d.html)

One review round; both passes approved with findings. One fix round ([SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md), the spread
shot's shot pool).

## Waiting on you

| What | Where |
|---|---|
| **Keep / Iterate / Kill on the power-ups.** E1 needs your verdict on one experiment to finish. The team says Iterate | `docs/studio/iterations/06/review.md` |
| Should a production fix also need your approval? | Q10 in [Shadow Studio — Questionnaire](questionnaire.md) |
| Name the realm, if "Shadow Studio" isn't it | Q1, same note |
| Anything else about how the company runs | Q5, same note (it stays open) |

## Next

`plan` sprint 07, **E1 · sprint 3 of 3**, the epic's last granted sprint. The top of
[Shadow Studio — Backlog](backlog.md) is Ready:

1. #33 production River Run's restart freeze (arcade 🐞 p0-17), a production fix under ADR-0008
2. #37 a deterministic restart test, which #33 reuses
3. #35 the score, the power-up HUD and the controls stop overlapping on a phone
4. #21 a commit form for your steering edits — the one process ticket
5. #8 best score on the game-over screen

#38 (power-up timers in real time) sits just below, and follows your verdict. The retro
writes the epic review and proposes E2.

## Blocked

Nothing.

## Done — iteration 06

| Ticket | What |
|---|---|
| [SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) | Every `SHS-NNN` in the docs links to its ticket; the retro keeps them linked |
| [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) | **A shield and a spread shot float down the fork's river** |
| [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md) | **A restart can no longer freeze the fork**; TD-014 closed |
| [SHS-062](../iterations/06/tickets/SHS-062-iteration-record.md) | The iteration's record |

## Open debt

| | |
|---|---|
| TD-001 | The realm's own home has no portal. E1 makes the 3D page the studio's window instead; the River Run portal is the first door |
| TD-003 | The storage-key rule is implemented twice |
| TD-005 | With site data blocked, the arcade's `settings.js` throws and `body.dark-mode` is never applied |
| TD-006 | The 3D landing page prefers a portal prompt to a trophy prompt at any range |
| TD-007 | The static test server exists twice |
| TD-008 | What `studio-boot` does not collect |
| TD-012 | A production fix to a test harness could empty it with every check green before its review |
| TD-013 | A merge that takes a fix file from one parent is invisible to `path-guard` |

TD-014 closed in 06 ([SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md)). Full register, with the cost of leaving each one:
`docs/studio/tech-debt.md` in the repo.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Handoff](handoff.md) · [Shadow Studio — Scorecard](scorecard.md)*
