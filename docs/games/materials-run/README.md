# Materials Run

**Status:** Live (Production)
**Repo Path:** `games/materials-run/`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/materials-run/

## What it is
Materials Run is a DOM/CSS grid-based game where the player controls a spinning pin that skates across a 20x20 grid. The grid is made of different materials (grass, water, ice, sand) that affect acceleration and friction. The player moves by clicking/tapping the grid to place "movement pins," and the character accelerates towards the average position of all active pins. The character automatically shoots bullets towards a blinking target tile when moving fast enough.

## Game Modes
- **Score Attack:** The goal is to hit the blinking target tile as many times as possible to score points while avoiding enemies and a randomly appearing 3x3 danger zone.
- **Survival:** The goal is to survive for 3 minutes without touching an enemy or staying in the danger zone for more than 500ms.

## Auto Play Visualizer
The game features a "Pathfinder Bot" auto-play mode (added July 2026). When enabled, a bot evaluates the grid and automatically drops movement pins to navigate towards the target tile (Score Attack) or maximize distance from enemies (Survival) while staying out of the danger zone.

## Known Simplifications
- Pathfinding is a simple greedy algorithm over a down-sampled grid (checking every 2nd tile). It does not use A* or look ahead multiple steps, but is sufficient to dodge enemies and the danger zone reasonably well.
- The physics engine is tied to DOM rendering (no separate WebGL/Canvas layer), so it relies on CSS transitions and standard DOM updates.

## Next Steps
- See [Improvements](ideas.md) for potential features or tweaks.
