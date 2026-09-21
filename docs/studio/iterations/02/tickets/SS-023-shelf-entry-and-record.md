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

- **What changed:** `studio/shelf-data.js` — `PULSE` advanced to iteration 02 when the plan
  landed, `LEARNED` now quotes this iteration's retro, and `SHELF` carries its first entry:
  Overtighten, PROTOTYPE, linking to `games/overtighten/`. `studio/README.md` describes the
  new folder and its two storage keys. `docs/studio/CHANGELOG.md`, `tech-debt.md`,
  `learning-log.md`, and `iterations/02/{log,review,retro}.md`.

- **Tested by:** `pulse-current.test.mjs`, which caught two of these before a human did —
  the pulse line went stale the moment the iteration folder was created, and `LEARNED` was
  advanced to 02 before the retro existed. `--stage=closeout` 3/3. After SS-027 the shelf
  entry is also asserted by `studio-boot`: the realm's own shelf must offer at least one
  card and every card's link must be a page the check booted, so emptying `SHELF` or
  dropping the url now fails.

- **The blurb says what the game is, not what it was meant to be**, because a shelf
  advertising an ordering puzzle and linking to something that is not one would be the
  realm lying in its own window.

- **This section was empty when the ticket was first marked Done**, with all six criteria
  ticked, and `docs-current` reported the iteration complete — its evidence match used
  `\s*(.*)`, and `\s` matches a newline, so each label was "answered" by the label below
  it. Found by the second review; the check is fixed in SS-027 and now refuses this file.
  Two of the ticked criteria were also false at the time: the card's link was asserted by
  nothing, and the reviewer's verdict line did not exist. Both are true now.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
