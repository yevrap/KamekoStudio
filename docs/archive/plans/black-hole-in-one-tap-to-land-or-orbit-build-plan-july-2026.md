# Black Hole in One — Tap to Land or Orbit Build Plan (July 2026)

> **Status: PLANNED 2026-07-18 — ready to ship, nothing started.** Consumes [Black Hole in One — Tap to Land or Orbit Questionnaire (July 2026)](../questionnaires/black-hole-in-one-tap-to-land-or-orbit-july-2026.md) (Q1=A full replacement, Q2=write-in sequencing, Q3=A proximity-gated, Q4=A Explore only, Q5=A MAP-2-style label, Q6=write-in intuitive/fun). **Supersedes ORB-2's original flick-at-the-disc spec and reworks ORB-1's already-shipped auto-capture**, both in [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md) — that note's Wave 1 ship order becomes ORB-1(reworked, see TAP-1) → TAP-2 → TAP-3 → ORB-3 → ORB-4. Overview: [Black Hole in One](../../games/black-hole-in-one/README.md) · backlog checklist: [Improvements](../../games/black-hole-in-one/ideas.md) · ship history: [Dev Log](../dev-logs/black-hole-in-one.md) · repo `games/black-hole-in-one/`.

## North star (Yev's words, right after ORB-1 shipped, 2026-07-18)

> "I've changed my mind. I want a plan for having a tap on the planet to land and another tap to orbit to be the functionality tied to that item/setting/feature."

ORB-1 (🧲 Orbit Magnet, shipped `301effb`) made every approach auto-resolve into an orbit with no player choice. That's exactly what this redesign removes: the player now **chooses** land-or-orbit with a deliberate tap, and physics/speed/angle stop mattering for the outcome — they only matter for whether you can get close enough to tap at all.

## ⚠️ One-read call — confirm or flip before/while building

Q1's header quote and its chosen option A both say the sequence as **"tap → land, tap again → orbit."** Q2's write-in says **"tap...bring the ship into orbit and landed on the planet,"** which reads order-reversed. Rather than guess a strict global first-tap/second-tap counter, this plan resolves both readings at once by making the tap **state-resolved, not counted**:

- Tap a planet you're **approaching** (in flight, within the orbit band) → **lands** you (matches the header quote + Q1=A exactly).
- Tap the planet you're **resting on** → **launches you into orbit** around it (matches Q2's mention of orbit).
- Tap the planet you're **already orbiting** → **lands** you (the mirror case — not explicitly asked, but falls out of the same rule, and is exactly what retires the old ORB-2 flick-at-the-disc trigger).

If this reads backwards from what you actually meant — e.g. you wanted the *first* encounter to orbit and a *second* tap while orbiting to land — it's a one-line swap between TAP-2 and TAP-3 below, not a redesign. Flag it at the Wave-1 checkpoint if the built feel is wrong; don't block the build on it, per Q6's steer that the details are all in service of "intuitive and fun."

## Decisions consumed

| Question | Decision | Consequence |
|---|---|---|
| Auto-capture vs. tap (Q1) | **Full replacement (A)** | `magnetCapture()`'s auto-fire in `explore.js`'s capture loop is retired. Item ON → capture only happens via a deliberate tap. Item OFF → today's pre-ORB-1 strict `orbitCapture()` still auto-fires exactly as it did before ORB-1 shipped (the "magnet off" baseline is preserved, not deleted). |
| Sequencing (Q2) | **State-resolved, not a toggle counter** | No per-planet tap counter. What a tap does depends on the comet's *current engagement* with that planet (approaching in-band / resting on it / orbiting it) — see the state machine below. |
| Proximity gate (Q3) | **A — must already be engaged** | A tap only resolves against a planet the comet is *currently* within the orbit band of, resting on, or orbiting. A tap that hits a planet's on-screen disc with no such engagement is a no-op — tapping a planet across the map does nothing. |
| Scope (Q4) | **A — Explore only** | `orbitCapture()`, `game.js`, `gameplay.js` untouched — golf stays byte-identical, same as every prior item in this arc. |
| Discoverability (Q5) | **A — persistent on-planet label, MAP-2 visual language** | First tap-driven action on a planet shows a highlight + short label naming what the *next* tap there will do, in the same chrome MAP-2's two-tap star-map confirm uses. |
| Feel (Q6) | **Write-in — intuitive, fun, nice-looking** | Folded into every item's Done-when as an explicit "reads clearly, feels responsive, looks good" verification pass — same bar the rest of this arc already holds itself to. |

## Interaction model (the state machine)

No toggle, no counter — just three engagement states, each with one guaranteed tap outcome:

