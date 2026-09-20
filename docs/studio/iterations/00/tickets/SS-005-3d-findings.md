# SS-005 — Findings on the 3D landing page

- **Status:** Done
- **Size:** M
- **Iteration:** 00
- **Role lead:** Tech Lead / Architect
- **Depends on:** none
- **Branch:** `ss-005-findings`

## Motivation

The design assumed the realm's portal was one approved edit to `3d.html`. Before asking for
that approval, establish what the change actually is.

## Acceptance criteria

- [x] Every file involved in the 3D landing page is described by responsibility and size.
- [x] The mechanism by which a portal comes to exist, and the mechanism by which it navigates, are both traced.
- [x] The exact files a studio portal would touch are named, and their path-guard status stated.
- [x] The proposed change is written as a reviewable diff, and **not applied**.
- [x] Costs, risks and an alternative are stated, with a recommendation.
- [x] Anything the survey turns up that is wrong today is filed on the debt register.

## Evidence plan

Read all six files end to end; count the position table against the game list.

## Out of scope

Applying anything. `3d.html` and `shared/3d/` are outside the path guard and the brief
forbids touching them this iteration.

---

## Result

- **What changed:** `docs/studio/iterations/00/findings-3d.md`. No source file touched.
- **Tested by:** `git diff --stat` for the iteration shows no change under `shared/` or to
  `3d.html`; the `path-guard` check confirms it.
- **Deferred:** both proposed edits, pending approval — TD-001 (no entrance) and TD-002
  (the portal table holds 9 slots against 11 games, so Black Hole in One and Maze Warden
  are silently dropped today).
- **Fix rounds used:** 0 / 2
