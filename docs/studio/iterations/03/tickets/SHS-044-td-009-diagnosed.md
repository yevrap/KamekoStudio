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
  `lib/browser.mjs` — no third static server. Each trial uses its own browser profile and
  a real pointer tap on the Explore button, and compares a fresh profile (a golf hole with
  a black hole behind the menu) against a control that has played Explore once (Explore's
  world behind the menu, no black hole). By default it forces the precondition by making
  every frame on the menu spawn a spiral; `--as-a-player` forces nothing. Exit codes: 1
  present, 0 fixed, 2 a result that contradicts the diagnosis, 3 no Chrome.
  `docs/studio/tech-debt.md` — the TD-009 row rewritten with the cause, player
  reachability, the reproduction and the specified fix. `tests/studio/README.md` lists the
  script.

- **Tested by:** the committed script, run three times forced: 9/9 defect trials threw
  (62–65 uncaught errors each, first frame `stepParticles (ui.js:171:18)`), 0/9 control
  trials threw, exit 1 each time. `--as-a-player` once: 3/3 threw (41–63 errors), 0/3
  control, exit 1. How the cause was found, before the script existed: the flaky flow in
  isolation threw 0/15 times with New Map clicked straight after launch, and 2/24 with
  delays of 100–2500 ms before the click, always from `stepParticles` and never from New Map's own code. Waiting 60
  frames with the start menu hidden, then starting Explore with **no shot and no New Map
  click**, threw 8/8; waiting 0 frames, 0/8. A real tap on Explore after two seconds on
  the menu, a fresh profile per run, threw 10/10 (47–66 errors); with one shared profile
  only the first run of each batch threw — because the game had saved Explore as the last
  mode and drew Explore behind the menu from then on. That observation is what made the
  control trial. **The fix, tried on a scratch copy of the repository and nowhere else:**
  one line in `stepParticles`; the script then exits 0 and `npm run e2e` passes 23/23.
  `node --test tests/` still runs 693 tests in about a second, so the diagnostic is not
  collected. `path-guard` at the ticket stage: every changed path is inside the guard.

- **Deferred:** the fix itself, which is production-side and waits on the executive.

- **Fix rounds used:** 0 / 2
