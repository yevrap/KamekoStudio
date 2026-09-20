# ADR-0004 — The self-checks are an executable script, not a checklist

- **Status:** Accepted
- **Date:** 2026-09-19
- **Iteration:** 00

## Context

The studio's guarantees — the path guard, the storage rule, public-repo hygiene, document
cleanliness, production being untouched — are only worth anything if they are applied the
same way every time. An agent following a markdown checklist applies it as well as its
attention that day allows, and a skipped item leaves no trace.

## Decision

The checks are a Node script, `tests/studio/check.mjs`, with one module per check in
`tests/studio/checks/`. It runs with no dependencies beyond Node itself and whatever the
repo already installs, is grouped into stages, and prints every check as `pass`, `fail` or
`not run` with a reason. Exit code 1 on any failure.

A check that cannot run reports `not run` rather than being omitted, and the `gate` stage
refuses to pass with a `not run` in it.

## Consequences

- A reader of the repository can run the studio's guarantees themselves, which is the
  strongest form of documentation available.
- Checks become code that needs maintaining, and a broken check can block honest work.
  Mitigated by keeping each check small, single-purpose and independently runnable.
- Agent judgment is still needed for the things a script cannot see — whether a mechanic is
  fun, whether a document reads well. Those stay in the Definition of Done and the review,
  and are not pretended into automation.

## Alternatives considered

| Option | Why not |
|---|---|
| A markdown checklist in the process doc | Unenforceable, and invisible when skipped. |
| Git hooks | Invisible to a reader, bypassed with `--no-verify`, and not present in a fresh clone. |
| A CI workflow | There is no `.github/` in this repository and Pages deploys from the branch; adding CI is a production-wide change well outside the studio's remit. |
