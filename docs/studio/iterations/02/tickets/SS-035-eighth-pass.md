# SS-035 — Rules about the thing, not about the spelling

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-034
- **Branch:** `ss-035-close-the-eighth-pass`

## Motivation

Opened by the eighth independent review. **All three rules SS-034 added were satisfied by
the defect they named** — the clearest statement yet of this iteration's deepest habit. A
back link rule that rejected `#` and accepted `index.html`; a states-must-differ rule
satisfied by four greys one unit of blue apart; an unticked-criteria rule that missed
ordered lists. `docs-current` was also defeated a third time in the same place, by a raw
`<script>` block hiding a forged `Status`.

Each of those rules was written to exclude the instance in front of the author, and each
was therefore a rule about a *spelling* rather than about the thing.

## Acceptance criteria

- [x] The back link is compared **as a page**: `index.html` normalised away before the
      comparison, so no spelling of "the page it is on" passes.
- [x] A ticket declares its status **exactly once**, counted in the raw file — a rule
      indifferent to how a second declaration is hidden.
- [x] The four bolt-state colours are compared **as colours against an absolute gap**, not
      as strings.
- [x] Unticked criteria count ordered task items as well as bulleted ones.
- [x] The headline count, TD-008's tally and the round counts are all current.
- [x] `review.md` is in chronological order and narrates all eight rounds.
- [x] The lesson is written into the learning log and the retro, since it is now the
      iteration's most repeated failure.

## Evidence plan

Each of the review's four demonstrations re-applied to a clean tree and run at its stage.

## Out of scope

- The unbounded mutation surface. The fifth through eighth reviews all reported more and
  all declined to reject on it; it is disclosed in `self-checks.md` and carries TD-008.

---

## Result

- **What changed:**
  - `tests/studio/checks/boot.mjs` — the back link's resolved URL normalised through a
    `page()` helper before comparison.
  - `tests/studio/checks/docs.mjs` — `statusLineCount`, and a rule that a ticket declares
    its status once; `untickedCriteria` matches `[-*+]` and `\d+[.)]`.
  - `tests/studio/lib/boot-contract.mjs` — `channelsOf`, `colourDistance` and
    `MIN_COLOUR_GAP`; the state-ink rule compares every pair of the four states as colours.
  - The record: the headline count, TD-008's tally, `self-checks.md`'s two rule
    descriptions, the retro's ticket list and round counts, a drifting number removed from
    the live page, and `review.md` restored to chronological order with round eight
    narrated.

- **Tested by:** the review's four demonstrations, replayed. All four fail:

  | Demonstration | What the check says now | Stage |
  |---|---|---|
  | back link `href="index.html"` | *goes nowhere (href="index.html" resolves to this page)* | ticket |
  | `Status` forged in a raw `<script>` block | *2 Status lines — a ticket declares its status once* | gate |
  | four state greys one unit apart | *a loose bolt's gauge (rgb(136, 136, 136)) and a seated one (rgb(136, 136, 137)) are 1 apart* | ticket |
  | criteria unticked as `1. [ ]` | *Done with no "What changed" evidence* (the criteria now count, so the ticket is judged) | gate |

  218 studio tests green; the ticket stage green on a clean tree.

- **Why the status rule is different in kind from the six before it.** `docs-current` was
  defeated by five ways of hiding text and once more by reading the status from raw text.
  Stripping each hiding place in turn never converged — backticks, then `~~~`, then HTML
  comments, then indented fences, then `<script>`. "A ticket declares its status exactly
  once" is indifferent to *how* a second declaration was hidden, which is why it is the
  first fix here that does not invite a seventh round on the same object.

- **The count, current:** 66 mutations across nine sets — 59 at the ticket stage, 7 at the
  gate. The ninth set is the seventh review's nine demonstrations, closed by SS-034.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
