# Black Hole in One — Thruster & Flight Controls

> **Status: INV-3a/b/c all shipped — the Thruster arc is complete.** INV-3a/b shipped 2026-07-16 (`2857836`, `6664585`); INV-3c shipped 2026-07-17 (`a53fe66`) — see the Dev Log for the root-cause finding (Explore's Giant/Dwarf density multipliers were quietly breaking the "beats every planet" guarantee even before this pass) and full verification trail. Was part of a 3-item sprint — **FUEL-1 → INV-3c → FUEL-2** — FUEL-1 and INV-3c are both shipped; FUEL-2 is next, see [Improvements](../../games/black-hole-in-one/ideas.md)'s ⛽ Fuel Economy & Thruster Feel section. Parent arc: [Black Hole in One — Explore Inventory System](../../games/black-hole-in-one/plans/explore-inventory-system.md) (INV-1, INV-2 shipped) · overview: [Black Hole in One](../../games/black-hole-in-one/README.md) · repo `games/black-hole-in-one/`.
>
> **Agents: this note is self-contained.** Architecture, file:line anchors, tuning constants, slice order, Done-when criteria, and the known gotchas are all below. INV-3a/b/c are all built — see the ⚠️ agent-interpretation note right after the Slices list, and the INV-3c decisions table (with its post-ship addendum on the density-multiplier finding) further down.

## Origin

Yev's inbox line, July 16 2026, verbatim:

> *"Fly with circle controller not push. item that works with never running out of fuel as well as with metered fuel."*

Plus, same session: *"i also want to have arrow and wasd controls on keyboard."*

This lands squarely in the Inventory arc's stated purpose — *"i want to have these items to test out more game mechanics."* It is the most informative experiment the testbed has produced so far, because it doesn't modify the push; it **replaces the entire control scheme** and asks whether Explore is a better game as a flying game than as a flicking game. It therefore **takes the INV-3 slot** from the previously-recommended ⚡ Precision Thrusters, which is demoted to INV-5 (see [Black Hole in One — Explore Inventory System](../../games/black-hole-in-one/plans/explore-inventory-system.md)).

## What it is

**🚀 Thruster** — an Explore-only inventory item. Switch it on and the flick is gone: touch anywhere and a circle materializes under your thumb, and you fly the comet directly with an analog stick. Push the nub toward where you want to go; how far out you push is your throttle. Let go and you coast ballistically, exactly as today. On a laptop, WASD or the arrow keys do the same job.

The thrust is genuinely strong — it beats every planet's surface gravity, so you can lift off under power, hover, fight a giant, and go where you point. **Explore stops being golf and becomes flying.** That is the point of the experiment, and it's survivable precisely because it's Explore-only behind a toggle: the golf modes' "gravity is the club" pillar is untouched, and flipping the item off restores flick-Explore bit-for-bit for an honest A/B.

Fuel is the whole cost model. With metered fuel, holding the stick burns fuel continuously (scaled by throttle), so feathering the throttle to stretch a tank is its own skill; run dry and you're towed home instantly. With **♾️ Endless Flight** also on, fuel never drains and the Thruster is a free-flight sandbox. Both items compose cleanly — that's Yev's explicit *"works with never running out of fuel as well as with metered fuel."*

## Decisions (Yev, 2026-07-16 — do not re-litigate)

| # | Question | Answer |
|---|---|---|
| T1 | Thrust model | **Analog thrust stick.** Direction + throttle from one circle. Not rotate-and-burn (no heading state), not steering-only. |
| T2 | Thrust strength vs gravity | **Strong — a spaceship.** Beats most gravity. Explicitly accepted: planets become things you use *and* dodge, not the sole engine of movement. |
| T3 | Fuel cost, metered | **Per-second burn while thrusting**, scaled by throttle. Replaces the flat −15/flick while the item is on. |
| T4 | Scope | **Explore-only item, INV-3 slot.** Endless and golf untouched — the EXP-1 pillar holds. |
| T5 | Stick layout | **Floating stick where you touch.** No fixed hotspot, no handedness, keeps the game's "touch anywhere" philosophy. |
| T6 | Flick coexistence | **Thruster replaces the flick in Explore entirely.** ON = you fly, OFF = you flick. No gesture collision to solve; the toggle *is* the A/B. |
| T7 | Keyboard scope | **Thrust only.** Arrows/WASD drive the stick in Explore. No keyboard aiming in golf — that stays a separate future item. |
| T8 | Empty tank | ~~Tow home immediately at 0, mid-flight or not.~~ **⚠️ REVERSED 2026-07-17** ([Black Hole in One — Thruster Feel & Fuel Economy Questionnaire](../questionnaires/black-hole-in-one-thruster-feel-and-fuel-economy.md), Q1) — Yev now wants **no auto-tow at all**, in any phase, Thruster on or off: *"I don't need auto go back to town."* Coast-and-pray after all, but signaled: the restart button pulses/glows while stranded instead of the player wondering why nothing happens. See FUEL-1 in [Improvements](../../games/black-hole-in-one/ideas.md) for the current, authoritative scope. |
| T9 | Stick polarity | **Push toward — drag up, fly up.** Standard joystick, matches WASD exactly. Diverges from the flick's pull-back convention, which is fine because the flick is gone when this is on. |
| T10 | Flight readout | **The trail is enough.** No aim arrow, no velocity vector, no live trajectory prediction. The half-second preview existed because a flick was committed-and-unrecoverable; thrust is continuously correctable. |

### ⚠️ Scoping note on T8 — superseded 2026-07-17, kept for history

This note (and the flick-scheme rest-gated tow it defended) is now moot: T8 itself was reversed the same day — there's no more auto-tow to scope in the first place. Kept here rather than deleted since it explains *why* the original code (`shouldTowHome()`'s phase-gating) looked the way it did before FUEL-1 removed it. Original text follows for the record:

