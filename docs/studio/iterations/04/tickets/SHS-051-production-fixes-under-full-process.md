# SHS-051 — The studio may fix production under the full process, and the path guard admits a production file only for the ticket that names it, in its own iteration

- **Status:** Done
- **Size:** M
- **Iteration:** 04
- **Role lead:** Tech Lead / Architect
- **Depends on:** [SHS-050](SHS-050-checks-every-push-can-trust.md) (the post-deploy stage this rule extends)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The executive gave the studio standing permission to make fixes to production files, as
long as the whole sprint process runs — plan, ticket, review, gate, retrospective — and
asked for it to be written into the handbook by a decision record before it is first used.
Today the path guard forbids every production path that is not one of two recorded
exceptions, so the permission needs a rule the guard can enforce, not only a sentence.

## Acceptance criteria

- [x] `decisions/ADR-0008-production-fixes.md` records the permission: who gave it, what
      counts as a production fix and what does not, what still stops the run, and how the
      guard enforces it.
- [x] `guardrails.md` has a *Production fixes* section. Every passage in the handbook that
      said production is untouchable, or that a production edit needs a one-off approval,
      now says what is true — the ticket lists each passage and the search that found it.
- [x] `PRODUCTION_FIXES` in `tests/studio/lib/rules.mjs` lists each production path the
      studio is fixing, with the ticket and the iteration. `path-guard` admits a production
      path only when all three hold:
      - an entry for that exact path names the iteration being checked;
      - that ticket has a file in that iteration's `tickets/` directory;
      - every commit in the range that touches the path names that ticket in its subject.

      Anything else is a violation, as before.
- [x] The check names every production fix it admits, with its ticket — never silently.
- [x] `production-unchanged` applies the same rule, so a post-deploy run reports the fix as
      a fix and still fails on any production path no entry covers.
- [x] `hygiene` scans every production-fix path, as it already scans exception paths.
- [x] Unit tests cover the admitted case and each way it can fail on its own: no entry, an
      entry for another iteration, no ticket file, a commit naming another ticket, a
      commit naming no ticket.

## Evidence plan

- `production-fix.test.mjs`: the pure rule, and the two checks run against a scratch
  repository, since the rule's evidence lives in git.
- `npm run studio:check -- --stage=ticket` on this ticket's commits (no entries yet,
  nothing admitted), and on [SHS-052](SHS-052-td-009-fixed.md)'s (both of its files admitted, named).

## Out of scope

- Using the permission. [SHS-052](SHS-052-td-009-fixed.md) is the first use.
- Promotion of a studio game into the arcade, which keeps its own process and approval
  (`promotion.md`).
- The two existing exceptions, which stay exactly as they are.

---

## Result

- **What changed:**
  - `decisions/ADR-0008-production-fixes.md` — the permission, what is and is not a fix,
    what still stops the run, the mechanism, and the alternatives. ADR-0001's status
    notes the amendment; the decisions index lists it.
  - `tests/studio/lib/rules.mjs` — `PRODUCTION_FIXES` (empty until [SHS-052](SHS-052-td-009-fixed.md)),
    `productionFixProblem` (the three conditions), `productionFixEntryProblems` (a
    malformed entry fails loudly instead of never matching), and `classifyPaths` with a
    `fixes` bucket. An entry for the iteration being checked takes precedence over an
    exception on the same file.
  - `tests/studio/checks/path-guard.mjs` — both checks run the rule, reading the
    iteration's ticket file names and `git log --no-merges <base>..HEAD -- <file>`; every
    admitted file is reported as `production fix: <path> — <ticket>, N commit(s)`.
  - `tests/studio/checks/hygiene.mjs` — scans this iteration's production-fix files.
  - `tests/studio/lib/scratch-repo.mjs` — the throwaway-repository helper, now shared by
    `baseline.test.mjs` and the new tests.
  - **Passages that said something no longer true**, found by searching the handbook, the
    team files and both READMEs for `untouch`, `out of bounds`, `outside the guard`,
    `production file|edit|change|code`, `may only write`, `stop … ask`, `one-time
    exception`, `executive's approval` and `nothing worse`:
    - `guardrails.md` — the opening line ("a messy `studio/` folder and nothing worse"),
      the path guard's rule, the paragraph saying a production edit is a single approved
      change made last, the safety net (before *every push*, after *every deploy*), and
      the stop-and-ask line. New subsection: *Production fixes*.
    - `README.md` — ground rule 3, "Production is untouched".
    - `definition-of-ready.md` — *Inside the guard*.
    - `definition-of-done.md` — the post-deploy line, and a regression test for a
      production fix.
    - `team/tech-lead.md` — "rewrite working production code".
    - `studio/README.md` — "a production file the studio may not edit".
    - `self-checks.md` — the `path-guard`, `hygiene` and `production-unchanged` rows.
  - **Found by the same search and deliberately unchanged:** the bodies of ADR-0001,
    ADR-0003, ADR-0004 and ADR-0005, which describe the boundary as it was when each was
    decided — decision records keep their history; ADR-0001's *status* line says it is
    amended. `promotion.md` is still right: promotion is its own
    workflow. `process.md`'s stop rule — "a change that would fall outside the path
    guard" — is still right, because a fix is admitted by the guard.
