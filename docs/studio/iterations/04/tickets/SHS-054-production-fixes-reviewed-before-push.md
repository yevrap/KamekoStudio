# SHS-054 — A production fix is independently reviewed before it is pushed, and the push stage refuses one that was not

- **Status:** In progress
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

- [ ] A production fix is the one exception to "push when a ticket is done": its commits
      are pushed only after an independent review (fresh context, a different model from
      the author) has passed them. `process.md`, ADR-0007 and ADR-0008 say so.
- [ ] The review is recorded in `iterations/NN/reviews/<TICKET>.md`, which names the full
      hash of the commit it reviewed on exactly one `**Reviewed:**` line and gives exactly
      one `**Verdict:**` line.
- [ ] A new check, `production-fix-reviewed`, in the `push` and `gate` stages, fails
      unless, for every ticket whose production files changed since the previous release:
      - the record exists;
      - its verdict begins with `APPROVED`;
      - the reviewed commit is in `HEAD`'s history;
      - **every commit that changed one of the ticket's production files is contained in
        the reviewed commit.**

      A fix changed after it was reviewed is refused until it is reviewed again.
- [ ] ADR-0008 says plainly what this proves and what it cannot. The record is written by
      the studio, so the check makes the review impossible to forget, not impossible to
      fake. Only a signal from outside the repository could do the second, and that is the
      executive's call.
- [ ] Tests cover the rule, pure and against a scratch repository: a missing record, a
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

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
