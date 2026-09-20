# Tech debt

## Policy

- Debt is **taken deliberately or not at all.** A shortcut that is worth it gets a row
  below, in the same iteration that takes it. A shortcut nobody is willing to write down
  is not worth taking.
- Every row names the **cost of leaving it** — what gets harder, or what will break.
- Roughly **20% of each iteration** is reserved for debt, refactoring, docs and learning.
  The retro checks that the reservation was actually used.
- A row is closed by a ticket, and the closing ticket ID is recorded.
- Debt is not a wish list. "It would be nicer as X" belongs in the backlog, not here.

## Register

| ID | Opened | Description | Cost of leaving it | Size | Status |
|---|---|---|---|---|---|
| TD-001 | 00 | The realm has no entrance. It is reachable only by typing the URL. | The realm is invisible to anyone who does not already know it exists. | S | Open — **held by decision**, not by capacity: the door waits until there is a gallery worth entering. The twelfth portal slot, the centre of the front wall facing the spawn point, is free and reserved for it. Filling it will mask the middle trophy's prompt until TD-006 is resolved. ADR-0005 |
| TD-002 | 00 | The 3D landing page could only show 9 portals while `ARCADE_GAMES` listed 11, so the last two entries were silently dropped by `if (!positions[index]) return;`. | Two shipped games (Black Hole in One, Maze Warden) had no portal, and nobody noticed. | M | **Closed** in 01 by SS-014: a front-wall row takes the room to 12 slots, and the `portal-capacity` check now counts the list against the table so the same defect cannot recur unreported. ADR-0005 |
| TD-003 | 00 | `tests/guard-localStorage.test.mjs` scans `shared/` and `games/` only, so studio storage keys are checked by the studio's own guard rather than by the repo-wide one. Two guards, one rule. | The rule can drift between the two implementations. | S | Open — accepted for now; see `decisions/ADR-0003-storage-namespace.md` |
| TD-005 | 00 | With site data blocked, `shared/settings.js` throws an uncaught `SecurityError` from `getSavedTheme` on every page that loads it, studio pages included. The studio's own code handles blocked storage correctly; this throw is production's, and `shared/settings.js` is outside the path guard. | A studio page reports an uncaught error in a configuration the studio cannot fix, which weakens "loads with no uncaught errors" as an acceptance criterion. | S | Open — production-side; needs an exception or a production ticket |
| TD-004 | 00 | `npm run smoke` discovers pages under `games/` and `drafts/` only, so `studio/` pages are smoke-tested by the studio's own check instead. | A studio page that throws at load would be caught one stage later than a production page would. | S | Open — accepted; revisit when `studio/` has more than a couple of pages |
| TD-006 | 01 | `updatePlayer()` in `shared/3d/gameplay.js` chooses the interaction prompt by 2D distance and prefers a portal to a trophy unconditionally — `if (closestPortal) … else if (closestTrophy)` — so a nearer trophy loses to a further portal. | Any portal placed within interaction range of the trophy shelf silently replaces every trophy description there. It cost this iteration a ticket to route around, and it blocks the reserved twelfth slot. | S | Open — production-side; needs an exception or a production ticket. Routed around by SS-018 |