*The question was framed around continuous burn, so T8 was scoped to the Thruster being ON. Flick-scheme Explore kept the rest-gated tow. The reason was a concrete regression: a flick costs −15 charged at launch, so flicking with exactly 15 in the tank drops fuel to 0 while the comet is airborne. A globally-immediate tow would yank the player home mid-shot, deleting the last flick they just paid for.*

## Design rationale — why "strong" survives

The obvious objection to T2 is that strong thrust kills the game's identity. It doesn't, for three reasons worth writing down before someone re-opens this:

1. **Golf never sees it.** The pillar lives in Endless and the golf modes, which the Explore-only gate keeps bit-for-bit identical. Nothing that makes Black Hole in One *Black Hole in One* is at risk.
2. **The toggle is the experiment.** The testbed's entire value is being able to flip a mechanic off and feel the difference. A timid tune would produce a mushy verdict; a strong one produces a real answer to "is Explore better as a flying game?"
3. **Gravity is still doing the work — it just moved.** See the throttle-vs-cap note below: because `MAX_V` pins top speed in under half a second, the *analog range of the throttle expresses itself against gravity, not against top speed*. Near a planet, partial throttle is a live negotiation with a 300+ u/s² pull. Gravity stops being the club and becomes the wind.

## Tuning constants (starting values — superseded by INV-3c's ship, kept for history)

**⚠️ These are the INV-3a/b launch values, not current.** INV-3c (shipped 2026-07-17) changed `THRUST_A` to 385 and found the "370 at the giant" math below was itself wrong — see the post-ship addendum in the INV-3c decisions table above for what actually shipped and why.

All new, in `constants.js` beside the existing tuning blocks:

```js
// ---- Thruster (INV-3), Explore only ----------------------------------------
export const THRUST_A     = 400;  // world u/s² at full throttle
export const THRUST_BURN  = 8;    // fuel/second at full throttle (× throttle)
export const STICK_R_PX   = 46;   // CSS px from stick origin = full throttle
export const STICK_DEAD_PX = 8;   // CSS px deadzone — a tap must not fire a blip
```

