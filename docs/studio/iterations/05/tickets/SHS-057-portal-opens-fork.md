# SHS-057 — The 3D landing page's River Run portal opens the studio fork

- **Status:** Ready
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

- [ ] In `shared/3d/constants.js`, the `ARCADE_GAMES` entry named "River Run Rapids" has
      the `url` `studio/games/river-run/`. Nothing else in the file changes.
- [ ] `guardrails.md` and `tests/studio/lib/rules.mjs` record the exception, scoped to that
      one `url` value of that one entry. It is checked the way the `frontPositions`
      exception is: remove the approved change, and what remains must equal the base
      revision byte for byte. An ADR records the approval, which comes from the E1
      direction's done-when and Q4.
- [ ] Every other `ARCADE_GAMES` entry still points at `games/<slug>/`, and a test asserts
      that each portal URL resolves to a directory with an `index.html`.
- [ ] In a headless browser on `3d.html`, the River Run portal's target is the fork.
- [ ] The guarded shared-3D code still boots: `npm run smoke` and `portal-capacity` pass.

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

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
