# SHS-044 — TD-009 diagnosed: root cause, a deterministic reproduction, the production fix specified

- **Status:** Done
- **Size:** S
- **Iteration:** 03
- **Role lead:** QA Engineer
- **Depends on:** none
- **Branch:** `shs-044-td-009-diagnosed`

## Motivation

TD-009: a Black Hole in One end-to-end test fails about one run in three, which makes the
studio's guarantee that "the whole suite is green before merging" weaker than it reads and
would hide a real regression in that path. It is production code, so the studio may not fix
it; the executive asked instead for what a fix would take. That needs the cause, not the
symptom.

## Acceptance criteria

- [x] The root cause is stated in the debt register with the file and line that throw, why
      it is intermittent, and whether a player can reach it — each from a measurement, not
      from reading alone.
- [x] A reproduction lives in the repository, under the studio's own paths, that produces
      the failure on every run rather than one in three, and reports plainly whether the
      defect is present — so the row can be closed later by running it.
- [x] The reproduction is not collected by `npm test`, and so cannot turn the repository
      suite red.
- [x] The production fix is specified — files, size, and the regression test it needs — as
      a proposal, not a change.
- [x] No file outside the path guard changes.

## Evidence plan

Run the reproduction several times against the current tree; every run reproduces. Run it
with the precondition removed; no run reproduces. The path guard at the ticket stage.

## Out of scope

- The fix itself. Production-side; the executive decides.
- Any retry or exemption in the studio's own gate.

---

## Result

- **What changed:** new `tests/studio/diagnostics/td-009.mjs`, built on the studio's own
  `lib/browser.mjs` — no third static server. Every player trial uses its own browser
  profile and real pointer taps. It tries two player routes into Explore — from the start
  menu of a fresh profile, and out of a golf round through ☰ Menu — a control with no black
  hole behind the menu, and the defect **directly**: spirals alive, black hole removed, one
  call to `stepParticles`. It forces the precondition by default; `--as-a-player` forces
  nothing. It says *fixed* only when every route and the direct check are clean; a route
  that throws is *present*; a fix that clears the routes but not the defect, a control that
  throws, an error from anywhere but `stepParticles`, or mixed forced results are
  *unclear*; and the script's own failure is *broken*, never *present*. Exit codes 0, 1, 2,
  4, and 3 for no Chrome. `docs/studio/tech-debt.md` — the TD-009 row, with the cause, both
  player routes, both exposed end-to-end tests, a rate stated no more precisely than it was
  measured, the check and the specified fix. `tests/studio/README.md` lists the script.
  **Fix round 1**, from the QA review: the first version tried only the start-menu route
  and treated any exit it did not expect as *present*, so a partial fix that suppressed
  spirals on the menu alone made it print "looks fixed, close the row" while the mid-round
  route still threw every time; and its own crash exited 1. The row also named one exposed
  test of two, and stated a one-in-three rate measured over three runs.

- **Tested by:** on the real tree, forced: start menu 3/3 and mid-round 3/3 threw (46–64
  uncaught errors each, first frame `stepParticles (ui.js:171:18)`), control 0/3, direct
  check threw, exit 1. `--as-a-player`: the same, exit 1. On four scratch copies of the
  repository, each patched in one way and never the real tree: the specified one-line fix
  → *fixed*, exit 0, and `npm run e2e` 23/23 with it; QA's partial fix (no spirals in the
  menu phase) → *present*, mid-round 3/3, exit 1; clearing particles when Explore starts
  instead → *unclear*, routes clean but the direct check throws, exit 2; the Explore button
  renamed → *broken*, exit 4. How the cause was found, before the script existed: the flaky
  flow in isolation threw 0/15 times with New Map clicked straight after the shot and 2/24
  with delays of 100–2500 ms, always from `stepParticles`, never from New Map's code;
  starting Explore after 60 frames with the menu hidden, with no shot and no New Map click,
  threw 8/8, and after 0 frames 0/8. `node --test tests/` does not collect the script: it
  still runs 693 tests in about a second. `path-guard` at the ticket stage.

- **Deferred:** the fix itself, which is production-side and waits on the executive.

- **Fix rounds used:** 1 / 2
