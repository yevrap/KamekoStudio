# SS-003 — `npm run studio:check`

- **Status:** Done
- **Size:** L
- **Iteration:** 00
- **Role lead:** Tech Lead
- **Depends on:** SS-001
- **Branch:** `ss-003-self-checks`

## Motivation

The studio's guarantees are worthless if they are applied by memory. A checklist is skipped
silently; a script is not.

## Acceptance criteria

- [x] `npm run studio:check` runs from a clean clone with no new dependencies.
- [x] Checks are grouped into the five stages from the design: preflight, ticket, gate, postdeploy, closeout.
- [x] Every check reports pass, fail or "not run" **with a reason**; nothing is omitted.
- [x] The gate refuses to pass on a "not run".
- [x] The path guard allows only the three studio paths, and content-checks its one recorded exception rather than waving the file through.
- [x] The storage guard catches a non-`studio_` key, including one built by concatenation.
- [x] The hygiene scan catches secrets, identifiers, private paths, note-vault syntax and oversized files, with a pragma so the documents that quote those rules can exist.
- [x] The doc-cleanliness check catches stacked corrections, and does not flag a decision record for recording that it was superseded.
- [x] The decision logic is pure functions, unit tested.
- [x] Exit code is 1 on any failure.

## Evidence plan

`node --test tests/studio/` for the rules; each stage run against the live repository, with
the failures it produced recorded in the review.

## Out of scope

CI. There is no `.github/` in this repository and adding one is a production-wide change.

---

## Result

- **What changed:** `tests/studio/check.mjs` (CLI, five stages, JSON and table output),
  `checks/` (8 modules, 18 checks), `lib/rules.mjs` (pure decision logic), `lib/shell.mjs`
  (git, fs, network plumbing), `rules.test.mjs` (18 tests), `tests/studio/README.md`; one
  line added to `package.json` under the ADR-0002 exception.
- **Tested by:** `node --test tests/` — 484 tests green, the studio's 18 among them. Every
  stage exercised against the live repo; six real defects caught (listed in the review).
- **Deferred:** studio pages are not in `npm run smoke` (TD-004); the storage rule is
  implemented twice (TD-003). Both registered.
- **Fix rounds used:** 1 / 2 — the storage check's first pass could not see through the
  page's storage wrappers. Fixed in the page, not the check: the namespace is now applied
  as a literal at the call site, which makes it both structural and checkable.
