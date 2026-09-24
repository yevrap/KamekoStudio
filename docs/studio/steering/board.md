# Shadow Studio — Board

*Regenerated from the repo by each run. Don't hand-edit — add anything you want to say to
[Shadow Studio — Feedback Inbox](inbox.md) instead.*

**Epic E2 · The studio's first original game worth playing · sprint 1 of 3 (+1 reserve,
unclaimed).** Its first game, *Samovar*, is live as a prototype with the Playtester's
Iterate; sprint 09 acts on it.

**Iteration 08 · shipped.** *Samovar*: pour tea for an evening of ten guests, one button,
each cup's strength judged by its colour. The River Run fork's pickups glow from far up
the river. Tag `studio-iteration-08`. Live:
https://yevrap.github.io/KamekoStudio/studio/games/samovar/ and
https://yevrap.github.io/KamekoStudio/studio/games/river-run/ (or the River Run portal on
https://yevrap.github.io/KamekoStudio/3d.html)

One review round; the Independent Reviewer approved with findings, QA approved. The
Playtester: Samovar **Iterate**, the fork's pickups **Keep**.

## Waiting on you

Nothing blocks. When you have a minute:

| What | Where |
|---|---|
| Trim the root `CLAUDE.md` to make every agent's start cheaper? (⭐ move two arcade-only blocks; about 2% a sprint) | Q16 in [Shadow Studio — Questionnaire](questionnaire.md) |
| What makes Samovar's cups different (⭐ shapes, taken at plan 09 unless you tick another) | Q15, same questionnaire |
| Three things only a real phone can answer: Samovar's small-cup timing under a thumb, Golden vs Amber in normal light, River Run's glow outdoors | [08's review](../iterations/08/review.md) |
| Strike the Playtester's verdicts if you disagree | [08's review](../iterations/08/review.md), or "studio verdict: …" |

## Next

`plan` sprint 09, **E2 · sprint 2 of 3**. At the top of
[Shadow Studio — Backlog](backlog.md):

1. #51 Samovar: a forgiving brim (Ready)
2. #52 Samovar: every cup fills in the same time, and the result card leaves the rim in
   view (Ready, with #53)
3. #53 Samovar: cups of different shapes, so the cup changes the decision (Ready, Q15 ⭐)
4. #54 Samovar: the best evening on the first screen (Ready)
5. #49 branches and pull requests, part 2 — the process slot (Ready)

#21, #47 and #43 wait for later process slots.

## Blocked

Nothing.

## Done — iteration 08

| Ticket | What |
|---|---|
| [SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md) | ***Samovar*, the studio's first original game: pour tea for an evening of guests** |
| [SHS-069](../iterations/08/tickets/SHS-069-river-run-power-ups-read-at-a-glance.md) | **The fork's far-off pickups glow; the power-up label keeps one height** |
| [SHS-070](../iterations/08/tickets/SHS-070-checks-accept-studio-branches.md) | The checks accept a ticket branch and a squash-merged pull request |
| [SHS-071](../iterations/08/tickets/SHS-071-iteration-record.md) | The iteration's record, and the retro's cost reader |

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

No row opened or closed in 08. Full register, with the cost of leaving each one:
`docs/studio/tech-debt.md` in the repo.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Handoff](handoff.md) · [Shadow Studio — Scorecard](scorecard.md)*
