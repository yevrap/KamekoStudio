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
  `lib/browser.mjs` — no third static server. Every route trial uses its own browser
  profile and ends in a real tap on Explore. Four player routes from a black hole to that
  button — the start menu of a fresh profile; a golf round left through ☰ Menu; a golf
  round left through ⚙️ and the Play tab; a shared map left through its own ☰ Menu — a
  control with no black hole behind the menu, and the defect **directly**: in a golf round,
  spirals spawned by calling `stepParticles`, **proven to exist** by counting reads of the
  black hole's `x` against a no-particle baseline, then the black hole removed and one step
  taken. It forces the precondition by default; `--as-a-player` forces nothing. Verdicts:
  *present* (1) if any route throws; *fixed* (0) only if every route and the direct check
  are clean; *unclear* (2) for a control that throws, an error from anywhere but
  `stepParticles`, mixed forced results, routes clean but the direct check throwing, or no
  spiral creatable at all; *broken* (4) for the script's own failure; 3 for no Chrome.
  `docs/studio/tech-debt.md` — the TD-009 row: cause, the four routes, both exposed
  end-to-end tests, no rate claimed beyond what was measured, the check and the specified
  fix. `tests/studio/README.md` lists the script.
  **Fix round 1**, from the QA review: the first version tried one route and treated any
  unexpected exit as *present*, so a partial fix that suppressed spirals on the menu alone
  printed "looks fixed, close the row" while the mid-round route still threw, and its own
  crash exited 1. **Fix round 2**, from both round-2 reviews, which found the same gap
  independently: the direct check added in round 1 ran in the start menu's state and never
  confirmed a spiral existed, so a patch that stopped spirals while a menu showed and
  cleared them on ☰ Menu was reported *fixed* while two routes the script did not try still
  threw; and a start menu with no black hole behind it was reported *broken* instead of
  being judged. The direct check now runs in a golf round and proves its precondition, the
  two missing routes are tried, and an empty start menu is just a clean route. This round
  was not reviewed: review is capped at two.

- **Tested by:** on the real tree, forced: all four routes 3/3 (45–64 uncaught errors each,
  first frame `stepParticles (ui.js:171:18)`), control 0/3, direct check *10 spirals alive,
  black hole removed: threw*, exit 1. Against eight scratch copies of the repository, each
  patched one way and never the real tree: the specified one-line fix → *fixed*, exit 0
  (and `npm run e2e` 23/23 with it, measured in fix round 1); stopping spirals in the menu
  phase → *present*, 1; drawing no golf hole behind the menu → *present*, 1; stopping
  spirals while any menu shows and clearing them on ☰ Menu → *present*, 1; clearing
  particles when Explore starts → *unclear*, 2; stopping spirals while a menu shows and
  clearing them whenever one opens (the round-2 reviewers' decoy) → *unclear*, 2;
  removing spirals altogether → *unclear, could not be tested*, 2; the Explore button
  renamed → *broken*, 4. The three decoys new in round 2 are QA's own patches, applied
  from its scratch trees; the Independent Reviewer's decoy has the same shape as the
  second-to-last of them. How the cause was found, before the script
  existed: the flaky flow in isolation threw 0/15 times with New Map clicked straight after
  the shot and 2/24 with delays of 100–2500 ms, always from `stepParticles`, never from New
  Map's code; starting Explore after 60 frames with the menu hidden, with no shot and no
  New Map click, threw 8/8, and after 0 frames 0/8. `node --test tests/` does not collect
  the script. `path-guard` at the ticket stage.

- **Deferred:** the fix itself — production-side. The executive has since granted the
  studio standing permission to make production fixes under the full process, from the
  next iteration, once it is written into the guardrails.

- **Fix rounds used:** 2 / 2
