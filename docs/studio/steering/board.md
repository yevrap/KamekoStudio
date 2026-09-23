# Shadow Studio — Board

*Regenerated from the repo by each run. Don't hand-edit — add anything you want to say to
[Shadow Studio — Feedback Inbox](inbox.md) instead.*

**Epic E1 · The Studio Wing opens · sprint 1 of 3 spent (+1 reserve, unclaimed).**

**Iteration 05 · shipped.** The River Run portal on the 3D landing page opens the studio's
own copy of River Run, which plays like the arcade's and keeps its own saves. Tag
`studio-iteration-05`. Live: https://yevrap.github.io/KamekoStudio/3d.html (walk into the
River Run portal) · the fork:
https://yevrap.github.io/KamekoStudio/studio/games/river-run/

One review round; both passes approved with findings. No fix rounds.

## Waiting on you

| What | Where |
|---|---|
| **Which River Run experiment goes first?** Blank at plan 06 takes ⭐ power-ups | Q12 in [Shadow Studio — Questionnaire](questionnaire.md) |
| Keep / Iterate / Kill on what shipped | `docs/studio/iterations/05/review.md` |
| Should a production fix also need your approval? | Q10, same note |
| Name the realm, if "Shadow Studio" isn't it | Q1, same note |
| Anything else about how the company runs | Q5, same note (it stays open) |

## Next

`plan` sprint 06, **E1 · sprint 2 of 3**: the first experiment in the River Run fork. The
top of [Shadow Studio — Backlog](backlog.md) is Ready:

1. #4 power-ups (or whichever experiment Q12 picks)
2. #22 the fork's Tone.js start-time fix
3. #21 a commit form for your steering edits — the one process ticket
4. #8 best score on the game-over screen
5. #31 a way back to the 3D page from the fork

## Blocked

Nothing.

## Done — iteration 05

| Ticket | What |
|---|---|
| SHS-055 | The studio checks tell studio commits from arcade commits on the shared `main` |
| SHS-056 | **River Run forked** into `studio/games/river-run/`, with `studio_` saves only |
| SHS-057 | **The 3D page's River Run portal opens the fork** (ADR-0010) |
| SHS-058 | The iteration's record |

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
| TD-014 | **New.** The fork's browser test exempts one inherited Tone.js rejection; closes with #22 |

Full register, with the cost of leaving each one: `docs/studio/tech-debt.md` in the repo.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Handoff](handoff.md) · [Shadow Studio — Scorecard](scorecard.md)*
