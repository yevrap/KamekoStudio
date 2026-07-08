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
| p0-01 | Add durak-alchemist to CLAUDE.md and GEMINI.md game tables | S | open | Game exists in games/ but is missing from the Games table in both context files |
| p0-02 | Delete orphaned game.js monoliths | S | open | keypad-quest/game.js (1539 lines), durak-dungeon/game.js (1373 lines), durak-tactics/game.js (815 lines) exist alongside ES modules — verify unused then delete |
| p0-03 | Add durak-alchemist unit tests | M | open | No tests exist for it; add to tests/ covering core logic in gridLogic.js and combatLogic.js |

---

## P1 — High-Impact Polish

Biggest visible improvements to the player experience.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p1-01 | Durak: card animations | M | open | Animate card plays (slide to table), pickups (fan into hand), round resolution (sweep to discard). CSS transitions on DOM elements. |
| p1-02 | Token economy: earn tokens by playing | M | open | Finish a game = 1 token, beat high score = 2 tokens. Settings panel faucet stays as fallback. Needs a token-history array in localStorage. |
| p1-03 | Blob Zapper: juice + feedback | S | open | Screen shake on blob escape, particle burst on zap, pulsing color when destruction zone shrinks |
| p1-04 | Blob Zapper: combo system | S | open | Chain kills within a short window for score multipliers |
| p1-05 | River Run: ghost run | M | open | Record best run's boat positions in localStorage, replay as transparent ghost on next attempt |
| p1-06 | Hidden Object: hint system (token cost) | S | open | Hint button highlights the quadrant containing the target, costs 1 token |

---

## P2 — Medium Features

New mechanics that add replayability.

| ID | Item | Effort | Status | Notes |
|----|------|--------|--------|-------|
| p2-01 | Arcade Passport (achievement system) | L | open | Cross-game achievements stored in localStorage, passport-stamp UI on index.html dashboard |
| p2-02 | Daily Arcade Challenge | M | open | Date-seeded featured challenge per game on 7-day rotation, awards bonus tokens, shown on dashboard |
| p2-03 | Keypad Quest: visual wave map | M | open | 3-second interstitial between waves showing upcoming enemy types/counts |
| p2-04 | Keypad Quest: tower upgrades | M | open | Spend in-game currency (kills) on fire rate / splash / range upgrades |
| p2-05 | Hidden Object: themed scenes | L | open | Layered scenes (kitchen, forest, space) instead of flat emoji grid |
| p2-06 | Materials Run: material combos | M | open | Cross-material transitions (ice→sand = skid, water→ice = frozen slide) |
| p2-07 | Durak: smarter AI with tells | M | open | Hesitation delays, "thinking..." indicator, personality variation per AI seat |
| p2-08 | Durak: match history and stats | S | open | Win/loss tracking in localStorage, post-game breakdown screen |
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
| b-06 | CLAUDE.md / GEMINI.md sync discipline | S | open | Files maintained manually in parallel; easy to drift. Add a checklist or shared source-of-truth approach. |
| b-07 | Durak: test coverage for ai.js | M | open | ai.js has no unit tests; logic is complex enough to warrant coverage. |

---

## Completed ✅

(Items move here as they ship, with date and commit.)
