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

Two agents with fresh context read the iteration's diff. The Independent Reviewer
**rejected** it, on two counts that were both reproduced before anything was changed:

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

| Check | Result |
|---|---|
| `tree-clean` · `on-main` · `no-stop-file` · `baseline-suites` | pass (preflight) |
| `path-guard` | pass — one exception used, `shared/3d/gameplay.js` |
| `storage-keys` | pass |
| `portal-capacity` | pass — 11 games, 12 slots |
| `studio-tests` | pass |
| `hygiene` | pass |
| `full-suites` | pass — 525 unit, smoke, 23 e2e |
| `commit-lint` · `docs-current` · `reviewer-verdict` | pass |
| `studio-live` · `production-live` · `production-unchanged` | run after the deploy; recorded in the changelog and the handoff |
| `iteration-docs` · `doc-cleanliness` · `changelog` | run at close-out, after this document exists |

## Not done

- **TD-001, the realm's entrance.** Held by decision, not by capacity. The slot is reserved.
- **TD-003, TD-004, TD-005.** Untouched and unchanged on the register.
