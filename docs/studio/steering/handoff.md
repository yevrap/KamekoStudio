# Shadow Studio — Handoff

*The latest iteration's report. Rewritten by each run; never edited by hand.*

## Iteration 05 — the Studio Wing opens with River Run

**E1 · sprint 1 of 3 (+1 reserve, unclaimed).** On track.

**Summary**

- **River Run is forked into the studio** (SHS-056). `studio/games/river-run/` is a copy
  of the arcade game with `studio_riverRun_*` saves.
  - Every difference from production is listed and proved byte for byte.
  - A browser test logs every storage write and refuses any production key.
  - It plays exactly like the original; the experiments start in sprint 06.
- **The 3D page's River Run portal opens the fork** (SHS-057). It is a recorded exception
  to one value in `shared/3d/constants.js` (ADR-0010). The other portals still open their
  arcade games.
- **The checks tell studio commits from arcade commits** (SHS-055), so the studio and the
  arcade share `main` without either failing the other's checks.
- **The arcade docs about River Run are current.** `CLAUDE.md` names both builds, and
  River Run's feature rows moved from the arcade roadmap to the studio backlog. Your
  direction at review; now a guardrail.

**Review: one round.** QA (`opus`) and the Independent Reviewer (`fable`) each approved
with findings. 12 distinct findings: 3 fixed in the step, the rest on the backlog
(#26–#31, #22 amended) or declined with a reason.

**Checks**
- **Gate 11/11** against `studio-iteration-04`, with full suites.
- **Post-deploy 3/3** after the tag.
- **Close-out 3/3** at this retro: iteration docs, doc cleanliness (140 documents),
  changelog.

**Live:** https://yevrap.github.io/KamekoStudio/3d.html (the River Run portal) · the fork:
https://yevrap.github.io/KamekoStudio/studio/games/river-run/ · **Tag:**
`studio-iteration-05`

**Where the docs are**

- **Iteration record:** `docs/studio/iterations/05/`. It has the plan, the log (a
  stand-up per session), the review, the retro, and 4 tickets (SHS-055 to SHS-058).
- **Decisions:** `ADR-0010-fork-portal-url.md` (new). ADR-0009 (one step per session) was
  yours, from the start of the sprint.
- **Handbook:** `forking.md` (new), `guardrails.md`, `process.md`, `templates/ticket.md`,
  `learning-log.md` (now opens with **Active rules**), `tech-debt.md`, `CHANGELOG.md`.
- **Arcade docs:** `CLAUDE.md`, `games/CLAUDE.md`, `docs/roadmap.md` (`63b8190`).

**Trend.**

| | 02 | 03 | 04 | 05 |
|---|---|---|---|---|
| Tickets (done/committed) | 18/2 | 7/3 | 5/3 | **4/3** |
| Review-opened tickets | 15 | 0 | 1 | **0** |
| Review passes | 11 | 4 | 4 | **2** |
| Fix rounds | 14 | 6 | 7 | **0** |
| Debt (+/−) | +2/−1 | +2/−0 | +2/−3 | **+1/−0** |

[Shadow Studio — Scorecard](scorecard.md) has row 05.

**Changes from the retro**
- The ticket template separates the record ticket's close criteria from its retro work,
  so the gate stops failing on it.
- A ticket that adds or changes a check lists the inputs it must refuse, tested red first.
- The learning log opens with ten **Active rules**; each retro promotes, converts or
  retires them.
- Your steering edits get a commit form the checks accept (#21), planned as sprint 06's
  process ticket.

**Did the last retro's changes help?** Yes, all of them that were exercised. There was
no production fix this sprint, so "a production fix waits for review" and iteration 04's
unreviewed content check weren't tested. The first production fix (the README, #10) will
test them.

**Needs you**

1. **Q12.** Which River Run experiment goes first? Left blank, plan 06 takes ⭐ power-ups
   (a shield and rapid-fire / spread shot).
2. **Keep / Iterate / Kill** at the end of `docs/studio/iterations/05/review.md`. The team
   says Keep for the fork and the checks, and Iterate for the portal: the 3D page's River
   Run trophy still reads the arcade's score (#26).

**Say next:** `studio next`, in a new session. [Shadow Studio — Next step](next.md) says
which step is due; [Shadow Studio — Backlog](backlog.md) holds the order of work.
