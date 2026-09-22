# Black Hole in One — Survival Mode Build Plan

Yev requested: *"make a survival mode with limited fuel, enemy mobs, fuel refreshes that you can find and spawn as you fly"*

This introduces an entirely new gameplay loop focused on resource management and evasion, rather than reaching a hole in minimum strokes (Golf) or pure relaxed sandbox flying (Explore).

## Design Decisions (from Questionnaire)
- **Fuel drain:** Per-flick cost. Every flick costs a fixed amount.
- **Enemies:** Space Mines (static, instant kill/drain), Asteroids (moving dumb projectiles), Gravity traps (strong gravity pulling to death).
- **Structure:** Discrete levels. Must reach the Black Hole before running out of fuel/health.

## Sprint Backlog

- [x] **P0 · SURV-1 — Survival Mode Scaffold & Fuel System** — Add the Survival mode UI/flow and discrete level structure. Implement the `fuel` metric with a per-flick cost. *Done when:* Survival mode boots into a level, UI shows fuel gauge, flinging consumes fixed fuel, reaching the Black Hole advances level, empty fuel triggers Game Over. (Shipped July 15)
- [x] **P1 · SURV-2 — Fuel Refreshes (Pickups)** — Spawn fuel pickups in the levels that restore fuel. *Done when:* Pickups spawn, collecting one increases fuel and plays a sound/effect, pickup disappears on collection. (Shipped July 15)
- [x] **P1 · SURV-3 — Hazards: Space Mines & Gravity Traps** — Introduce static space mines and gravity traps. *Done when:* Mines and gravity traps spawn. Touching a mine causes massive fuel drain or instant death. Gravity traps pull the player in. (Shipped July 15)
- [x] **P2 · SURV-4 — Hazards: Moving Asteroids** — Introduce moving asteroids that drift across the level. *Done when:* Asteroids spawn with linear velocity. Colliding with them damages fuel or ends the run. (Shipped July 15)
