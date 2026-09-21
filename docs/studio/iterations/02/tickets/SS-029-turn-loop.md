# SS-029 — One hold runs one animation loop

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SS-025
- **Branch:** `ss-029-turn-loop`

## Motivation

Opened by the second independent review. `hold()` schedules an animation frame, and a frame
already pending from a previous hold also saw `session.held` set and carried on beside the
new one. Measured by the reviewer: six `pointerdown`/`pointerup` pairs dispatched in one
task left seven concurrent loops, each running a full `paint()` per frame — 434 readout
rewrites during a one-second hold against a baseline of 61. Reachable by a fast tapper or a
noisy touch digitizer.

## Acceptance criteria

- [x] Each hold carries an id, and a frame belonging to an older hold retires instead of
      continuing.
- [x] After six rapid press/release pairs, a one-second hold schedules the same number of
      frames as a clean one.
- [x] The turn rate is unchanged.

## Evidence plan

Count `requestAnimationFrame` calls during a one-second hold, clean and after rapid taps.

## Out of scope

- Everything else in `main.js`. This is one loop.

---

## Result

- **What changed:** `studio/games/overtighten/main.js` — `session.turnId`, incremented by
  each `hold()`; `step()` takes the id it was scheduled for and returns immediately when it
  is not the current one.

- **Tested by:** counting frames scheduled during a one-second hold, with the page's
  `requestAnimationFrame` wrapped before any of its own code ran.

  | | frames | torque |
  |---|---|---|
  | clean hold | 63 | 43 |
  | after six rapid press/release pairs | 61 | 42 |

  Previously seven loops ran concurrently in the second case.

- **A mistake made and caught inside this ticket, recorded because of what caught it:** the
  first version named the parameter `turn`, which **shadowed the `turn()` torque rule
  imported from `gameplay.js`** — so `turn(plate, …)` became a call on a number and every
  hold died silently. `studio-boot` failed it immediately with *"the game threw while being
  played: uncaught: turn is not a function"*. That rule exists because the first
  independent review found the driven phase running with no error listener at all. It
  caught a real accident within an hour of being added.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
