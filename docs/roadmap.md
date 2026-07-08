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
| p0-05 | Fix waterfall missing lastPlayed_ write | S | ✅ | Shipped in `0a6fcb3` — `games/waterfall/index.html:223` writes `lastPlayed_waterfall` right after the token spend. Status was already ✅ on disk; note text updated for clarity during the 2026-07-07 /ship pass. |
| p0-06 | Add durak-alchemist to games/CLAUDE.md and games/GEMINI.md | S | ✅ | Shipped 2026-07-07 in `5c889a7`. Added durak-alchemist rows to the ES Module Refactor Status, Games, and localStorage Keys tables in both files. |
| p0-07 | Add unit tests for durak-dungeon and durak-tactics pure logic | M | ✅ | Shipped 2026-07-07 in `63c1879`. durak-dungeon: 20 tests on constants.js + state.js (mulberry32, seedFromString, shuffle, canDefend incl. no-trumps mutation, hasRelic, getActiveTrumpSuit). durak-tactics: 7 tests on constants.js's `getDisplayVal` — its only DOM-free function; the rest of the game's logic lives in gameplay.js, which reads DOM elements at module load and isn't unit-testable without a refactor (documented as an intentional ui+gameplay merge in games/CLAUDE.md). |

---

## P1 — High-Impact Polish