**Why `THRUST_A = 400`.** Planet mass is `r²` and `G = 400`, so surface gravity is `400·r²/(r+1.6)²` — **297 u/s² at r=10, 340 at r=20, 370 at r=40 (a giant)**. 400 beats all of them, which is what T2 asks for. It never beats everything: `gravityAt()` (`physics.js:18`) clamps `d²` to a floor of `(0.8·r)²`, capping any body's pull at `G·m/(0.64r²)` = **625 u/s²** — so a comet essentially inside a body still loses. That's a good failure mode, and it's already there for free.

**⚠️ Do not raise `MAX_V` to make thrust feel faster.** `MAX_V = 175` is a tunneling guard, not a taste call: at 175 u/s and `DT = 1/240` the comet moves 0.73 u/step, comfortably under `COMET_R = 1.6`. At 400 u/s it moves 1.67 u/step and starts passing *through* small bodies, because `stepBody()` collision is a point test per step, not a swept test. Raising the cap means writing swept collision first. Out of scope.

**Throttle-vs-cap, the thing that will feel surprising.** At full throttle from a standstill you hit `MAX_V` in 175/400 ≈ **0.44 s**. Top speed is therefore effectively binary and the throttle looks useless in open space. It isn't — its analog range shows up wherever gravity is (see rationale #3 above). This is a real design property, not a bug; note it in the playtest verdict rather than "fixing" it by nerfing thrust.

**Why `THRUST_BURN = 8`.** A 100 tank (L0) = **12.5 s of continuous full burn**, and a fuel pickup (+20 at Siphon L0, +45 at L3) buys 2.5–5.6 s. Compare the flick's −15: ~6.7 flicks/tank. A ~2 s burn costs about one flick and gets you to top speed *with steering* — roughly comparable value, which is the point. `tankMaxFuel()` and `siphonGain()` (the EXP-1 upgrades) apply unchanged, so the Town Shop composes with this for free. **This is the primary tuning knob; expect to move it.**

## Architecture

### The single most important refactor: `burnFuel()`

There is now more than one place that spends fuel, and each one must independently respect the Endless Flight fuel-lock. Today that logic is inlined in `launch()` (`explore.js:238-241`). **Extract it before adding the second drain site**, or the two items will drift apart:

```js
// Spend fuel, unless Endless Flight (INV-1) has the tank locked. Every fuel cost
// in Explore goes through here so item N+1 gets the fuel-lock interaction free.
function burnFuel(amount) {
    if (S.inventory.endlessFlight?.enabled) return;
    fuel = Math.max(0, fuel - amount);
}
```

`launch()` becomes `burnFuel(15)`; the thrust step calls `burnFuel(THRUST_BURN * throttle * dt)`. **This one function is where Yev's "works with never running out of fuel as well as with metered fuel" is actually implemented** — the composition falls out of it rather than being special-cased.

### Registry entry

`constants.js:107-110`, one entry beside `endlessFlight`:

```js
{ key: 'thruster', icon: '🚀', label: 'Thruster',
  desc: 'Fly with a stick instead of flicking. Hold to burn — fuel drains while you thrust.' },
```

`defaultInventory()` (`state.js:8-12`) derives from `ITEMS`, so state, persistence, `mergeInventory()`, the drawer panel (`main.js:266-287`), and the Shop's ✅ Acquired row (INV-2) all pick it up with **zero further changes**. If that turns out not to be true, INV-1's abstraction is wrong and should be fixed there — that was INV-3's original stated purpose and it still applies.

### Input

**Thrust vector is transient input state, not game state** — keep it in `explore.js` module scope, not `S` (nothing persists, nothing serializes):

```js
let stick = null;       // { ox, oy, cx, cy, id } in VIEW units
const keys = new Set(); // held key codes
export function thrustVec() { /* combine stick + keys → { x, y, throttle } */ }
```

**Floating stick (T5/T9).** On `pointerdown` with the item enabled, the touch point becomes the origin; `pointermove` updates the current point; `pointerup`/`pointercancel` clears it. Direction is **origin → current** (push toward, T9). Throttle ramps from the deadzone edge to full:

