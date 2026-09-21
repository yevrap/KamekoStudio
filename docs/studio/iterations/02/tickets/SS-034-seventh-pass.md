# SS-034 — The status word, and two rules satisfied by the defect they named

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-033
- **Branch:** `ss-034-close-the-seventh-pass`

## Motivation

Opened by the seventh independent review. Six rounds had hardened how `docs-current` reads
*evidence*; the **status word**, which gates every one of those checks, was still matched
against the raw file. An HTML comment or a fenced block above the real line forged it to
something outside the vocabulary and skipped all of them, while the ticket still read
"Done" to a person — demonstrated on this iteration's own SS-033, gutted to an empty Result
with every criterion unticked, passing the gate.

Two rules written the round before were each satisfied by the defect they named, and the
record was false again in the ticket written to make it true.

## Acceptance criteria

- [x] The status and the unticked-criteria count are read through the same stripping as the
      evidence, and both are pure exported functions with tests.
- [x] Unticked criteria count for `-`, `*` and `+`, which all render as empty boxes.
- [x] The back link is judged on where it **resolves**, not on what it says.
- [x] The status-churn rule has a floor as well as a ceiling, measured over a window in
      which the line must change.
- [x] The torque arc must tell the four bolt states apart **on its own**.
- [x] `self-checks.md` describes the rules that exist, not the ones that were replaced.
- [x] Rounds six and seven are narrated in `review.md`, and every count corrected.

## Evidence plan

Each of the review's nine demonstrations re-applied to a clean tree and run at its stage.

## Out of scope

- The unbounded mutation surface, which the fifth, sixth and seventh reviews all reported
  and all declined to reject on. It is disclosed in `self-checks.md` and carries TD-008.

---

## Result

- **What changed:**
  - `tests/studio/checks/docs.mjs` — `statusOf` and `untickedCriteria`, both reading through
    `withoutHiddenText`, both exported and tested. The decision left `run()`, which is what
    `self-checks.md` has said to do since iteration 00.
  - `tests/studio/lib/boot-contract.mjs` — the back link judged on `samePage` /
    `fragmentOnly` and failing closed when never resolved; a floor on status churn; a
    separate rule requiring the four states' **fill** colours to be distinct.
  - `tests/studio/checks/boot.mjs` — the back link resolved with `new URL(href, location)`;
    the churn window lengthened to cover a bolt reaching its band; the state fixture's
    transitions disabled.
  - `self-checks.md`, `review.md`, `retro.md`, `log.md`, `CHANGELOG.md`, and SS-032's ticked
    claim.

- **Tested by:** the review's nine demonstrations, replayed. All nine fail:

  | Demonstration | What the check says now | Stage |
  |---|---|---|
  | `Status` forged in an HTML comment | *Done with no "What changed" evidence* | gate |
  | `Status` forged in a fenced block | same | gate |
  | criteria unticked with `*` bullets | same, plus the unticked count | gate |
  | back link `href="#top"` | *goes nowhere (href="#top" resolves to this page)* | ticket |
  | back link `href="./"` | same, for `./` | ticket |
  | back link `href=" "` | same, for a blank | ticket |
  | status line frozen on its opening sentence | *never changed while a bolt crossed into its band: it is frozen* | ticket |
  | only the gauge's state fills deleted | *a seated bolt's gauge is the same colour as a loose one* | ticket |
  | all gauge strokes set to one colour | same | ticket |

  214 studio tests green; the ticket stage green on a clean tree.

- **A mistake this ticket made and its own baseline caught.** The new state-ink rule failed
  against the *real* page on its first run. The torque arc animates its stroke over 120ms,
  so a computed colour read immediately after a class change is still the previous state's,
  and all four states read as loose. The rule was right; the observation was taken at the
  wrong moment. That is the same error as measuring in a configuration where nothing can
  fail, at the scale of one frame — and it is the first time this iteration that the error
  was caught before it reached a document.

- **Why round six's missing narration mattered.** `review.md` had rounds one to five as
  sections and round six as a table row. The three surviving "five rounds of review"
  statements were not a separate defect from that hole; they were produced by it. Both are
  fixed together.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
