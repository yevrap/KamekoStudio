# SS-002 — Twelve role definitions

- **Status:** Done
- **Size:** M
- **Iteration:** 00
- **Role lead:** Scrum Master
- **Depends on:** SS-001
- **Branch:** `ss-002-team`

## Motivation

Roles are the mechanism by which different questions get asked of the same work. A role
that is not written down is a question nobody asks.

## Acceptance criteria

- [x] One file per role in the design: twelve, each with what it owns, what it reviews, its voice, what it refuses to do, and its Definition of Done line.
- [x] Each role's "refuses to" list contains things that would actually be tempting, not platitudes.
- [x] Working notes carry the repo-specific knowledge that role needs, drawn from the existing codebase rather than invented.
- [x] `team/README.md` explains that roles are lenses, and names the two run with fresh context.
- [x] No role file duplicates content from another document; they link instead.

## Evidence plan

Cross-read against the repository's own `CLAUDE.md` conventions: each working note must be
traceable to something real in this codebase.

## Out of scope

Persona voice for player-facing content. These are engineering lenses, not characters.

---

## Result

- **What changed:** `docs/studio/team/` — README plus twelve role files.
- **Tested by:** every working note traced to a real convention or a real past failure in
  this repo (canvas-size-zero, `pageshow` on iOS, the trailing-slash rule, the three test
  levels, the ~800-line split threshold, synthesized audio).
- **Deferred:** the Independent Reviewer can be a different vendor's agent; not wired up, the
  role file says so.
- **Fix rounds used:** 0 / 2
