# Shadow Studio — Handoff

*The latest iteration's report. Rewritten by each run; never edited by hand.*

## Iteration 09 — Samovar, second pour

**E2 · sprint 2 of 3 (+1 reserve, unclaimed).**

**Summary**

- **Glasses of three shapes** ([SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md)): a straight tea glass, a tulip
  and a wide bowl, each filling in 2.5 s, so the right stop sits at a different height in
  each. The Playtester said **Iterate**. The shapes read apart and can be learned, but a
  player who counts the hold scores better than one who watches the tea. Sprint 10 makes
  the flow differ from guest to guest (#57, Q18 ⭐) and draws the glasses true (#58).
- **A forgiving brim and the best evening on the first screen** ([SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md)):
  a drop over the brim drips down the glass and costs one star; first evenings scored 8 to
  25 of 30 instead of 0. **Keep** on both.
- **The pull-request flow is written down** ([SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md)), with a title lint
  added at review; sprint 10's first ticket is the first real pull request.

**Review: one round.** The Independent Reviewer (`opus`) approved with seven findings,
QA (`sonnet`) approved with none. Four fixes landed in the step, two with a test shown red
first; the rest went to the backlog (#57–#59).

**Checks**
- **Gate** against `studio-iteration-08`: red once on `docs-current` (a Result label in the
  wrong form), fixed; a rerun hung for nine minutes in two browser suites and was stopped;
  then 11/11.
- **Post-deploy** after the tag: both markers found (the realm's blurb on the third
  attempt).
- **Close-out** at this retro: see the retro's commit.

**Live:** https://yevrap.github.io/KamekoStudio/studio/games/samovar/ · **Tag:**
`studio-iteration-09`

**Where the docs are**

- **Iteration record:** `docs/studio/iterations/09/`: plan (with each glass's numbers
  before the build), log, review, retro, and 4 tickets ([SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md) to [SHS-075](../iterations/09/tickets/SHS-075-iteration-record.md)).
- **The game:** `docs/studio/games/samovar.md`, the design note with the shapes, the brim
  and the hook as built.
- **Handbook:** `process.md` (branches and pull requests), `templates/ticket.md` (a bypass
  the numbers show is decided at plan), `team/qa-engineer.md` (QA tests the tests),
  `learning-log.md`, `tech-debt.md` (TD-015).
- **Skills:** `studio-iteration` (the pull-request flow and its title lint), and QA's
  prompt in the workflow and the `studio-sprint` prompts file.

**Trend.**

| | 06 | 07 | 08 | 09 |
|---|---|---|---|---|
| Tickets (done/committed) | 4/3 | 4/3 | 4/3 | **4/3** |
| Review-opened tickets | 0 | 0 | 0 | **0** |
| Fix rounds | 1 | 1 | 2 | **3** |
| Debt (+/−) | +0/−1 | +0/−0 | +0/−0 | **+1/−0** |
| Cost, plan to close, writes + reads | — | $13.71 | $13.63 | **$24.63** |
| Review's writes + reads | — | — | $5.98 | **$9.37** |

Output isn't in the cost row: sprint 09's couldn't be measured (the run was resumed after
a usage limit). [Shadow Studio — Scorecard](scorecard.md) has row 09.

**Changes from the retro**
- **The sprint cost 81 % more in writes and reads.** About $2 of it is a bigger starting
  context for every agent, from outside the repository. The rest is more and longer turns:
  - close went from 26 turns to 66, on a red gate and a hung rerun;
  - the Independent Reviewer's measurements found three of its findings;
  - QA read what the Reviewer read and found nothing.
- **The costliest step is still review (38 %). The one change: QA tests the tests.** QA
  stops re-checking the claims, which is the Reviewer's job. Instead it breaks the code
  in a copy outside the repository and checks that each new test goes red for the reason
  its criterion names. The next retro checks QA's cost ($1.93) and whether QA finds
  anything the Reviewer doesn't.
- **A bypass the numbers show is decided at plan** (the ticket template). Plan 09 saw that
  counting could beat watching, shipped it anyway, and the Iterate on it is why sprint 10
  is another pass on the core.
- **`docs-current` at push (#47) is next in the process slot**, ahead of #21: the gate was
  red on it for the fourth time.
- **A hung suite** is TD-015 and #60.

**Did the last retro's changes help?** Yes, for their targets:

- The Playtester keeps screenshots out of its context. Its writes and reads fell from
  $1.97 to $1.22, and its verdicts still judged how the game looks.
- A game ticket states its numbers before the build. That moved the drip band to 8 % and
  predicted the counting problem.

**Needs you**

Nothing blocks. Optional:

- **Q18** (how the flow varies) before plan 10, if you don't want the ⭐.
- **Q16** (trim the root `CLAUDE.md`).
- **The three real-phone questions** in [09's review](../iterations/09/review.md).
- **The starting context.** Every agent's start grew by about 14k tokens between the two
  sprints with no change in the repo, most likely from the session's own tools. If so, a
  run started from a session with fewer tools would win it back.

**Say next:** "run the studio" (sprint 10, watched) or `studio next`, in a new session.
[Shadow Studio — Next step](next.md) says which step is due.