```js
// Pure — unit-test this. d is distance from stick origin in CSS px.
export function stickThrottle(d) {
    if (d <= STICK_DEAD_PX) return 0;
    return Math.min((d - STICK_DEAD_PX) / (STICK_R_PX - STICK_DEAD_PX), 1);
}
```

**⚠️ Store the stick in view units, not world units.** `toWorld()` (`ui.js:69`) applies the camera translate and the STAB-2 zoom — a stick anchored in world coordinates would slide out from under the player's thumb as the camera follows the comet and as the zoom eases. Add a `toView(e)` helper mirroring `toWorld()` but stopping before the camera/zoom math (`(e.clientX - rect.left) / view.scale`). Convert `STICK_R_PX / view.scale` at use so thumb ergonomics stay constant across devices — `view.scale` is ~3.75 on a phone and ~4.7 on a laptop, so a radius fixed in view units would be physically different sizes.

**Keyboard (T7).** `keydown`/`keyup` on `window`, into the `keys` set. `ArrowUp`/`w` → (0,−1), `ArrowDown`/`s` → (0,+1), `ArrowLeft`/`a` → (−1,0), `ArrowRight`/`d` → (+1,0). Normalize the sum so diagonals aren't √2 faster; throttle is always 1 from the keyboard. Three gotchas, all of which will bite:

- **`preventDefault()` on the arrow keys** or the page scrolls under the canvas.
- **Ignore keys while a text field has focus.** The Map Maker's save-name input is right there (`editor.js`) — check `e.target.tagName` against `INPUT`/`TEXTAREA` and bail.
- **Clear `keys` on `window.blur`.** Alt-tabbing while holding W leaves the key stuck down forever; the existing blur handler (`main.js:230`) is the natural place.

Stick and keys both active → sum the vectors and clamp the magnitude to 1.

**Gating.** All of the above is inert unless `S.mode === 'explore' && S.inventory.thruster?.enabled`. When the item is OFF, `main.js`'s existing drag → aim → `explore.launch()` path (`main.js:84-138`) must run **completely untouched** — that's the A/B, and it's also what protects the golf modes, which share those handlers.

### Physics

Apply thrust at the top of `explore.step(dt)` (`explore.js:260`), **before** `stepBody()`:

```js
const t = thrustVec();
if (t.throttle > 0 && fuel > 0) {
    comet.vx += t.x * THRUST_A * dt;
    comet.vy += t.y * THRUST_A * dt;
    burnFuel(THRUST_BURN * t.throttle * dt);
}
```

Correct by construction for three reasons worth knowing: `main.js` already calls `explore.step(DT)` inside the fixed-timestep accumulator (`main.js:300-316`), so thrust is frame-rate independent; `stepBody()` applies the `MAX_V` clamp *after* gravity and therefore catches thrust too; and **`physics.js` stays untouched and pure** — no new parameter, no new test surface there.

**Phase transitions:**

| From | Trigger | Behavior |
|---|---|---|
| `rest` | any throttle > 0 | `S.phase = 'flight'`. Thrust lifts off under power — there is no flick to leave with (T6). **Do not apply the STAB-1 liftoff grace**: it exists because a one-shot impulse can lose to surface gravity, a problem `THRUST_A = 400 > 370` doesn't have. Grace *plus* strong thrust would fire the comet off a planet like a cannon. |
| `orbit` | any throttle > 0 | Eject to `flight`: `world.orbit = null; S.orbitCooldown = ORBIT_COOLDOWN;`. Velocity needs no fixup — `stepOrbit()` (`explore.js:409`) already writes the correct tangential velocity into `comet.vx/vy` every step, so live physics picks up exactly where station-keeping left off. Handle it inside `stepOrbit()` so there's one decision point. |
| `flight` | — | **Skip orbit capture entirely while throttle > 0** (`explore.js:302-319`). Otherwise flying past a planet near-circularly yanks the player into a station-kept orbit against their will, mid-burn. This will feel like a bug the first time it happens. Release the stick and capture arms again normally. |