Biggest visible improvements to the player experience.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p1-01 | Durak: card animations | M | ✅ | Already implemented — `ui.js` runs a generic FLIP animation on every `renderAll()`, covering plays sliding to the field, pickups fanning into hand on take, and round resolution sweeping to discard. Shipped in `b663dfa`; discovered already-done during 2026-07-07 /ship triage. |
| p1-02 | Token economy: earn tokens by playing | M | ✅ | Shipped 2026-07-08 in `56edd2d`. `window.KamekoTokens.earn(n, reason)` adds tokens and logs to a capped 50-entry `tokenHistory` array in localStorage. Wired into all 9 gallery games with an actual finish/best hook (finish=1, new personal best=2); `waterfall` excluded — it has no game-over or score-persistence concept at all, so there was nothing to hook. `durak`/`hidden-object`/`blob-zapper` get a flat 1 token (no comparable "high score" concept). Settings-panel faucet (`add()`) untouched as fallback. Discovered and left alone (out of scope) a pre-existing bug: `durak-alchemist/index.html` loads `settings.js` before `<body>` exists, so `applyTheme()` throws on load and the gear/settings overlay never renders there — `window.KamekoTokens` itself is still defined before that throw, so token earning is unaffected, but the settings UI is broken on that page independent of this ticket. Worth a follow-up backlog item. |
| p1-03 | Blob Zapper: juice + feedback | S | ✅ | Shipped 2026-07-08 in `ec6bb51`. Zapping a blob (touching the destruction zone) spawns a small particle burst and kicks a decaying screen shake. Note: this game has no "escape" mechanic (blobs are eliminated by touching the zone, not by fleeing it), so shake triggers on zap instead. The destruction zone doesn't literally shrink either — reinterpreted "pulsing color when destruction zone shrinks" as the zone's pulse amplitude/stroke intensity rising as remaining blob count drops toward zero. Verified visually in browser (screenshot + console check), no unit tests apply (pure Canvas game). |
| p1-04 | Blob Zapper: combo system | S | ✅ | Shipped 2026-07-08 in `e0ced4f`. Zaps within a 700ms window escalate a x1–x5 score multiplier with a "xN COMBO!" popup. The game had zero score concept before this, so a `score` + persisted `blobZapperHighScore` were added as the necessary base for "multiplier" to mean anything; beating the high score now awards 2 tokens (was flat 1), so blob-zapper was removed from the "no comparable best" list in CLAUDE.md/GEMINI.md. |
| p1-05 | River Run: ghost run | M | open | Record best run's boat positions in localStorage, replay as transparent ghost on next attempt |
| p1-06 | Hidden Object: hint system (token cost) | S | open | Hint button highlights the quadrant containing the target, costs 1 token |
| p1-07 | Fix AI Hard failing test (durak ai.js bug) | M | ✅ | Shipped 2026-07-08 in `9c9a629`. Root cause: `aiPlayHard`'s defend branch forced a trump defense whenever the deck was empty, before the existing comfort-based take/defend check could run. Now the forced-defend path only fires when defending would clear (or nearly clear) the hand (genuine survival), otherwise the comfort check can declare Take. Also fixed the test's fixture — the attacker seat needs a matching-rank card so `declareTake` settles at `pileOn` instead of auto-resolving via `endBout`. All 113 tests pass. |
| p1-08 | High-score displays: celebrate new records | S | ✅ | Shipped 2026-07-08 in `afe7df4`. Added a gold pulse/badge treatment: materials-run gets a pulsing "New Record!" badge on the top-score line matching the mode just played; durak-alchemist's game-over screen previously showed no final score or record indicator at all, both added; blob-zapper's existing "New Best!" text now scale-pulses; keypad-quest's new-best wave-clear message renders gold instead of the same cyan as a normal clear. Also fixed a pre-existing keypad-quest bug found during verification: `endWave()` pushed the float text then immediately called `startWave()`, which reset `state.floats` in the same synchronous call before any frame rendered it — the wave-clear/new-best message never actually displayed for either case. river-run left out of scope: it has no score display on its game-over overlay at all today, a larger gap than "no visual distinction." |

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
| b-08 | Consolidate to pointer events: blob-zapper, hidden-object, waterfall | M | open | Corrected during 2026-07-07 /improve scan — the 3 games don't all have the same pattern. blob-zapper (`index.html:472-492`) has real split-handler duplication: 6 separate mousedown/mousemove/mouseup + touchstart/touchmove/touchend/touchcancel listeners tracking `'mouse'` vs per-touch identifiers in one `touchPoints` array — on hybrid touch+mouse devices both handler sets can fire for one tap, pushing two entries for what's a single interaction. hidden-object actually uses `click` + `touchstart` (not mousedown) with a 100ms debounce + `preventDefault()` guard, so it's a style deviation but not a double-fire bug. waterfall is `touchstart`-only for shooting with `Space` keydown as the desktop path (no mousedown, no click) — functionally fine but still not unified pointer events. |
| b-09 | Add `100dvh` fallback pattern to games missing it | S | open | `blob-zapper`, `hidden-object`, `materials-run`, `waterfall` (plus root `index.html`, `3d.html`) size full-screen containers with `100vh`/`min-height:100vh`/`max-height:100vh` only — zero `dvh` usage found in any of the 6 files. The documented iOS Safari fix (address-bar show/hide causing `100vh` jump/clip) is already applied in durak, durak-dungeon, durak-tactics, durak-alchemist, and keypad-quest, but not here. Found during 2026-07-07 /improve scan. |
| b-10 | durak-dungeon: relic-slot tap target under 44px | S | open | `.relic-slot` is 32×32px and interactive — `main.js:58-64` wires `pointerdown` via `closest('.relic-slot')` to open a relic tooltip. Below the documented 44px minimum tap target; a packed relic bar (up to 15 relic types possible in one run) makes mis-taps likely on small screens. Found during 2026-07-07 /improve scan. |
| b-11 | Delete stale `patch_style.py` from repo root | S | open | One-off migration script that regex-patches `games/durak/style.css` dimensions; `git log` shows it was already applied in `eb605cb`. Not referenced by any doc, build step, or other file — dead code sitting outside the `games/`/`shared/`/`docs/` structure. Found during 2026-07-07 /improve scan. |
| b-12 | durak-alchemist: settings gear/overlay never renders | S | open | `index.html:9` loads `shared/settings.js` in `<head>`, before `<body>` (line 11) exists. `settings.js`'s top-level `applyTheme(getSavedTheme())` call throws (`document.body` is null), aborting the rest of the IIFE before it reaches the `injectUI()` registration — so the gear button and settings overlay never appear on this page. `window.KamekoTokens` is assigned earlier in the same script, before the throw, so token spend/earn still work; only the UI is broken. Every other game loads `settings.js` right before `</body>` per convention — durak-alchemist is the outlier. Found 2026-07-08 while shipping p1-02. |

---

## Completed ✅

(Items move here as they ship, with date and commit.)
