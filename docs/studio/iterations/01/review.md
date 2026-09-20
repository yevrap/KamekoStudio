# Iteration 01 — review

## Demo

| What | Where |
|---|---|
| The realm's home page, in the Backstage identity | <https://yevrap.github.io/KamekoStudio/studio/> |
| Every game reachable from the 3D landing page | <https://yevrap.github.io/KamekoStudio/3d.html> — turn around at the spawn point |

### The realm's identity and shelf — SS-012, SS-013

Warm paper ground by day, graphite at night; one amber worklight for status, one teal for
anything interactive; a monospace for tags, dates and iteration numbers. The page leads
with a pulse line naming the current iteration, then the shelf, then what the team changed
about itself, then a link to the handbook. The way back to the arcade is the first thing in
the document and never scrolls away.

The shelf is empty and says so. The realm has no games; the component, its data file and
every state it can reach are built and tested, and nothing was invented to fill it.

**Keep / Iterate / Kill:** ______

### Every game has a portal again — SS-014

The 3D landing page built nine portal positions for an eleven-game list and dropped the
rest silently. A front-wall row takes the room to twelve slots. Black Hole in One and Maze
Warden have doors for the first time since they were promoted; walking up to each one shows
its own prompt. The twelfth slot, the centre of the front wall facing the spawn point, is
left empty for the realm's own door.

**Keep / Iterate / Kill:** ______

## The independent review

Two agents with fresh context read the iteration's diff, and the Independent Reviewer read
it twice. It **rejected the diff on both passes**, and every blocker was reproduced against
the live code before anything was changed. Thirteen tickets' worth of findings across the
two passes and the QA run; five tickets were opened to answer them (SS-016 to SS-019, and
SS-020 carried to iteration 02).

### First pass — rejected

- The path exception guarding `shared/3d/gameplay.js` accepted arbitrary executable
  JavaScript placed inside the approved block. The block was matched as "a `Vector3` call
  whose arguments contain no parentheses" — and a tagged template calls without one, an
  assignment expression assigns without one. Four payloads went through end to end with the
  guard printing *exception used*, into a file that runs on every visit to the landing page.
  Worse than the hole: `guardrails.md`, ADR-0005 and SS-014 all recorded it as already
  closed, and the adversarial test offered as proof was caught by a parenthesis rather than
  by the block's shape. Closed in SS-016, as a whitelist.
- `hygiene` failed at the gate on a regex this iteration added, whose literal text matches
  the note-vault wikilink pattern. It went unnoticed because all three build tickets
  recorded only `--stage=ticket` evidence, and `hygiene` runs at the gate.

Eight further findings, all answered: an untested reader behind the first fix, a wrong
clearance figure frozen into a production comment, fifty lines of dead CSS, a page with no
`h1`, two overstated test counts, an unguarded free-text line, and a capacity rule that
compared table names as a set rather than a sequence.

### Second pass — rejected again, on the fix

SS-016 replaced "no parentheses" with the character class `[-+*/\s\w.]+`. A character class
cannot express a token grammar, because every keyword is made of word characters. Twelve
payloads went through it — `delete engineState.walls`, `new fetch`, `typeof window`,
`obj.prop++` — and deleting `engineState.walls` blanks the production landing page while
the guard prints *exception used*. Exfiltration was no longer reachable, so the ceiling had
dropped from data theft to denial of service, but the boundary still fell.

The sharper finding was about the tests, not the rule: every regression test written for the
whitelist was a payload against the **old** rule, so the suite specified the previous hole
and attacked nothing in force. The page shipped in this same diff says *"An adversarial test
has to fail against the rule it is attacking."* SS-019 rewrote the rule as a grammar —
operands joined by operators, two adjacent operands forbidden — and wrote its tests against
it, running each payload against the live rule first to watch it pass.

### The QA pass

Sixteen test areas, run rather than reasoned about. Five majors. The one that mattered:
**SS-014 broke the trophy shelf.** The landing page picks its prompt by 2D distance and
prefers a portal to a trophy at any range, so the new row — sitting directly above the
shelf — replaced 4 of 5 trophy descriptions with *"Press E to enter Black Hole in One"*.
A production feature, changed silently, by a ticket that had put the trophy shelf out of
scope. Fixed in SS-018 by moving the row to flank the shelf rather than crown it; the
priority itself is production logic and is now TD-006.

QA also fooled `portal-capacity` five ways into reporting a full room, found every shelf
card's link would be a 20px target the moment an entry existed, and demonstrated eight
mutations to `index.html` and `style.css` that the entire suite survives. That last one is
the honest shape of TD-004 and is carried to iteration 02.

