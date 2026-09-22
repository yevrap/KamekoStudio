# Black Hole in One — Stable Orbits Exploration

> **Status: SHIPPED July 15, 2026 (BH-4, v27 `4dfb217`).** This note is the design reference that drove the build; it stays live as the mechanic's design rationale. Follow-up tuning is now in [Black Hole in One — Orbit Tuning Questionnaire](../questionnaires/black-hole-in-one-orbit-tuning.md). Yev's write-in picked a **live orbit you flick out of** (a variant of Option B): the comet orbits and stays orbiting, and the player uses the existing drag-anywhere aim to launch it back out. Triaged out of the Improvements inbox line: *"stable orbits around planets in addition to landing on the planet. how can we make this interesting?"* Overview: [Black Hole in One](../../games/black-hole-in-one/README.md) · sprint: [Black Hole in One — Style & Stats Sprint (July 2026)](../../games/black-hole-in-one/plans/style-and-stats-sprint.md) · backlog: [Improvements](../../games/black-hole-in-one/ideas.md).

## ✅ Decision (Yev, July 15) — the "orbit-and-flick" mechanic

> *"Have it orbit. And allow the player to start pulling on it from anywhere on the screen. When the player lets go, it goes as if the player is exerting a force in that direction."*

The comet enters a **live orbit** around a planet (not a frozen rest state), circles it indefinitely, and the player flicks it out with the normal drag-anywhere aim — the release vector is a **force impulse added to the comet's current orbital velocity** (not a launch from standstill). This is the "flourish" reward of Option A but with real motion instead of a snapped freeze.

### Yev's ruling on pause-proofing (July 15, follow-up)

> *"I don't mind not being pausable in that sense. If the button works, that's all I want. Having orbits and complicated motion is what I want — and the player to have a force-push-like influence."*

**Pause-proofing is no longer a design constraint.** The old "fully at rest between flicks" property is dropped by choice. The only requirement is that the existing **auto-pause freezes and resumes cleanly** (tab blur / visibility / settings drawer → `S.paused` halts the sim, refocus resumes). Live orbits and multi-body complicated motion are now an **intended feature**, not a risk to contain. This also means: don't fight long, curvy, multi-planet flights — lean into them. (Revisit whether the space-dust decay / `FLIGHT_CAP` should be *loosened* generally so interesting motion lasts, not just inside orbit — see open note below.)

### Concrete spec (BH-4) — force-push model

- **Force, not teleport.** The player's flick is a **force impulse applied to the comet**, added to whatever velocity it already has. On the tee the comet is at rest, so impulse ≈ launch velocity (unchanged from today). In an orbit (or any motion) the impulse **bends the existing trajectory** — that's the "force-push-like influence" Yev wants. Drag anywhere → release = a directional shove.
- **Entry into orbit.** When a flight passes through a planet's influence band at a speed/angle near-circular for that radius, transition `flight → orbit` around that planet instead of decaying, landing, or escaping. Newtonian orbits are unstable here, so **station-keep**: snap the comet to a stable circular path (radius = capture distance, velocity = tangential) and hold it. The orbit persists until the player flicks out.
- **During orbit.** Comet keeps moving (the point). **Suspend space-dust drag (`DUST_T`) and `FLIGHT_CAP` while orbiting** so the orbit doesn't decay away.
- **Flick-out.** Player can `pointerdown` anywhere while orbiting (aim is already screen-anywhere, not on the comet). On release, add the drag vector as an impulse to current orbital velocity → back to `flight`. Costs one stroke, like re-teeing off a landed planet. The aim preview must integrate from the comet's *current* position **and** current velocity + the impulse, or it lies.
- **No stroke to enter orbit** — it's a consequence of the previous flick, like landing.
- **Reward.** Entering an orbit banks a ⭐ (optional — the ⭐ plumbing arrives with [BH-1](../../games/black-hole-in-one/plans/style-and-stats-sprint.md); BH-4 can ship without it) and fires a "🛰 ORBIT!" toast, first per hole.

### Open sub-question (not blocking — build's call, note it in the ship)
With motion now a feature, does the **normal** flight also want longer legs — i.e. loosen `DUST_T` (9s) / `FLIGHT_CAP` (24s) so complicated multi-planet paths play out instead of getting dust-dragged into the hole? Default: leave them as-is for non-orbit flight, only suspend them inside orbit. Flag in the Dev Log if the build finds the caps fighting the "complicated motion" goal.

## The idea

Today a slow comet **lands on** a planet (`REST_V` window in `collide()`) and re-tees from its surface. The suggestion: a comet at the *right* speed and angle could instead **enter a stable orbit** around a planet — circling it a few times before you flick again from the orbit.

## Why it's not a free win

- **Pause-proofing (the load-bearing constraint).** BHIO is "at rest between flicks" *by construction* — that's why orbiting moons were cut. A comet parked in a live orbit is **in motion at rest**, which breaks the pause-proof property unless the orbit freezes the instant the comet stops (see design source [Black Hole in One](../../games/black-hole-in-one/README.md) "How it pauses").
- **Physics reality.** Real orbits in this sim are unstable — gravity is Newtonian and any perturbation decays or escapes (that's *why* "space dust" drag exists after 9s). A truly stable orbit has to be **scripted/snapped**, not emergent.
- **"Landed" already reads as the reward.** The current land-and-hop is legible. An orbit needs to feel *better* than landing, or it's just a slower land.

## Options (pick one for Yev)

**A — Orbit capture as a skill flourish (recommended).** If the comet crosses a planet's influence ring within a tight speed band, it **snaps into a fixed circular orbit** and freezes there as the new rest state (pause-safe: it's a still frame until you flick). Visually it's parked mid-orbit with a faint orbit ring drawn; the next flick releases tangentially, so a good orbit *hands you free launch speed and a new angle*. Banks a ⭐ like a slingshot. **Interesting because:** it's a third landing type between "land on surface" and "slingshot past" — a precision reward, not a new rule to learn.

**B — Live decaying orbit (against the grain).** The comet actually orbits for N seconds (motion continues), decaying via the existing space-dust drag until it lands or sinks. **Cost:** breaks pause-proofing during the orbit window, reopens exactly what killed orbiting moons. Only viable if the orbit is short (<~3s) and treated like an extended flight, not a rest state. Not recommended.

**C — Leave it.** Landing already covers "the planet caught you." Slingshots already cover "the planet slung you." An orbit may be a mechanic without a job. Close the inbox line.

## Question — ANSWERED

- [ ] **A — orbit-capture flourish** (snap to a frozen orbit, tangential release, banks ⭐) *(recommended)*
- [ ] **B — live decaying orbit** (accepts a short motion-at-rest window)
- [ ] **C — leave it** (close the idea; landing + slingshot already cover the space)
- [x] **Write-in (chosen):** have it orbit. and allow the player to start pulling on it from anywhere on the screen. when the player lets go, it goes as if the player is exerting a force in that direction.

→ **Consumed into backlog item BH-4** (spec above). This note stays live as the design reference until BH-4 ships, then archives to `docs/archive/`.
