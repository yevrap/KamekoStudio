# Kameko Studio — Roadmap

Engineering director: Yevster  
Last updated: 2026-07-07

AI agents read this file to pick the next work item. Items marked ✅ are complete. Items marked 🚧 are in progress. All other items are open.

Priorities: P0 (foundation/blockers) → P1 (high-impact polish) → P2 (medium features) → P3 (new games) → Backlog (tech debt).

---

## P0 — Foundation

Pre-conditions that should be cleared before adding features.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p0-01 | Add durak-alchemist to CLAUDE.md and GEMINI.md game tables | S | ✅ | Already done — durak-alchemist has been in the Games table in both files since commit `0eb7f36`, the same commit that created this roadmap and listed the item as open. Found stale during the 2026-07-07 roadmap audit. |
| p0-02 | Delete orphaned game.js monoliths | S | ✅ | Deleted 2026-07-07 in `d42587c`. Verified zero references before removal; also fixed a stale doc pointer in games/CLAUDE.md. |
| p0-03 | Add durak-alchemist unit tests | M | ✅ | Shipped 2026-07-07 in `93be05d`. 28 tests covering gridLogic.js (spawnCard, getEmptyCells, spawnRandomBaseCard, slideGrid, isGameOver) and combatLogic.js (canBeat, canTransfer, getExposedRanks). Also added games/durak-alchemist/package.json (type:module) so Node's test runner can import the game's ES modules, matching games/durak/'s existing pattern. |
| p0-04 | Remove Tailwind CDN from blob-zapper, hidden-object, waterfall | M | ✅ | Shipped 2026-07-07 in `f9955d6`. blob-zapper had zero Tailwind classes (script tag only); waterfall had one heading; hidden-object was fully ported to plain CSS (responsive breakpoints, colors, modals). Caught and fixed a self-introduced cascade-order bug (`.hidden` losing to `.modal-overlay`'s `display:flex`) via in-browser testing before committing. |
| p0-05 | Fix waterfall missing lastPlayed_ write | S | ✅ | waterfall/index.html spends a token on start but never writes `lastPlayed_waterfall` to localStorage — dashboard can't track when it was last played. |

---

## P1 — High-Impact Polish

Biggest visible improvements to the player experience.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p1-01 | Durak: card animations | M | ✅ | Already implemented — `ui.js` runs a generic FLIP animation on every `renderAll()`, covering plays sliding to the field, pickups fanning into hand on take, and round resolution sweeping to discard. Shipped in `b663dfa`; discovered already-done during 2026-07-07 /ship triage. |
| p1-02 | Token economy: earn tokens by playing | M | open | Finish a game = 1 token, beat high score = 2 tokens. Settings panel faucet stays as fallback. Needs a token-history array in localStorage. |
| p1-03 | Blob Zapper: juice + feedback | S | open | Screen shake on blob escape, particle burst on zap, pulsing color when destruction zone shrinks |
| p1-04 | Blob Zapper: combo system | S | open | Chain kills within a short window for score multipliers |
| p1-05 | River Run: ghost run | M | open | Record best run's boat positions in localStorage, replay as transparent ghost on next attempt |
| p1-06 | Hidden Object: hint system (token cost) | S | open | Hint button highlights the quadrant containing the target, costs 1 token |
| p1-07 | Fix AI Hard failing test (durak ai.js bug) | M | open | Test "AI Hard: Takes instead of spending a high trump on a low attack when hand is comfortable" (durak.test.mjs:410) fails — indicates ai.js doesn't match intended hard-difficulty behavior |

---

## P2 — Medium Features

New mechanics that add replayability.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p2-01 | Arcade Passport (achievement system) | L | open | Cross-game achievements stored in localStorage, passport-stamp UI on index.html dashboard |
| p2-02 | Daily Arcade Challenge | M | open | Date-seeded featured challenge per game on 7-day rotation, awards bonus tokens, shown on dashboard |
| p2-03 | Keypad Quest: visual wave map | M | open | 3-second interstitial between waves showing upcoming enemy types/counts |
| p2-04 | Keypad Quest: tower upgrades | M | open | Spend in-game currency (kills) on fire rate / splash / range upgrades. Note: `upgradeRandom()` in gameplay.js already applies an automatic random tower level-up every 10 correct answers — that's not player-chosen or currency-spent, so the actual gap (player agency over which upgrade) is still unbuilt. Confirmed during 2026-07-07 roadmap audit. |
| p2-05 | Hidden Object: themed scenes | L | open | Layered scenes (kitchen, forest, space) instead of flat emoji grid |
| p2-06 | Materials Run: material combos | M | open | Cross-material transitions (ice→sand = skid, water→ice = frozen slide) |
| p2-07 | Durak: smarter AI with tells | M | open | Hesitation delays and a "thinking..." indicator already exist (`ai.js` `scheduleAiAction`: 500–900ms random delay; `ui.js` `status-thinking` class). Remaining gap: personality variation per AI seat is still unbuilt. Confirmed during 2026-07-07 roadmap audit. |
| p2-08 | Durak: match history and stats | S | ✅ | Shipped 2026-07-07 in `36f6085`. Seat 0 (device-owner human) win/loss/draw record tracked in `durak_wins`/`durak_losses`/`durak_draws`, shown on the game-over overlay. |
| p2-09 | Waterfall: wave structure | M | open | Organized waves (line, V-formation, spiral) instead of random spawns |
| p2-10 | River Run: biome transitions | M | open | Visual storytelling as score increases: forest → canyon → volcanic → space |

---

## P3 — New Games

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p3-01 | Signal Tower | L | open | Listen to procedurally generated melody, reproduce on colored pads. Web Audio API + Canvas 2D. Mobile-first. |
| p3-02 | Hex Drift | L | open | Hex-grid territory game vs AI. CSS Grid + DOM. Turn-based strategy — fills a gap in the arcade lineup. |
| p3-03 | Glyph Run | L | open | Endless side-scroller: auto-run, swipe to jump/duck/dash, obstacles are glyphs matching a cognitive prompt. Canvas 2D. |

---

## Backlog — Tech Debt

Lower priority but worth doing when a game is getting other attention.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| b-01 | ES module split: river-run | L | open | index.html is 1006 lines with all JS inline. Split into constants/state/gameplay/main modules. |
| b-02 | ES module split: materials-run | L | open | index.html is 685 lines with all JS inline. |
| b-03 | ES module split: hidden-object | L | open | index.html is 621 lines with all JS inline. |
| b-04 | ES module split: blob-zapper | M | open | index.html is 512 lines with all JS inline. |
| b-05 | ES module split: waterfall | M | open | index.html is 494 lines with all JS inline. |
| b-06 | CLAUDE.md / GEMINI.md sync discipline | S | open | A prose "Sync discipline" reminder section already exists in both files (commit `0eb7f36`), but there's no actual checklist or automated/shared-source-of-truth mechanism — the prose rule alone didn't prevent this same roadmap from drifting (see p0-01, p1-01, b-07). Still worth a real mechanism, not just a sentence. Confirmed during 2026-07-07 roadmap audit. |
| b-07 | Durak: test coverage for ai.js | M | ✅ | Already done — `tests/durak.test.mjs` has 3 dedicated AI-logic tests via the exported `_test_aiTurn` (Normal-difficulty defense, Hard-difficulty take-vs-defend endgame branches). One of the three currently fails, but that's a bug (tracked as p1-07), not a coverage gap. Found stale during the 2026-07-07 roadmap audit. |
| b-08 | Consolidate to pointer events: blob-zapper, hidden-object, waterfall | M | open | Confirmed still real: all 3 games use split mousedown/touchstart handlers, none use unified pointerdown/pointermove/pointerup. Correction: only blob-zapper is missing `touch-action: none` — hidden-object and waterfall already have it. Confirmed during 2026-07-07 roadmap audit. |

---

## Completed ✅

(Items move here as they ship, with date and commit.)