- **Tested by:**
  - `tests/studio/production-fix.test.mjs` — 11 tests: 7 on the pure rule (the entries
    well-formed, malformed ones caught, the admitted case, an uncommitted change admitted,
    each of five failures on its own, precedence over an exception, an uncovered file still
    a violation), and 4 running `path-guard` and `production-unchanged` against a scratch
    repository (admitted and named; another ticket's commit refused; no ticket file
    refused; an uncovered file next to an admitted one refused).
  - Six mutations, each putting back one hole in this working tree, and each failed the
    suite: ignore the iteration (1 test fails), ignore the ticket file (2), ignore commit
    subjects (2), exceptions before fixes (1), admit silently (1), skip entry validation
    (1). Files restored after each.
  - `npm run studio:check -- --stage=ticket` green on this ticket: no entries yet, nothing
    admitted, 41 paths inside the guard.
- **Fix round 1 — found by the author on [SHS-052](SHS-052-td-009-fixed.md)'s deploy.** With the first real fix
  admitted, `production-unchanged` reported *"nothing outside the guard changed in 8
  commit(s)"* and then listed the two production files it had admitted — the sentence
  contradicted the list under it. It now says *"the only changes outside the guard are the
  N admitted below"* whenever it admitted anything, fix or exception. A test in
  `production-fix.test.mjs` holds it.
- **Fix round 2 — from review round 1, the last this ticket may use.** Both passes rejected
  the guard:
  - **What it proves was overstated** (Independent Reviewer, blocker). The entry, the
    ticket file and the commit subjects are all written by the studio, and so are the
    guard's rules. A fabricated fix — a made-up SHS-999 with a one-line ticket, editing
    `index.html` — passes. ADR-0008, `guardrails.md` and `self-checks.md` now say what the
    guard proves: that a write was *planned and recorded*, not that the plan was
    legitimate. The control against a wrong or fabricated fix is a review before it is
    pushed, which is **[SHS-054](SHS-054-production-fixes-reviewed-before-push.md)**, opened by this finding.
  - **A merge commit could carry a change past the guard** (reviewer minor, QA B1).
    `--no-merges` is gone. Git's history simplification keeps a merge only when the merge
    itself changed the file, and such a merge names no ticket. An ordinary merge of a
    ticket's branch is still admitted.
  - **A commit after the iteration's tag was still admitted** (QA B3). Once
    `studio-iteration-NN` exists, a commit to a fix file that the tag does not contain is
    refused. `--iteration`'s help now says that it chooses the fixes admitted.
  - **Deleting a fix file was admitted** (QA M2a). Refused now.
  - **A revert the documents describe could not pass `commit-lint`** (QA m2). ADR-0008 and
    `process.md` give the command and a conventional subject.
  - **Two passages the search missed** (QA m4): `self-checks.md`'s `portal-capacity` row
    and `guardrails.md`'s note on the clear-data list.
  - **Nits** (QA n1, n2): the admission note gives line counts and says when uncommitted
    changes ride along; a malformed entry is tested through the check, not only the rule.
  - **Declined, with the reason in ADR-0008:** that an entry for the current iteration takes
    precedence over the narrow `gameplay.js` exception. The exception's grammar exists
    because that edit needs no review; a production fix gets one before it is pushed.
  - **Deferred as TD-012** (QA M2b): an entry for a test harness admits emptying it.
  - Tests: `production-fix.test.mjs` +6 (a change made inside a merge refused, an
    ordinary merge admitted, a change after the tag refused, a deletion refused, a
    malformed entry through the check, the note's line counts and uncommitted changes).
    Three mutations, each putting back one hole in this working tree, and each failed one
    test: `--no-merges` restored, the release tag ignored, deletion ignored.
- **After fix round 2 — what review round 2 found, recorded because the ticket is at its
  cap.** The merge fix above is incomplete (QA N2). Git's history simplification leaves out
  a merge that takes a file from one of its parents, so such a merge — a rollback to a
  version already in the history — changes a fix file with no commit examined, and this
  guard admits it as *"0 commit(s)"*. The ticket cannot take a third fix round. The change
  cannot reach the live site unreviewed, because [SHS-054](SHS-054-production-fixes-reviewed-before-push.md)'s `production-fix-reviewed` now
  compares content and refuses it at the push and at the gate. The guard's own gap is
  registered as **TD-013**, and ADR-0008 and `self-checks.md` say what the guard does and
  does not see.
- **Deferred:** TD-012, TD-013.
- **Fix rounds used:** 2 / 2
