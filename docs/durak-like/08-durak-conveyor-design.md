# Durak Conveyor — Game Design & Implementation Document

**Game Title:** Durak Conveyor (Working Title)
**Core Concept:** A high-intensity, real-time action puzzle game. Players actively pull cards from a moving conveyor belt to merge them on their board, while simultaneously defending against relentless real-time Durak attacks from enemies.
**Platform:** Mobile-first PWA (Vanilla JS, CSS, HTML). No backend, no framework, no build step.

---

## 1. Core Mechanics & Game Flow

### 1.1 The Game Loop
1.  **Start Screen:** Title, High Score, and a "Play" button (costs 1 Kameko Token).
2.  **The Conveyor (Continuous Phase):**
    *   Cards (ranks 6, 7) slowly push into a "Staging Area" at the bottom of the screen (similar to a conveyor belt).
    *   The player taps or drags a card from the Staging Area into an empty slot on their 5x5 Active Board.
    *   **Merging:** If a card is placed adjacent (Up/Down/Left/Right) to an identical card (same suit, same rank), they automatically snap together and merge into `Rank + 1`.
3.  **The Bouts (Continuous Phase):**
    *   In the center of the screen sits the "Bout Area". Above it is the Enemy.
    *   The Enemy operates on a timer (e.g., attacks every 5 seconds). 
    *   **Attacking & Defending:** The Enemy throws an attack card into the Bout Area. A progress bar ticks down. The player must tap a valid defending card (higher rank same suit, or Trump) from their 5x5 Active Board to send it to the Bout Area.
    *   **Chaining & Transfers:** Once the player defends, the enemy can instantly chain another attack of the same rank (e.g., Player defends an 8 with a 9, Enemy throws another 8 or 9). The timer resets briefly. The player must frantically scan their board to defend the new attack. The player can also tap an exact matching rank to Transfer the attack to the enemy.
4.  **Consequences:**
    *   *If Player Wins Bout:* The Enemy takes damage. Defended cards are cleared.
    *   *If Player Fails to Defend (Timer Runs Out):* The player "Takes" the cards. The attack cards are permanently dropped onto empty slots on the 5x5 Active Board as unmergeable Junk, eating up precious space.
5.  **Game Over:** The game is an endless survival mode. The player loses when the 5x5 board is completely full (no room to place cards from the conveyor) OR the conveyor overflows because the Staging Area is full.

### 1.2 Durak Rules Integration
*   **Deck:** Endless procedural deck of standard Durak ranks (6 through Ace).
*   **Trump Suit:** Displayed constantly. Trumps can be forged by merging the highest normal cards, or spawn rarely on the conveyor.
*   **Chaining:** Implemented as a real-time panic mechanic. The enemy chains automatically based on what ranks are exposed in the bout.

---

## 2. UI & Layout (Mobile First)

*   **Global:** `touch-action: none` to prevent scroll hijacking. Use `requestAnimationFrame` for smooth conveyor movement and bout timers.
*   **Header Bar:** 
    *   Left: Survival Time / Score.
    *   Center: Trump Suit Icon.
    *   Right: Settings Gear (injected by `shared/settings.js`).
*   **Enemy / Bout Area (Top):**
    *   Enemy Avatar and HP bar.
    *   Bout Zone: Displays overlapping attack/defense cards.
    *   Timer Bar: A fast-moving progress bar underneath the Bout Zone indicating how long the player has to respond to the current attack/chain.
*   **Active Board (Middle):** A 5x5 grid. Cards snap to these slots. CSS Grid is ideal, with absolute positioning used during merge animations.
*   **Staging / Conveyor (Bottom):** A horizontal track where new cards slide in from the right. If a card reaches the far left and cannot be pushed further, the conveyor jams.

---

## 3. Architecture & File Structure

Following Kameko Studio's ES Module pattern:

*   **`index.html`:** The DOM structure, card templates, inclusion of `shared/settings.js`.
*   **`style.css`:** CSS custom properties, grid layouts, fluid CSS transitions for dragging and merging.
*   **`constants.js`:** Enums for Game States (`START`, `PLAYING`, `GAMEOVER`), Card config, Conveyor Speed, Bout Timer limits.
*   **`state.js`:** Holds the Active Board array, Staging Area array, Enemy HP, Bout context (active attacks/defenses), and Score.
*   **`boardLogic.js`:** Pure functions for placement validation and adjacency merging checks.
*   **`boutLogic.js`:** Durak rules validation (`canBeat`, `canTransfer`), and enemy chaining AI.
*   **`ui.js`:** DOM manipulation, handling `pointerdown/move/up` for placing cards from the staging area or tapping cards to defend.
*   **`loop.js`:** The `requestAnimationFrame` central loop. Manages the conveyor belt progression, bout timers, and triggering game over conditions.
*   **`main.js`:** Initialization, bringing the modules together, handling the `settingsOpened` event to pause the `loop.js`.

---

## 4. Implementation Guide for AI Agents

When building this game, work in the following iterations:

**Phase 1: The Board & Merging**
*   Setup `index.html`, `style.css`.
*   Implement the 5x5 Active Board.
*   Allow the user to click to spawn a random card on the board.
*   Implement adjacency checking in `boardLogic.js`. If a card is placed next to an identical card, merge them, clear one, and upgrade the other.

**Phase 2: The Conveyor Belt**
*   Implement the Staging Area at the bottom.
*   Build the `requestAnimationFrame` loop in `loop.js` to continuously push new cards into the Staging Area.
*   Implement drag-and-drop or tap-to-place to move cards from Staging to the Active Board.
*   *Verification:* The player can endlessly pull cards from the conveyor and merge them on the board.

**Phase 3: The Enemy & Bouts**
*   Introduce the Bout Area UI and the Enemy timer.
*   When the timer triggers, spawn an Attack card. Start the defense countdown timer.
*   Implement tap-to-defend: tapping a valid card on the 5x5 board moves it to the Bout Area.
*   Implement consequences: if defense succeeds, clear bout. If defense fails (timer expires), drop the attack card onto an empty spot on the 5x5 board.

**Phase 4: Chaining & Chaos**
*   Implement the Chaining logic: after a successful defense, the Enemy immediately checks if it can chain another attack of a matching rank. If yes, it throws it down and resets the defense timer.
*   Implement Transfers.

**Phase 5: Polish & Integration**
*   Integrate `shared/settings.js`. Ensure the `settingsOpened` event correctly pauses the `requestAnimationFrame` loop.
*   Implement Kameko Token check on start.
*   Save Best Survival Time to `localStorage` (e.g., `conveyorBestTime`).
*   Ensure iOS Safari safe-area compatibility.