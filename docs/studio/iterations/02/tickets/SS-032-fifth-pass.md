# SS-032 — The rule I broke while fixing the last one, and a record that counts

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-031
- **Branch:** `ss-032-close-the-fifth-pass`

## Motivation

Opened by the fifth independent review, which rejected the iteration — explicitly *not* for
the existence of further mutations, which it judged honestly disclosed, but because four
claims outran what was true. The worst was introduced by SS-031: emulating a phone made
`window.innerWidth` grow with overflowing content, so the sideways-scroll rule compared
`scrollWidth` against a number that tracks `scrollWidth` and became unreachable, while two
documents went on asserting it and the rule that replaced it blamed a missing viewport meta
tag on pages whose tag was present and correct.

That is this iteration's signature failure — a correct rule fed input that cannot falsify
it — committed by the ticket written to end it.

## Acceptance criteria

- [x] Three measurements, three rules, three causes: whether the page **asks** for the
      device width (read from the tag), whether content **forced** the layout viewport
      wider than the device, and whether the page **scrolls** sideways inside its own
      layout — the last compared against `clientWidth`, which does not move with the
      overflow.
- [x] Each of the three fails on its own defect and names it correctly.
- [x] `resultSection` strips a fence indented by up to three spaces, and a fence of four or
      more characters.
- [x] Focus after choosing a plate from the picker is asserted, not only after a restart.
- [x] Every stale count is corrected: five rounds of review, 51 mutations across seven sets.
- [x] The changelog records the fourth and fifth rounds, including **TD-008**.
- [x] The strip-headroom figure is scoped to what was measured.
- [x] SS-031's mutation accounting reconciles twelve reported against nine replayed.

## Evidence plan

Each defect the review demonstrated, re-applied to a clean tree and run.

## Out of scope

- The `display: none` family of mutations the review found and did **not** reject on. They
  are covered by `self-checks.md`'s gap list and TD-008; closing them means a rendering
  observation, which is the debt row's subject.

---

## Result

- **What changed:**
  - `tests/studio/checks/boot.mjs` — `clientWidth` and the viewport meta's content added to
    the observation; focus after a pick asserted.
  - `tests/studio/lib/boot-contract.mjs` — one rule became three, each naming its own
    cause; `declaresDeviceWidth` added.
  - `tests/studio/checks/docs.mjs` — the fence pattern allows up to three spaces of
    indentation and four or more fence characters.
  - The record: `review.md`, `retro.md`, `self-checks.md`, `CHANGELOG.md`, `tech-debt.md`,
    SS-020's and SS-031's Results.

- **Tested by:** the review's demonstrations, replayed:

  | Defect | What the check says now |
  |---|---|
  | content wider than the device, meta present | *content forced the layout viewport to 440px on a 320px device* — and no longer blames the tag |
  | viewport meta deleted from both pages | *there is no viewport meta tag: a phone lays the page out at ~980px* |
  | real sideways scroll inside the layout | *the page scrolls sideways: content is 942px inside a 320px viewport* |
  | 3-space-indented fence supplying evidence | *SS-029-turn-loop.md: Done with no "What changed" evidence* |
  | focus dropped after choosing a plate | *after loading a plate, focus is not on a bolt* |

  `npm test` green, 208 studio tests.

- **The number that was generalised:** "6 to 38 units of strip headroom" is the per-bolt
  range **on the listed order**. Across all 142 clearing orderings the tightest is 3.5.
  Both are now stated, because the first was being attached to a sentence about all 142.

- **Deferred:** nothing. The rendering gaps the review found are TD-008's, not this
  ticket's, and were not rejected on.

- **Fix rounds used:** 1 / 2
