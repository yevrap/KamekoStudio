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
| TD-001 | 00 | The realm has no entrance. It is reachable only by typing the URL, because the 3D landing page's portal list is outside the path guard and the change is not yet approved. | The realm is invisible to anyone who does not already know it exists. | S | Open — waiting on approval of `iterations/00/findings-3d.md` |
| TD-002 | 00 | The 3D landing page can only show 9 portals. `ARCADE_GAMES` in `shared/3d/constants.js` lists 11 games, and `createEnvironment()` in `shared/3d/gameplay.js` has 9 hard-coded positions, so the last two entries are silently dropped by `if (!positions[index]) return;`. A studio portal would be the 12th. | Two shipped games (Black Hole in One, Maze Warden) already have no portal, and nobody noticed. Adding a studio portal without fixing this does nothing. | M | Open — production-side; needs an exception or a production ticket |
| TD-003 | 00 | `tests/guard-localStorage.test.mjs` scans `shared/` and `games/` only, so studio storage keys are checked by the studio's own guard rather than by the repo-wide one. Two guards, one rule. | The rule can drift between the two implementations. | S | Open — accepted for now; see `decisions/ADR-0003-storage-namespace.md` |
| TD-004 | 00 | `npm run smoke` discovers pages under `games/` and `drafts/` only, so `studio/` pages are smoke-tested by the studio's own check instead. | A studio page that throws at load would be caught one stage later than a production page would. | S | Open — accepted; revisit when `studio/` has more than a couple of pages |