A process note from QA that the retro took: three of SS-013's ticked criteria — 44px
targets, no horizontal overflow, no uncaught errors — were each verified against the
**empty** shelf, the one configuration in which they cannot fail.

One finding was **partly overturned on the evidence.** The reviewer said the front portals
intersected the trophies at the proposed position. Recomputed from the measured bounding
boxes, the two *built* portals were clear, by 0.01 in z — but the *reserved* twelfth slot
overlapped the tallest trophy in all three axes. The ticket's original wording was wrong in
detail and so was the correction; the production comment now states both.

One finding was **declined with a reason**: up to twelve leading comment lines inside the
approved block may change without failing the guard. A comment cannot execute, and
`hygiene` scans that file because it is an exception path. Recorded in `guardrails.md` as a
bounded accepted residual, not as a closed hole.

## Checks

Recorded at the gate. A check that did not run is named, never omitted.

*Filled in from the run, not before it. The first draft of this table recorded
`reviewer-verdict | pass` while the check was failing for want of the verdict line below
it, and `525 unit` when the suite had grown to 548 — the same anticipation the retro
commits to stopping, in the document that records the commitment.*

| Check | Result |
|---|---|
| `tree-clean` · `on-main` · `no-stop-file` · `baseline-suites` | pass (preflight) |
| `path-guard` | pass — one exception used, `shared/3d/gameplay.js` |
| `storage-keys` · `portal-capacity` · `studio-tests` | pass — 11 games, 12 slots; 82 studio tests |
| `hygiene` | pass |
| `full-suites` | pass — 548 unit, smoke, 23 e2e |
| `commit-lint` · `docs-current` | pass — 10 commits, 8 tickets |
| `reviewer-verdict` | pass, once the verdict below existed. It failed through all three passes, which is what it is for |
| `studio-live` · `production-live` · `production-unchanged` | recorded in the handoff after the deploy |
| `iteration-docs` · `doc-cleanliness` · `changelog` | recorded at close-out |

### Third pass — approved

The grammar held. Roughly thirty payloads, including all ten round-2 bypasses and thirteen
new constructions — optional chaining, indexing, the comma operator, hex and exponent
literals, `await`, `yield`, `in`, `instanceof`, a unicode-escape identifier — and none got
through. Relocation, a fourth element and a thirteenth comment line are all rejected, and a
ReDoS probe on the ambiguous `-` stayed flat at 1–2 ms across 30 consecutive signs.

Seven payloads are accepted and were judged acceptable by both sides: expressions over
numbers and property paths whose only effect is the coordinate they produce. One correction
to this repository's earlier wording — `this.x` is not inert, it *throws*, because
`gameplay.js` is a module and `this` is `undefined` inside `createEnvironment()`. It is the
same class as a mistyped identifier, and that class is irreducible without scope analysis:
you cannot tell `roomWidth` from a typo, and both are visible in a three-line diff.

Three findings closed in SS-021 and SS-015:

- `SS-015` ticked *"review.md records the Independent Reviewer's verdict line"* while no
  verdict existed — reported without being checked, one layer up from the gap that caused
  the first rejection. Worth recording why it survived: `docs-current` counts *unticked*
  boxes on Done tickets, so a false tick passes and an honest blank fails. Two checks in the
  same gate disagreed about one sentence, and the document-level one was wrong.
- The guard's rotation requirement grepped the whole file for
  `...frontPositions.map(() => Math.PI)`, and that string in a comment *inside the approved
  block* satisfied it — the comment is reverted away, so the real rotation entry could be
  deleted and the row accepted, leaving twelve positions against nine rotations.
  `portal-capacity` caught it, which is exactly what the claim next to the code denied.
- `safeUrl` let through `//evil.example/x` and `java\nscript:alert(1)` — a browser strips
  whitespace inside a scheme when it resolves an href.

## Not done

- **TD-001, the realm's entrance.** Held by decision, not by capacity. The slot is reserved.
- **TD-003.** Untouched and unchanged on the register.
- **TD-004**, restated with eight named mutations the whole suite survives. Declined for
  this iteration and agreed by the reviewer: closing it now means taking a **second**
  production exception, under time pressure, in the iteration whose entire history is the
  cost of getting an exception wrong. Iteration 02 adds a studio-owned boot check (SS-020).
- **TD-005**, restated with its consequence measured, and **TD-006**, opened against the
  real cause of the trophy masking.

## Verdict

Recorded from the Independent Reviewer's third pass, on `a06b0b1`:

**Verdict:** APPROVED
