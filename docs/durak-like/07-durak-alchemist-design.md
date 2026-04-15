# Durak Alchemist — Game Design & Implementation Document

**Game Title:** Durak Alchemist (Working Title)
**Core Concept:** A hybrid puzzle-battler. Alternate between a tactical 2048-style swipe-to-merge grid phase and an explosive, turn-based Durak combat phase focused on chaining massive attacks.
**Platform:** Mobile-first PWA (Vanilla JS, CSS, HTML). No backend, no framework, no build step.

---

## 1. Core Mechanics & Game Flow

### 1.1 The Game Loop
1.  **Start Screen:** Title, High Score, and a "Play" button (costs 1 Kameko Token).
2.  **Phase 1: The Forge (Merge Phase):** 
    *   Played on a 4x4 grid.
    *   Player has a set number of "Energy" (e.g., 10 swipes) per turn.
    *   Swiping (Up/Down/Left/Right) slides all cards. Identical cards (same rank, same suit) merge into `Rank + 1` of the same suit.
    *   New low-rank cards (6, 7) spawn in empty spaces after each swipe.
    *   *Goal:* Build high-ranking cards and Trump cards before Energy runs out.
3.  **Phase 2: The Clash (Combat Phase):**
    *   The grid locks. A central Bout Area opens.
    *   The AI Opponent appears with its own hidden/partially-hidden hand.
    *   **Attacking:** If the player attacks, they drag a card from the grid to the Bout Area. If the AI defends, the player can *chain* any exposed cards on their grid that match the rank of *any* card in the bout. 
    *   **Defending:** If the AI attacks, the player must drag a valid defender (higher rank same suit, or Trump) from their grid. The AI will aggressively chain matching ranks.
    *   **Taking:** If a defender cannot beat all attacking cards, they must "Take."
        *   *If AI Takes:* The AI loses HP based on the total value/count of cards taken.
        *   *If Player Takes:* The attacking cards are permanently dropped into empty slots on the player's 4x4 grid as "Junk/Wound" cards, severely limiting future merge space.
4.  **Phase 3: Cleanup & Repeat:**
    *   All cards successfully defended are discarded (cleared from grid).
    *   Return to Phase 1 (The Forge) with restored Energy.
5.  **Game Over:** The player loses if their 4x4 grid becomes completely filled and no valid merges are possible, or if player HP reaches 0 (if a dual-condition is preferred, though grid-lock is cleaner).

### 1.2 Durak Rules Integration
*   **Deck:** Standard 36-card Durak rules (6 through Ace).
*   **Trump Suit:** Selected randomly at the start of the run. Displayed prominently in the UI.
*   **Chaining:** The defining feature of Combat. Multiple cards of the same rank can be thrown into the bout.
*   **Transfer:** If attacked, the player can play a card of the *exact same rank* to transfer the attack back to the AI (if the AI has enough cards/HP to take it).

---

## 2. UI & Layout (Mobile First)

*   **Global:** `touch-action: none` on the grid. `body.dark-mode` support. `viewport-fit=cover` for iOS.
*   **Header Bar:** 
    *   Left: Current Score / Wave.
    *   Center: Trump Suit Icon (large, glowing).
    *   Right: Settings Gear (injected by `shared/settings.js`).
*   **Opponent Area (Top):** AI avatar/HP bar, and visual indicator of AI's hand size.
*   **Bout Area (Middle):** A distinct visual zone where cards are played during combat. Shows overlapping attack/defense pairs.
*   **Player Grid (Bottom/Center):** 4x4 grid for merging. CSS Grid layout. Cards use standard Kameko Studio high-visibility layout (large center watermark, clear corner ranks).
*   **Action Bar (Bottom-most):** Shows remaining "Energy" (swipes) during the Forge phase, and an "End Turn / Take" button during the Combat phase.

---

## 3. Architecture & File Structure

Following Kameko Studio's ES Module pattern:

*   **`index.html`:** The DOM structure, template tags for cards, inclusion of `shared/settings.js`.
*   **`style.css`:** CSS custom properties, grid layouts, card animations (transform/translate for sliding), mobile responsive media queries.
*   **`constants.js`:** Enums for Suits, Ranks, Game States (`START`, `FORGE`, `COMBAT`, `GAMEOVER`).
*   **`state.js`:** The single source of truth. Holds the 4x4 grid array, AI HP, current Trump suit, Bout cards (attacks/defenses), and score.
*   **`gridLogic.js`:** Pure functions for resolving 2048-style swipes (shift, merge, spawn new).
*   **`combatLogic.js`:** Durak rules engine (can beat?, get valid chains, resolve transfer).
*   **`ui.js`:** DOM manipulation, drag-and-drop pointer events, rendering the grid, animating card slides and bout attacks.
*   **`main.js`:** Initialization, game loop orchestration, event listeners, localStorage high score persistence, and Token spending logic.

---

## 4. Implementation Guide for AI Agents

When building this game, work in the following iterations:

**Phase 1: Foundation & The Forge (Grid Phase)**
*   Setup `index.html`, `style.css`, and basic module structure.
*   Implement the 4x4 CSS grid.
*   Implement the swipe logic in `gridLogic.js` (Up/Down/Left/Right). Ensure cards slide and merge correctly (6+6=7).
*   Implement spawning of new base cards (6s and 7s) after a valid swipe.
*   *Verification:* The user can play a standalone 2048-style card merging game.

**Phase 2: State Machine & Durak Engine**
*   Introduce Game States (`FORGE` -> `COMBAT`). Implement the Energy counter to trigger the state switch.
*   Build `combatLogic.js`: function `canBeat(attackCard, defenseCard, trumpSuit)`.
*   Setup the Bout Area UI in the DOM.

**Phase 3: The Clash (Combat Implementation)**
*   Implement Drag-and-Drop from the grid to the Bout Area using `pointerdown/move/up`.
*   Implement the AI's turn: AI selects an attack, player must defend.
*   Implement **Chaining**: Highlight valid cards on the player's grid that match the rank of cards in the bout. Allow tapping to chain them into the attack.
*   Implement the "Take" consequence: Defended cards are destroyed. Taken cards drop into the player's empty grid slots as unmergeable junk.

**Phase 4: Polish & Integration**
*   Integrate `shared/settings.js` (listen for `settingsOpened` to pause input).
*   Implement Kameko Token check on start.
*   Save High Score to `localStorage` (e.g., `alchemistHighScore`).
*   Add CSS animations for combat impacts and chaining.
*   Ensure iOS Safari safe-area compatibility (`padding-bottom: env(safe-area-inset-bottom)`).