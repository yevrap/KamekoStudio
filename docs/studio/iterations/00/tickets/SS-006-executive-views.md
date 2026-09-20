# SS-006 — The executive-facing views

- **Status:** Done
- **Size:** M
- **Iteration:** 00
- **Role lead:** Technical Writer
- **Depends on:** SS-001
- **Branch:** none — these files live outside the repository

## Motivation

The repository holds the company's record; the executive needs a short read that says where
things are and where to steer. Those are different documents with different audiences, and
keeping them in one place would ruin both.

## Acceptance criteria

- [x] An index that links to the repo documents rather than restating them.
- [x] A board, a scorecard, a feedback inbox, an input ledger and a handoff.
- [x] A review-digest template and a questionnaire template.
- [x] Every view states that the repository wins if the two disagree.
- [x] The scorecard's first row is filled from what this iteration actually did.
- [x] The input ledger records every input this iteration received, and what each became.
- [x] No private content crosses into the repository, and no repository content is duplicated into the views.

## Evidence plan

The `hygiene` check over the repo confirms nothing private crossed. A read of each view
confirms it links rather than copies.

## Out of scope

Automating the regeneration. The `studio-iteration` skill does it as a documented step.

---

## Result

- **What changed:** nine notes in the vault's Shadow Studio folder — index, board,
  scorecard, feedback inbox, input ledger, handoff, design brief, two templates — plus
  edits folding this iteration's answered questions into the design note and trimming the
  questionnaire to what is still open.
- **Tested by:** `hygiene` green over 45 repo files; `doc-cleanliness` run over the vault
  folder as well as the repo, via `--docs-root`.
- **Deferred:** nothing.
- **Fix rounds used:** 0 / 2
