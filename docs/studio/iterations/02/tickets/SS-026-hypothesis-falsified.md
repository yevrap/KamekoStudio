# SS-026 — The design hypothesis is recorded as false, in the tests and on the page

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** Game Designer
- **Depends on:** SS-022
- **Branch:** `ss-026-hypothesis-falsified`

## Motivation

Opened by both independent reviews, which found the same thing separately: the test written
to defend Overtighten's design hypothesis could not fail, and the hypothesis it was
defending is false for every plate that shipped. The plan's own falsifier was *"it is wrong
if the plates can be cleared by holding each bolt once in any order."* They can be.

## What actually happened

The original test held each bolt once **to the middle of its band**. The hold amount is the
free variable, and fixing it removed the only degree of freedom that mattered. Because
`turn()` clamps loosening at zero, a bolt at zero absorbs nothing — so in a single pass a
bolt is only ever reduced by the neighbours turned *after* it. Every plate is therefore a
back-substitution: overshoot each bolt by `coupling × Σ(later neighbours' amounts)`.

Measured, not argued:

| | |
|---|---|
| Orders that fall to one hold per bolt | **142 of 146** across the three plates |
| Why the other four resist | one bolt on the face plate would need 0.2–2.8 units past its strip point. A tuning margin, and nothing on the plate tells a player which four orders those are |
| Strip headroom on the listed order | 6 to 38 units — not a frame-perfect exploit |
| Blind round-robin, every order | clears every plate, at most **4 passes** |

QA reached the same result from the other end, playing it: hinge in 2 holds, face in 4,
bracket in 5, through the real interface, one of them keyboard-only.

## Acceptance criteria

- [x] The false test is replaced. `onePass` and `roundRobin` are written out, and the tests
      assert what is **true** of the plates, named so that a redesign inverts them.
- [x] The orders that resist are asserted to resist on a strip ceiling by a small margin, so
      that an order failing for a *structural* reason fails the test and says so.
- [x] A guard that the two strategies are genuinely different, so their agreeing means
      something.
- [x] The game's own page no longer describes itself as an ordering puzzle.
- [x] `constants.js` and `studio/README.md` say the same thing, and point at the review.
- [x] No plate is re-tuned to hide it. Tuning cannot fix this.

## Evidence plan

`node --test tests/studio/overtighten-plates.test.mjs`, and reading the page.

## Out of scope

- **Redesigning the mechanic.** It is an open product question with materially different
  answers, so by the Definition of Ready it goes to the executive as a questionnaire and the
  ticket waits. Options and their costs are in `review.md`.
- Re-tuning the plates. A parameter change cannot close this; the analysis says why.

---

## Result

- **What changed:** `tests/studio/overtighten-plates.test.mjs` — `naive()` replaced by
  `onePass()` (back-substitution over any order) and `roundRobin()`, plus `permutations()`;
  the old assertion inverted and renamed; two new tests per plate; a guard that the two
  strategies differ; the reference solver's test demoted and relabelled to say what it
  actually proves. `studio/games/overtighten/index.html`, `constants.js` and
  `studio/README.md` now describe the game as what it is.

- **Tested by:** 28 tests in the plate file, all green. The measurement above was taken
  **three times, by three methods that share no code**:

  | Method | Result |
  |---|---|
  | Closed-form back-substitution over all 146 orderings | 142 clear with one hold per bolt |
  | QA driving the real interface, by hand | hinge 2 holds, face 4, bracket 5 |
  | A brute-force grid search over hold *amounts* and every bolt order, driving the shipped `turn()` | agrees on all three plates |

  The grid search is the strongest of the three, because it does not assume the targeting
  rule the other two use. It found solutions aiming at the **bottom** of each band rather
  than the middle — `hinge: a+57.5, b+46.0`; `face: a+74.5, b+61, c+59, d+52`;
  `bracket: hub+74.5, n+46, e+46, s+46, w+52` — and every one of them was re-run against
  the shipped model here and lands every bolt inside its band:

  ```
  hinge    SOLVED  a=46.00 b=46.00
  face     SOLVED  a=46.25 b=46.25 c=46.00 d=52.00
  bracket  SOLVED  hub=40.30 n=46.00 e=46.00 s=46.00 w=52.00
  ```

  So the hypothesis does not fail on a particular choice of target. It fails structurally.

- **Why nothing was re-tuned:** any strategy that always moves a bolt to the middle of its
  band converges, because turning only ever *adds* to the bolt being turned and coupling
  load is under 1 by construction. No choice of bands, couplings or strip points changes
  that. Restoring the puzzle needs a state the player cannot undo — a turn budget per bolt,
  a seated bolt that locks, or torque that decays — and each of those is a different game.
  That is the executive's call, not a fix round's.

- **Deferred:** the redesign itself, to a questionnaire.

- **Fix rounds used:** 1 / 2