`main.js`'s loop gate (`main.js:305`) currently steps Explore only in `flight`/`aiming`/`orbit`. It must also step at rest when thrust is live, or thrusting off a planet does nothing:

```js
if (S.phase === 'flight' || explore.hasThrust() && S.phase === 'rest' || …) explore.step(DT);
```

### Empty tank (T8) — ⚠️ superseded 2026-07-17, kept for history

This whole subsection describes INV-3a's shipped `shouldTowHome()` design — **since reversed.** FUEL-1 ([Improvements](../../games/black-hole-in-one/ideas.md)) removes the tow-home call entirely; there is no more auto-tow to gate by phase or Thruster state. Left below for the historical record of how it worked pre-FUEL-1, not as current implementation guidance.

`shouldTowHome()` (`explore.js:341`) grows a phase argument. **This changes an existing tested signature — `tests/explore.test.mjs:287-302` has 5 tests to update:**

```js
// Tow home on a dry tank. Endless Flight locks the tank so this never fires while
// it's on. Under the Thruster the tow is immediate wherever you are (T8) — running
// dry mid-burn is a normal event and Yev chose not to leave the player drifting.
// The flick scheme keeps the rest-gated tow: a flick charges −15 at launch, so
// flicking with 15 in the tank hits 0 mid-shot, and an immediate tow would yank
// the player home out of the very shot they just paid for.
export function shouldTowHome(fuel, inventory, phase) {
    if (fuel > 0 || inventory.endlessFlight?.enabled) return false;
    return inventory.thruster?.enabled || phase === 'rest';
}
```

Call site (`explore.js:332`) drops its `S.phase === 'rest'` guard and passes `S.phase` in. `respawnTown()` is otherwise unchanged.

### Rendering

Draw the stick **after** `render()`'s final `ctx.restore()` (`ui.js:~258`). At that point the transform is back to `setTransform(dpr·scale)` with no camera translate and no zoom — i.e. exactly the screen-anchored view-unit space the stick wants. Suggested look, matching the game's existing palette: a translucent outer ring at `STICK_R_PX/view.scale`, a filled nub at the current point, tinted green → gold → red by throttle like the power arrow's `cr` ramp (`ui.js:508`), fading in/out over ~0.12 s so a tap doesn't strobe.

`drawAim()` (`ui.js:472`) must not be called at all when the item is on — T10 removes the arrow and the preview together. `render(drag)`'s signature can stay; just pass `null`.

Exhaust: `burst()` a couple of particles per frame from the comet **opposite** the thrust vector while burning, in the comet's own color. Cheap, reuses the existing particle system, and it's the main thing that will sell the feel.

## Slices (agent-shippable, in order)

