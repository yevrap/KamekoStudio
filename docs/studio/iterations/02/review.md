# Iteration 02 — review

## What shipped

| # | Item | Where |
|---|---|---|
| SS-020 | `studio-boot` — every page under `studio/**` opened in a real browser, three ways | `tests/studio/checks/boot.mjs`, `lib/boot-contract.mjs`, `lib/browser.mjs` |
| SS-022 | *Overtighten* — the shelf's first experiment | `studio/games/overtighten/` |
| SS-023 | The shelf's first entry and this record | `studio/shelf-data.js`, `docs/studio/iterations/02/` |
| SS-024 | The boot check's exemption anchored, its blind spots closed | opened by review |
| SS-025 | Overtighten's input, focus and live region | opened by review |
| SS-026 | The design hypothesis recorded as false | opened by review |

Live: <https://yevrap.github.io/KamekoStudio/studio/> · <https://yevrap.github.io/KamekoStudio/studio/games/overtighten/>

## The reviews

QA and the Independent Reviewer ran with fresh context and **rejected the diff**. They
worked separately and found the same two primary defects independently, which is the
strongest signal either of them produced.

### The exemption was untested and defeatable

`studio-boot` exempts one thing: production's `shared/settings.js`, which throws an uncaught
`SecurityError` when site data is blocked (TD-005) and is outside the path guard. The
exemption matched any path *ending* in `shared/settings.js`. `studio/**` is inside the guard,
so `studio/games/x/shared/settings.js` is a file the studio creates at will — and both
reviewers created it, threw uncaught from it, and watched the check print `pass`.

`firstFrame` also did not return the first frame: it matched the parenthesised form against
the whole stack before the bare form, so a named production frame beat an anonymous studio
frame above it.

None of the five classifiers had a test, while SS-020's Result claimed they were
"unit-tested both ways". **That sentence was false when it was written.** Iteration 01's
retro said: *do not write "closed" before the thing that closes it has been attacked.* One
iteration later, the same mistake, on the same kind of object.

Closed by SS-024: anchored to origin and exact path, failing closed, with ten tests built
from the bypasses the reviews demonstrated.

### The design hypothesis is false

Recorded in full in SS-026. In short: the test defending it could not fail, and the thing it
was defending is not true. 142 of the 146 orderings across the three plates clear with a
single hold per bolt; blind round-robin clears every plate in at most four passes. There is
no ordering to discover.

### Three blind spots in the check, each found by mutating `studio/**`

- Deleting the pointer release listeners makes **every tap run a bolt to its strip point and
  destroy the plate.** The whole ticket stage passed. The check sampled the readouts
  immediately after `mouse.up`, which cannot tell a bolt that stops from one that never does.
- `opacity: 0` over the plate — every bolt, every readout, the status line — passed. An
  invisible control was *excluded* from the 44px rule rather than failing it, so hiding a
  target was an escape from the rule instead of a violation of it.
- The driven game phase ran with **no error listener at all**, so "no console errors" was a
  claim about the page load and nothing else.
- Stubbing `write()` to a no-op — nothing persists, every session restarts at plate one —
  passed.

All closed by SS-024, each demonstrated failing afterwards.

### Seven input and focus defects

Closed by SS-025. The two that mattered most to a player: after any pointer use the keyboard
stopped working entirely (`preventDefault` suppressed focus and nothing restored it), and
choosing a plate from the picker scrolled every bolt off the top of a phone screen — at
320×568 there was nothing playable visible at all.

### What the reviews credited

The pure/driver split is real rather than cosmetic. The unit tests are adversarial where it
counts: inclusive band boundaries tested *at* the boundary, stripping outranking solving,
`"1e999"` granting nothing rather than unlocking everything. `judgeKilledTreatment`
asserting a *difference* is the right shape — and QA then defeated it with a card that was
visually identical and numerically different, so it now asserts the named treatment too.

## Keep / Iterate / Kill

> Yev: strike through what you disagree with and write your own verdict. These are the
> team's, and the team is not the judge of them.

- **`studio-boot` — Keep.** It closed TD-004 and then earned its place twice over: it is the
  only reason three of the defects above were found at all, and the reviews' attacks on it
  made it considerably stronger than the version that shipped.
- **Overtighten — Iterate, not Keep.** It is a well-built, pleasant, tactile thing, and it is
  not the game it was designed to be. The experiment succeeded: it returned a clear "no" on a
  specific question, with a measurement. What it needs is a mechanic change, not tuning.
- **The hypothesis-as-a-check practice — Keep, and fix how it is written.** Stating a design
  hypothesis as a test was right. Writing one that could not fail was the error, and the
  retro carries the rule that came out of it.

## The open decision this leaves

Overtighten needs an irreversible state to become a puzzle, and each candidate is a
different game. This is a product question with materially different outcomes, so by the
Definition of Ready it goes to the executive rather than into a ticket. Q7 in the studio
questionnaire, with the three candidates and what each costs.
