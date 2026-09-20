# Iteration 01 — give the realm its identity, and fix the portal limit

**Goal:** replace the placeholder with the realm's decided visual identity and a shelf that
generates itself from data, and restore the two production games that the 3D landing page
has been silently dropping.

## Committed tickets

| ID | Title | Size | Role lead |
|---|---|---|---|
| SS-012 | The Backstage identity tokens | M | UX / Art Direction |
| SS-013 | The realm's home page: pulse, shelf, back-out chrome | M | Front-end Dev |
| SS-014 | Restore the two missing portals on the 3D landing page | M | Tech Lead |

Three tickets, at the top of the standing cap of 2–3. The cap applies from this iteration
onward, as iteration 00's plan recorded.

| ID | Title | Size | Role lead |
|---|---|---|---|
| SS-015 | This iteration record | S | Scrum Master |

SS-015 is the iteration's own paperwork — plan, log, review, retro — carried as a ticket so
that the commit naming them has an ID to name, exactly as SS-009 was in iteration 00. It is
process overhead rather than committed work, which is why the cap is read as three.
Recorded here rather than quietly exceeded.

## Decisions this iteration builds on

Two product questions were open at the end of iteration 00 and are now answered. Both were
answered by the executive on 2026-09-20, in neutral summary:

| Question | Answer | What depends on it |
|---|---|---|
| The realm's visual identity, three directions | **Backstage** — the workshop behind the arcade: warm ground, paper and worklight, one amber accent, physical status tags | SS-012, SS-013 |
| Whether to fix the 3D landing page's nine-portal limit, a production change | **Approved**, as a production bug fix on its own merits | SS-014 |
| Whether the realm gets its own portal | **Not yet** — held until there is a gallery worth entering | Out of scope; TD-001 stays open |

The third row is the reason SS-014 changes `shared/3d/gameplay.js` and **not**
`shared/3d/constants.js`. Edit 1 of the two proposed in `../00/findings-3d.md` is approved;
edit 2 is not, and is not made.

## Reserved capacity

SS-014 is the debt share: it closes **TD-002**, and the regression check it adds is the
learning share — the defect it fixes existed because nothing reported it, so the fix is
incomplete without something that would.

## The base ref

`studio-iteration-00` exists, so the checks default to it and `--base` is unnecessary.

## Risks

| Risk | Response |
|---|---|
| SS-014 edits a production file that runs on every visit to the landing page | Narrow, content-checked path exception; made last, in its own commit; verified by a check that counts capacity against the game list, and by `production-live` after deploy |
| `shared/3d/` has no unit tests and the smoke suite only asserts the page loads, so a portal in the wrong place would pass every existing check | Add `portal-capacity` to the studio's own checks, and state plainly on the ticket what it does and does not prove — geometry is verified by reading the diff against the room dimensions, not by a test |
| The shelf is built with nothing to put on it: the realm has no games yet | Build the component and the data file, and ship an honest empty state. No invented entries |
| The pulse line names an iteration, so it can go stale the moment an iteration ships | A unit test ties the pulse data to the newest iteration in the changelog |

## Out of scope

- **The realm's own portal.** Held by decision, not by capacity. TD-001 stays open.
- **`shared/3d/constants.js`.** No game-list entry is added; the front-wall centre slot is
  left empty for it.
- **Any game.** The shelf is the frame, not its contents.
- **TD-003, TD-004, TD-005.** Unchanged; all three are recorded and none blocks this work.
