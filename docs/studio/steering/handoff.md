# Shadow Studio — Handoff

*The latest iteration's report. Rewritten by each run; never edited by hand.*

## Iteration 04 — the first production fix, and the rule it taught

**Where the docs are**

- **Iteration record:** `docs/studio/iterations/04/` — plan, log (a stand-up after every
  ticket and review round, each pushed as it landed), review, retro, **5 tickets**
  (SHS-050 to SHS-054), and `reviews/SHS-052.md`, the first pre-push review record.
- **Decisions:**
  - `ADR-0008-production-fixes.md` is new. It covers the permission, what counts as a
    fix, and what the guard proves and cannot.
  - ADR-0007 gained the push-when-done exception for production fixes.
  - ADR-0001's status line now says it is amended.
- **Checks:**
  - new: `tests/studio/checks/production-review.mjs`;
  - changed: `deploy.mjs`, `path-guard.mjs`, `commit-lint.mjs`, `hygiene.mjs`,
    `index.mjs`, `check.mjs`, `lib/rules.mjs`, `lib/shell.mjs`;
  - new tests: `baseline`, `deploy`, `stages`, `production-fix`, and the helper
    `lib/scratch-repo.mjs`;
  - retired: `diagnostics/td-009.mjs`.
- **Production, the first time:**
  - `games/black-hole-in-one/ui.js`: one line;
  - `scripts/e2e.mjs`: three tests.
- **Handbook:** `guardrails.md`, `process.md`, `self-checks.md`, the Definitions of Ready and
  Done, the README, `team/tech-lead.md`, the ticket template, `tech-debt.md`,
  `learning-log.md`, `CHANGELOG.md`.
- **Steering views** (kept in private planning notes at the time; in `docs/studio/steering/` since 2026-09-22):
  - this note, the Board, the Scorecard (row 04), the Index, the Questionnaire (**Q10**),
    the design note, the Input Ledger;
  - Black Hole in One's Improvements and Dev Log;
  - the `studio-iteration` skill;
  - the agent context files.

**Summary**

- **Black Hole in One no longer throws when you enter Explore with a golf hole's spirals
  alive** (TD-009, SHS-052). This is the studio's first fix to a production game: one
  line.
  - Three regression tests went red on the unfixed file and are green on the fixed one.
  - They refuse partial and over-broad fixes.
  - Both review rounds approved it on its own.
  - QA measured it with real taps: 0 of 20 trials threw on the fixed build, and 20 of 20
    on the unfixed one.
  - It's live.
- **Production fixes, under the full process** (SHS-051, ADR-0008). Your Q9 permission is
  written down, and the path guard admits a production file only for the ticket that owns
  it, in its own iteration.
  - Review showed the first version claimed too much. The studio writes everything the
    guard reads, so a made-up fix passed.
  - ADR-0008 now says the guard proves a write was *planned and recorded*, not that it was
    *legitimate*.
- **Reviewed before it is pushed** (SHS-054, opened by review). A production fix is now the
  one exception to push-when-done. It waits for an independent review, and the push is
  refused unless every file it owns is exactly what the reviewers saw.
  - On its first real use it refused SHS-052's fix round until round 2 approved that exact
    commit.
- **Every push checked before and after** (SHS-050):
  - a `push` stage;
  - `studio-live` waits for the new build (TD-010);
  - no check passes on a comparison of nothing (TD-011, and four more places review found
    it).

**Review: two rounds, the cap.**
- **Round 1:** both rejected, on the production-fix guard and on checks that passed on
  nothing. Neither found anything wrong with the fix itself.
- **Round 2:** the Independent Reviewer approved with findings. QA rejected: the new review
  check could be escaped by putting a file back to the release after review. QA did it
  with SHS-052's own tests.
- **The fix was the one QA proposed:** compare content, not history. QA's reproduction is
  now a regression test. That fix round has had no review.
- **The team shipped**, under your standing hand-back. The reasons are in `review.md`, and
  iteration 05's retro judges the call.
- **Did 03's call hold?** Yes. Its unreviewed fix, the TD-009 diagnostic, exited 0 on the
  fixed tree, and QA reproduced that independently.

**Checks**
- **Gate 11/11 green**, twice (the second time on the pushed commit): tree-clean,
  path-guard (49 paths, and 2 production fixes admitted, both SHS-052's), storage-keys,
  portal-capacity, studio-boot, hygiene (161 files), full-suites (unit, smoke, e2e),
  commit-lint (20 commits), **production-fix-reviewed** (SHS-052 exactly as reviewed at
  `b378402`), docs-current, reviewer-verdict.
- **Push stage** before every push: 12 pushes to `main`, all green. None broke the live
  site.
- **Post-deploy 3/3 after the tag**, with no `--previous-tag`. It compared with iteration 03
  across 22 commits, not with the release itself, so TD-011's fix held at the moment it used
  to fail. One post-deploy run failed mid-iteration, correctly: my marker was a phrase that
  wraps across two lines in the source.
- **Close-out 3/3**, with the steering folder in the doc scan (127 documents).

**Live:** https://yevrap.github.io/KamekoStudio/studio/ · the fixed game:
https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ · **Tag:** `studio-iteration-04`

**Trend.** Five iterations now.

| | 01 | 02 | 03 | 04 |
|---|---|---|---|---|
| Tickets (done/committed) | 9/3 | 18/2 | 7/3 | **5/3** |
| Review-opened tickets | 6 | 15 | 0 | **1** |
| Review passes | 3 | 11 | 4 | **4** |
| Fix rounds | 7 | 14 | 6 | **7** |
| Debt (+/−) | +1/−1 | +2/−1 | +2/−0 | **+2/−3**, the first iteration to pay more than it added |

[Shadow Studio — Scorecard](scorecard.md) has row 04.

**Efficiency changes from the retro**
- A production fix waits for review and ships exactly as reviewed. Enforced by
  `production-fix-reviewed`.
- A check asking "is this what was reviewed or released?" compares content, not history.
- No comparison of nothing passes, in any check. `postdeploy` is now conclusive.
- A check says what it proves. ADR-0008 is the model.
- A marker is copied from the diff, and a count comes from a command.
- **05 tries the other way:** a checker ticket starts from QA's attack list, written before
  the code.

**Did the last retro's changes help?**
- **Held:** "a check proves its precondition" (every new test does), "run the player's
  path", and "a profile per trial".
- **Didn't hold:** "check a convention change with a test, not a search". The permission
  sweep was a search, and it missed three passages. "Say where a number came from" also
  slipped once: the log's push count.

It's the same pattern as before. What worked was the lessons that became checks; the ones
left as sentences didn't hold.

**Needs you**

1. **Q10.** Should a production fix also need your approval from outside the repo, such as
   a pull request you merge? The ⭐ default keeps things as they are: the studio's own
   independent review, recorded, with no extra step for you.
2. **Keep / Iterate / Kill** on what shipped, at the end of
   `docs/studio/iterations/04/review.md`. The team says Keep for the fix and the checks,
   and Iterate for review-before-push and for trunk-based.

**Say next:** `studio next`, in a new session. Since 2026-09-22 the team runs one step per
session (ADR-0009); [Shadow Studio — Next step](next.md) says which step is due, and
[Shadow Studio — Backlog](backlog.md) holds the order of work that this handoff used to list.
