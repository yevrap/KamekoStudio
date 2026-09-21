# SS-028 — The record says what is true, including about itself

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** Technical Writer
- **Depends on:** SS-027
- **Branch:** `ss-028-the-record`

## Motivation

Opened by the second independent review. Four record defects, three of them in tickets
written by the pass that was supposed to have fixed overstated claims: a ticket marked Done
with an entirely empty Result, three wrong counts, and a paragraph in `studio/README.md`
still asserting the design hypothesis as fact fifteen lines above the paragraph calling it
false.

## Acceptance criteria

- [x] SS-023's Result records what changed and what tested it, and says plainly that it was
      empty when the ticket was first marked Done.
- [x] SS-024's "up from 21" corrected to 17, verified against the commit; its "was 623"
      corrected to a 619 baseline with the reasoning shown.
- [x] SS-020's projection of "191 at the end of the iteration" removed rather than corrected
      — a count written in advance is a claim about the future.
- [x] `studio/README.md` no longer asserts that a plate is an ordering puzzle.
- [x] No remaining mention of the hypothesis anywhere states it as fact.

## Evidence plan

`--stage=gate` for `docs-current`; `grep` for the hypothesis across the studio's files.

## Out of scope

- The check that let the empty Result through — that is SS-027.

---

## Result

- **What changed:** `docs/studio/iterations/02/tickets/SS-023…md` (Result written, and the
  emptiness recorded), `SS-024…md` (17, not 21; a 619 baseline, not 623), `SS-020…md` (the
  projected count removed), `studio/README.md` (the lead paragraph describes the mechanic
  and then says what testing it returned).

- **Tested by:** `docs-current`, which now refuses SS-023 as it stood — the same check that
  passed it before SS-027 fixed the evidence match. `grep -n "ordering puzzle"` across
  `studio/**` returns three hits, each of them naming the hypothesis as falsified.

- **The pattern worth recording:** all three wrong numbers were in Result sections, and two
  were in the ticket whose whole subject was a claim written before it was checked. A number
  in a Result is evidence and gets the same treatment as a test: read it off the thing, at
  the time, or do not write it.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
