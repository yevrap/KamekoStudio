# Pachinko Bazaar — Promotion Plan

> **Archived — fully shipped.** All six phases below were completed and shipped 2026-07-14 (commit `f5434bb`, live as v22); see the Dev Log entry "Pachinko Bazaar: promoted to the arcade" in `docs/archive/dev-logs/arcade.md`. Moved here from the `Pachinko Bazaar/` folder since it's fully consumed. Overview: [Pachinko Bazaar](../../games/pachinko-bazaar/README.md).

Promote the `pachinko-bazaar` draft to a full game in the Arcade, incorporating the feedback from the "Verdict & Direction" questionnaire.

## Context
**Verdict:** Keep — promote it to the arcade (module split, tests, drawer, e2e per the promotion checklist).

## User Feedback Addressed
- **Aim Assist:** Add a light aim assist (dotted arc to the first bounce).
- **Physics Feel:** Ball bounces are too fast, need to be toned down.
- **Bazaar Additions:** Add more items (e.g. orb types, peg warpers).
- **Audio:** Add sound effects.
- **Juice:** Needs a bigger juice pass (screen shake, combo counter, slow-mo on big drops).
- **Language:** EN-only is fine.
- **Queue:** Queue unchanged (jam flow glider next regardless of this verdict).

## Phased Implementation Plan

### Phase 1 — Move & Split
- [x] Create `games/pachinko-bazaar/index.html` (extracted markup from draft).
- [x] Create `games/pachinko-bazaar/style.css` (extracted CSS from draft).
- [x] Create `games/pachinko-bazaar/constants.js` (constants like `BW`, `BH`, `G`, `REST_PEG`).
- [x] Create `games/pachinko-bazaar/state.js` (state variables: `round`, `quota`, `drops`, `coins`, `pegs`, `orbs`).
- [x] Create `games/pachinko-bazaar/gameplay.js` (pure logic: rules, physics step, scoring math).
- [x] Create `games/pachinko-bazaar/main.js` (DOM bindings, `requestAnimationFrame`, input handling).
- [x] Create `games/pachinko-bazaar/package.json` with `{"type": "module"}` for testing.
- [x] Delete `drafts/pachinko-bazaar/`.

### Phase 2 — Questionnaire Tweaks (Game Logic)
- [x] **Aim Assist:** Add dotted arc predicting the first bounce in `main.js`.
- [x] **Audio:** Add Web Audio API synths for peg hits, bucket land, and coin collect in `main.js`.
- [x] **Juice:** Implement screen shake (canvas translation) on multiplier hits and combo counter text. Add slow-mo effect during big multi-peg collisions.
- [x] **Physics:** Lower physics restitution (`REST_PEG`) slightly in `gameplay.js` / `constants.js` to make bounces less wild.
- [x] **Bazaar Items:** Add 2 new Bazaar items (e.g., Ghost Orb, Peg Upgrader) in `constants.js`.

### Phase 3 — Tests
- [x] Create `tests/pachinko-bazaar.test.mjs` covering pure logic (scoring, quotas, physics collisions, item effects).
- [x] Verify `node --test tests/` is fully green.

### Phase 4 — Shared Infrastructure & Platform Patterns
- [x] Include `<script src="../../shared/settings.js" data-gallery-depth="2"></script>` in `index.html`.
- [x] Implement dark/light mode custom properties.
- [x] Add `touch-action: none` on canvas.
- [x] Persist high score (`localStorage.setItem('lastPlayed_pachinkoBazaar', Date.now())` and `bestScore_pachinkoBazaar`).
- [x] Pause/resume on `settingsOpened` / `settingsClosed` events.
- [x] Add zero-size guard + `requestAnimationFrame` retry in `init()`.

### Phase 5 — Register Everywhere
- [x] **`index.html` (root):** Add Pachinko Bazaar game card to the games grid, add entry in `GAMES_META` array, and score entry in `SCORES_META`.
- [x] **`3d.html`:** Add portal link for Pachinko Bazaar.
- [x] **`drafts/index.html`:** Remove Pachinko Bazaar card.
- [x] **`games/CLAUDE.md` & root `CLAUDE.md`:** Update Games tables, ES Module Refactor Status table, localStorage Keys table.
- [x] **`docs/roadmap.md`:** Promote the draft row in the roadmap to a ✅ Arcade game row.

### Phase 6 — Docs Updates
- [x] Log the promotion in the `Dev Log.md`.
- [x] Move the `Pachinko Bazaar Questionnaire — Verdict & Direction.md` to `docs/archive/`.
