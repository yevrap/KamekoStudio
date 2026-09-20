# SS-008 — The three skills

- **Status:** Done
- **Size:** M
- **Iteration:** 00
- **Role lead:** Scrum Master
- **Depends on:** SS-001
- **Branch:** none — skills live outside the repository

## Motivation

The company is only usable if a single sentence starts it. Three sentences, three skills.

## Acceptance criteria

- [x] `studio-iteration`, `studio-standup` and `studio-promote` exist as standard `SKILL.md` files in the single skills location, so every agent sees the same files.
- [x] Each description states the trigger phrases plainly enough to fire on them.
- [x] `studio-iteration` encodes the protocol, the caps, the hard rules and the report shape, and points at the repo handbook as authoritative rather than restating it.
- [x] `studio-standup` is read-only and carries the delta rule.
- [x] `studio-promote` stops for approval before touching anything outside the guard.
- [x] Registered in the skills index and in all three agent context files, per the vault's sync rule.

## Evidence plan

The skills appear in the session's skill list; each file's paths resolve.

## Out of scope

Scheduling. The design says one iteration per kickoff, no scheduler.

---

## Result

- **What changed:** three `SKILL.md` files in the vault's skills folder; a new section in
  the skills index; a Shadow Studio section in all three agent context files, plus their
  arcade rows and key-content lines and a refreshed sync date.
- **Tested by:** all three registered and listed by the session; every vault path
  referenced in them checked to exist under its exact name.
- **Deferred:** the Independent Reviewer running as a different vendor's agent — possible,
  not wired up.
- **Fix rounds used:** 1 / 2 — the skills referenced the vault views by their short names;
  corrected to the real filenames after the views were created.
