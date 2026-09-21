# SS-023 — The shelf shows the first experiment, and the iteration is on the record

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** Technical Writer
- **Depends on:** SS-022
- **Branch:** `ss-023-shelf-entry-and-record`

## Motivation

The realm's home page builds itself from `shelf-data.js`, and the empty state is currently
accurate. Once *Overtighten* exists it stops being accurate. The iteration's own paperwork
— log, review, retro, changelog, learning log — is carried on this ticket so the commits
that write it name an ID.

## Acceptance criteria

- [x] `SHELF` has one entry for *Overtighten*, status `PROTOTYPE`, with a blurb, the
      iteration it arrived in, the date it last changed, and a working relative url.
- [x] The empty-state copy is no longer rendered, and the test that covers the empty state
      still covers it — the state is gone from the page, not from the component.
- [x] `PULSE` and `LEARNED` name iteration 02, and the tests that tie both to the newest
      iteration folder still pass.
- [x] `studio/README.md` describes the new folder and its two storage keys.
- [x] `docs/studio/iterations/02/` holds `plan.md`, `tickets/`, `log.md`, `review.md` and
      `retro.md`; `CHANGELOG.md`, `tech-debt.md` and `learning-log.md` are current.
- [x] `review.md` records the Independent Reviewer's `**Verdict:**` line and a Keep /
      Iterate / Kill line per shipped item.

## Evidence plan

| Criterion | Proof |
|---|---|
| The entry renders, and links | `studio-boot`: the card is present on the realm home and its link resolves to a page that boots |
| Pulse and retro line are current | The existing `pulse-current.test.mjs` |
| The record is complete | `docs-current`, `iteration-docs`, `changelog`, `reviewer-verdict`, `doc-cleanliness` |

## Out of scope

- **Any change to `shelf.js`.** Adding an entry is a data change; if it needs a component
  change, that is a finding, not this ticket.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
