# SS-011 — Scope the storage claim to studio code

- **Status:** Done
- **Size:** M
- **Iteration:** 00
- **Role lead:** Data & Systems Dev
- **Depends on:** SS-004
- **Branch:** `ss-011-storage-claim`

## Motivation

The independent review found that five places, including copy shown to the public on the
placeholder page, claimed the realm "never reads or writes a key without the `studio_`
prefix". Studio pages load `shared/settings.js` for the light/dark toggle, and that script
reads and writes `theme` and `devMode` and provides "Clear All Game Data". The behaviour is
correct and was chosen deliberately in SS-004. The claim was the defect — and it was a
claim the `storage-keys` check could never have supported, since it scans `studio/**` only.

## Acceptance criteria

- [x] The public page's copy is accurate about what the realm's own code does and what it inherits.
- [x] `studio/README.md`, `guardrails.md` and ADR-0003 are scoped to studio code, in place, with no stacked correction.
- [x] ADR-0003 carries an explicit decision point on the scope, so a later document cannot quietly widen it back.
- [x] `self-checks.md` describes what `storage-keys` actually proves.
- [x] The inherited `SecurityError` under blocked site data is on the debt register.
- [x] Standalone footer links meet the 44px target the SS-004 criterion asked for.
- [x] A corrupted `studio_visitCount` cannot render a nonsense sentence, with a test for each observed input.

## Evidence plan

Grep for the absolute phrasing across `docs/studio/` and `studio/`. Re-measure every link
and button in headless Chrome at both widths. Seed corrupted values and reload.

## Out of scope

Giving the studio its own clear-data control, or adding the `studio_` prefix to the
production drawer's list — both need `shared/settings.js`, which is outside the guard.

---

## Result

- **What changed:** `studio/index.html`, `studio/README.md`, `studio/style.css`,
  `studio/main.js`, `docs/studio/guardrails.md`,
  `docs/studio/decisions/ADR-0003-storage-namespace.md`, `docs/studio/tech-debt.md` (TD-005),
  `tests/studio/placeholder-page.test.mjs`.
- **Tested by:** grep confirms all three surviving statements are scoped to studio code.
  Headless Chrome at 390×844 and 1280×900: no element under 44px outside the closed
  production drawer, no horizontal scroll, no console errors. Seeded values — `"3.7"` now
  renders "Visit number 4", `"1e999"` renders "First time here"; eight coercion cases unit
  tested. `npm run smoke` green.
- **Deferred:** TD-005, and the studio's own clear-data control — both production-side.
- **Fix rounds used:** 0 / 2
