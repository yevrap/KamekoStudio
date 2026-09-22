# Black Hole in One — Town Orbit and Auto-Label Plan

**Objective:** Allow players to orbit the Town planet (`tee` type) and make the "Tap to land" prompt show up automatically upon entering orbit (without requiring a tap first).

## Proposed Changes

### 1. Enable Orbiting for Town
Town is generated as a `tee` body. Currently, the orbit logic explicitly ignores it.
- **`physics.js`**: In both `orbitCapture` and `magnetCapture`, update the body type filter to include `'tee'`:
  ```javascript
  if (b.type !== 'planet' && b.type !== 'blackhole' && b.type !== 'tee') return null;
  ```
- **Tests**: Add a test case in `explore.test.mjs` verifying that a `tee` body can capture the comet into orbit and that `magnetCapture` works on it. 

### 2. Auto-show "Tap to land" in Orbit
Currently, the label requires the planet to be explicitly tapped (`b.tapped = true`) before it appears.
- **`ui.js`**: In `drawPlanetLabel(b)`, modify the early return condition to bypass the `b.tapped` check if the comet is currently orbiting the body:
  ```javascript
  const isOrbited = S.phase === 'orbit' && world.orbit && world.orbit.b === b;
  if (S.mode !== 'explore' || (!b.tapped && !isOrbited)) return;
  ```
### 3. Tap-to-Land/Orbit Support in Thruster Mode
Currently, when the Thruster item is enabled, the `pointerup` event immediately delegates to `explore.stickUp()` and returns early, entirely bypassing the tap-detection logic (`len <= TAP_MAX_LEN` and `explore.handleTap()`). This prevents players from clicking/tapping planets to orbit or land while using the Thruster.
- **`main.js`**: In the `pointerup` event listener, before returning early for Thruster mode, check if the stick interaction qualifies as a tap (i.e., the drag distance between `stick.cx` and `stick.ox` is less than `TAP_MAX_LEN`). If it is a tap, calculate `wx, wy` via `ui.toWorld(e)` and invoke `explore.handleTap(wx, wy)`.
- **Tests**: Add a test case ensuring that a quick tap while the Thruster is enabled correctly triggers the tap action rather than just canceling the stick.

## Prompt for Next Session
When you are ready to implement this plan in another session, you can use the following prompt with the AI agent:

> **"Please implement the Town Orbit and Auto-Label plan. The plan is detailed in 'Black Hole in One — Town Orbit and Auto-Label Plan.md'. Follow the plan and ship the changes end-to-end using the dev-ship skill."**
