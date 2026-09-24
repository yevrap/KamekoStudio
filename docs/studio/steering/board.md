# Shadow Studio — Board

*Regenerated from the repo by each run. Don't hand-edit — add anything you want to say to
[Shadow Studio — Feedback Inbox](inbox.md) instead.*

**Epic E1 · The Studio Wing opens · done in 3 of 3 sprints (reserve unclaimed).** E2, *the
studio's first original game worth playing*, is proposed in [Direction](direction.md);
plan 08 adopts it unless you strike or change it.

**Iteration 07 · shipped.** The River Run fork's power-ups read at phone width and count
real seconds, and the arcade's River Run no longer freezes on restart. Tag
`studio-iteration-07`. Live: https://yevrap.github.io/KamekoStudio/studio/games/river-run/
(or the River Run portal on https://yevrap.github.io/KamekoStudio/3d.html) and
https://yevrap.github.io/KamekoStudio/games/river-run/

One review round; both passes approved with findings. The Playtester kept both changes.

## Waiting on you

Nothing blocks. When you have a minute:

| What | Where |
|---|---|
| Strike or change E2 before plan 08 adopts it | *Proposed next epic* in [Direction](direction.md) |
| May a production fix bump `version.json`? (⭐ yes; waits for your tick, since it touches releases) | Q13 in [Shadow Studio — Questionnaire](questionnaire.md) |
| Two things only a real phone can answer: River Run's music after many restarts on an iPhone, and whether a spread shot is worth grabbing at 120 Hz | [07's review](../iterations/07/review.md) |
| Name the realm, if "Shadow Studio" isn't it | Q1, same questionnaire |

## Next

`plan` sprint 08, **E2 · sprint 1 of 3**. At the top of
[Shadow Studio — Backlog](backlog.md):

1. #48 E2's first game: three pitches, the pick with its ⭐, the core mechanic as a
   prototype (refined at plan)
2. #44 the fork's power-up label keeps one height (Ready)
3. #42 a far-off pickup reads at a glance (Ready)
4. #40 branches and pull requests, first part — the process slot (split at plan)
5. #37 a deterministic restart test for the fork (Ready)

#21 and #47 (Ready) wait for later process slots.

## Blocked

Nothing.

## Done — iteration 07

| Ticket | What |
|---|---|
| [SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md) | **The fork's score and power-up label read at 320 and 390; the spread shot counts real seconds** |
| [SHS-065](../iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md) | A ticketed studio commit may change the studio's own skills and conductor |
| [SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md) | **The arcade's River Run never freezes on restart** (p0-17, reviewed before push) |
| [SHS-067](../iterations/07/tickets/SHS-067-iteration-record.md) | The iteration's record, E1's epic review and E2 |

## Open debt

| | |
|---|---|
| TD-001 | The realm's own home has no portal. E1 made the 3D page the studio's window instead; the River Run portal is the first door |
| TD-003 | The storage-key rule is implemented twice |
| TD-005 | With site data blocked, the arcade's `settings.js` throws and `body.dark-mode` is never applied |
| TD-006 | The 3D landing page prefers a portal prompt to a trophy prompt at any range |
| TD-007 | The static test server exists twice |
| TD-008 | What `studio-boot` does not collect |
| TD-012 | A production fix to a test harness could empty it with every check green before its review |
| TD-013 | A merge that takes a fix file from one parent is invisible to `path-guard` |

No row opened or closed in 07. Full register, with the cost of leaving each one:
`docs/studio/tech-debt.md` in the repo.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Handoff](handoff.md) · [Shadow Studio — Scorecard](scorecard.md)*
