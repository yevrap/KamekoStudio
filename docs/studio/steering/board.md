# Shadow Studio — Board

*Regenerated from the repo by each run. Don't hand-edit — add anything you want to say to
[Shadow Studio — Feedback Inbox](inbox.md) instead.*

**Epic E2 · The studio's first original game worth playing · sprint 2 of 3 (+1 reserve,
unclaimed).** *Samovar* has had its second pass: the brim and the best evening got a Keep,
the glasses an Iterate. Sprint 10, the last granted sprint, is another pass on the core.

**Iteration 09 · shipped.** *Samovar's* second pour: three tea glasses of different shapes
that each fill in the same time, a hair over the brim that drips and costs a star instead
of the whole cup, and your best evening on the first screen. The pull-request flow is
written into the skill for sprint 10. Tag `studio-iteration-09`. Live:
https://yevrap.github.io/KamekoStudio/studio/games/samovar/

One review round; the Independent Reviewer approved with findings, QA approved. The
Playtester: the glasses **Iterate**, the forgiving brim **Keep**, the best on the first
screen **Keep**.

## Waiting on you

Nothing blocks. When you have a minute:

| What | Where |
|---|---|
| How Samovar's pour changes from guest to guest (⭐ a flow per guest, shown by the stream's thickness; taken at plan 10 unless you tick another) | Q18 in [Shadow Studio — Questionnaire](questionnaire.md) |
| Trim the root `CLAUDE.md` to make every agent's start cheaper? (⭐ move two arcade-only blocks) | Q16, same questionnaire |
| When a pull request merges (⭐ at the end of its build, already in the skill) | Q17, same questionnaire |
| Three things only a real phone can answer: counting or watching after a few evenings, the tulip's thin Light layer in daylight, where your thumb lands at the brim | [09's review](../iterations/09/review.md) |
| Strike the Playtester's verdicts if you disagree | [09's review](../iterations/09/review.md), or "studio verdict: …" |
| Every agent's starting context grew by about 14k tokens between sprint 08's run and 09's, with no change in the repo (about $2 a sprint) | [09's retro](../iterations/09/retro.md), *Efficiency* |

## Next

`plan` sprint 10, **E2 · sprint 3 of 3**, the last granted sprint. At the top of
[Shadow Studio — Backlog](backlog.md):

1. #57 Samovar: the pour's flow differs from guest to guest (Ready, Q18 ⭐)
2. #58 Samovar: the glasses drawn true to their names and aspect (Ready)
3. #50 the first real pull request, riding on the first games ticket (Ready)
4. #47 `docs-current` at push — the process slot, ahead of #21 (Ready)
5. #60 a hung suite fails by name within a time limit (Ready)

#21, #56 and #59 wait for later process slots.

## Blocked

Nothing.

## Done — iteration 09

| Ticket | What |
|---|---|
| [SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md) | ***Samovar*: three glasses of different shapes, each filling in the same time** |
| [SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md) | ***Samovar*: a hair over the brim costs a star, not the cup; the best evening on the first screen** |
| [SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md) | The skill's build and review steps describe the branch and pull-request flow |
| [SHS-075](../iterations/09/tickets/SHS-075-iteration-record.md) | The iteration's record, and the retro's change to QA |

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
| TD-015 | Nothing limits how long a suite runs; a gate rerun hung for nine minutes at close 09 (#60) |

One row opened in 09 (TD-015), none closed. Full register, with the cost of leaving each
one: `docs/studio/tech-debt.md` in the repo.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Handoff](handoff.md) · [Shadow Studio — Scorecard](scorecard.md)*
