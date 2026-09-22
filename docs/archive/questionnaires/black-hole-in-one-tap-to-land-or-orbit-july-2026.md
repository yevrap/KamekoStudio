# Black Hole in One — Tap to Land or Orbit Questionnaire (July 2026)

> **Status: ANSWERED & CONSUMED — 2026-07-18.** Q1-Q6 below turned into [Black Hole in One — Tap to Land or Orbit Build Plan (July 2026)](../plans/black-hole-in-one-tap-to-land-or-orbit-build-plan-july-2026.md) (full state machine, file:line hooks, a flagged one-read ambiguity between Q1's stated order and Q2's write-in, and a Done-when list for TAP-1/2/3). Kept here as the decision record — don't re-answer. Nothing is built yet; ORB-1 is untouched and still live until TAP-1 ships.

## Where things stand right now

- **ORB-1 (🧲 Orbit Magnet) shipped today** (`301effb`, live): fly anywhere into a planet or black hole's orbit band and the item **automatically** captures you into a stable orbit — no tap, no aim, no choice. Approach speed/angle don't matter; any entry into the band captures.
- **ORB-2 (🛬 flick-at-the-planet landing) was next, not yet built:** the plan had you flick *from* an existing orbit, aimed at the planet's disc, to trigger a guaranteed scripted descent onto the surface. Flicking elsewhere still ejects you as normal.
- **Your new ask replaces the interaction model, not just ORB-2.** A tap is a new gesture this game doesn't have anywhere yet during flight — today's *only* flight input is drag-and-release (pull back, release to flick; `main.js` `pointerdown`/`pointermove`/`pointerup`, `canvas` listeners around line 93). Introducing "tap the planet" means teaching the game to tell a tap (press-release, near-zero movement) apart from the start of a drag-aim, and to hit-test that tap against a planet's on-screen circle.

## Q1. Does tapping replace ORB-1's automatic capture, or sit alongside it?

This is the big one — it decides whether today's shipped behavior gets reworked.

- [x] **A — Full replacement (recommended read of "I've changed my mind").** Flying into the band no longer auto-captures you into anything. Instead, while approaching/near a planet, **tap it once → guaranteed landing** (scripted descent, same idea ORB-2 had, just triggered by a tap instead of a flick); **tap it again → guaranteed entry into a stable orbit instead.** The player always chooses; physics/speed/angle stop mattering entirely. This retires ORB-1's `magnetCapture()` auto-trigger in `explore.js`'s capture loop (the pure function can likely be reused as the "orbit" outcome's snap, just no longer fired automatically).
- [ ] **B — Tap governs the planet you're already engaged with; auto-capture stays.** ORB-1 keeps working exactly as shipped (fly close → auto-orbit, no tap needed). Tapping the planet *you're currently orbiting* triggers the guaranteed landing (replaces ORB-2's "flick at the disc" with "tap the disc"). Tapping the planet you're currently *resting on* launches you back into a stable orbit around it (a assisted alternative to flicking away and hoping to re-enter the band at the right speed). Smaller change — ORB-1 stays as-is, only the not-yet-built ORB-2 changes shape.
- [ ] Something else — write in:

## Q2. "Another tap" — same planet, second tap, or something else?

Confirming the read before it's built as a state machine.

- [ ] **A — A second, distinct tap on the *same* planet toggles the outcome** *(default)*: tap once, get one result; tap again (before or after it resolves), get the other. Sequence is per-planet, not global.
- [x] B — Write in a different sequencing model: i want the tap to bring the ship into orbit and landed on the planet 

## Q3. How close do you need to be for a tap to count?

Matters for whether this keeps a flight-skill component or becomes point-and-click travel.

- [x] **A — Only while already near/approaching the planet** *(default — e.g. inside or just outside today's orbit band, roughly `ORBIT_MAX_GAP` beyond the surface)*: you still have to fly the comet there first; the tap just resolves the outcome instead of leaving it to physics. Tapping a planet across the map does nothing.
- [ ] B — Tap works from any distance/anywhere on screen — the tap itself flies you to the planet (removes the flight/aim skill for planet interactions entirely; flicking would still exist for open travel between planets).
- [ ] Something else — write in:

## Q4. Scope — Explore only, or golf too?

Every existing inventory item (Thruster, Endless Flight, and ORB-1) is Explore-only; golf's `orbitCapture()`/collision code is explicitly kept byte-identical per the arc's architecture rule.

- [x] **A — Explore only, same as every other inventory item** *(default)*
- [ ] B — Golf too — write in which mode(s) and why:

## Q5. Discoverability — how does the player learn the two-tap sequence?

The star map's planned fast-travel (MAP-2, not yet built) already uses a two-tap-confirm pattern (tap selects + highlights, tap again travels) — this could reuse that visual language for consistency.

- [x] **A — First tap shows a label/highlight on the planet ("🪐 Tap again to orbit" or similar), same visual language as MAP-2's star-map confirm** *(default — keeps the two two-tap mechanics feeling like one system)*
- [ ] B — One-time toast the first time it happens, no persistent on-planet label
- [ ] Something else — write in:

## Q6. Anything else about the feel you want on record before this gets built?

- [ ] Nothing else — build it from the defaults above
- [x] Write-in: i want it to be intuitive and fun to use and look at

---

*Once answered, this turns into a build plan the same way the [Black Hole in One — Next Arc Questionnaire (July 18, 2026)](black-hole-in-one-next-arc-july-18-2026.md) became [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md) — full file:line hooks, a done-when list, and (if Q1=A) a plan for what happens to the already-shipped ORB-1 code. See [Improvements](../../games/black-hole-in-one/ideas.md) for the live checklist and [Dev Log](../dev-logs/black-hole-in-one.md) for the ORB-1 ship entry this supersedes the next steps of.*
