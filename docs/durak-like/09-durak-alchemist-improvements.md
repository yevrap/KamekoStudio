# Durak Alchemist: Proposed Improvements

Based on the current implementation of Durak Alchemist, here are several proposed improvements to enhance gameplay balance, visual feedback, and overall player experience.

## 1. Visual Feedback & Game Feel (Juice)
*   **Chaining Highlights:** During the Combat Phase, when it's the player's turn to chain attacks, any cards on the grid that match the exposed ranks in the bout should pulse or glow to clearly indicate they are valid for chaining.
*   **Merge Animations:** Add a stronger "pop" or particle effect when two cards merge. High-rank merges (e.g., merging into an Ace or a Trump) should have a spectacular, screen-shaking effect.
*   **Attack Impacts:** When a card is dropped into the Bout Area, a screen shake or directional flash indicating damage to the opponent (or to the player) would make the combat feel heavier.
*   **Trump Indicator:** The Trump suit icon in the header should glow. On the board, cards that match the Trump suit could have a subtle golden border so players can instantly spot their most valuable defenders.

## 2. Balance & Economy
*   **Energy Tuning:** Currently, Energy resets to 15 upon defeating an enemy. We might want to scale the energy gained based on how quickly the enemy was defeated, or offer an "Energy Potion" mechanic (e.g., merging 3 identical cards grants +1 Energy).
*   **Enemy Scaling:** The enemy gains +20 HP per kill. We should also scale their AI behavior. Early enemies should only attack with single cards. Later enemies should aggressively use the Chaining mechanic and have a higher percentage chance to defend player attacks.
*   **Junk Card Penalty:** When the player "Takes" an attack, dropping the cards onto the grid as junk is punishing (which is good), but we might want a mechanic to slowly clear junk over time, or allow junk cards of the same rank to be merged into a standard base card.

## 3. UI / UX Enhancements
*   **Drag-and-Drop Clarity:** When dragging a card from the grid, the Bout Area should highlight (e.g., a glowing drop zone) to indicate it's a valid target.
*   **Enemy Hand Visibility:** Show the number of cards the enemy holds. If the enemy only has 2 cards left, the player knows they only need to chain 2 attacks to overwhelm them.
*   **"Take" Button Clarity:** The "End Turn" button changes its text to "Take" during defense, but it could change color (e.g., turning bright red) to warn the player they are about to take damage and clog their board.

## 4. Advanced Mechanics (Future Updates)
*   **Relics / Passives:** Similar to `durak-dungeon`, introducing passive items (e.g., "The Spades Chalice: Merging Spades grants +1 Energy") could add a roguelike deckbuilding layer to the Forge phase.
*   **Boss Fights:** Every 5th enemy could be a Boss that changes the rules (e.g., "The Board Shrinks to 3x3 during Combat" or "The Boss always defends with Trump cards").

## Next Steps
These improvements can be implemented iteratively. The highest priority for the next pass should be **Visual Feedback** (highlighting valid chain cards and trump cards), as it directly impacts how well players understand the combat state.