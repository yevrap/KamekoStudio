# ADR-0003 — Studio storage is namespaced `studio_` and guarded separately

- **Status:** Accepted
- **Date:** 2026-09-19
- **Iteration:** 00

## Context

`studio/` is served from the same origin as the production arcade, so the two share one
`localStorage`. Production keys are unprefixed and varied (`theme`, `devMode`,
`riverRunHighScore`, `durak_*`, `blackHoleInOne_*`, …). The production
"Clear All Game Data" control clears a hand-maintained list of those keys and prefixes,
which lives in `shared/settings.js` — outside the path guard.

There is already a repo-wide guard test, `tests/guard-localStorage.test.mjs`, but it scans
`shared/` and `games/` only.

## Decision

1. Every key written by code under `studio/` begins with `studio_`.
2. Studio code never reads or writes a key without that prefix, and never calls
   `localStorage.clear()`, which empties the whole origin.
3. The rule is enforced by the studio's own check (`storage-keys`), which scans
   `studio/**` — not by extending the repo-wide guard test.
4. Studio keys are deliberately **not** added to the production "Clear All Game Data"
   list, because that would require editing `shared/settings.js`.
5. The rule is scoped to **studio code**, not to everything a studio page loads. Studio
   pages inherit `shared/settings.js` for the light/dark toggle, and that production script
   owns `theme` and `devMode` and provides the clear-data control.

## Consequences

- Nothing the *studio* writes can corrupt a production save: its keys occupy a namespace
  nothing else uses, and it cannot clear the origin.
- It does not follow that a studio page is inert with respect to production storage. It
  inherits the arcade's settings drawer, so `theme` and `devMode` are read and written on
  its behalf, and a visitor can clear the arcade's saves from it. That is the price of
  inheriting the theme rather than re-declaring it; the trade was made knowingly in SS-004,
  and point 5 exists so that no document can claim otherwise.
- Clearing all game data in production leaves studio data behind. For an experimental
  realm this is acceptable, and arguably correct; when the studio has data worth clearing
  it will need its own control, or a one-line exception adding the `studio_` prefix to
  `prefixesToRemove`.
- The same rule is now implemented in two places (TD-003), so the two can drift. Accepted:
  the alternative is touching production files from the studio's iterations.

## Alternatives considered

| Option | Why not |
|---|---|
| Extend `tests/guard-localStorage.test.mjs` | It is a production test file; changing it puts studio logic in production's guard and widens the path guard on day one. |
| Use `sessionStorage` or IndexedDB instead | Neither removes the shared origin; it just moves the collision to a different store. |
| No prefix, unique names per feature | "Unique enough" is how collisions happen. A prefix is checkable by a script. |
