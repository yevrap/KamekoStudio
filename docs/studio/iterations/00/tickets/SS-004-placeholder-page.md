# SS-004 — The realm's placeholder page

- **Status:** Done
- **Size:** M
- **Iteration:** 00
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SS-003
- **Branch:** `ss-004-placeholder`

## Motivation

The realm has to exist as a deployed thing before anything can be built in it, and the
storage and hygiene checks need something real to check.

## Acceptance criteria

- [x] `studio/index.html` loads with no uncaught errors and no console errors, at phone and desktop widths.
- [x] No horizontal scroll at 390px; tap targets at least 44px.
- [x] It follows the arcade's `body.dark-mode` theme rather than declaring its own toggle, and the settings drawer is present.
- [x] Every storage key starts with `studio_`, and each is documented in `studio/README.md` before use.
- [x] `studio/README.md` explains the folder, the rules for code in it, and the storage keys.
- [x] The page is honest: it says there is nothing to play yet.
- [x] No binary assets, no dependencies, no build step.

## Evidence plan

Headless Chrome at 390×844 and 1280×900: console listeners, a `localStorage` key dump, a
computed tap-target height, and a reload to exercise the visit counter. Plus
`npm run smoke` to confirm nothing else broke.

## Out of scope

The visual identity. This is tokens and layout so that the identity decision is not made by
default.

---

## Result

- **What changed:** `studio/index.html`, `studio/style.css`, `studio/main.js`,
  `studio/README.md`; `tests/studio/placeholder-page.test.mjs`.
- **Tested by:** headless Chrome at both widths — no page errors, no console errors,
  `pill` height 44px, no horizontal scroll, drawer injected, theme class applied, only
  `studio_firstVisit` and `studio_visitCount` written; counter correct across reloads.
  Four unit tests on the visit sentence. `npm run smoke` green.
- **Deferred:** the real gallery, pending the identity decision.
- **Fix rounds used:** 1 / 2 — see SS-003; the storage wrappers were rewritten so the
  prefix is a literal at the call site.
