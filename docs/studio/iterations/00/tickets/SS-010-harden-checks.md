# SS-010 — Close the holes the independent review found

- **Status:** Done
- **Size:** L
- **Iteration:** 00
- **Role lead:** Tech Lead / Architect
- **Depends on:** SS-003
- **Branch:** `ss-010-harden-checks`

## Motivation

QA and the Independent Reviewer, run with fresh context on the iteration's diff, both
found that the guard's one exception was unenforced in exactly the situation it is used
in, and QA found three routes to shared storage the rule did not check. A guard that
reports "pass" without having checked anything is worse than no guard, because it is
believed.

## Acceptance criteria

- [x] The `package.json` exception compares the parsed file between the base revision and now, so it works the same whether the change is committed or in the working tree.
- [x] It checks the **value** of `scripts["studio:check"]`, not only the key, and rejects a second key smuggled onto the same line.
- [x] Both sides of a rename count as changed paths, so a file cannot be moved out of production unnoticed.
- [x] Paths are read NUL-separated, so a non-ASCII filename is not misread as a violation.
- [x] The storage rule covers bracket access, `delete`, and `clear()`, and treats a computed key as a violation whatever its text.
- [x] A legitimate `'studio_' + name` concatenation still passes.
- [x] Merge commits are exempted from the commit lint by parent count, not by their subject line.
- [x] `hygiene` scans by binary denylist rather than a text allowlist, and covers the exception paths.
- [x] A base ref that does not resolve fails rather than silently disabling the guard.
- [x] `tree-clean` runs at the gate, so the document checks describe what will be pushed.
- [x] A missing browser reports "not run" with the reason instead of a failure, and `--offline` skips the browser suites.
- [x] Every hole above has a regression test that fails against the old rule.
- [x] The documents that described the old behaviour are corrected in place.

## Evidence plan

A test per hole, each written from the reviewer's reproduction. Then every stage re-run
against the live repository.

## Out of scope

Alias tracking beyond detection — following `const ls = localStorage` through a file needs
a parser. Detecting and refusing the alias is the bounded answer.

---

## Result

- **What changed:** `tests/studio/lib/rules.mjs` (content-based exception with a JSON diff,
  storage rule rewritten around expression *kind*, commit lint takes parent count),
  `lib/shell.mjs` (`committedPaths`, NUL-safe `workingTreePaths`), `checks/path-guard.mjs`,
  `checks/storage-keys.mjs`, `checks/hygiene.mjs`, `checks/commit-lint.mjs`,
  `checks/suites.mjs`, `checks/preflight.mjs`, `check.mjs`; `rules.test.mjs` grew from 18
  to 26 tests; `self-checks.md`, `guardrails.md`, ADR-0002 and the learning log corrected.
- **Tested by:** `node --test tests/` — 497 green. Each reviewer reproduction re-run against
  the new rule: a committed dependency in `package.json` now fails with
  `changes beyond scripts["studio:check"]: dependencies`; a hijacked script value fails with
  `must be exactly`; `localStorage.clear()`, `localStorage['k']`, `delete localStorage.k`,
  `setItem(studio_key, v)` and `const ls = localStorage` all now fail; `'studio_' + name`
  still passes.
- **Deferred:** alias following (out of scope, above); `--base` resolution still needs the
  explicit value for iteration 00 (SS-009 records it).
- **Fix rounds used:** 1 / 2 — the first storage rewrite flagged legitimate concatenation;
  fixed by recording how each key was written rather than inferring it from the text.
