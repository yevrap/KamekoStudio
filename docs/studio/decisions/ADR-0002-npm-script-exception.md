# ADR-0002 — `package.json` gets one recorded exception for `studio:check`

- **Status:** Accepted
- **Date:** 2026-09-19
- **Iteration:** 00

## Context

The self-checks must be runnable as `npm run studio:check`. The path guard forbids
changes outside `studio/`, `docs/studio/` and `tests/studio/`, and `package.json` is
outside all three. So the required deliverable and the guard contradict each other.

## Decision

`package.json` is a **recorded exception**, narrowed to a single `scripts` entry:

```json
"studio:check": "node tests/studio/check.mjs"
```

The exception is listed in `../guardrails.md` and encoded in the guard itself
(`tests/studio/checks/path-guard.mjs`), which reports it as *used* whenever the file is
touched, and fails if the diff to `package.json` contains anything but that line.

## Consequences

- The guard has an exception mechanism, which is a thing that can be abused. Mitigated by
  making every exception enumerated in code, printed when used, and content-checked rather
  than path-checked.
- A future iteration that wants to add a dependency will hit the guard and stop, which is
  the intended behavior: the studio has no business adding dependencies to a repository
  whose stack constraint is "no build step".

## Alternatives considered

| Option | Why not |
|---|---|
| Invoke the checks as `node tests/studio/check.mjs` and skip npm | Contradicts the brief, and an undiscoverable command is one nobody runs. |
| A separate `package.json` inside `studio/` | npm workspaces or a second install for one script; complexity far past the value. |
| Treat the whole of `package.json` as allowed | Turns a one-line exception into an open door to dependencies and script rewrites. |