- [x] **INV-3a — P1 — Thrust core + keyboard.** ✅ **Shipped 2026-07-16 (`2857836`).** The vertical slice, playable end-to-end on a laptop with no touch work at all. `ITEMS` entry, the `burnFuel()` extraction, thrust vector state, `explore.step()` integration, keyboard input (with all three gotchas), per-second burn, the `shouldTowHome()` signature change + T8 wiring, the three phase transitions, and the `main.js` rest-step gate. No stick, no ring, no exhaust. *Done when:* the 🚀 Thruster row appears in the drawer **and** the Shop's Acquired list with zero new registry plumbing; WASD/arrows fly the comet in Explore with the item on; the item off reproduces flick-Explore bit-for-bit; both items on = unlimited thrust, no drain, no tow; Thruster alone = per-second drain and an immediate tow at 0; thrusting lifts off a resting comet and ejects from an orbit; orbit capture never fires mid-burn; arrows don't scroll the page, don't fire while the Map Maker name field is focused, and don't stick after alt-tab; golf and Endless provably untouched; `stickThrottle()` and the new `shouldTowHome()` unit-tested; verified in-browser. All of the above confirmed — see the Dev Log entry for verification detail (test tooling note: this preview browser's synthetic key-press action doesn't populate `KeyboardEvent.code`, so verification drove the real `window` keydown/keyup listeners with hand-constructed events instead; the shipped code itself listens on real `e.code` exactly as designed).
- [x] **INV-3b — P1 — Floating stick + juice.** ✅ **Shipped 2026-07-16 (`6664585`).** Mobile completion. `toView()` helper, floating-stick pointer handling, the deadzone, ring/nub rendering after the world restore, the throttle color ramp, `drawAim()` suppression (falls out for free — the flick path, and therefore `S.phase==='aiming'`, is now unreachable while the item is on), exhaust particles. `stickThrottle()` shipped inert in INV-3a; this slice wires it up via a new `setViewScale()` (pushed in from `ui.resize()`) so the stored view-unit drag converts back to the CSS px the function expects. *Done when:* all criteria confirmed — touch anywhere in Explore with the item on raises a ring under the thumb and flies the comet (verified via real `PointerEvent`s at the canvas, not just direct function calls); the ring holds its screen position through 500 physics ticks of camera-moving flight (pixel-sampled, not just assumed from the architecture); a tap fires no thrust; the ring is the same physical size on a 375px phone and a laptop (92 device px at both `view.scale=3.75` and `view.scale=4.706` — pixel-sampled, not eyeballed); no aim arrow or preview appears (`S.phase` provably never reaches `'aiming'` with the item on); stick and keyboard drive simultaneously without fighting (both the clamped and unclamped sum cases verified live). The ⚠️ agent-interpretation note below is now resolved — see it for the answer.
- [x] **INV-3c — P1 — Feel pass (scope now concrete, see decisions below).** ✅ **Shipped 2026-07-17 (`a53fe66`).** Full backlog entry with Done-when criteria: [Improvements](../../games/black-hole-in-one/ideas.md)'s ⛽ Fuel Economy & Thruster Feel sprint. Shipped alongside FUEL-1; FUEL-2 (refuel station planets) is next.

### INV-3c decisions (Yev, 2026-07-17 — do not re-litigate)

| # | Question | Answer |
|---|---|---|
| Q3a | What to change about thrust feel | **Lower `THRUST_A`** (softer accel, less "instant-on," analog range reads as a real negotiation) **and raise the escape floor** — the shared `gravityAt()` clamp (`physics.js`, `d²` floors at `(0.8·r)²`, currently caps pull at 625 u/s²) — so full thrust always wins, at every body including the biggest giant (r≈40). |
| Q3b | Should raw thrust always beat every planet | **Yes, unconditionally** — no upgrade required. This is *why* Q4's skill tree got parked: base tuning is meant to be the whole fix. |
| Q4 | Rocket upgrade skill tree | **Parked, not built this sprint.** *"Let Q3's base-tuning answer be the whole fix."* Revisit only if tuned base thrust still isn't enough in practice. |
| Q5 | When does the flying-vs-flicking verdict get written | **Held until the whole sprint ships** — FUEL-1 and FUEL-2 too, not just INV-3c's constants. Tune first, judge the concept on the tuned version. |

