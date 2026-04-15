# Durak Merge Game: Chaining-Focused Proposals

This document explores three game design proposals that combine a "Merge 2" core mechanic with the full, unfiltered ruleset of Russian Durak—specifically highlighting **chaining in bouts** (adding cards of the same rank to the attack/defense pool), trump suits, and taking cards on a failed defense.

All three designs are architected to work as zero-dependency Progressive Web Apps (PWAs) using vanilla ES modules, matching Kameko Studio's established patterns.

---

## Proposal 1: Durak Siege (Solitaire Merge & Defend)

**Concept:** A column-based merge game (similar to Solitaire layouts) where you continuously manage your board to survive endless, escalating Durak bouts against an invading enemy.

*   **The Merge Mechanic:** Your play area consists of 4 or 5 columns of cards. You can drag the bottom card of any column onto another matching card (same suit, same rank) at the bottom of another column to merge them into `Rank + 1` (e.g., 6♠ + 6♠ = 7♠).
*   **The Durak Bout:** An enemy deck sits at the top of the screen and initiates a bout by playing an attack card. You must drag a valid defending card (higher rank same suit, or trump) from the bottom of your columns to the bout area.
*   **The Chaining (The Fun Part):** Once a card is in the bout (either the attack or your defense), the enemy can add *more* attack cards of that same rank. You must defend those too! Conversely, if the enemy attacks, you can counter-attack (transfer) if you have an exposed card of the exact same rank. 
*   **The Penalty:** If you cannot defend the entire chained attack, you must "Take" the cards. The entire bout pile is distributed onto your columns as junk/unmerged cards, severely clogging your board and limiting your merge options. If a column overflows the screen height, you lose.
*   **Technical Fit:** Pure DOM. Columns are flex containers. Bouts are resolved with the same logic engine used in `durak-dungeon`. Standard drag-and-drop interactions.

---

## Proposal 2: Durak Alchemist (Grid Merge + Turn-Based Bouts)

**Concept:** A clear separation between a 2048-style puzzle phase and an intense, explosive combat phase where you unleash your chained combos.

*   **The Merge Mechanic:** Played on a 4x4 or 5x5 grid. You swipe to slide and merge identical cards to build high-ranking cards and trumps. You have a limited number of "Moves" (e.g., 10 swipes) before the phase ends.
*   **The Durak Bout:** After your moves, a Bout phase begins. You and an AI opponent take turns being the Attacker. 
*   **The Chaining:** When you are the Attacker, you drag an initial card from your grid to the center. If the AI defends, you look at your grid: you can tap *any* cards on your grid that match the rank of the attack or defense cards to chain them into the bout! You are trying to overwhelm the AI so it has to "Take" the cards (dealing damage to it or filling its invisible board). When defending, the AI will aggressively chain you; if you have to "Take," the attacking cards are dropped into empty slots on your grid, locking them up.
*   **Technical Fit:** Combines the swipe logic of a grid game (like `materials-run`) with the discrete state-machine flow (Gathering State -> Bout State) of `durak-tactics`. Perfect for mobile portrait mode.

---

## Proposal 3: Durak Conveyor (Active Match & Defend)

**Concept:** A highly dynamic, real-time merge game where cards slowly push up from the bottom (or fall from the top), and bouts happen continuously in a dedicated zone.

*   **The Merge Mechanic:** Cards are constantly fed into a staging area. You tap/drag to place them onto your active board. Placing two identical cards adjacently merges them into `Rank + 1`.
*   **The Durak Bout:** A separate "Bout" area sits in the center. Enemies queue attacks. To defend, you don't just use the incoming cards—you tap *any exposed card* on your merged board to send it to the bout area. 
*   **The Chaining:** The bout stays active until someone yields. The enemy might attack with a 7. You defend with an 8. The enemy instantly chains another 7 and an 8. You must quickly scan your merged board and tap valid defenses for *both* new attacks before a timer runs out. If you tap a matching rank instead of a higher rank, you trigger a "Transfer" and bounce the attack back to them!
*   **Technical Fit:** Requires `requestAnimationFrame` for the smooth conveyor movement and active timers for the bouts, but still 100% vanilla JS and DOM-renderable (or Canvas 2D if performance requires, similar to `keypad-quest`).

---

## Technical Implementation Notes (PWA / ES Modules)

Whichever proposal is chosen, the architecture will follow Kameko Studio standards:
1.  **No Backend:** All game state, enemy AI, and run progress lives in local JS and `localStorage`.
2.  **ES Modules:** The game will be split into `state.js` (board and bout logic), `gameplay.js` (merge rules and chaining validation), `ui.js` (drag/drop and animations), and `main.js` (orchestration).
3.  **Durak Engine:** The core Durak logic (comparing cards, checking valid chains, resolving transfers) is already proven in `games/durak/` and `games/durak-tactics/` and can be easily adapted to a merge-first interface.
