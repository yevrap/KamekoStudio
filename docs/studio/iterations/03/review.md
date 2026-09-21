# Iteration 03 — review

## What shipped

| # | Item | Where |
|---|---|---|
| SHS-043 | New tickets are `SHS-NNN`; the `SS-` series closes at 042, enforced both ways | `tests/studio/lib/rules.mjs`, `process.md`, `decisions/ADR-0006-ticket-prefix.md` |
| SHS-044 | TD-009 diagnosed: a real player-facing defect, a reproduction that says *fixed* only when the defect is gone, the production fix specified | `tests/studio/diagnostics/td-009.mjs`, `tech-debt.md` |
| SHS-045 | Every ticket a commit names has exactly one file; content rules reach every ticket the iteration names or edits | `tests/studio/checks/docs.mjs`, `rules.mjs`, three reconstructed files in `iterations/02/tickets/` |
| SHS-046 | This record | `iterations/03/`, `studio/shelf-data.js`, `CHANGELOG.md`, `learning-log.md` |
| SHS-047 | One pushed commit waived by its full hash, visibly | `tests/studio/checks/commit-lint.mjs`, `rules.mjs` |

Three committed tickets, the record, and SHS-047, opened during the build by SHS-043's own
verification. **No ticket was opened by a review**: every finding went into a fix round on
the ticket it was about, and none reached the cap of two.

Nothing in the realm a visitor sees changed except the pulse and retro lines on its home
page. Live: <https://yevrap.github.io/KamekoStudio/studio/>.

## The reviews

Two rounds, the cap. Each ran QA and the Independent Reviewer separately, with fresh
context. **The reviewer ran on a different model from the author in both rounds**; QA ran
on the author's model.

### Round 1 — the reviewer approved, QA failed it

The reviewer re-measured every number it could and approved, with one minor finding and
one nit. QA failed the iteration on one major finding, four minor and four nits.

| Finding | Severity | Disposition |
|---|---|---|
| The TD-009 reproduction printed "looks fixed, close the row" under a fix that stopped spirals on the menu only, while leaving a golf round through ☰ Menu still threw every time; and its own crash exited with the code for *present* | Major | Fixed — SHS-044 fix round 1: a second route, a direct check, *broken* separated from *present* |
| TD-009 named one exposed end-to-end test of two, and stated a one-in-three rate measured over three runs | Minor | Fixed — SHS-044 fix round 1 |
| The handbook's own example commit, `SHS-003`, was rejected by the new rule | Minor | Fixed — SHS-043 fix round 1, with a test over the handbook's examples |
| A reconstructed ticket edited in this iteration escaped the content rules, because no commit subject named it | Minor | Fixed — SHS-045 fix round 1: content rules reach every ticket file the range changed |
| The docs said *every ticket ID in the subject*; the rule reads the one in the ticket position | Minor | Fixed — SHS-045 fix round 1: the words now say what the rule does, because a later mention is not a claim to be that ticket |
| Out-of-sequence ticket file names were accepted; an upper-case `.MD` copy was invisible; the merge exclusion was untested; SHS-047's counts did not say where they were taken | Nits | Fixed — SHS-045 and SHS-047 fix round 1 |
| The whole history was read unfiltered | Reviewer nit | Fixed — filtered to commits containing `(studio):` |
| `PULSE.shipped` is dated before the iteration ships | Reviewer minor | **Declined.** The line reaches the live page only in the push that ships the iteration — nothing is pushed until the gate is green — and the date is confirmed at close-out. The test that ties it to the repository was designed for the page to run one iteration ahead while that iteration is built |

### Round 2 — both rejected, on the same gap, found independently

