# SS-014 — The 3D landing page shows every game, not the first nine

- **Status:** Ready
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

- [ ] `createEnvironment()` builds a front-wall position row of three, taking the room from
      nine portal slots to twelve, with a matching rotation so the portals face into the
      room.
- [ ] Every entry in `ARCADE_GAMES` gets a portal: the two previously dropped games appear,
      and no existing portal moves.
- [ ] The front-wall positions clear the trophy shelf: they sit above its top surface and
      inside the room's height, verified against the room and shelf dimensions in the same
      file.
- [ ] `shared/3d/constants.js` is unchanged — no game-list entry is added, and the twelfth
      slot stays empty.
- [ ] The path exception for `shared/3d/gameplay.js` is recorded in `guardrails.md` and in
      the guard itself, is scoped to this single change by comparing the file's content
      against the base revision, and is reported as *used* rather than passing silently.
- [ ] A `portal-capacity` check fails when `ARCADE_GAMES` has more entries than
      `createEnvironment()` has positions, and is unit tested against a source that
      overflows as well as one that fits.
- [ ] The exception rejects any other edit to `shared/3d/gameplay.js`, proven by a unit test
      that feeds it one.
- [ ] `npm test`, `npm run smoke` and `npm run e2e` stay green.

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

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
