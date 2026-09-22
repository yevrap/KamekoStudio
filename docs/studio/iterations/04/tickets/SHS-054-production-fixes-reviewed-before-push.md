# SHS-054 — A production fix is independently reviewed before it is pushed, and the push stage refuses one that was not

- **Status:** Done
- **Size:** M
- **Iteration:** 04
- **Role lead:** Tech Lead / Architect
- **Depends on:** SHS-051
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Opened by the Independent Reviewer's round-1 blocker. The production-fix rule decides from
an entry, a ticket file and commit subjects, and the studio writes all three itself. So a
fabricated fix passes every check, and under trunk-based work it reaches the live site
before any independent review has seen it. SHS-052, the first production fix, went live
before review in exactly that way. Nothing in the repository can stop the author, since
the guard's own rules live in studio paths. What the process can do is put an independent
review between a production fix and the live site, and make that step impossible to
forget.

## Acceptance criteria

- [x] A production fix is the one exception to "push when a ticket is done": its commits
      are pushed only after an independent review (fresh context, a different model from
      the author) has passed them. `process.md`, ADR-0007 and ADR-0008 say so.
- [x] The review is recorded in `iterations/NN/reviews/<TICKET>.md`, which names the full
      hash of the commit it reviewed on exactly one `**Reviewed:**` line and gives exactly
      one `**Verdict:**` line.
- [x] A new check, `production-fix-reviewed`, in the `push` and `gate` stages, fails
      unless, for every ticket with a production file that differs from the previous
      release:
      - the record exists;
      - its verdict begins with `APPROVED`;
      - the reviewed commit is in `HEAD`'s history;
      - **every file the ticket owns is, at `HEAD`, exactly what the reviewed commit
        holds.**

      A fix changed after it was reviewed is refused until it is reviewed again.
- [x] ADR-0008 says plainly what this proves and what it cannot. The record is written by
      the studio, so the check makes the review impossible to forget, not impossible to
      fake. Only a signal from outside the repository could do the second, and that is the
      executive's call.
- [x] Tests cover the rule, pure and against a scratch repository: a missing record, a
      missing or doubled `Reviewed` line, a short hash, a rejected verdict, a record that
      predates the fix, a fix changed after its review, and the admitted case.

## Evidence plan

`production-fix.test.mjs`; the `push` stage on this iteration's own production fix. The
record for SHS-052 is written from the reviews that actually saw it, and the next change
to SHS-052's files is refused until a review covers it.

## Out of scope

- An approval from outside the repository, such as a pull request the executive merges.
  That is offered to the executive as an option; it is not built.
- Changing how studio-only work is pushed. It still goes out as soon as it is done.

---

## Result

- **What changed:**
  - `tests/studio/lib/rules.mjs` — `productionReviewProblem`. It reads a review record raw:
    exactly one `**Reviewed:**` line with a full 40-character hash, exactly one
    `**Verdict:**` line beginning `APPROVED`, and a first line naming the ticket. Then every
    commit that changed the ticket's production files must be contained in the reviewed
    commit.
  - `tests/studio/checks/production-review.mjs` — the `production-fix-reviewed` check, in
    `push` and `gate`. It also refuses a reviewed commit that is not in `HEAD`'s history.
    `commitsTouching` is exported from `path-guard.mjs` so both use the same commit list.
  - `docs/studio/iterations/04/reviews/SHS-052.md` — the first record. It is written from
    review round 1's reports and says so, because SHS-052 went live before this rule
    existed.
  - Docs:
    - ADR-0008 (item 4, and *Reviewed before it is pushed*);
    - ADR-0007 (the exception to push-when-done);
    - `process.md`, `guardrails.md`, `self-checks.md` (both stage rows and the check's
      row), `definition-of-done.md`.
  - `check.mjs` — the report's id column is two characters wider, for this check's name.
- **Tested by:**
  - `production-fix.test.mjs` +4. The pure rule against nine malformed or insufficient
    records, including a verdict hidden in a comment, which counts as a second declaration.
    Then, in a scratch repository, the whole cycle:
    - no record, refused;
    - a record from before the fix, refused;
    - a record of the fix's own commit, admitted;
    - the fix changed again, refused.

    Also: a record naming a commit that exists nowhere, and one on another branch that
    contains the fix, both refused. And no production fix in range means nothing to
    review.
  - Three mutations in this working tree:
    - skipping the coverage loop failed 2 tests;
    - accepting any verdict failed 1;
    - skipping the history check failed none at first, because the only test for it used
      a hash that exists nowhere, which the coverage check refuses first. The test now
      also uses a real commit on another branch, and the mutation fails it.
  - This ticket's own push: `push` 11 of 11, with the check admitting SHS-052 as reviewed
    at `7b8a0fe`. Results in `log.md`.
- **Fix round 1 — from review round 2.** QA rejected the iteration on this ticket's central
  claim, and was right:
  - **A file put back to the release after its review escaped the check** (QA N1). The
    check looked only at files that still differed from the release, and decided coverage
    by commit ancestry. QA approved `b378402` in a scratch clone, then restored iteration
    03's `scripts/e2e.mjs`, deleting all three TD-009 tests, under a docs subject. The
    whole `push` stage passed 11 of 11.
  - **A merge taking a file from its side parent** hid the change from `git log` (QA N2,
    in SHS-051's `path-guard`).
  - **A narrow `--base`** left an unpushed fix out of view (QA N3).
  - **All three are closed by deciding from content.** Every file the ticket owns must be,
    at `HEAD`, exactly what the reviewed commit holds. The need for a review is measured
    from the previous release, not from `--base`. The ticket is exempt only when every
    one of its files equals the release.
  - `productionReviewProblem` became `readReviewRecord`, which only parses the record;
    the check does the comparisons.
  - Tests: `production-fix.test.mjs` now has QA's three reproductions as regression
    tests, plus a whole-fix revert that needs no review, alongside the earlier cycle.
    Four mutations, each putting one hole back, and each failed:
    - covering only files that still differ from the release: 2 tests;
    - measuring from `--base`: 1;
    - dropping the history check: 1;
    - dropping the content comparison: 3.
  - The Independent Reviewer's two round-2 nits: the unused release-tag argument is gone
    with the ancestry code. Two tickets owning one file now means both reviews must have
    seen that file as it is pushed, which ADR-0008 states.
  - **No review has seen this fix round.** Round 2 was the last; the review record says
    what a third round would most likely have found.
- **Deferred:** an approval from outside the repository, the only thing that would make the
  review impossible to fake. It is offered to the executive as a choice.
- **Fix rounds used:** 1 / 2
