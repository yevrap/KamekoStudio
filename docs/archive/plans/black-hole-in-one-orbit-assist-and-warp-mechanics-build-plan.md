# Black Hole in One — Orbit Assist & Warp Mechanics Build Plan

This plan outlines the two new features. The specs below contain exact file:line hooks, algorithm designs, and verification steps so this work can be directly picked up by an execution agent (e.g. using the `dev-ship` skill).

## Phase 1: Explore Black Holes (The Gravity Well)

Wild black holes in Explore will now capture the comet into orbit from afar. Warping to Town only happens if the player flies (or flicks) directly into the center event horizon.

### Implementation Hooks

#### [MODIFY] constants.js
- **Delete:** `exploreBlackHoleWarpR` and `EXPLORE_BLACKHOLE_WARP_MARGIN`. (They are no longer needed since warp will trigger on a much tighter inner radius).

#### [MODIFY] physics.js
- **Update `orbitCapture(p, b)`:**
  Change `if (b.type !== 'planet') return null;` 
  To `if (b.type !== 'planet' && b.type !== 'blackhole') return null;`

#### [MODIFY] explore.js
- **Update `step()` warp trigger:**
  Find the loop iterating over `world.bodies` (around line 479) that checks `exploreBlackHoleWarpR`.
  Change the distance check to: `if (dist(comet.x, comet.y, b.x, b.y) < b.r * 0.3)`. This tight inner radius ensures players must dive deep into the black hole to warp.
- **Update `useReturnPortal()`:**
  Instead of dropping the comet near the black hole in free flight, initialize it directly into `S.phase = 'orbit'`.
  ```javascript
  const b = world.bodies.find(body => body.id === exploreHome.blackHoleId);
  if (b) {
      const r = EXPLORE_BLACKHOLE_R + COMET_R + ORBIT_MIN_GAP + 2;
      const ang = Math.atan2(dy, dx);
      comet.x = bhX + Math.cos(ang) * r;
      comet.y = bhY + Math.sin(ang) * r;
      comet.vx = 0; comet.vy = 0; comet.rest = null;
      world.orbit = { b, r, ang, omega: circularSpeed(b.m, r) / r };
      S.phase = 'orbit';
  } else {
      S.phase = 'flight'; // Fallback
  }
  ```

### Done When (Phase 1)
- Wild black holes cleanly capture the comet into orbit (like normal planets).
- Flicking or flying into the black hole (`< b.r * 0.3`) triggers the warp spiral to Town.
- Using the Return Portal spawns the player back at the wild black hole, perfectly locked into a stable orbit.
- Existing tests pass, and new tests cover the Return Portal orbit injection.

---

## Phase 2: Orbit Aim Assist (Navigation Computer)

A new Explore inventory item that magnetically snaps the aim angle and highlights the trajectory blue when dragging near a valid orbit.

### Implementation Hooks

#### [MODIFY] constants.js
- **Update `ITEMS`:** Add `navComputer: { id: 'navComputer', name: 'Nav Computer', desc: 'Orbit Aim Assist', icon: '🧭' }`

#### [MODIFY] ui.js
- **Add `getSnappedAim(drag, S, comet)` helper:**
  Extract `dx, dy` from the drag object.
  If `S.inventory?.navComputer?.enabled` is false, return `{ dx, dy, isOrbit: false }`.
  If true, sweep angles ±0.15 radians from the raw angle in small steps (e.g. 10 steps each way). For each angle, run a fast headless simulation (up to ~120 `stepBody` ticks). Inside the loop, check if `orbitCapture(ghost, b)` returns truthy for any body. If it does, snap to that angle and immediately return `{ dx: snappedDx, dy: snappedDy, isOrbit: true }`.
- **Update `drawAim(drag)`:**
  Call `const aim = getSnappedAim(drag, S, comet)` at the top. Use `aim.dx` and `aim.dy` for the trajectory projection math.
  If `aim.isOrbit` is true, override the line color `cr` to a bright blue (e.g., `'77,166,255'`).

#### [MODIFY] main.js
- **Update `pointerup` handler:**
  Before calling `gameplay.launch()`, call `getSnappedAim()` (make sure it's exported from `ui.js`).
  Use the snapped `dx` and `dy` to calculate the final launch vector. This ensures the visual snap matches the physics engine.

### Done When (Phase 2)
- "Nav Computer" appears in the Explore inventory (Shop & Drawer).
- When turned ON, aiming slightly off from an orbit magnetically snaps the preview line to the correct angle and turns it blue.
- Releasing the shot on a snapped blue line results in a guaranteed orbit capture.
- When OFF, aim is raw and un-snapped (keeping standard Golf physics pure).
- Added unit tests for `getSnappedAim` verifying it finds adjacent orbits and ignores them when OFF.