**Cross-mode note:** `gravityAt()` is shared with golf and Endless. The arc's earlier "physics.js stays untouched" guardrail (INV-3a/b) was about not regressing golf *during that build*, not a permanent lock — but raising the clamp floor here does touch every mode's near-surface gravity, however slightly. Verify the golf/Endless regression suite (256+ tests, especially STAB-1's liftoff-grace escape numbers) still passes before calling this done.

**✅ Post-ship addendum (2026-07-17):** the table above assumed uniform planet density when it cited "~370 at the giant" — Explore's chunk generator actually carries a Giant ×1.5 / Dwarf ×2.0 mass multiplier (present since the original OW-1/OW-2 commit, not something this arc introduced), which pushed real worst-case surface gravity to ~555 u/s². No `THRUST_A` this side of ~560 could satisfy Q3b's "unconditionally" with that in place, so shipping Q3a+Q3b together required also dropping both multipliers to `m=r²` — beyond what this table literally named. Giants/Dwarfs stay visually and physically distinct through `r²` scaling alone (a giant still outweighs a dwarf ~100:1), just without the extra density tax. Shipped: `THRUST_A=385` (was 400), floor `1.0·r` (was `0.8·r`, though this turned out to have zero real effect — see Dev Log), exhaust density `0.06×throttle` (was `0.15×throttle`). Full reasoning trail: [Dev Log](../dev-logs/black-hole-in-one.md).

*Order rationale: INV-3a is deliberately shaped so the mechanic is fully playable and answerable before a single pixel of stick UI exists — if flying Explore isn't fun on a keyboard, INV-3b should never be built. INV-3b is the mobile half and is pure input+render over a proven core. INV-3c is where the actual question gets answered.*

### ⚠️ Agent interpretation on INV-3a scope — ✅ resolved by INV-3b

INV-3a shipped keyboard-only with zero changes to the drag-to-flick path, on the reading that T6 describes the *end state* once a stick exists to take the gesture over, not a requirement that INV-3a disable the flick ahead of any stick existing.

INV-3b's own Done-when confirms that reading was right: "no aim arrow or preview appears" and "stick and keyboard can drive simultaneously without fighting" both require the flick gone, not just out-throttled. Implemented as the one line this note predicted — `main.js`'s `pointerdown`/`pointermove`/`pointerup` now branch to the stick handlers before the old `canAim`/`drag` logic whenever `S.mode==='explore' && S.inventory.thruster?.enabled`, so the flick path (and `S.phase==='aiming'`) is structurally unreachable in that state. Verified live: dragging the mouse/touch on a laptop with the Thruster on now drives the stick, not the flick.

## Testing notes

New pure functions to unit-test in `tests/explore.test.mjs` (which already imports `explore.js` — the INV-1 note's "zero coverage" warning is out of date):

- `stickThrottle(d)` — deadzone floor, linear ramp, clamp at 1, and `d = 0`.
- `keysToVector(keys)` — each key, diagonals normalized to magnitude 1, opposite keys cancel to 0, empty set = 0.
- `shouldTowHome(fuel, inventory, phase)` — the full matrix: the 5 existing tests updated, plus Thruster-on-mid-flight = true, Thruster-off-mid-flight = false, and **Endless-Flight-on wins over everything** (that's Yev's headline composition and deserves an explicit test).
- `burnFuel` is not directly testable (`fuel` has no exported setter — the standing gotcha from INV-1), so test the *predicate* it obeys and verify the wiring in-browser, exactly as INV-1 did.

Follow the arc's precedent: extract the decision as a pure exported function, unit-test that, verify integration live. `orbitCapture()`, `fitZoom()`, and `shouldTowHome()` are all this shape.

**Definition of done** is the studio standard: `node --test` green, `npm run smoke` green, pushed to main, GitHub Pages deploy verified serving the change. Per house rule, ship without pausing for plan approval — stop only for ambiguous scope or anything touching releases/accounts/money.

## Knock-on effects

- **INV-4 (🪝 cast-to-pull) just got unblocked, partly.** Its design gate was *"there is no second gesture to spare."* Two things change that: on a laptop, keyboard flight frees the mouse drag entirely for a cast; and with the Thruster on, the drag is a *held* gesture, which makes tap-to-cast a live option that doesn't collide. Doesn't remove the need for a design pass — anchor lifetime and pull-force are still unanswered — but the hardest fork is now much easier.
- **INV-5 (⚡ Precision Thrusters) is narrower than it was.** It modifies the flick, which the Thruster replaces, so the two items are mutually exclusive by construction. Still a valid experiment for flick-Explore; demoted to P3.
- **The Core Re-alignment sprint says Explore gains fuel/survival mechanics.** Per-second burn is a much sharper fuel pressure than −15/flick, and hazards (mines, traps, asteroids) currently only spawn in Endless. Whoever builds that sprint should read T3/T8 first — the Thruster changes what "fuel pressure" means in Explore.
- **Nothing here touches `physics.js`, `gameplay.js`, or the golf modes.** If a diff does, something has gone wrong.
