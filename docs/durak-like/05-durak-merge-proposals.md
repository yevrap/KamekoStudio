# Durak Merge Game Proposals

This document outlines three distinct game design proposals that combine "Merge 2" mechanics (like 2048, Suika Game, or Threes) with the classic rules of Russian Durak (attack/defend, trump suits, card ranks).

---

## Proposal 1: Durak 2048 (Grid Survival)

**Concept:** A fast-paced puzzle survival game played on a 4x4 grid. You slide cards to merge them, building stronger ranks and trumps to survive relentless incoming attacks from an opponent.

*   **Core Merge Loop:** Random low-rank cards (6, 7, 8) drop onto a 4x4 grid. You swipe (Up/Down/Left/Right) to slide all cards. Colliding two identical cards (same suit and rank) merges them into the next rank up (e.g., 6♠ + 6♠ = 7♠).
*   **The Durak Twist:** Above the grid sits an AI opponent that constantly queues "Attack" cards. You must defend by dragging or double-tapping a valid card from your grid (higher rank same suit, or any Trump).
*   **The Tension:** If you cannot defend an attack within a time limit (or turn limit), the attacking card drops onto your grid as a "Wound" card. Wound cards cannot be merged or moved, taking up precious grid space. If the grid locks up entirely, you lose.
*   **Trump Mechanic:** At the start of the game, a Trump suit is selected. Merging Trump cards is your ultimate goal to survive late-game high-rank attacks.
*   **Implementation:** DOM-based grid with CSS transitions (similar to `materials-run`). Swipe and touch listeners to resolve grid state arrays.

---

## Proposal 2: Durak Auto-Battler (Tavern / Bazaar)

**Concept:** A turn-based roguelike tactics game where you draft and merge cards between combat encounters to build a powerful frontline deck.

*   **Core Merge Loop:** You start in a "Shop" phase with a bench of basic cards (6s and 7s) and a pool of gold. You buy duplicates from a randomized shop. Dragging a card onto an identical one on your bench merges them into the next tier (e.g., 6♥ + 6♥ = 7♥).
*   **The Durak Twist:** After the shop phase, you enter Combat. You place your merged cards into 3 to 5 frontline slots. The Enemy reveals their attacking cards. Combat resolves using Durak rules: each slot compares your card to the enemy card. If yours wins (higher rank same suit, or Trump), the enemy takes damage. If you lose, you take player damage and your card is destroyed.
*   **The Tension:** Managing gold economy versus board space. Do you merge two 8s to make a 9, or keep two 8s to fill more frontline slots? The Trump suit might change per run or per boss, forcing you to adapt your merge strategy.
*   **Implementation:** DOM drag-and-drop interface, separate Shop and Combat state screens (similar architecture to `durak-tactics` and `durak-dungeon`).

---

## Proposal 3: Durak Solitaire: The Forge (Conveyor Puzzle)

**Concept:** A methodical puzzle game where a conveyor belt delivers raw cards, and you must strategically place and merge them on a board to intercept incoming attacks from all four sides.

*   **Core Merge Loop:** You draw cards from a conveyor belt queue one by one and place them onto a 5x5 grid. Placing a card adjacently to another card of the *exact same rank* automatically merges them into a card of `Rank + 1`.
*   **The Durak Twist:** Enemies approach from the left, right, top, and bottom of the grid, slowly moving inwards with their own attacking cards. You must actively drag a valid defending card from your grid to an approaching enemy to destroy them before they breach your play area.
*   **Trump Mechanic:** Merging two cards of the *same suit* creates the next rank of that suit. Merging two cards of *different suits* creates a Trump card of the next rank. This gives you control over crafting Trumps when you desperately need them.
*   **Implementation:** Drag-and-drop from a queue onto a grid. Physics or turn-based "step" movement for the approaching enemies.

---

## Next Steps

Review these proposals and let me know which direction sounds most interesting. Once a path is chosen, we will enter **Plan Mode** to flesh out the detailed mechanics, visual style, UI layout, and create the full Implementation Document for Kameko Studio standards.