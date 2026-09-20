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
(`tests/studio/lib/rules.mjs`), which reports it as *used* whenever the file is touched.
Enforcement compares the **parsed file** at the base revision with the parsed file now:
the only permitted difference is `scripts["studio:check"]`, and its value must be exactly
`node tests/studio/check.mjs`. The value is checked as strictly as the key, because
`studio:check` is a script this repository runs — an arbitrary command appended to it would
execute.

An earlier version of this check read the diff text instead, which meant it saw nothing at
all once the change was committed and the working tree was clean: any committed change to
`package.json` was waved through while the check printed a reassuring "exception used".
Found by the independent review of iteration 00, and the reason the rule now works on
content rather than on diffs.

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
