# ADR-0005 — `shared/3d/gameplay.js` gets one recorded exception for the front-wall portal row

- **Status:** Accepted
- **Date:** 2026-09-20
- **Iteration:** 01

## Context

The 3D landing page generates one portal per entry in `ARCADE_GAMES`, positioned from a
table built inside `createEnvironment()`. The table holds nine positions. The list holds
eleven games. The loop that pairs them opens with:

```js
ARCADE_GAMES.forEach((game, index) => {
    if (!positions[index]) return;
```

That `return` is silent, so the tenth and eleventh games — Black Hole in One and Maze
Warden, both promoted production games — have had no portal on the landing page since they
were promoted, and nothing reported it. Recorded as TD-002 and surveyed in
`../iterations/00/findings-3d.md`.

Both files involved are production files, outside the studio's path guard. The studio
therefore surveyed the defect in iteration 00 and proposed the fix rather than making it.

## Decision

`shared/3d/gameplay.js` is a **recorded exception**, narrowed to one change: a
`frontPositions` table of three positions on the front wall, spread into `positions` and
given a matching rotation. This takes the room from nine portal slots to twelve, which
restores the two missing games and leaves one slot free.

The exception is enforced by content, not by trust. `allowOnlyFrontPortalRow` in
`../../../tests/studio/lib/rules.mjs` removes exactly that change from the file's current
text and requires the result to equal the file at the base revision byte for byte. Any
other edit anywhere in the file breaks the equality and fails the guard.

The removal pattern is a whitelist, and it is a whitelist because a blacklist failed. An
earlier version described a permitted element as a `Vector3` call whose arguments contain
no parentheses; an independent review then wrote four payloads that need none — a tagged
template, an assignment expression, a fourth array element, and a multi-line argument list —
each of which the guard accepted while reporting the exception as *used*. An element is now
exactly three arguments drawn from numbers, identifiers, property paths and arithmetic, and
the row is exactly three elements. See `guardrails.md` for what the exception still permits.

`shared/3d/constants.js` is **not** covered. Adding the studio's own entry to
`ARCADE_GAMES` was proposed alongside this change and deliberately held: an empty room
behind a door is worse than no door. The twelfth slot — the centre of the front wall,
facing the player's spawn point — is left empty for it. TD-001 stays open.

## Consequences

- Two shipped games have a door again. The landing page shows eleven portals.
- The `portal-capacity` check now counts the game list against the position table on every
  ticket and at the gate, so the same defect cannot recur unreported. Its failure message
  names the shortfall and how many games would be dropped.
- The exception is single-purpose and will not stretch. A further change to this file needs
  its own approval and its own decision record.
- The studio now edits a production file, which iteration 00 did not. The safety net is
  unchanged: the full production suites run before the merge, and `production-unchanged`
  checks the deployed tree against the previous tag afterwards — reporting this exception as
  used rather than passing over it.

## Alternatives considered

- **Widen the path guard to `shared/3d/`.** Rejected: the guard's value is that it is
  narrow, and nothing about this change needs standing access to the rest of the directory.
- **Leave it, keep TD-002 open.** Rejected once the fix was approved: it is a production
  defect that hides two finished games, and it costs one table to fix.
- **Add the studio's portal at the same time.** Held by decision. It is a separate change
  with a separate justification, and it would have made a bug fix carry a feature.
