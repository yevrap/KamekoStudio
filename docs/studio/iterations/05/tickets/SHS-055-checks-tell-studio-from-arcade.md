# SHS-055 — The studio checks tell studio commits from arcade commits on the shared `main`

- **Status:** Done
- **Size:** M
- **Iteration:** 05
- **Role lead:** Tech Lead / Architect
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The arcade and the studio now share `main`. `path-guard`, `production-unchanged` and
`commit-lint` judge every commit since the previous studio tag, so the arcade's own commits
(the 2026-09-22 migration, any arcade ship) read as studio violations and block the gate.
Source: inbox 2026-09-22, backlog #1.

## Acceptance criteria

- [x] A commit is a **studio commit** when its subject has the scope `(studio)`. The rule
      lives in one function in `tests/studio/lib/rules.mjs`, and every check that needs it
      calls that function.
- [x] `commit-lint` requires `type(studio): SHS-NNN …` of studio commits only, and ignores
      arcade commits.
- [x] `path-guard` and `production-unchanged` judge the files changed by studio commits.
      A file changed only by arcade commits is not a studio violation.
- [x] The reverse holds: an arcade commit that touches `studio/**`, `docs/studio/**` or
      `tests/studio/**` is reported as a violation, so dropping the scope does not get a
      studio change past the guard. The shared exception files and production-fix files
      keep their current rules.
- [x] A merge commit is judged by the files it changes against its first parent, and a
      merge that mixes the two kinds is a violation (no silent pass).
- [x] The two executive commits scoped `(studio)` with no ticket number (`fecf7ea`, the E1
      direction; `d454f79`, ADR-0009), which also touch `.claude/`, pass by a **recorded**
      list of exact hashes in `rules.mjs`, each with its reason. The check reports them as
      exempted, never silently. A new unnumbered `(studio)` commit still fails.
- [x] `npm run studio:check -- --stage=gate --base=studio-iteration-04` no longer reports
      the 2026-09-22 migration commits as violations.
- [x] `process.md` and `guardrails.md` say how a commit is classified, and what that does
      and does not prove.

Seen at the sprint 05 plan's push stage (the plan commit, unpushed): `path-guard` listed the migration's
`.agents/`, `.claude/` and `docs/` files, and `commit-lint` rejected `234c8b6`, `7712cf2`,
`fecf7ea` and `d454f79`. Every one of these must be classified, not waved through.

## Evidence plan

Unit tests on the classifier in `tests/studio/rules.test.mjs`. `path-guard.test.mjs` runs
the check on a scratch repository (`lib/scratch-repo.mjs`) holding a studio commit, an
arcade commit, an arcade commit that sneaks into `studio/`, and a mixed merge, and asserts
each verdict. Run the gate stage against the real history since `studio-iteration-04`.

## Out of scope

TD-013 (a fix file changed by a merge the guard can't see) and the `hygiene` scope question
(backlog #12). Neither changes here.

---

## Result

- **What changed:**
  - `tests/studio/lib/rules.mjs` — `commitKind` is the one function that decides a
    commit's kind: `merge` (more than one parent), `exempt` (full hash in
    `COMMIT_EXEMPTIONS`, with its reason), `studio` (scope `(studio)`, any type, any
    ticket) or `arcade`. `sortCommitsByKind` turns a range into the paths the guard judges
    and the problems: an arcade commit that changed a studio path, or a merge whose
    first-parent diff holds both kinds of path.
  - `COMMIT_EXEMPTIONS` records three hashes, each with its reason: `fecf7ea` and
    `d454f79` as the ticket names, and also `7712cf2`, the arcade-scoped migration that
    moved the steering views into `docs/studio/steering/`. Under the new reverse rule it
    would otherwise be a violation, and the gate against `studio-iteration-04` must not
    report the migration.
  - `tests/studio/lib/shell.mjs` — `commitsWithPaths`: every commit in the range with the
    paths it changed against its first parent (both sides of a rename).
  - `checks/commit-lint.mjs` lints studio commits only, counts arcade commits as not
    linted, and reports exempt commits with their reasons. A range with no studio commit
    is a skip, not a pass.
  - `checks/path-guard.mjs` — `path-guard` and `production-unchanged` judge the paths
    studio commits changed (plus the uncommitted tree, for `path-guard`), and add the
    arcade and merge problems as violations. Each prints its commit tally.
  - `guardrails.md` has a section on how a commit is classified and what that does and
    does not prove; `process.md` points to it.
- **Tested by:**
  - `tests/studio/rules.test.mjs` — ten new tests on the classifier: near misses of the
    scope, merges decided by parents, exemptions by exact hash only, an unnumbered
    `(studio)` commit still failing the lint, and each path verdict.
  - `tests/studio/path-guard.test.mjs` — seven new tests on scratch repositories: a studio
    and an arcade commit (pass), a studio commit outside the guard (fail), an arcade commit
    into `studio/` and `tests/studio/` (fail, each path named), a mixed merge (fail), a
    one-kind merge (pass), and the lint on both kinds. **Red first:** with the checks
    reverted to `3405146`, six of the seven failed; the seventh (a studio commit outside
    the guard) passed before and after, as it should.
  - `node --test tests/studio/` — 300 of 300.
  - **Real history:** `--stage=gate --base=studio-iteration-04` — `path-guard` passes
    (*commits: 1 studio, 1 arcade, 0 merge, 3 exempt*, the three named), `commit-lint`
    passes (*1 studio commit(s) conventional; 1 arcade commit(s) not linted, 3 exempt by
    hash*). The gate itself is red only on the review-time checks, as expected mid-sprint.
  - `--stage=ticket` green before committing.
- **Deferred:**
  - An executive edit to `docs/studio/steering/` (the inbox, a questionnaire answer) has
    no commit form that passes: without the scope it is an arcade commit touching a studio
    path, and with it but no ticket the lint fails it. It is backlog #21.
  - The existing-test wording in `production-fix.test.mjs` changed with the check's pass
    sentence (*the only studio changes outside the guard…*); nothing else in it changed.
- **Fix rounds used:** 0 / 2