1. **`S.phase === 'flight'`, planet's `gap` (distance − radius, same `ORBIT_MIN_GAP..ORBIT_MAX_GAP` band ORB-1 used) in range** → tap that planet → **guaranteed scripted landing** (TAP-2, "from flight").
2. **`S.phase === 'rest'`, `comet.rest.b === tapped planet`** → tap it again → **guaranteed scripted orbit launch** (TAP-3).
3. **`S.phase === 'orbit'`, `world.orbit.b === tapped planet`** → tap it → **guaranteed scripted landing** (TAP-2, "from orbit" — this is the exact case that retires ORB-2's flick-at-the-disc trigger; same descent, different trigger).
4. **Anything else** (tap on empty space, a planet you're not engaged with, a black hole, or while the 🚀 Thruster item is enabled) → no-op, today's behavior is unchanged.

**Scope note — Thruster interaction.** This whole mechanic lives in the drag-anywhere flick control path (`main.js` `pointerdown`/`pointermove`/`pointerup`, ~93–163). When 🚀 Thruster is enabled, pointer input is captured entirely by the floating stick (`main.js:98-105`, `explore.stickDown/Move/Up`) and never reaches this code — tap-to-land/orbit simply won't fire while Thruster is on, same as ORB-1/ORB-2 never touched Thruster either. This isn't a gap to close here; it's consistent with the Next Arc Questionnaire's Q1 verdict that items modify play and flicking stays the default control scheme this mechanic belongs to.

## Architecture principles (extends the Orbits & Star Map Build Plan's)

- **No ghost simulation, still.** The scripted descent/ascent are simple fixed-duration eases (~0.5–0.7s of real time), not simulated ahead — same rule as everywhere else in this arc.
- **Golf stays byte-identical.** `orbitCapture()` untouched; every new function is Explore-only and item-gated.
- **`magnetCapture()` (already shipped, `physics.js:84-96`) is reused, not deleted.** Its call site in the automatic capture loop goes away; its math becomes the basis for TAP-3's "snap into a valid orbit" step, since it already produces a valid `{radius, omega, ang}` without requiring approach-velocity conditions.
- **Reuse existing patterns, don't invent new ones:** the one-time-toast pattern (`shownPushHint`, `explore.js:343`) for first-use hints; the eased-state-machine pattern `stepWarp` (`explore.js:583`) already established for scripted motion; MAP-2's two-tap-confirm visual language (from [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md)'s Wave 2) for the on-planet label, even though MAP-2 itself hasn't shipped yet — same *look*, independent code.
- **Tap vs. drag needs an actual threshold.** Today's `pointerup` (`main.js:154-162`) treats **any** nonzero release movement as a flick (`len > 0`) — on a real touchscreen a "tap" always has some finger jitter, so this boundary cannot currently tell a deliberate tap from an accidental micro-flick. TAP-1 introduces a real threshold constant.

---

## Ship order: TAP-1 → TAP-2 → TAP-3 (then resume ORB-3 → ORB-4)

- [ ] **P1 · TAP-1 — Tap gesture detection + retire ORB-1's auto-capture.**
  - **Constant:** `TAP_MAX_LEN` in `constants.js`, beside `MIN_SHOT` — a small world-unit threshold below which a release counts as a tap rather than a flick or a cancelled shot. Pick a value comfortably below `MIN_SHOT`'s own dead zone so a tiny deliberate flick and a real tap don't collide; tune by feel, not derived.
  - **Hook — `main.js` `pointerup` (line 142-163):** where `len` is currently computed (`const dx = drag.sx - drag.cx, dy = drag.sy - drag.cy; const len = Math.hypot(dx, dy);`), branch: `len > TAP_MAX_LEN` → today's flick path unchanged; `len <= TAP_MAX_LEN && S.mode === 'explore'` → call new `explore.handleTap(drag.cx, drag.cy)` (world coords, already computed as `wx, wy` earlier in the handler) **before** falling through to the existing phase-restore line; golf (`game.launch`) keeps its exact current behavior — no new tap handling in `game.js`.
  - **New `explore.js` export `handleTap(wx, wy)`:** hit-test `wx, wy` against `world.bodies` of `type === 'planet'` (disc test against `b.r` plus a tap-friendly padding, same spirit as MM-8's pulsar hit-radius bump for mobile tappability — small planets need a forgiving hit box). For the hit body, branch on current engagement:
    - `S.phase === 'flight'` and the body's `gap` (`dist(comet.x,comet.y,b.x,b.y) - (b.r + COMET_R)`, same math `orbitCapture`/`magnetCapture` already do) is inside `[ORBIT_MIN_GAP, ORBIT_MAX_GAP]` → call TAP-2's `beginDescentFromFlight(b)`.
    - `S.phase === 'rest'` and `comet.rest.b === b` → call TAP-3's `beginAscend(b)`.
    - `S.phase === 'orbit'` and `world.orbit.b === b` → call TAP-2's `beginDescentFromOrbit()`.
    - otherwise → no-op, return.
  - **Retire the auto-fire:** in the capture loop (`explore.js:528-548`), the line `const capture = S.inventory.orbitMagnet?.enabled ? magnetCapture : orbitCapture;` changes to always use `orbitCapture` — the item no longer changes what happens *automatically*. The item flag now only gates whether `handleTap` does anything (checked inside `handleTap`, not the auto-loop). This keeps "item OFF" meaning exactly what it always meant (today's pre-ORB-1 strict physics baseline) and keeps "item ON" as purely additive (tap becomes available; nothing new happens on its own).
  - **Registry text:** update `constants.js:185`'s `desc` from *"Planets catch you — pass close and you swing into orbit. Flick at the planet to land."* to something naming the new mechanic, e.g. *"Tap a nearby planet to land. Tap it again to swing into orbit."*
  - *Done when:* a real tap (dispatched `PointerEvent`s with sub-`TAP_MAX_LEN` movement) on an in-range planet in flight calls `handleTap` and does not also fall through to a flick or a phase-restore no-op; a release above `TAP_MAX_LEN` still flicks exactly as today (regression); item OFF makes `handleTap` a no-op in every engagement state and the automatic loop reproduces pre-ORB-1 `orbitCapture`-only behavior exactly (regression test against the original ORB-1 pre-ship behavior); golf (`game.js`/`gameplay.js`) has zero lines changed; full suite green; verified in-browser at 375px + desktop by dispatching real `PointerEvent`s with near-zero deltas at a planet's screen position.

- [ ] **P1 · TAP-2 — Tap-triggered scripted landing (from flight-approach or from live orbit).**
  - Generalizes the never-built ORB-2 descent spec to two entry points instead of one flick-triggered one.
  - **New `world.descent` state**, two constructors:
    - `beginDescentFromFlight(b)`: `r0` = current distance to `b`, `a0` = current angle to `b`; decompose current velocity into radial/tangential components the same way `orbitCapture` already does (`nx,ny` unit vector, `vr`, `vt`) so the ease blends from whatever the comet was actually doing, not an assumed circular path.
    - `beginDescentFromOrbit()`: `r0 = world.orbit.radius`, `a0 = world.orbit.ang`, angular rate `= world.orbit.omega` — already circular, this is exactly the original ORB-2 math.
    - Both set `S.phase = 'descend'`.
  - **New `stepDescent(dt)`** (mirrors `stepWarp`, `explore.js:583`): eases `radius: r0 → b.r + COMET_R` and keeps the angle advancing (decaying any angular rate toward zero as it nears the surface) over ~0.7s, then lands through the **existing** rest path verbatim — `comet.rest = {b, ang}`, `placeOnRest()`, `comet.vx = comet.vy = 0`, `hooks.sfx.land()`, `hooks.burst(...)`, and the refuel-station check (`explore.js:498-502`) — reuse that block, don't duplicate it.
  - **Wire `'descend'`** into `main.js`'s frame loop beside `'warp'`.
  - **Fuel — default: free.** No `launch()` call happens here (it's a tap, not a flick spend); charging fuel for a tap that didn't move the comet anywhere it wasn't already headed would be a surprising, unstated tax against Q6's "intuitive and fun" steer. Flag this default at the Wave-1 checkpoint rather than deciding it's final — a flat cost is the fallback if playtesting says taps need a downside.
  - **Affordances:** first-ever descent (either entry point) → one-time toast `🛬 Tap to land!` (`shownPushHint`-pattern flag). Persistent on-planet label (Q5): after any first tap-interaction with a given planet, show a small pill/highlight near it reading `🪐 Tap again to orbit` while resting there — same visual language as MAP-2's star-map confirm chrome (from the Orbits & Star Map Build Plan's Wave 2), built independently since MAP-2 itself hasn't shipped.
  - *Done when:* tapping an in-range planet in flight always lands regardless of approach speed/angle (integration test: drive `step()` toward a planet along varied vectors, tap, assert `phase==='rest'` on that body within N ticks, zero bounces); tapping an orbited planet always lands the same way (integration test from a live `world.orbit`); either entry point refuels correctly on a station landing; `phase==='descend'` blocks re-tap/re-capture mid-ease; item OFF makes taps inert in both entry states (regression); golf untouched; full suite green; verified at 375px + desktop.

- [x] **P1 · TAP-3 — Tap-triggered scripted orbit launch (from resting on a planet).**
  - **New `S.phase = 'ascend'`, `world.ascend = { b, r0, a0, t }`** — `r0` = the comet's current resting radius (`b.r + COMET_R + 0.25`, wherever `placeOnRest()` left it), `a0 = comet.rest.ang`.
  - **New `stepAscend(dt)`** mirrors `stepDescent` in reverse: eases radius outward from `r0` toward a target radius inside `[ORBIT_MIN_GAP, ORBIT_MAX_GAP]` over ~0.5s. At completion, hand off using `magnetCapture`'s existing shape — construct the target `{radius, omega, ang}` the same way `magnetCapture` would (reuse its band/circular-speed math rather than re-deriving it by hand) and set `world.orbit = {...}`, `S.phase = 'orbit'`, with the same sfx/burst treatment ORB-1's capture already uses (`explore.js:545-548`).
  - **Wire `'ascend'`** into `main.js`'s frame loop.
  - **Fuel — default: free**, same reasoning as TAP-2; flag together at the checkpoint.
  - **Affordances:** first-ever ascend → one-time toast `🧲 Tap again to land` (mirrors TAP-2's toast — whichever direction the player discovers first teaches the other). The per-planet label from TAP-2 re-evaluates on phase entry: resting → `🧲 Tap to orbit`, orbiting → `🪐 Tap to land` — same label mechanism, just read fresh each time engagement changes.
  - *Done when:* tapping the planet you're resting on always ascends into a valid stable orbit (integration test across varied planet sizes/masses, asserting the resulting `world.orbit` passes the same invariants ORB-1's own capture tests check — band radius, valid omega, correct direction); ascend can't be interrupted or re-triggered mid-ease; item OFF makes the tap inert and the comet stays resting (regression); golf untouched; full suite green; verified at 375px + desktop.

**⏸️ Checkpoint — Yev plays before ORB-3/ORB-4 resume.** Two things flagged above are real feel calls, not architecture, and should be confirmed or flipped here rather than mid-build: **(1)** the state→action mapping in the "One-read call" section above — does land-then-orbit feel right, or should it run the other way? **(2)** fuel-free taps — does giving both transitions away for free undercut the fuel economy, or does it feel appropriately different from a flick (which already costs 15)? Once confirmed, Wave 1 resumes in its original order — **ORB-3** (station refuel trickle) → **ORB-4** (stardust rings) — both attach to `world.orbit` however it was entered and are otherwise **unaffected** by this redesign; their specs in [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md) stand exactly as written.

---

## What this changes in the existing Orbits & Star Map Build Plan

- **ORB-1** (shipped `301effb`) is **reworked, not reverted.** Its registry item, its `magnetCapture()` function, and its capture-ring render affordance all stay — only its *automatic* call site in the capture loop is removed (folded into TAP-1 above).
- **ORB-2** as originally spec'd (flick-at-the-disc guaranteed landing) is **retired, replaced entirely by TAP-2.** The flick-ray-intersection helper (`flickHitsBody`) from the original spec is no longer needed — tap hit-testing replaces it.
- **ORB-3 and ORB-4 are unaffected** — they were always designed to attach to whatever `world.orbit` holds, regardless of how the comet got there; no changes needed to either spec.
- **MAP-2** (Wave 2, free fast travel) still arrives comets **in orbit** via a shared `arriveInOrbit()` — unrelated to this redesign, unaffected, stays queued after the Wave 1 checkpoint.

## Repo facts for whoever ships this

Repo: `games/black-hole-in-one/`. Tests: `node --test tests/`, `npm run smoke`, `npm run e2e`. Dev server: `preview_start` name `"arcade"`, game at `/games/black-hole-in-one/`. Verify in-browser by dispatching real `PointerEvent`s at the canvas (not the synthetic click/tap tools) so `pointerId` capture and the drag/tap distinction actually exercise; drive physics manually alongside dispatched events if the preview tab's `requestAnimationFrame` turns out to be paused in the background (check rather than assume — see the Dev Log's verification notes for how to tell). Golf regression is cheap insurance here — run the full suite, not just new tests, before every commit, per this arc's own rule.

---

*Convention, same as every arc: each item, as it ships, gets checked off in [Improvements](../../games/black-hole-in-one/ideas.md) (source of truth for done) plus a Dev Log entry. Don't start ORB-3 past the ⏸️ checkpoint until Yev has actually played TAP-1/2/3. When this closes, the overview note's current-state section and the Orbits & Star Map Build Plan's status line both get a pass.*
