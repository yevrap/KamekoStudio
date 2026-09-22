# SHS-057 — The 3D landing page's River Run portal opens the studio fork

- **Status:** Done
- **Size:** S
- **Iteration:** 05
- **Role lead:** Tech Lead / Architect
- **Depends on:** SHS-056
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

E1's first done-when line: a 3D portal leads to a studio fork, and every portal without a
fork still leads to its production game. The portal list lives in production code, so the
change is a recorded exception. Source: direction E1, Q4, backlog #3.

## Acceptance criteria

- [x] In `shared/3d/constants.js`, the `ARCADE_GAMES` entry named "River Run Rapids" has
      the `url` `studio/games/river-run/`. Nothing else in the file changes.
- [x] `guardrails.md` and `tests/studio/lib/rules.mjs` record the exception, scoped to that
      one `url` value of that one entry. It is checked the way the `frontPositions`
      exception is: remove the approved change, and what remains must equal the base
      revision byte for byte. An ADR records the approval, which comes from the E1
      direction's done-when and Q4.
- [x] Every other `ARCADE_GAMES` entry still points at `games/<slug>/`, and a test asserts
      that each portal URL resolves to a directory with an `index.html`.
- [x] In a headless browser on `3d.html`, the River Run portal's target is the fork.
- [x] The guarded shared-3D code still boots: `npm run smoke` and `portal-capacity` pass.

## Evidence plan

Rule tests in `rules.test.mjs` (an approved change passes; the same change with any other
edit riding along fails, and so does a second URL changed). `path-guard` at the ticket
stage. Postdeploy with `--marker-at=shared/3d/constants.js`.

## Out of scope

TD-006 (the prompt that prefers a portal to a trophy); any studio label or styling on the
portal. A visual mark for "this is a studio fork" is backlog material if the executive
wants one.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:** `ARCADE_GAMES`' "River Run Rapids" entry now has the `url`
  `studio/games/river-run/` (one line, `71245fa`). `shared/3d/constants.js` is a recorded
  exception in `PATH_EXCEPTIONS`, with `STUDIO_FORK_PORTALS` listing the approved fork.
  `allowOnlyStudioForkPortal` undoes that value on the entry's own line, on both sides, and
  requires byte equality, so the released change reads as unchanged next sprint and the
  rollback passes. ADR-0010 records the approval (E1 done-when, Q4). `guardrails.md` has the
  row, and the pending row now names only the realm's own portal (TD-001). `path-guard.test.mjs`
  used `constants.js` as its "unchanged since the base" sample, so it now uses
  `shared/3d/state.js`.
- **Tested by:** 10 rule tests in `rules.test.mjs` (approved change, unchanged file before
  and after release, ride-along edit, second url, fork url on another entry, wrong target,
  duplicated entry, trailing newline, missing base, rollback), red on the missing export
  first. `studio-portal.test.mjs`: River Run points at the fork; the ten other portals match
  `games/<slug>/`; every portal url has an `index.html`; in headless Chrome on `3d.html` the
  player stands at River Run's portal, the page's own proximity code picks it, pressing E
  opens `/studio/games/river-run/`. The two River Run tests were red on the production url
  first. `--stage=ticket` green (path-guard: *exception used*). `--stage=push` green, full
  suites included (`npm test`, smoke, e2e) and portal-capacity (11 games, 12 slots).
  Postdeploy green: the marker was served from the live `shared/3d/constants.js` on attempt
  3, and production-unchanged admits only this exception.
- **Deferred:** none from the ticket. **Unplanned, in this ticket:** the first push stage
  failed on SHS-056's browser test, not this ticket's. An unattended run outlived its
  60 s wait (1 in 3 alone, measured). That's the flake the last session couldn't name.
  `045f031` makes the run end on purpose: it waits for a point, then a rock is moved onto
  the boat and the game's own collision ends the run. 5/5 green, 15 s instead of 45–63 s.
- **Fix rounds used:** 0 / 2