| Finding | Severity | Disposition |
|---|---|---|
| The direct check added in round 1 ran in the start menu's state and never confirmed a spiral existed. A patch that stopped spirals while any menu showed and cleared them on ☰ Menu was reported *fixed*, while two routes the script did not try — a golf round left through ⚙️ and the Play tab, and a shared map left through its own ☰ Menu — still threw. QA called it major; the reviewer called it a blocker and verified a one-line correction | Major / Blocker | Fixed — SHS-044 fix round 2, the last one: the direct check runs in a golf round and proves the spirals it spawned exist before removing the black hole; the two routes are tried. The reviewer's decoy, and three of QA's, are reported *present* or *unclear*, never *fixed* |
| A start menu with no black hole behind it made the script report *broken* and discard a *present* result from another route | Minor | Fixed — SHS-044 fix round 2: an empty start menu is a clean route |
| The example-subject test matched only inline code with an allowed type, in top-level files | Minor, and a reviewer nit | Fixed — SHS-043 fix round 2: any type, inline or fenced, at any depth, excluding only the records |
| TD-009 stated two failure counts measured outside the repository | Reviewer minor | Fixed — the row no longer states a rate it cannot reproduce |
| `log.md` pointed to a reason in `review.md` before `review.md` existed | Nit | Closed by this document. A forward reference in a log written between tickets, true once the iteration's record is complete |
| `namedTickets` reads a range with `..` while `committedPaths` diffs with `...` | Reviewer nit | **Declined.** The two commands mean different things by the same syntax: for `git log`, `A...B` is the symmetric difference, and would add commits that are on the base but not on `HEAD`; for `git diff`, `A...B` compares against the merge base. With the base an ancestor of `HEAD`, as it always is here, `log A..B` and `diff A...B` describe the same range |

**Fix round 2 was not reviewed.** Review is capped at two rounds, so what closed round 2's
findings has had no independent pass. It was verified by the author only: the four routes
and the direct check on the real tree, eight scratch variants including every decoy the
two reviews built, and the five inputs that defeated the example test.

### What a third round would most likely find

Written down instead of run, per the cap. Both reviewers were asked for their estimate.

- **More partial fixes the TD-009 check misjudges.** Both reviewers expect this first. The
  direct check now tests the defect's condition in a golf round, but "every state a spiral
  can be alive in" is larger than one round: a spiral spawned mid-flight rather than at
  rest, the Map Maker's own assignment to `world.blackHole`, or a fix that keys off the golf
  phase itself would each be worth an attack. The check is a diagnostic for a defect whose
  fix is one line, so the cost of an imperfect *fixed* is low: the specified fix is known
  good, and anything else is visible in review.
- **A way around `docs-current`'s changed-files rule** through a rename or re-add that `git
  diff -M` attributes differently from what the check assumes, or a disagreement between
  the `--grep` pre-filter and the subject parser. QA tried merges, later mentions,
  out-of-sequence names, case variants of `.md` and edits in older iterations, and the rule
  held against all of them. A `.markdown` copy is still invisible, and nothing claims
  otherwise.
- **More ways around the example test** — other formats, other documents — and small
  forward references in the record.

Nothing in that list is a defect a player would hit.

## Checks

The gate stage, run on the commit being pushed:

*(filled in from the gate run)*

## Verdict

**Verdict:** REJECTED by the second and last review round — the Independent Reviewer's
blocker, which QA found independently, is closed by an unreviewed fix round; whether that
ships is the executive's decision.

That line is the record, so it is worth being exact about it.

**What was rejected.** Round 2's reviewer rejected the iteration for one finding: the
TD-009 check's direct test ran in a state a fix could key off, so a route-only fix could be
reported *fixed*. QA failed it for the same finding, arrived at separately. Round 1's
reviewer approved; round 1's QA failed it for the finding that the direct test was added
to close.

**What happened to it.** The reviewer verified a one-line correction — enter a golf round
before creating the precondition. Fix round 2 made that correction and went further: it
proves the spirals exist before removing the black hole, and tries the two routes that
defeated round 1's version. The reviewer's decoy now exits *unclear*. No reviewer has
examined that fix.

**Why it does not ship on the team's authority.** The executive's standing answer is that
the gate keeps its verdict and the executive breaks a tie. This is one.

## Keep / Iterate / Kill

> The executive: strike through what you disagree with. These are the team's.

- **The ticket prefix and its lint — Keep.** It enforces a sequence, not a spelling, and a
  full-history lint found the one commit it could not fix.
- **`docs-current`'s ticket-file rule — Keep.** It found three missing tickets on its first
  run over real history, and the rule decides from commit subjects and file names only.
- **The TD-009 diagnostic — Keep, then retire.** Its job ends when the defect is fixed; the
  row can be closed with its output, and the regression test belongs in production's suite.
- **The two-round cap — Keep.** It ended a review that would otherwise have continued, and
  put the decision where the standing answer says it belongs.
