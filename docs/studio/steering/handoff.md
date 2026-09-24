# Shadow Studio — Handoff

*The latest iteration's report. Rewritten by each run; never edited by hand.*

## Iteration 07 — power-ups you can read, a River Run that restarts, and E1 done

**E1 · sprint 3 of 3 (+1 reserve, unclaimed).** E1 is done inside its budget. E2 is
proposed in [Direction](direction.md), and plan 08 adopts it unless you change it.

**Summary**

- **The fork's power-ups, second pass** ([SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md)). The score stays on one line at 320
  and 390 wide, the power-up label has its own pill below it, and "✦ SPREAD 6.0s" counts
  real seconds at any frame rate and waits while the drawer is open. The Playtester's
  Iterate from 06 became a Keep.
- **The arcade's River Run never freezes on restart** ([SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md), arcade p0-17). The fix
  the fork proved in 06, applied to production under ADR-0008: tests red 5 of 5 before it,
  reviewed before it was pushed, 80 restarts clean at review. Kept by the Playtester.
- **The studio can edit its own skills and conductor** in a ticketed commit ([SHS-065](../iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md)).
  This retro was the first to use it.

**Review: one round.** The Independent Reviewer (`opus`) and QA (`sonnet`) each approved
with findings; the Playtester (`opus`) kept both player-visible changes. Four findings
fixed in the step, one to the backlog with Q13 (#43), three Playtester notes to the
backlog (#44–#46).

**Checks**
- **Gate** against `studio-iteration-06`: red once on `docs-current` ([SHS-063](../iterations/06/tickets/SHS-063-exempt-adr-0011-commits.md) lacked its
  Result fields), then 11/11.
- **Post-deploy** after the tag: all three markers found on the first attempt.
- **Close-out 3/3** at this retro: iteration docs, doc cleanliness (160 documents),
  changelog.

**Live:** https://yevrap.github.io/KamekoStudio/studio/games/river-run/ (or the River Run
portal on https://yevrap.github.io/KamekoStudio/3d.html) ·
https://yevrap.github.io/KamekoStudio/games/river-run/ · **Tag:** `studio-iteration-07`

**Where the docs are**

- **Iteration record:** `docs/studio/iterations/07/`: plan, log, review,
  `reviews/SHS-066.md`, retro (with E1's epic review), and 4 tickets ([SHS-064](../iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md) to [SHS-067](../iterations/07/tickets/SHS-067-iteration-record.md)).
- **Handbook:** `process.md` (*Standing rules*, the direction's eight under the same
  numbers; the reviewers' models as ADR-0011 has them), `guardrails.md` (the skills and
  conductor exception), `learning-log.md`, `CHANGELOG.md`.
- **Workflow:** the reviewers' prompt, in `.claude/workflows/studio-sprint.js` and the
  `studio-sprint` skill's prompts file.
- **Direction:** E1 marked done; E2 under *Proposed next epic*.

**Trend.**

| | 04 | 05 | 06 | 07 |
|---|---|---|---|---|
| Tickets (done/committed) | 5/3 | 4/3 | 4/3 | **4/3** |
| Review-opened tickets | 1 | 0 | 0 | **0** |
| Review passes | 4 | 2 | 2 | **2 + Playtester** |
| Fix rounds | 7 | 0 | 1 | **1** |
| Debt (+/−) | +2/−3 | +1/−0 | +0/−1 | **+0/−0** |
| Output tokens | — | — | — | **213,718** to close |

[Shadow Studio — Scorecard](scorecard.md) has row 07.

**Changes from the retro**
- **The costliest step was review** (82,272 of 213,718 tokens, all three reviewers
  included). The Independent Reviewer and QA no longer re-run evidence the tickets already
  count, or play what the Playtester is playing. Sprint 08's retro checks the number.
- E1's rules are in the handbook now, under the same numbers.
- Backlog #47: `docs-current` also runs at `push`. It was red at the gate three sprints
  running, each time for a new reason.
- Active rules: *run `--stage=ticket` before every commit* left the list (the skill does
  it); *every ticket starts from the template* joined it.

**Did the last retro's changes help?** Yes. The close order held, regression tests showed
red every run with a count, layout was measured at 320, and the new clock rule was applied.
#21 missed the process slot again, to your ADR-0011 request.

**Needs you**

Nothing blocks. Optional: strike or reshape E2 before plan 08; tick Q13; the two
real-phone questions in [07's review](../iterations/07/review.md).

**Say next:** "run the studio" (sprint 08, watched) or `studio next`, in a new session.
[Shadow Studio — Next step](next.md) says which step is due.
