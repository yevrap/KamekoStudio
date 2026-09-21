# SHS-051 — The studio may fix production under the full process, and the path guard admits a production file only for the ticket that names it, in its own iteration

- **Status:** Done
- **Size:** M
- **Iteration:** 04
- **Role lead:** Tech Lead / Architect
- **Depends on:** SHS-050 (the post-deploy stage this rule extends)
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
  nothing admitted), and on SHS-052's (both of its files admitted, named).

## Out of scope

- Using the permission. SHS-052 is the first use.
- Promotion of a studio game into the arcade, which keeps its own process and approval
  (`promotion.md`).
- The two existing exceptions, which stay exactly as they are.

---

## Result

- **What changed:**
  - `decisions/ADR-0008-production-fixes.md` — the permission, what is and is not a fix,
    what still stops the run, the mechanism, and the alternatives. ADR-0001's status
    notes the amendment; the decisions index lists it.
  - `tests/studio/lib/rules.mjs` — `PRODUCTION_FIXES` (empty until SHS-052),
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
- **Deferred:** nothing.
- **Fix rounds used:** 0 / 2
