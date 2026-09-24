# Shadow Studio — Handoff

*The latest iteration's report. Rewritten by each run; never edited by hand.*

## Iteration 08 — Samovar, the studio's first game of its own

**E2 · sprint 1 of 3 (+1 reserve, unclaimed).**

**Summary**

- ***Samovar*** ([SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md)). An evening of ten guests: hold to pour
  the brew, hold again to top up with water, and match each guest's colour between the
  dashed line and the brim. The Playtester said **Iterate**. The loop reads at once and
  players improve within an evening (5 → 24 of 30), but a hair over the brim costs the
  whole cup, and the review's arithmetic showed the cups don't change the decision. Sprint
  09 fixes both (#51–#54, Q15).
- **The fork's pickups glow from far up the river** ([SHS-069](../iterations/08/tickets/SHS-069-river-run-power-ups-read-at-a-glance.md)), and the power-up
  label keeps one height. **Keep.**
- **The checks accept a ticket branch and a squash-merged pull request** ([SHS-070](../iterations/08/tickets/SHS-070-checks-accept-studio-branches.md)),
  the first part of ADR-0011's pull-request flow.

**Review: one round.** The Independent Reviewer (`opus`) approved with findings and QA
(`sonnet`) approved. Four small findings were fixed in the step with tests shown red
first, two design findings went to the backlog with Q15, and one was declined with its reason.

**Checks**
- **Gate** against `studio-iteration-07`: 11/11 on the first run, the first time in four
  sprints.
- **Post-deploy** after the tag: all three markers found (the realm's pulse on the second
  attempt).
- **Close-out** at this retro: see the retro's commit.

**Live:** https://yevrap.github.io/KamekoStudio/studio/games/samovar/ ·
https://yevrap.github.io/KamekoStudio/studio/games/river-run/ · **Tag:** `studio-iteration-08`

**Where the docs are**

- **Iteration record:** `docs/studio/iterations/08/`: plan (with the three pitches), log,
  review, retro, and 4 tickets ([SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md) to [SHS-071](../iterations/08/tickets/SHS-071-iteration-record.md)).
- **The game:** `docs/studio/games/samovar.md`, the design note with what review found.
- **Cost:** `tests/studio/sprint-cost.mjs` prices a sprint's writes and reads from the
  local transcripts.
- **Handbook:** `templates/ticket.md` (a game ticket states its numbers), `process.md` and
  [Direction](direction.md) (rule 8 in dollars), `team/playtester.md`, `learning-log.md`.
- **Skills:** `studio-iteration` (the retro's cost step), `studio-request` (a request's
  path), and the Playtester's prompt in the workflow and the `studio-sprint` prompts file.

**Trend.**

| | 05 | 06 | 07 | 08 |
|---|---|---|---|---|
| Tickets (done/committed) | 4/3 | 4/3 | 4/3 | **4/3** |
| Review-opened tickets | 0 | 0 | 0 | **0** |
| Fix rounds | 0 | 1 | 1 | **2** |
| Debt (+/−) | +1/−0 | +0/−1 | +0/−0 | **+0/−0** |
| Output tokens, plan to close | — | — | 213,718 | **237,398** |
| Cost, plan to close | — | — | $17.98 | **$18.37** |
| Review's cost | — | — | $8.32 | **$7.86** |

[Shadow Studio — Scorecard](scorecard.md) has row 08.

**Changes from the retro**
- **Your issue #4:** the scorecard keeps each sprint's cost in dollars (writes / reads /
  output), measured by a new reader, with sprint 07 back-filled for comparison. The
  sprint cost about the same as 07 (+2%) and built a whole game.
- **The costliest step is still review (43%).** The Playtester now keeps screenshots out of
  its context unless it needs to see how something looks. The next retro checks review's
  writes ($3.43) and the Playtester's writes and reads ($1.97).
- **Your issue #3:** the team picked and built an original game on its own; game code went
  from about 6% to 30% of changed lines. The request lane hasn't been used yet;
  `studio-request` now tells you a request's whole path when you file one.
- **A game ticket states its numbers before the build** (the ticket template), since
  Samovar's hook failed on arithmetic that review did in a few lines.

**Did the last retro's changes help?** Yes. The Independent Reviewer stopped repeating
counted evidence, and its cost fell from $3.55 to $1.10. #47 wasn't built, and the gate
was green anyway.

**Needs you**

Nothing blocks. Optional: Q16 (trim the root `CLAUDE.md`); Q15 before plan 09 if you don't
want cup shapes; the three real-phone questions in [08's review](../iterations/08/review.md).

**Say next:** "run the studio" (sprint 09, watched) or `studio next`, in a new session.
[Shadow Studio — Next step](next.md) says which step is due.
