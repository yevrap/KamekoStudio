# SS-022 — *Overtighten*, the studio's first experiment, is playable

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** Game Designer
- **Depends on:** SS-020
- **Branch:** `ss-022-overtighten`

## Motivation

The shelf is a frame with nothing on it. The standing work mix runs new development on a
cadence, and this is the iteration where that cadence fires. A first experiment also
exercises the realm end to end — a game directory, the identity applied to something that
is not a document, the storage rule, and the promotion path that has never been walked.

## The mechanic, in one paragraph

A plate of bolts. Hold a bolt to turn it and its torque climbs; every bolt it is coupled to
loosens while you hold. Each bolt has a tolerance band and must end inside it — all of them
at once. Torque is only ever added to a bolt directly and only ever removed from it by
turning a neighbour, so a plate is an ordering puzzle with an analog release on top. Past
the strip point a thread is ruined and the plate is lost.

## Acceptance criteria

- [x] `studio/games/overtighten/` follows the folder convention in `studio/README.md`:
      native ES modules split by concern, no build step, no framework, no binary assets.
- [x] The torque rules are pure functions with no DOM, unit-tested for: turning, coupled
      loosening, the floor at zero, seating, stripping, and a solved plate.
- [x] Three plates ship, and a solver test proves each one reachable from zero to
      all-seated without stripping. A plate the solver cannot clear does not ship.
- [x] A test asserts, for every plate, that the naive strategy — hold each bolt once, in
      order, to the middle of its band — does **not** solve it. This is the design
      hypothesis stated as a check.
- [x] Input works with pointer and with keyboard: bolts are focusable controls, holding
      turns, releasing stops, and a pointer leaving the control stops it too.
- [x] Mobile-first: every interactive target is at least 44×44 CSS px at 320px width, and
      the page has no horizontal scroll there.
- [x] The page follows `body.dark-mode` and the Backstage tokens, declaring no light/dark
      toggle of its own.
- [x] Audio is synthesized, silent until the first pointer gesture, and mutable; the mute
      state persists under `studio_overtighten_muted`.
- [x] Progress persists under `studio_overtighten_progress`, survives a corrupt or
      hand-edited value, and the game is fully playable with storage blocked.
- [x] Both keys are documented in `studio/README.md` before use and pass `storage-keys`.
- [x] The page passes `studio-boot` from SS-020 with no console errors.
- [x] A back link to the realm is present and is the first focusable thing on the page.

## Evidence plan

| Criterion | Proof |
|---|---|
| Pure rules, coupling, stripping | `tests/studio/overtighten-gameplay.test.mjs` |
| Every plate solvable | The solver test, which prints the move count it needed |
| The hypothesis holds | The naive-strategy test, asserting failure per plate |
| Boot, console, tap targets, storage blocked | `studio-boot`, which asserts these generically for every studio page |
| Keyboard and pointer | Driven in the boot check: focus a bolt, hold a key, assert torque moved |
| Storage keys | `storage-keys`, plus the README table |

## Out of scope

- **Meta-progression.** No score, no stars, no unlock economy beyond the furthest plate
  cleared. Deliberate: see the plan.
- **A level editor, custom plates, or sharing.**
- **Promotion to the production arcade.** It ships as a PROTOTYPE on the studio shelf.
- **The realm's portal.** Held by decision; adding a game does not change that this
  iteration.

---

## Result

- **What changed:** `studio/games/overtighten/` — `constants.js` (tuning and three plates),
  `gameplay.js` (the torque rules, pure), `state.js` (progress, pure), `ui.js` (markup,
  pure), `main.js` (the only file touching the document), `sfx.js`, `index.html`,
  `style.css`. `studio/README.md` describes the folder and both storage keys.
  `tests/studio/lib/boot-contract.mjs` gains the game's own page contract.

- **Tested by:**
  - `overtighten-gameplay.test.mjs` — 21 tests: turning, coupled loosening, the floor at
    zero, immutability, seating and stripping at their exact boundaries, the two
    distinguishable failure states, and every shape of corrupt stored progress.
  - `overtighten-plates.test.mjs` — 18 tests, per plate: couplings mutual, every bolt's
    coupling load under 1, bands coherent, **solvable from zero without stripping**, and
    **not solvable by holding each bolt once**.
  - `overtighten-ui.test.mjs` — 13 tests: gauge arithmetic, each bolt state, one button per
    bolt, links drawn once per pair, singular/plural status copy, a locked plate rendered
    and disabled rather than hidden, and escaping.
  - `studio-boot` now drives the game in a real browser: holding a key on a focused bolt
    turns it, holding the pointer on its neighbour turns that one *and* visibly loosens the
    first, releasing stops the turn, and holding past the strip point ends the plate.
  - **A full play-through of all three plates through the real interface**, holding bolts
    the way a player would: Hinge seated in 3 holds, Face in 9, Bracket in 9. Progress
    persisted to `studio_overtighten_progress` and all three plates unlocked.

  Six mutations were applied to the game and each was demonstrated failing `studio-boot`,
  so the new contract is not a check wired to nothing:

  | Mutation | What the check said |
  |---|---|
  | `COUPLING` set to 0 | *turning a bolt did not loosen the bolt it is coupled to — the mechanic is not running* |
  | coupled loosening removed from `turn()` | same |
  | `keyup` no longer releases | *the bolt kept turning after the input stopped* |
  | keyboard hold not wired | *holding a key on a focused bolt did not turn it: the game is unplayable without a pointer* |
  | stripping no longer ends the plate | *turning past the strip point did not end the plate* |
  | every plate unlocked from the start | *no plate is locked on a fresh profile: the plates are not gated at all* |

- **Two things found by looking at it, and fixed:**
  1. **The band was invisible.** It was drawn beneath the fill, in a wash colour, so the
     one thing on the gauge the player is aiming at could barely be seen in either theme —
     and was covered by the fill the moment it was reached. It is now a thinner ring
     outside the fill, in the worklight amber.
  2. **The gauge radius existed in two files.** `main.js` repainted the fill arc from its
     own copy of `2π × 26`. One edit away from a gauge that no longer matched its track.
     The geometry is now exported from `ui.js` and asserted to fit its own viewBox.

- **Deferred:** the difficulty curve does not rise between the second and third plates by
  the only measure taken — both were cleared in 9 holds. Recorded in `review.md` as an
  Iterate rather than tuned by guess: hold count is a poor proxy for how hard an ordering
  puzzle is, and the right response is a second measure, not a nudge to the numbers.

- **Fix rounds used:** 0 / 2
