# SS-014 — The 3D landing page shows every game, not the first nine

- **Status:** Done
- **Size:** M
- **Iteration:** 01
- **Role lead:** Tech Lead / Architect
- **Depends on:** none
- **Branch:** `ss-014-restore-missing-portals`

## Motivation

`createEnvironment()` builds nine portal positions and `ARCADE_GAMES` lists eleven games,
so `if (!positions[index]) return;` silently drops the last two — Black Hole in One and
Maze Warden have no portal on the landing page, and nothing reported it. Recorded as
TD-002 and surveyed in `../00/findings-3d.md`; the fix was approved by the executive on
2026-09-20 as a production bug fix on its own merits.

## Acceptance criteria

- [x] `createEnvironment()` builds a front-wall position row of three, taking the room from
      nine portal slots to twelve, with a matching rotation so the portals face into the
      room.
- [x] Every entry in `ARCADE_GAMES` gets a portal: the two previously dropped games appear,
      and no existing portal moves.
- [x] The front-wall positions clear the trophy shelf: they sit above its top surface and
      inside the room's height, verified against the room and shelf dimensions in the same
      file.
- [x] `shared/3d/constants.js` is unchanged — no game-list entry is added, and the twelfth
      slot stays empty.
- [x] The path exception for `shared/3d/gameplay.js` is recorded in `guardrails.md` and in
      the guard itself, is scoped to this single change by comparing the file's content
      against the base revision, and is reported as *used* rather than passing silently.
- [x] A `portal-capacity` check fails when `ARCADE_GAMES` has more entries than
      `createEnvironment()` has positions, and is unit tested against a source that
      overflows as well as one that fits.
- [x] The exception rejects any other edit to `shared/3d/gameplay.js`, proven by a unit test
      that feeds it one.
- [x] `npm test`, `npm run smoke` and `npm run e2e` stay green.

## Evidence plan

- `tests/studio/rules.test.mjs`: the capacity rule against a fitting source and an
  overflowing one; the exception against the approved edit and against a tampered one.
- `npm run studio:check -- --stage=ticket`, which now includes `portal-capacity` and must
  report the exception as used.
- The landing page loaded and walked: the two restored portals present on the front wall,
  their prompts reachable, no console errors.
- After deploy, `production-live` and `production-unchanged` — the latter reporting the
  exception as used and nothing else outside the guard.

## Out of scope

- **A portal for the realm.** Edit 2 in the findings note is not approved and is not made.
- Unit-testing the rest of `shared/3d/`. Untested production 3D code predates the studio;
  this ticket adds the one check that would have caught this defect, not a suite.
- Any change to `3d.html`, `controls.js` or the trophy shelf.

---

## Result

- **What changed:** `createEnvironment()` in `shared/3d/gameplay.js` gains a
  `frontPositions` table of three, spread into `positions` and into `rotations` at
  `Math.PI`. The room holds twelve portal slots; eleven games fill eleven of them and the
  twelfth — the centre of the front wall, facing the spawn point — is left empty for the
  realm's own door. No other file in `shared/` is touched, and `ARCADE_GAMES` is unchanged.

  Around it: `ADR-0005` records the exception; `guardrails.md` moves the file from *pending*
  to *recorded*, and restates what is still pending as held by decision rather than by
  capacity; `tech-debt.md` closes TD-002 and rewrites TD-001's status; `self-checks.md`
  documents `portal-capacity`; `tests/studio/checks/portal-capacity.mjs` is the check and
  `portalCapacity` in `lib/rules.mjs` is its rule.

- **Deviation from the diff as proposed.** The findings note put the row at
  `roomDepth/2 - 1.2`, matching the other three walls. Measured in the running scene with
  every trophy present, that cleared the tallest trophy by **0.01 units** — the bounding
  boxes did not intersect, but trophy spacing is `shelfWidth / (n + 1)`, so the margin
  moves with how many achievements the player has. The row ships at `roomDepth/2 - 2.0`,
  which puts the portals 0.53 in front of the nearest trophy in z and clear of the shelf's
  1.5 of depth entirely. Separation is now structural rather than incidental. Height and
  rotation are as proposed.

- **Tested by:**
  - `portal-capacity` **failed first, against the real defect** —
    *"11 games but only 9 portal slots — the last 2 would be dropped silently"* — and
    passes after the fix: *"11 game(s), 12 portal slot(s) — every game has a door."*
  - 12 new unit tests in `rules.test.mjs`: capacity on a fitting page, on the nine-slot
    page, on exact fit, on a position row with no matching rotation row, and on three
    unreadable sources; the exception against the approved edit, an unchanged file, a
    smuggled unrelated edit, tampering *inside* the approved block, a deleted line
    elsewhere, a stripped trailing newline, and a file absent from the base revision.
  - The running landing page, in headless Chrome: 11 games, 11 portals, **no game without
    one**, and all 11 showed their own `Press E to enter <name>` prompt when approached —
    including Black Hole in One and Maze Warden, which had none before. No page errors.
  - Bounding boxes measured with all five trophies spawned; front portals span y 2.735 to
    5.265 (room height 6) and z 9.61 to 10.39, against a shelf at z 10.5 to 12 and trophies
    from z 10.92. The clearance figures first written here were wrong in detail and are
    corrected on SS-016: at the proposed position the built portals were clear by 0.01 in z,
    and it was the *reserved* twelfth slot that overlapped the tallest trophy.
  - `npm test` 525 passed, `npm run smoke` green, `npm run e2e` 23 tests green.
  - `npm run studio:check -- --stage=ticket` green, with the exception reported as *used*.

- **Deferred:** nothing from this ticket. TD-001 stays open by decision, not by omission.

- **Fix rounds used:** 2 / 2 — both found by tests written to defeat the rule rather than
  to confirm it.
  1. The exception rejected its own approved edit. `textAt` read the base revision through
     a helper that trims, so every file lost its final newline and byte equality could
     never hold. Invisible until now because the only previous exception parses JSON before
     comparing. Fixed in `path-guard.mjs` by reading raw, with a regression test.
  2. The exception *accepted* a bypass: its pattern matched the approved block as
     "everything up to the next bracket", so code appended inside the block was reverted
     away with it and the guard waved it through. The pattern now matches the block's exact
     shape — comment lines, then an array whose every element is a bare `Vector3` call on
     its own line. The adversarial test that caught it is kept.
