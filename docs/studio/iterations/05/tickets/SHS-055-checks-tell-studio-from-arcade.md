# SHS-055 — The studio checks tell studio commits from arcade commits on the shared `main`

- **Status:** Ready
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

- [ ] A commit is a **studio commit** when its subject has the scope `(studio)`. The rule
      lives in one function in `tests/studio/lib/rules.mjs`, and every check that needs it
      calls that function.
- [ ] `commit-lint` requires `type(studio): SHS-NNN …` of studio commits only, and ignores
      arcade commits.
- [ ] `path-guard` and `production-unchanged` judge the files changed by studio commits.
      A file changed only by arcade commits is not a studio violation.
- [ ] The reverse holds: an arcade commit that touches `studio/**`, `docs/studio/**` or
      `tests/studio/**` is reported as a violation, so dropping the scope does not get a
      studio change past the guard. The shared exception files and production-fix files
      keep their current rules.
- [ ] A merge commit is judged by the files it changes against its first parent, and a
      merge that mixes the two kinds is a violation (no silent pass).
- [ ] The two executive commits scoped `(studio)` with no ticket number (`fecf7ea`, the E1
      direction; `d454f79`, ADR-0009), which also touch `.claude/`, pass by a **recorded**
      list of exact hashes in `rules.mjs`, each with its reason. The check reports them as
      exempted, never silently. A new unnumbered `(studio)` commit still fails.
- [ ] `npm run studio:check -- --stage=gate --base=studio-iteration-04` no longer reports
      the 2026-09-22 migration commits as violations.
- [ ] `process.md` and `guardrails.md` say how a commit is classified, and what that does
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

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
