# SHS-052 — Black Hole in One no longer throws when Explore starts with spiral particles alive (TD-009)

- **Status:** Done
- **Size:** S
- **Iteration:** 04
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SHS-051 (the rule that admits the production files)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

TD-009, diagnosed in iteration 03: entering Explore while a golf hole's spiral particles
are alive throws `Cannot read properties of null (reading 'x')` from `stepParticles` on
every frame for about a second, and players reach it by every route tried. It also makes
the repository suite fail some of the time for a reason unrelated to whatever is being
tested. The fix was specified in iteration 03 and not made, because production files were
out of bounds.

## Acceptance criteria

- [x] `stepParticles` in `games/black-hole-in-one/ui.js` drops spiral particles when there
      is no black hole. One line; nothing else in the file changes.
- [x] `scripts/e2e.mjs` has three deterministic regression tests: the start menu → Explore;
      a golf round → ☰ Menu → Explore; and the defect directly — spirals alive in a golf
      round, the black hole removed, one step. Each **proves spirals were alive** before it
      acts, and each is shown failing on the unfixed file and passing on the fixed one.
- [x] `node tests/studio/diagnostics/td-009.mjs` exits 0 on the fixed tree, and its output
      is recorded here. Its three checks now live in production's own suite, so the
      diagnostic is retired, and TD-009 is closed with this ticket's ID.
- [x] Golf is unchanged: spirals still spawn and orbit the black hole in a golf round (the
      direct test's precondition proves it).
- [x] Both production files are admitted by `PRODUCTION_FIXES`, named in the check's output
      with this ticket, and nothing else outside the guard changes.
- [x] After the push, `--stage=postdeploy --marker-at=/games/black-hole-in-one/ui.js`
      finds a string only the fixed file has.

## Evidence plan

- The three new tests: red on the unfixed `ui.js` (each with TD-009's error), green on the
  fixed one.
- The diagnostic's exit code and output on the fixed tree.
- `npm run e2e` several times in a row on the fixed tree, recorded with the count.
- The path guard's report; the post-deploy stage with the marker.

## Out of scope

- The two end-to-end tests that used to fail intermittently. They were not wrong: they
  entered Explore and the game threw. They stay as they are.
- Any other change to Black Hole in One, and the arcade's own roadmap.

---

## Result

- **What changed:**
  - `games/black-hole-in-one/ui.js` — one line in `stepParticles`: with no black hole,
    spiral particles are dropped before the loop that moves them around it. Nothing else
    in the file changed.
  - `scripts/e2e.mjs` — three regression tests, each in a browser profile of its own
    (the game remembers the last mode played, and an earlier test's Explore would leave no
    golf hole behind the start menu), with helpers to force spirals, count them without
    reaching into the module, and fail on any uncaught page error:
    - the start menu → Explore;
    - a golf round → ☰ Menu → Explore;
    - the defect directly: spirals created in a golf round and counted, the black hole
      removed, one step, then counted again — it must not throw, and none may survive.
  - `tests/studio/lib/rules.mjs` — two `PRODUCTION_FIXES` entries, both files, SHS-052,
    iteration 04.
  - Retired: `tests/studio/diagnostics/td-009.mjs` and its line in
    `tests/studio/README.md`, whose layout also gained the five test files SHS-050 and
    SHS-051 added. TD-009 closed in `tech-debt.md`.
- **Tested by:**
  - **Red first.** `npm run e2e` with the new tests and the unfixed `ui.js`: exactly the
    three new tests failed, each with TD-009's error — the start-menu route with 65
    uncaught `Cannot read properties of null (reading 'x')`, the ☰ Menu route with 57, and
    the direct test *"stepping 12 spiral(s) with no black hole threw"*. Every other test
    passed.
  - **Green.** The same run with the fix: 26 of 26.
  - **Partial fixes are not reported fixed.** Two, each tried in the working tree and
    reverted: keeping spirals but skipping them while there is no black hole — the direct
    test fails, *"12 spiral(s) survived their black hole"*; clearing particles when the
    Explore button is tapped — the direct test fails, *"stepping 11 spiral(s) with no
    black hole threw"*. Both route tests pass for both decoys: the direct test is the one
    that decides.
  - **The diagnostic, last run, on the fixed tree:** `node tests/studio/diagnostics/td-009.mjs`
    exited 0 — *"Fixed: every route clean in 3/3 forced trials, and with 10 spiral(s) alive
    stepParticles survives the black hole's removal."* All four routes and the control
    clean in every trial. With `--as-a-player`, also clean.
  - **Repeated:** `npm run e2e` five times in a row on the fixed tree, on the machine that
    built it: 26 of 26 each time. Evidence that the suite no longer fails for this reason;
    not a measured rate.
  - The guard: `path-guard` names both files as production fixes owned by SHS-052;
    `hygiene` scanned both and found nothing.
  - The deploy: `--stage=postdeploy --marker-at=/games/black-hole-in-one/ui.js` with a
    marker only the fixed file has — result in `log.md`.
- **Fix round 1 — from review round 1 (QA m1, n3).**
  - **The direct test accepted an over-broad fix.** `if (!bh) particles = [];` passed all
    three tests, while it also dropped the Explore bursts. The direct test now bursts
    particles in a colour nothing else draws, proves the renderer draws them, and requires
    them to survive the step. Counted by spying on the canvas's `fillStyle`, since the
    particle list is private.
    - That decoy now fails exactly the new assertion: *"the burst was dropped with the
      spirals"*.
    - The unfixed file still fails all three tests with TD-009's error: 65 and 59
      uncaught errors, then *"stepping 12 spiral(s)… threw"*.
    - With the fix, e2e passed 26 of 26, three runs in a row on this machine.
  - **The fix line allocated a new array on every Explore frame.** It now filters only
    when a spiral is there to drop. `ui.js` is still one line away from iteration 03.
  - **Not pushed until reviewed.** It changes this ticket's production files, so under
    SHS-054 the `push` stage refused it, as intended: *"review saw 7b8a0fe, and commit
    b378402 changed its production files outside what was reviewed — review it again"*.
    Review round 2 then saw `b378402`, and both passes approved SHS-052 on its own there:
    the Independent Reviewer *APPROVED*, and QA *APPROVED WITH FINDINGS*, re-measured with
    real taps (0 of 20 as a player on the fixed build, 20 of 20 on the unfixed one).
    `reviews/SHS-052.md` names that commit, and the push went out after it.
- **Deferred:** QA's round-2 nit, that the direct test would accept a fix that keeps only
  one of the burst's particles. It is one assertion in `scripts/e2e.mjs`, a production
  file, so under SHS-054 it could not be pushed without another review, and round 2 was the
  last. It is carried to the next iteration.
- **Fix rounds used:** 1 / 2
