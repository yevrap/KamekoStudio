# Black Hole in One — Dev Log

## 2026-09-21 — 🐞 Fix: Explore threw for about a second when entered with spirals alive (TD-009)

**Shipped by Shadow Studio, iteration 04 (SHS-052): the studio's first fix to a production
game**, done under the standing permission in Q9 (ADR-0008 in the repo). The full record
is in the repo at `docs/studio/iterations/04/`.

- **Root cause:**
  - `stepParticles` moves every spiral particle around `world.blackHole`.
  - Explore's `resetWorld()` sets `world.blackHole = null` and leaves the spirals behind.
  - Spirals spawn around any golf hole's black hole, including the decorative one behind
    the start menu.
  - So entering Explore with spirals alive threw on every frame for about a second, before
    the canvas drew.
- **Fix:** one line, `ui.js:160`. With no black hole, spirals are dropped; the filter
  runs only when there is a spiral to drop.
- **Tests:** three in `scripts/e2e.mjs`:
  - the start menu → Explore;
  - a golf round → ☰ Menu → Explore;
  - the defect directly.

  Each runs in its own browser profile and proves spirals are alive before it acts. They
  were red on the unfixed file with the original error, and are green on the fixed one:
  26/26, five and then three runs in a row. They refuse partial fixes, and an over-broad
  fix that also drops the Explore bursts.
- **Verified by two independent review rounds.** QA used real taps on all four player
  routes (start menu, golf ☰ Menu, golf ⚙️ Play tab, shared-map ☰ Menu): 0 of 20 trials
  threw as a player on the fixed build, 20 of 20 on the unfixed one. Golf is unchanged:
  spirals still spawn and orbit the hole.
- **Live:** the post-deploy check found the fixed line in the served `ui.js`.
- **Side effect:** the two e2e tests that used to fail now and then —
  `🔄 New Map regenerates the Explore world…` and `…(FUEL-3)` — no longer do. Neither had
  anything to do with it.

## 2026-07-21 — 🐞 Fix flaky MM-18 `updateActiveChunks` test

**Shipped:** fixed the intermittent MM-18 chunk-content test failure first flagged (not fixed) during GOLF-8 on 2026-07-20 — reproduced directly (~2/5 full-suite runs failing, isolated runs always passing), matching the earlier report.
**Root cause:** narrower than the "shared, unseeded `Math.random()` state" theory logged at the time. `explore.js` keeps `worldSeed` as module-level state; `rerollWorld()` (GEN-1) sets it to a fresh `'explore-' + Math.random()...` seed. The MM-18 test's own fixture search (`findChunkWithBody` in the test file) always searches for a target body/ring against the hardcoded `'explore-1'` seed, but `updateActiveChunks()` generates the live world from whatever `worldSeed` actually is. Since the immediately preceding test (GEN-1) calls `rerollWorld()` and nothing resets `worldSeed` afterward, MM-18 could end up searching one seed's world while loading a different one — flaking whenever that run's random reroll seed didn't happen to place the target object at the same chunk coordinates.
**Fix:** one line — `exploreStartRun(true)` at the top of the MM-18 test, which deterministically resets `worldSeed` back to `'explore-1'` (its own hardcoded value) regardless of what ran before it. No production code changed; test-only.
**Regression proof:** 20/20 consecutive `node --test tests/` full-suite runs clean post-fix (previously ~3/8 failed pre-fix, reproduced fresh before touching anything). No deploy — test-only change, nothing shipped to the live game.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) (unchanged) · commit `e72a599`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: ORB-3b orbit-collectible fuel rings

**Shipped:** ORB-3b — discrete orbit-collectible fuel rings in Explore, superseding ORB-3's parked "slow trickle while orbiting" idea per Yev's direct confirmation ("build ORB-3b instead of ORB-3's trickle"). Reuses ORB-4's own `ringSnap`/pickup-ring pattern (shipped 2026-07-19 for stardust) applied to fuel — the fifth and last independent item in the Fuel & Custom-Map Bugfix Pass (after FUEL-4/5/6/7/8/9/10, GEN-1, GOLF-6/8); GOLF-6 (repro-first freeze) and PARITY-1 (Orbit Magnet in Golf/Custom) remain open.
**Design:** `constants.js` gets a `FUEL_RING_*` constant set mirroring `STARDUST_RING_*` exactly (0.25 chance, 5-8 dots, same gap-fraction band) — kept as its own set rather than reusing the stardust one so the two can be tuned independently later even though today's numbers match. `explore.js`'s `getChunkBodies()` rolls fuel rings in a new loop right after the existing stardust-ring loop (same rng-stream-order convention as every other chunk-gen roll — existing chunks stay byte-identical), skipping black holes and any body that already got a stardust ring. **Judgment call, not explicit in the written spec:** a body keeps at most one ring type (stardust XOR fuel), never both — `ringSnap`'s "the ring is the orbit" contract only works for one radius per body; two overlapping rings at different radii would mean an orbit only ever sweeps one of them clean, silently stranding the other's dots the same way ORB-4's own stepAscend gap would have. `ringSnap()` widened to check `b.stardustRing || b.fuelRing`. `getChunkPickups()` emits fuel ring dots the same geometry-only way stardust ring dots already work (pure function of the seeded ring, `r: 1.8` matching scattered fuel pickups' size, `type: 'fuel'` so `collectPickups()`'s existing fuel-reward branch needs no changes at all). `ui.js` adds `drawFuelRing()` — a green guide arc, mirroring `drawStardustRing()`'s gold one; `drawPickup()` already color-coded fuel green vs. stardust gold (ORB-4), so ring dots read correctly with no changes there. New `fuelRing` glossary entry.
**Regression tests:** `tests/explore.test.mjs` — 11 new tests mirroring the full ORB-4 suite: no fuel ring on black holes, stardust/fuel ring exclusivity, frequency close to `FUEL_RING_CHANCE`, geometry (band + dot count), chunk-gen determinism, pickup-dot placement/determinism/no-neighbor-duplication, `ringSnap` onto a fuel ring, and a full-orbit sweep collecting every dot. Full suite `node --test tests/` 434/434 (+11), `npm run smoke` clean, `npm run e2e` 23/23 (no e2e coverage needed — same reward code path as existing scattered fuel pickups, already covered there).
**Live verification:** drove the deployed-equivalent local build via the browser preview's JS console — imported the live `explore.js`/`state.js` modules directly (Node test suite already proves the geometry; this confirmed real runtime rendering), found a real fuel ring seeded from the `'explore-1'` world seed (7 dots), teleported the camera/comet there, and screenshotted the green guide arc + dots rendering correctly and distinctly from a neighboring stardust ring in the same shot. Forced a full orbit revolution and confirmed all 7 dots collected (`world.pickups.length` dropped by exactly 7). Fetched the deployed `explore.js` post-push and confirmed `fuelRing`/`FUEL_RING` are served live; `version.json` confirms v46.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `31389c3`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: GOLF-8 boundary/pull rework

**Shipped:** GOLF-8 — reopened the GOLF-1/2 "lost in space" fix (`ef0c81b`, 2026-07-19) per Yev's follow-up: he didn't want a visible boundary or an instant snap-back, just gravity reasserting itself the further out a comet drifts. `OB_MARGIN` (the recoverable zone where gravity alone gets an uninterrupted chance) widened again, 56→130; past it, an acceleration that *grows* with distance curves the comet back instead of teleporting it to last rest; the dashed boundary line is gone entirely.
**Design:** New `applyReturnPull(dt)` in `gameplay.js` — once the comet is past `OB_MARGIN` from the nearest point of the course rect, adds an inward acceleration proportional to `RETURN_PULL_K * (distance past margin)`. Unlike real body gravity (`gravityAt`, inverse-square, weakens with distance), this grows with distance, so a return is mathematically inevitable — no hard cutoff needed. `FLIGHT_CAP`'s existing 24s timeout stays as an unrelated last-resort safety net for a flight that hasn't landed in a long time, decoupled from the OOB position check it used to share an `if` with. **Judgment call, not explicit in the written spec:** `stepOrbit`'s own OOB rescue (GOLF-1/2 — a planet placed near a custom map's edge carries its orbit band off-screen) used to teleport straight to rest too; rather than leave that as a second, orbit-only teleport path while flight got the new continuous pull, it now breaks the orbit into free flight (mirroring `launch()`'s own break-out-of-orbit bookkeeping — `orbitCooldown` armed, `tFlight` reset) and hands off to the same `applyReturnPull()` every other "too far" case gets. Flagging this for Yev in case a distinct treatment was intended for the orbit case specifically.
**Tuning:** `OB_MARGIN=130` / `RETURN_PULL_K=1.5` chosen via headless simulation (straight-out, diagonal, and grazing launches at up to `MAX_LAUNCH`/`MAX_V` speeds) — typical returns land in ~4-6s, max excursion ~150-270 world units past the course (course is 200×200), all well under `FLIGHT_CAP`'s 24s. Confirmed live in-browser matches the simulation almost exactly (a max-power straight-out shot peaked at 228 units past the rect and returned in 4.78s).
**Regression tests:** `tests/black-hole-in-one.test.mjs` — replaced the two stale "OB_MARGIN teleport" tests (their core assertion, instant rescue at the margin, is exactly what GOLF-8 removes) with 4 new tests: the orbit-OOB case now hands off to flight instead of teleporting (with cooldown armed); a comet just past `OB_MARGIN` is decelerated, not rescued, this frame; a comet well inside `OB_MARGIN` is untouched (gravity gets the first, uninterrupted chance, per spec); and a `MAX_LAUNCH`-speed escaping shot with no bodies in the world still curves back within a bounded step count, well under `FLIGHT_CAP`, never touching `S.phase = 'rest'` by position. These three new tests deliberately skip `game.startRun()` (which calls the shared, unseeded `Math.random()` stream via `genHole()`) since they discard the generated hole immediately anyway — skipping it avoids nondeterministically shifting a later, unrelated test's random draw (this was caught mid-session: an early draft that called `startRun()` in all three intermittently flipped a fixture assumption in the pre-existing MM-18 chunk-content test, ~1-in-5 runs). **Found, not caused, while chasing that flake: this same failure mode reproduces on unmodified `main` too** (2/10 runs), a pre-existing shared-random-state fragility across this test file, same root cause as the already-flagged FUEL-3 e2e flakiness — logged in Improvements.md, not fixed here (out of scope for a physics tuning item). Full suite `node --test tests/` 116/116 stable across 5 consecutive runs post-fix, `npm run smoke` clean, `npm run e2e` 23/23 (no e2e coverage existed for the boundary behavior specifically; the unit tests plus live-browser verification cover it).
**Live verification:** drove the deployed-equivalent local build directly via the browser preview's JS console — forced a `MAX_LAUNCH`-speed escaping shot with no bodies present, confirmed the pull decelerates and reverses velocity smoothly (never snapping position) and returns in 4.78s; confirmed `S.phase` stayed `'flight'` throughout, never rescued by position. Screenshotted mid-flight while far out of bounds — no boundary line renders. Fetched the deployed `ui.js` post-push and confirmed `drawCourseBoundary` is gone from the served file, and `constants.js` confirmed `OB_MARGIN = 130` / `RETURN_PULL_K = 1.5` are live.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `1174640`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: FUEL-9/GOLF-7 unified stranded state

**Shipped:** FUEL-9/GOLF-7 — one mode-agnostic "stranded" fuel-out state for Golf, Explore, and Custom Map, retiring golf's modal `sg-again`/`sg-menu` Survival Game Over overlay entirely. No mode ever force-blocks the screen on fuel-out now. Closes the core Fuel & Custom-Map Bugfix Pass sequence (FUEL-6 → FUEL-10 → GEN-1 → this), all three listed dependencies having shipped earlier the same day.
**Design:** Added a shared, pure `isStranded(fuel, inventory)` helper to `constants.js`; `explore.js`'s existing `isStranded()` now delegates to it instead of duplicating the rule. Removed `gameplay.js`'s `checkSurvivalGameOver()`/`endSurvivalRound()` and all four call sites (stepFlight OOB, landOn, beginOrbit, stepOrbit OOB) — organic fuel-out detection is now centralized in `main.js`'s per-frame loop, the same place Explore's own stranded check already lived, widened to cover `endless`/`custom` too. This is what makes the Endless Flight mid-strand rescue "free": since the check re-runs every frame, toggling the item just makes `isStranded()` return false the next frame, no special-case rescue code needed. Golf additionally gets a small non-blocking, dismissible card (`#roundOverPanel` — hole reached, ↺ Restart / 🔄 New Map / ✕ Dismiss, replacing the old `#survGameOver` modal) wired to the exact same `doRestart()`/`doNewMap()` functions the persistent ↺/🔄 buttons use, per Yev's "one reroll control, less code paths to get confused" answer. Explore/Custom keep the pre-existing glow+toast only — no round/scorecard concept to summarize. `triggerHazardDeath()` was unified: the comet now always resettles at last rest in every mode (previously only non-Endless modes did — Endless hazard kills used to just leave `S.phase` wherever it was, safe only because the old modal froze stepping; that safety net is gone now, so this had to be fixed, not just simplified), and a hazard kill still unconditionally fires the round-over card in Golf even with Endless Flight on, preserving FUEL-10's no-hazard-immunity contract.
**Real gap found and fixed:** the ☰ Settings Inventory section (`ui.js`'s `renderHowtoSettingsPanel()`) was gated `S.mode === 'explore'` only — Golf/Custom had no UI path to the Endless Flight toggle at all, which would have made the spec's own "reachable via the ☰ menu, reachable from any mode" requirement false. Widened to also surface just the `endlessFlight` item (not the full `ITEMS` list — Thruster/Orbit Magnet have no Golf/Custom control surface yet) when `S.mode` is `'endless'` or `'custom'`. The same toggle handler now also sets `S.fuel = 100` for Golf/Custom (previously it only called `explore.refuelFull()`, which tops off Explore's own fuel variable, doing nothing for Golf/Custom's separate `S.fuel`).
**Deferred, not decided:** 🔄 New Map's existing "reroll, not restart" contract (GEN-1) leaves fuel untouched, so using it from a *genuinely* empty tank doesn't actually let the player resume flying — only Restart or the item toggle do that. Flagged as a question in Improvements.md rather than silently changing GEN-1's shipped contract.
**Regression tests:** `tests/black-hole-in-one.test.mjs` — pure-function coverage for the shared `isStranded()` (0/negative/positive fuel, with/without the item, cross-checked against `explore.js`'s delegating wrapper), plus updated/new hazard-kill tests asserting `hooks.roundOver` fires (Golf, with and without Endless Flight) and does *not* fire in Custom Map. `scripts/e2e.mjs` — 6 new live-DOM cases: the non-blocking card appears with the canvas still visible, ✕ Dismiss hides it without un-stranding, the card's own Restart/New Map buttons behave correctly (including confirming New Map's fuel-untouched contract rather than assuming it refuels), the Settings-tab rescue toggle (real checkbox click, not a direct state poke) clears the stranded state and tops off fuel, and Custom Map gets glow+toast but never the Golf-only card. One flaky first e2e pass (4 failures) was actually a single test-hygiene bug — the rescue test's real checkbox click persists `blackHoleInOne_inventory` to `localStorage`, which survived subsequent `page.goto` reloads and leaked Endless Flight into three later tests, making their fuel-drain assertions fail; fixed by clearing `localStorage` at the end of that test. Full suite `node --test tests/` 423/423 (+7), `npm run smoke` clean, `npm run e2e` 23/23 (+6, net of 2 test replacements).
**Live verification:** drove the deployed-equivalent local build through the browser preview — forced Golf into a stranded state (0 fuel, hole 4), confirmed the canvas stayed fully visible with the non-blocking card and red restart glow, opened the real ☰ Settings tab (confirmed the Inventory section now appears in Golf), clicked the Endless Flight checkbox, and watched the glow/card clear and the fuel bar refill instantly. Fetched the deployed `constants.js`/`gameplay.js`/`index.html` post-push and confirmed `isStranded`, `hooks.roundOver`, and `#roundOverPanel` are all served live.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `09abacd`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: GEN-1 🔄 New Map reroll

**Shipped:** GEN-1 — a new "🔄 New Map" control next to ↺ Restart, usable mid-run in any phase. Delivers the raw ask ("skip a map and regenerate one of the same level type") without resetting the whole run the way Restart does — Restart's reset-to-hole-1/full-refuel behavior was too blunt for "I just want a different layout of what I'm already playing." Built as a standalone control first, per Yev's own scoping note; FUEL-9/GOLF-7's unified stranded state will reuse this same button in a later session rather than inventing a separate "new map" affordance (Yev's answer: "one reroll control, built once... less code paths to get confused").
**Design:** Golf/Endless — `gameplay.js`'s new `rerollHole()` re-runs `genHole(S.hole)` for the *same* hole number, leaving `S.fuel`/`S.totalDiff`/`S.roundCard` untouched (mirrors `nextHole()`'s pattern minus the `S.hole++`). Explore — `explore.js`'s new `rerollWorld()` regenerates the chunk world under a fresh random `worldSeed`; this only works because `startRun()` was silently hardcoding `worldSeed = 'explore-1'` every time (a Sprint-1 leftover, per its own comment) — refactored the shared reset logic into a `resetWorld(seed, silent)` helper so `startRun()` (fixed seed, full refuel) and `rerollWorld()` (fresh seed, fuel untouched) both call it. Custom Map has no procedural generator to reroll, so it falls back to a fresh Endless round — same fallback FUEL-4 already established for a missing retained map. The button is hidden in the Map Maker editor (nothing to reroll while authoring).
**Regression tests:** `tests/black-hole-in-one.test.mjs` — 3 new unit tests (Golf reroll keeps hole/fuel/totalDiff/roundCard, clears a pending result timer/chip the same way `nextHole()` does; Explore reroll changes `worldSeed` while leaving fuel/upgrades/stardust untouched). `scripts/e2e.mjs` — 5 new live-DOM cases: Golf reroll via a real button click, Explore reroll via a real button click, Custom Map's Endless fallback, and the button hidden in the editor. Full suite `node --test tests/` 416/416 (+3), `npm run e2e` 19/19 (+5), `npm run smoke` clean.
**Live verification:** drove the deployed-equivalent local build through the browser preview — clicked 🔄 New Map twice in Golf (planet layout changed each time, Hole/Par/Flicks HUD unchanged), started Explore, spent fuel with a real flick (100→85%), clicked 🔄 New Map, and confirmed via the live module singletons that `worldSeed` changed, fuel stayed at 85, and the comet was resting back on the home tee. Fetched the deployed `index.html` post-push and confirmed `#newMapBtn` is served.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `4e15cd8`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: FUEL-10 Endless Flight item parity

**Shipped:** FUEL-10 — the ♾️ Endless Flight item (Explore's inventory unlock) had no effect in Golf or Custom Map: fuel kept draining and could still run you dry in those modes even with the item toggled on. Delivers the golf/Explore item-parity answer already on record (Questions for Yev, this file) scoped to Endless Flight specifically.
**Root cause:** the item was wired only into Explore's own fuel system — `explore.js`'s `burnFuel()` checks `S.inventory.endlessFlight?.enabled` before spending, and `isStranded()` never reports stranded while it's on. Golf and Custom never route through `burnFuel()` — they spend `S.fuel` directly inside `gameplay.js`'s `launch()`, a wholly separate code path that never checked the item.
**Fix:** `gameplay.js`'s `launch()` now gates both its fuel-spend and its zero-fuel launch guard behind `!S.inventory.endlessFlight?.enabled`, mirroring `explore.js`'s `burnFuel()` exactly. Caveat traced during the fix: in Golf, a hazard kill (mine/trap) forces game-over by setting `S.fuel = 0` then calling the same zero-fuel round-over check organic drain uses — naively gating that shared check on the item would have accidentally made Endless Flight grant hazard immunity too, which isn't what the item is. Split `checkSurvivalGameOver()`'s round-over logic into its own `endSurvivalRound()` helper; `triggerHazardDeath()` now calls `endSurvivalRound()` directly instead of going through the (now item-gated) fuel check, so a mine/trap still always ends the run in Golf regardless of the toggle.
**Regression tests:** `tests/black-hole-in-one.test.mjs` — 5 new unit tests: fuel doesn't drain from a Golf launch with the item on, a 0-fuel Golf launch succeeds with the item on, a 0-fuel Golf launch is still blocked without it, fuel doesn't drain from a Custom Map launch with the item on, and a mine hit in Golf still zeroes fuel and ends the round with the item on (no hazard immunity). Full suite `node --test tests/` 413/413 (+5).
**Live verification:** fetched the deployed `gameplay.js` from `yevrap.github.io` post-deploy and confirmed the item-gated guards (`endlessFlight`, `endSurvivalRound`) are present in the served file.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `754544e`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: FUEL-6/7/8 custom-map fuel

**Shipped:** FUEL-6, FUEL-7, FUEL-8 (one pass, one commit — same code area). Custom Map mode's fuel system was effectively decorative: fuel never drained while flying, never reset entering or restarting a map (leftover golf/prior-custom fuel just carried over), and the HUD bar never moved even when fuel did change. Also resolves **GOLF-4** (a latent sibling of FUEL-3) as a side effect.
**Root cause:** all three bugs trace to the same pattern — `gameplay.js`'s `launch()` and `ui.js`'s `updateBar()` gated fuel spend/guard/render to `S.mode === 'endless'` only, and `startCustomMap()` never touched `S.fuel` at all. `'custom'` fell through every one of these checks untouched.
**Fix:**
- `gameplay.js`'s `launch()`: widened the fuel-spend and zero-fuel guard to `S.mode === 'endless' || S.mode === 'custom'` (FUEL-6). Folded the zero-fuel check into the same branch as the weak-drag cancel, applying FUEL-3's phase-restore pattern — this fold is unconditional on mode, so it also fixes GOLF-4 (Endless's identical, previously-"unreachable" softlock) as a byproduct, not just Custom.
- `ui.js`'s `updateBar()`: widened the `setFuelBar('endlessFuelBar', S.fuel)` call to also run for `'custom'` (FUEL-7); left the stardust text line endless-only, unchanged.
- `gameplay.js`'s `startCustomMap()`: added `S.fuel = 100` on entry, mirroring golf's `startRun('endless')` line exactly (FUEL-8) — covers first load, shared-link load, and restart (which reloads via the same function per FUEL-4).
**Regression tests:** `tests/black-hole-in-one.test.mjs` — 3 new unit tests (fuel drains per flick in custom, launch blocked at 0 fuel without stranding `S.phase` at `'aiming'`, `startCustomMap` resets fuel on both fresh entry and restart). `scripts/e2e.mjs` — 1 new live-DOM case asserting `#endlessFuelBar`'s rendered `style.width` actually tracks `S.fuel` through a real custom-map launch. All four confirmed to fail on pre-fix code (`git stash` check) and pass post-fix. Full suite `node --test tests/` 408/408 (+4), `npm run e2e` 15/15 (+1).
**Live verification:** drove the deployed page directly via the browser preview — set leftover golf fuel, entered a custom map (confirmed reset to 100%), launched (confirmed drain to 85% with the bar visibly moving), and fetched the deployed `gameplay.js` from `yevrap.github.io` to confirm the widened guards are actually served.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `8bca4cf`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: FUEL-5 thruster fuel bar

**Shipped:** FUEL-5 — in Explore's Thruster mode, the fuel bar never visibly ticked down while holding thrust; it only refreshed on the next unrelated HUD event (pickup collection, landing, upgrade purchase), so players couldn't see fuel actually draining until something else happened to redraw it.
**Root cause:** `explore.js`'s `step(dt)` calls `burnFuel()` every physics frame inside the `t.throttle > 0 && fuel > 0` block while thrust is held, but never called `hooks.bar()` in that block — every other fuel-spend call site in the file (e.g. `launch()`) pairs `burnFuel()` with an immediate `hooks.bar()`, this one didn't.
**Fix:** added the missing `hooks.bar()` call right after `burnFuel(THRUST_BURN * t.throttle * dt)` in `step()` — one line, `games/black-hole-in-one/explore.js`.
**Regression test:** `tests/black-hole-in-one.test.mjs` — enables the Thruster item, holds a movement key, runs one `step()` frame, and asserts `hooks.bar()` fired and fuel decreased. Verified it fails on the pre-fix code and passes post-fix.
**Live verification:** dynamically imported the running page's own `explore.js`/`state.js` module instances (same singletons `main.js` uses, confirmed by shared live state) and drove `step()` directly for 30 held-thrust frames — `#exploreFuelBar`'s rendered `width` style visibly ticked 100% → 96%.
**Live:** [Black Hole in One](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) · commit `0a23e79`

## 2026-07-20 — 🌌 Fuel & Custom-Map Bugfix Pass: FUEL-4 restart bug

**Shipped:** FUEL-4 — restarting a custom or shared map (↺ restart button, or `sg-again` on the survival game-over screen) used to silently discard the map and drop the player into a freshly generated random golf hole instead of reloading what they were actually playing.
**Root cause:** two compounding bugs. (1) `main.js`'s `startRun(mode)` wrapper — which both the restart button and `sg-again` call with `S.mode` — routed `mode === 'custom'` to `game.startRun(mode)`, golf's procedural `genHole()` generator, instead of `game.startCustomMap()`. (2) Even with the routing fixed, there was nothing to reload: `startCustomMap(mapData)` applied `mapData` straight onto `world.bodies`/`teeRock`/`blackHole`/`pickups` without retaining the source object anywhere.
**Fix:** `startCustomMap()` now retains its `mapData` on `world.activeMapData`; `main.js`'s restart routing calls `game.startCustomMap(world.activeMapData)` when `S.mode === 'custom'`, falling back to Endless only if no map is retained (a fresh page load resuming a stale `'custom'` last-played mode with nothing in memory to reload). One subtlety caught while fixing this: `stepFlight()` collects pickups by splicing `world.pickups` in place, and that array was the *same* array as `mapData.pickups` — reusing the retained `mapData` naively would have meant a restart came back with the previous playthrough's already-collected pickups still missing. `startCustomMap()` now clones each pickup object into `world.pickups` so the retained source map stays pristine across replays.
**Commit:** `f7d473c`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) §🌌 Fuel & Custom-Map Bugfix Pass.

**Verification:** one new `gameplay.js` unit test (retention + pickup-clone/reload behavior) and one new full e2e test (`scripts/e2e.mjs`) driving the real restart button end-to-end against a hand-authored map with a marker planet and a pickup — both confirmed to fail without the fix before it landed. Full suite 404/404 green, `npm run smoke` clean, `npm run e2e` 14/14 green. Manually verified live in-browser too (not just headless): loaded a custom map via `startCustomMap()`, simulated collecting its one pickup, clicked the real ↺ Restart button, and confirmed via the live `state.js` module that `S.mode` stayed `'custom'`, the marker planet survived (not a regenerated hole), and the pickup count was back to 1. **Deploy verified:** pushed to `origin/main`, GitHub Actions `pages-build-deployment` run succeeded, fetched the live `main.js` from `yevrap.github.io` and confirmed the `world.activeMapData` fix is served.

## 2026-07-19 — 🔨 Map Maker Sprint: MM-15 planet size options — sprint closes

**Shipped:** MM-15, the sprint's last item — plus a scope expansion Yev asked for directly when picking it up: *"i want all of the current object types available and for the ui and ux to be easy to use and navigate."* **Planet size (the written spec):** tap a planet in the 1:1 editor to select it — a new property panel (`#ed-selected`, above the toolbar) shows a ➖/➕ radius stepper (`PLANET_R_MIN`=4, `PLANET_R_MAX`=22, `PLANET_R_STEP`=1.5, new `constants.js` values) and an ⛽ Refuel Station toggle; `addPlanet()`'s default range dropped from `rand(9,14)` to `rand(6,10)` for tighter, more solvable default holes and auto-selects the new planet so the panel is one tap away, not two. **Object-type expansion:** the editor's Add-object row grew from 2 tools (Planet, Pulsar) to 6 — added 🌀 Trap, 💥 Mine (both reuse `world.bodies` and the existing generic hit-test/drag/delete loop unchanged, same as Pulsar always did) and 🟢 Fuel / ✨ Stardust pickups (new `world.pickups` support in the editor: hit-testing, drag, trash-delete, Test Play backup/restore, and full save/share/import plumbing — `mapData.pickups`, `encodeMap`/`decodeMap` tags 7/8). The refuel toggle sets a `refuelStation` flag on the selected planet (tag 6 on the planet's encode tuple, appended not inserted, so every pre-MM-15 share link still decodes byte-identically). MM-16's overview canvas got the same 6 tools plus glyphs for all 4 new types (colors matched to each object's own `drawX()` function) so large-map building doesn't need to bounce between overview and 1:1 view just to place a hazard.
**Two bugs found and fixed to make the expansion actually work, not just look like it works:**
1. **Hazard-death softlock.** `triggerHazardDeath()` (mine/trap collision) only ever ran in Endless mode before this ship — traps/mines were never spawned anywhere else. It zeroed `S.fuel` and called `checkSurvivalGameOver()`, but never reset `S.phase` or the comet's position/velocity. Outside Endless, `checkSurvivalGameOver()` is a no-op (mode check fails), so hitting a Map-Maker-placed mine in golf/editor Test Play/a custom map would leave the comet permanently stuck mid-flight — no fuel meter to zero, no recovery path, an invisible softlock. Fixed by branching: Endless keeps its exact existing behavior (fuel zero + game-over check); everywhere else now respawns the comet at its last rest spot, the same recovery `stepFlight`'s out-of-bounds case already uses.
2. **Pickups were inert outside Endless.** The fuel/stardust collision-collection block in `stepFlight()` was gated `if (S.mode === 'endless')` — a Map-Maker-placed pickup on a custom map or in editor Test Play would just sit there, uncollectible, form without function. Widened to `S.mode === 'endless' || S.mode === 'custom' || S.mode === 'editor'`.
**Deliberately excluded, with reasons (not silently dropped):**
- **Asteroids** — a real, separate bug was discovered in passing: `main.js`'s frame loop only calls `game.stepAsteroids(DT)` when `S.mode === 'survival'`, a mode string that no longer exists anywhere in the codebase (a leftover from before Survival Mode was merged into Endless, 2026-07-16). Asteroids currently **never move in any live mode** — placing one via the editor would be a static, non-functioning decoration until that dead-code gate is fixed. Not fixed here (out of scope for "planet size options," belongs in its own dev-fix pass) — flagged as a new bug line in Improvements.
- **Decorative moon/ring/stardust-ring** — multi-parameter procedural dressing (orbital period, tilt, arc length, gap) generated by Explore's chunk RNG, not a single placeable object. Authoring these by hand needs its own multi-control UI, a distinct feature from a placement toggle — flagged as a follow-up in Improvements, not built here.
**Commit:** `4afccc9`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Sprint (July 2026)](../../games/black-hole-in-one/plans/map-maker-sprint.md), [Improvements](../../games/black-hole-in-one/ideas.md) §🔨 Map Maker Sprint. **This closes the Map Maker Sprint** — all six items (MM-6, MM-16, MM-11, MM-13, MM-18, MM-15) now shipped.

**Verification:** 19 new unit tests (planet resize clamping + mass sync, refuel toggle, all four new add-tools' shapes, selection on tap/deselect-on-empty-space, delete-clears-selection, pickup drag/delete, encode/decode round-trip for trap/mine/pickups/refuelStation including a hand-built pre-MM-15 hash proving backward compatibility, `startCustomMap` pickup/asteroid handling, glossary marking for refuelStation/stardust, the hazard-death respawn fix in both Endless and non-Endless, and the widened pickup-collection gate), full repo suite 403/403 green (was 384 before this session), `npm run smoke` clean (all 15 pages, zero uncaught errors). One test bug caught and fixed during this pass: an early draft placed a test planet and pulsar at the same default spawn point (both `addPlanet()`/`addPulsar()` center on the map by default), so hit-testing grabbed the wrong object — fixed by repositioning before the second add, same "objects stack at center until dragged apart" behavior real users see. Verified live in-browser on the local dev server: added all 6 object types and confirmed correct `world.bodies`/`world.pickups` shapes; the property panel appeared automatically on Add Planet and updated live through the size stepper (6.6→9.6, clamped correctly) and refuel toggle (visible green glow/ring matching Explore's existing FUEL-2 styling); all 4 new types render with the right colors in both the 1:1 view and — separately confirmed on a large map — the Overview canvas; Test Play confirmed the hazard-death fix directly (`stepFlight` against a mine outside Endless correctly recovered to `S.phase==='rest'` instead of sticking in `'flight'`); a live `encodeMap`→`decodeMap` round trip in the browser console confirmed all new types, the refuel flag, and the large-map size tag all survive. **Deploy verified:** pushed to `origin/main`, GitHub Actions `pages-build-deployment` run succeeded, fetched the live `editor.js` from `yevrap.github.io` and confirmed the MM-15 code (PLANET_R_MIN/MAX/STEP import, `getSelected()`, the pickups reset comment) is served; loaded the live game page with zero console errors. While shipping this, also cleaned up a stray leftover git worktree (`jolly-swanson-b69a27`, detached at an old already-merged commit) and its branch, found sitting in the repo from an earlier session.

## 2026-07-19 — 🔨 Map Maker Sprint: MM-18 object glossary

**Shipped:** MM-18 — a "📖 Glossary" tab in the shared ☰ Menu (`#howtoPanelGlossary`), alongside Play/Settings, reachable from every mode including Map Maker. Yev's ask went beyond the sprint doc's own scope note: *"i want it to be more than a list of objects but also have a section for the actions and mechanics of the game... i want to think of it like an achievements system that lets the player know what part of the game they've experienced/play guide."*
**Design — three sections, one data-driven tab:** **🪐 Objects** (`GLOSSARY_OBJECTS` in `constants.js`, 12 entries — tee, black hole/cup, planet, pulsar, refuel station, stardust, stardust ring, fuel pickup, mine, trap, asteroid, decorative moon/ring), **⚙️ Mechanics** (`GLOSSARY_MECHANICS`, 6 entries — flick & gravity aim, landing/hop-and-putt, orbit capture, refueling, wormhole warp, Town), and **🎛️ Modifiers**, which reuses the existing Inventory `ITEMS` registry directly rather than duplicating its icon/label/desc data. Content was written from the actual current mechanics (tap-to-land/orbit, Orbit Magnet, force-push flick-out), not the old auto-capture model.
**The "achievements" layer:** `S.glossarySeen` (`state.js`, persisted `blackHoleInOne_glossarySeen`) is a flat `{key: boolean}` map covering every Objects/Mechanics/Modifiers key. `markGlossarySeen(key)` flips one true the first time it's genuinely earned and reports whether it was a new discovery (same convention as `explore.js`'s pre-existing `markDiscovered`). Hooked at: hole/chunk generation (marks whatever object types are actually present in the hole/chunk about to be played — `markPresentObjects()` in both `gameplay.js` and `explore.js`), `launch()` (flick), `landOn()`/`completeLanding()` (landing), `beginOrbit()`/`step()`'s orbit-capture block (orbit capture), a fuel pickup collected in flight (refueling), `beginWarp()` (wormhole warp), and — in `ui.js`, the presentation layer, not the DOM-free gameplay modules — the Town Shop's first open and an Inventory item's first toggle-on. The Glossary tab itself renders each entry with a live "✅ Seen"/"❔ Not yet" badge plus an overall `N / 21 encountered` counter.
**Deliberately not marked:** Map Maker placement (adding a planet in the editor isn't "experiencing" it in play) and the decorative boot-background hole/chunk `main.js` generates behind the start menu before any mode is chosen — `genHole()`, `explore.startRun()`, and `explore.updateActiveChunks()` all gained a `silent` parameter for exactly that call site, so a fresh page load can never falsely mark anything as seen.
**Commit:** `ec77ac6`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Sprint (July 2026)](../../games/black-hole-in-one/plans/map-maker-sprint.md), [Improvements](../../games/black-hole-in-one/ideas.md) §🔨 Map Maker Sprint.

**Verification:** 12 new unit tests (glossary data shape/uniqueness across `GLOSSARY_OBJECTS`/`GLOSSARY_MECHANICS`/`ITEMS`, `defaultGlossarySeen`/`mergeGlossarySeen`/`markGlossarySeen` behavior, silent-vs-real marking for `genHole`/`startCustomMap` and `explore.startRun`/`updateActiveChunks`, and a deterministic brute-force chunk search — reused across three assertions — proving `refuelStation`/`moonRing`/`stardustRing` all mark correctly once their chunk is actually loaded and stay silent when asked not to); full suite 389/389 green, `npm run smoke` clean. Verified in-browser on the local dev server: took a real flick in Endless Golf, confirmed Tee Rock/Planet/Flick flipped to "✅ Seen" (4/21) live in the Glossary tab; opened the same tab from inside Map Maker and confirmed the identical live count and content render correctly there too, with a clean return to `editorBar` on close; confirmed the seen-state (read via `S.glossarySeen`, the ES-module-cached live singleton) survives a full page reload without the silent boot-background call re-marking or resetting anything; zero console errors throughout. Deploy verified: GitHub Actions run succeeded; loaded the live site and confirmed the 📖 Glossary tab is present and reachable.

## 2026-07-19 — 🔨 Map Maker Sprint: MM-13 custom-map HUD clarity + top-level My Maps

**Shipped:** MM-13 — a "🗺️ Custom Map" badge now appears in the top HUD (`#customMapBadge`, in `#bar`'s `hud-left`) whenever `S.mode === 'custom'`, so custom/shared-map play is never mistaken for standard Endless. The exit control (`#customBar`'s existing "☰ Menu") already returned cleanly to the main menu — nothing to fix there. **Same-day scope fold-in** (Yev's raw inbox note: *"maps should be a top level option when clicking on menu so you can play your saved maps"*): "📂 My Maps" is now its own top-level section in the main menu's Play tab (between Play and Make & Explore), wired straight to the existing My Maps drawer (MM-2/MM-11) via `editor.toggleMapsDrawer()`.
**Bug found and fixed along the way:** exposing the My Maps drawer outside the editor for the first time surfaced a real latent bug in `editor.js`'s `loadMap()` (the drawer's "✎ Edit" action) — it silently assumed it was only ever called from inside an already-live editor session: it never set `S.mode`/`S.phase`, never toggled `#editorBar`/`#howto`/other bar visibility, and its `stopTest()` guard could misfire against leftover phase state from an unrelated prior mode. This was invisible before MM-13 because the drawer's only entry point (`#ed-maps`) was inside `editorBar`, where those ambient conditions always happened to already be true. Rewrote `loadMap()` to unconditionally enter editor mode itself — sets `S.mode='editor'`/`S.phase='edit'`, clears `world.editorBackup`, and toggles all bar visibility directly, mirroring the pattern `startEditor()`/`startCustomMap()` already use — so ✎ Edit now works correctly regardless of where it's invoked from. Also gated the drawer's "Save Current Map"/"Share Current Map" buttons on `S.mode === 'editor' && S.phase === 'edit'` so they're hidden (not a dead tap) when the drawer is opened from the main menu with no map actually open.
**Not touched:** "▶ Play" needed no fix — `startCustomMap()` (MM-11) already hid `#howto` itself, so playing a map from the new top-level entry already worked correctly first try.
**Commit:** `58529ee`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Sprint (July 2026)](../../games/black-hole-in-one/plans/map-maker-sprint.md), [Improvements](../../games/black-hole-in-one/ideas.md) §🔨 Map Maker Sprint.

**Verification:** full suite `node --test tests/` 377/377 green (no new pure logic to unit-test — the change is HUD/menu wiring and a DOM-manipulating editor.js fix, neither of which the repo's existing test convention covers directly), `npm run smoke` clean. Verified in-browser (dev server + live site): badge shows correctly for both a locally-loaded custom map (played via the new top-level My Maps → ▶ Play) and a `?map=` shared-link arrival, in both cases with the main menu correctly hidden underneath and the exit control returning cleanly to it; confirmed "Save/Share Current Map" are hidden when My Maps is opened from the main menu with nothing open, and shown when genuinely mid-edit; confirmed ✎ Edit from the top-level entry lands in a fully functional 1:1 editor (`S.mode==='editor'`, `S.phase==='edit'`, Add Planet actually adds a body — previously would have silently no-op'd). Deploy verified: GitHub Actions run succeeded; loaded the live site and confirmed "📂 My Maps" renders as a top-level menu option.

## 2026-07-19 — 🔨 Map Maker Sprint: MM-11 play saved maps directly

**Shipped:** MM-11 — the My Maps drawer's per-map row now has two distinct actions: a new **▶ Play** button hands a saved map straight to `gameplay.js`'s `startCustomMap()` (the exact same hand-off a shared `?map=` link already used) so it's immediately playable — aim, flick, sink/score — in custom mode's `rest` phase, no editor detour. The old load-into-editor action stays reachable, relabeled **✎ Edit** (was **▶ Load**, which read ambiguously once a real Play button existed next to it); the drawer's rename button was relabeled **✏️ Rename** for the same reason (both used a bare pencil glyph before).
**Design:** the real gap the sprint doc identified — Map Maker already had Test Play (MM-1) and URL share/import (MM-3), and a shared link already dropped a visitor straight into play; the only path that still forced an edit-mode detour was loading a *locally saved* map from My Maps. `startCustomMap()` already did everything needed (hides editor/explore chrome, shows `customBar`, sets `S.mode='custom'`/`S.phase='rest'`) — this item is purely the drawer's own hand-off to it, zero new gameplay code.
**Not touched:** `loadMap()` (now wired to ✎ Edit) is byte-for-byte the pre-existing function; the exit path (`☰ Menu` on `customBar`) already worked correctly for custom-mode play sessions from the pre-existing shared-map arrival flow, so no exit-side code was needed either.
**Commit:** `9c34a89`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Sprint (July 2026)](../../games/black-hole-in-one/plans/map-maker-sprint.md), [Improvements](../../games/black-hole-in-one/ideas.md) §🔨 Map Maker Sprint.

**Verification:** full suite `node --test tests/` 377/377 green (no new tests — the change is pure UI wiring with no new pure logic to unit-test; `startCustomMap()` and `loadMap()` themselves are pre-existing and already covered indirectly), `npm run smoke` clean. Verified in-browser (dev server): saved a test map to My Maps, clicked ▶ Play — confirmed `S.mode==='custom'`, `S.phase==='rest'`, both bodies present, `customBar` shown with no editor chrome; drove a flick via `game.launch()` and confirmed strokes incremented and the comet gained velocity (phase→`flight`); clicked ☰ Menu and confirmed it returned cleanly to the main menu overlay, not stuck in editor edit phase; separately clicked ✎ Edit on the same saved map and confirmed it still loads into `S.mode==='editor'`/`S.phase==='edit'` with both bodies intact, unchanged from pre-MM-11 behavior. Deploy verified: GitHub Actions run succeeded; fetched live `editor.js` from `yevrap.github.io` and confirmed the `playMap`/`▶ Play`/`✎ Edit` wiring is served.

## 2026-07-19 — 🔨 Map Maker Sprint: MM-16 editor overview mode

**Shipped:** MM-16 — a full-canvas "overview" mode for the Map Maker editor, opened via a new **🗺️ Overview** button in `#editorBar`. Resolves MM-16's long-open design gate directly from Yev's own words: *"I like the minimap and think it can be used as a map maker with adjustments made once it is closed."*
**Design:** two modes of the same editor, not two screens. Overview shows the entire course canvas at once (reusing `renderStarMap()`'s visual language — dark bg, fitted grid, simplified glyph markers — but its own function, `renderEditorOverview()` in `ui.js`, reading `world.bodies`/`teeRock`/`blackHole` directly rather than Explore's fog-of-war chunk discovery) for coarse drag-placement anywhere on the map in one motion. Closing it returns to the unchanged 1:1 editor for fine adjustments (nudging position, MM-15's future sizing) — nothing about the existing drag-to-move/drag-to-trash editing model changed.
**Gated on MM-6:** the Overview button is hidden (not disabled) on small/golf-scale maps, where the 1:1 view already shows the whole course and the control would have nothing to add — no dead click.
**Implementation — the key move was reuse, not new drag logic.** `editor.js`'s existing `pointerDown`/`pointerMove`/`pointerUp` already operate purely in world coordinates, so overview dragging needed zero new drag-state code: a new pure transform (`overviewTransform`/`overviewToWorld`/`worldToOverview` in `constants.js`, fit-to-container + center, same approach as every other canvas view in this game) converts the overview canvas's screen px to world coords, then feeds those into the same pointer functions the 1:1 view already calls. Overview- and 1:1-placed bodies are therefore identical on the wire, and the existing out-of-bounds delete threshold (dragging a body past the map's edge + margin) fires exactly the same way from either view with no duplicated logic. Add Planet/Add Pulsar work unchanged from inside Overview (they already centered on the active map's bounds regardless of which view was open).
**Commit:** `7fd43c1`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Sprint (July 2026)](../../games/black-hole-in-one/plans/map-maker-sprint.md), [Improvements](../../games/black-hole-in-one/ideas.md) §🔨 Map Maker Sprint.

**Verification:** 6 new unit tests (`overviewAvailable` size-tier gating, `overviewTransform` fit/center math including degenerate zero-size inputs, exact round-trip inverse of `overviewToWorld`/`worldToOverview` across the full map, extrapolation past the canvas edge for the off-edge-delete path, and a full drag-through-overview-coordinates test asserting a body lands at the exact transformed world position) — full suite 377/377 green, `npm run smoke` clean. Verified in-browser end-to-end on a large map: added a planet + pulsar (both default to map center, same as the 1:1 view — stacked until moved), opened Overview and confirmed both rendered as distinct glyphs at the fitted scale; dragged each via direct `PointerEvent` dispatch to a new position (the browser-automation drag tool doesn't synthesize pointer events — real touch/mouse input does — so this exercised the actual `pointerDown`/`Move`/`Up` code path rather than the automation shortcut) and confirmed the rendered position matched the expected world coordinates exactly; closed Overview and confirmed `world.bodies` held the same new positions with no copy/sync step; ran Test Play successfully on the resulting large map with no console errors. Separately confirmed on a small/golf-scale map that the Overview button stays hidden. Deploy verified: GitHub Actions run succeeded (`7fd43c1`); fetched the live deployed page and confirmed `#ed-overview` is present in the served DOM.

## 2026-07-19 — 🔨 Map Maker Sprint: MM-6 map size chooser

**Shipped:** MM-6 — a size chooser when starting a new map from the mode menu: **small/golf-scale** (200×200, unchanged default) or **large/Explore-scale** (600×600, new `MAP_SIZES` tier in `constants.js`). First item in the Map Maker Sprint, and a prerequisite for MM-16 (editor minimap/overview mode) — the overview only has something to offer once a map can be bigger than one screen.
**Design:** two fixed size tiers, per the sprint doc's own default (its "Map size tiers" question went unanswered). The active tier is module state (`world.mapSizeKey` in `state.js`), reset to small on every golf/endless run start so those modes are provably untouched, and carried on the map data itself (`mapData.size`) through save (My Maps), URL share (`encodeMap`/`decodeMap`), and import.
**Correctness risk found and fixed:** `stepFlight()`/`stepOrbit()`'s "lost in space" out-of-bounds checks (the same ones GOLF-1/2/the OB_MARGIN fix above touch) read the hardcoded `WORLD_W`/`COURSE_H` (200×200) — on a large map this would have falsely rescued the comet the moment it flew past x/y≈200, well inside the actual 600×600 canvas. Both checks now read `mapBounds(world.mapSizeKey)` instead. Same fix applied to the editor's drag-off-canvas delete threshold and the boundary-line renderer, all previously hardcoded to the same 200×200.
**Not changed:** camera-follow (`ui.camera`, both editor and Test Play) already tracked the comet unconditionally regardless of world size — no change needed for Test Play to work at the larger scale. `genHole()`'s procedural golf/endless generation is untouched; Map Maker doesn't call it.
**Backward compatibility:** `encodeMap` only emits a size tag for 'large', so every pre-sprint share link/save decodes byte-identical to before and defaults to small.
**Commit:** `1f2e3fc`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Sprint (July 2026)](../../games/black-hole-in-one/plans/map-maker-sprint.md), [Improvements](../../games/black-hole-in-one/ideas.md) §🔨 Map Maker Sprint.

**Verification:** 8 new unit tests (size-tier bounds resolution, encode/decode round-trip for 'large', default-to-small for untagged/pre-sprint maps, `startEditor(size)` fresh-map placement at both tiers, out-of-bounds delete threshold scaling with size, `startRun`/`startCustomMap` size reset/default) — full suite 372/372 green, `npm run smoke` clean. Verified in-browser (dev server + live deploy): drove the running module directly to confirm `world.mapSizeKey`/default tee-hole placement for both tiers, Add Planet centering on the active size, and a headless flight simulation showing a large-map flight travels to ~600 before OOB triggers (vs. ~200 pre-fix) while a small-map flight still triggers at ~200 exactly as before. Deploy verified: GitHub Actions run succeeded; live site's mode menu shows the size chooser and starting a large map on the deployed site sets `world.mapSizeKey` correctly.

## 2026-07-19 — 🐞 Golf "lost in space" trips before gravity can curve the comet back, with no boundary shown

**Symptom:** Yev's inbox note — *"on laptop it is unclear when the ball will be lost and what the map size is. it seems like a lot of the times the comet can come back towards the planets but doesn't and is deemed lost in space."* Same underlying mechanic as GOLF-1/GOLF-2 below (the OOB rescue), but a design/feel gap rather than a crash — already tracked as the open design note under that fix and as "Endless — softer 'lost in space' boundaries/indicators" in the Explore/Survival polish backlog.
**Root cause:** two compounding issues, both in golf modes only (Explore has no such boundary — it's an open chunked world). (1) `OB_MARGIN` was 14 units — only ~7% past the 200×200 course rect — and `stepFlight()`/`stepOrbit()`'s out-of-bounds check reads position only, never trajectory. Gravity is already the *only* force on the comet at any distance (`gravityAt` sums every body unconditionally, never clipped to the course rect), so a wide eccentric arc that would curve back on its own got killed the instant it crossed a line barely past the edge. (2) There was no on-screen indicator of the boundary at all — a `ui.js` comment ("Faint course edge removed as we use the whole screen now") confirmed one existed once and was deliberately dropped when the game went full-screen, leaving "what the map size is" genuinely unanswerable from the screen.
**Fix (two judgment calls confirmed with Yev before implementing, not defaulted silently):**
- **Keep a safety net, widen it a lot** (vs. dropping the hard boundary entirely and relying only on the 24s flight-time cap): `OB_MARGIN` 14 → 56 (4×). Gravity now gets real room to reclaim a looping shot before the hard rescue trips; the rescue (teleport to last rest + toast) stays as the last resort for shots that are genuinely escaping, or custom Map Maker courses with far-apart bodies that could otherwise strand a shot indefinitely.
- **Always-visible boundary** (vs. a warning that only fades in near the edge): a faint dashed rect drawn at the real `OB_MARGIN` threshold, shown whenever the comet is flying or orbiting in golf modes — so the course's true extent is legible during the moments it actually matters, not just an invisible line you find out about after being yanked back.
**Regression tests** (`tests/black-hole-in-one.test.mjs`): a comet placed past the *old* margin but inside the *new* one now stays in flight (previously would have been rescued); a comet past the *widened* margin still gets rescued (safety net confirmed intact, not removed). GOLF-2's existing regression test (below) updated to place its out-of-bounds planet relative to `OB_MARGIN` so it stays a valid regression at any future tuning.
**Commit:** `ef0c81b`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Golf Mode Catch-Up arc.

**Verification:** full suite `node --test tests/` 365/365 green (+2 new tests), `npm run smoke` clean. Verified in-browser (dev server + live deploy): directly drove `comet`/`S.phase` through the actual running module (not just headless) — confirmed the dashed boundary renders during flight, a comet past the old-but-not-new margin stays in flight, and a comet past the widened margin still gets rescued with the "🌌 Lost in space" toast, matching the unit tests exactly. Deploy verified: GitHub Actions run succeeded; live `constants.js` fetched directly from `yevrap.github.io` confirms `OB_MARGIN` serves as `56`.

## 2026-07-19 — 🐞 GOLF-1 + GOLF-2: comet stranded in an off-screen orbit with no recovery

**Symptom:** two related inbox reports — *"Black holes eat you up but no way to restart"* (GOLF-1) and *"I seem to be able to get past the end of the map"* (GOLF-2).
**Root cause:** `gameplay.js`'s `stepOrbit()` had no out-of-bounds escape, unlike `stepFlight()` (`OB_MARGIN` out-of-bounds check + `FLIGHT_CAP` time cap, both of which return the comet to rest). A planet placed near the course edge — reachable via Map Maker/custom maps, since the editor only auto-deletes an object once it's dragged past `W+10`/`COURSE_H+10` — can carry its orbit band (up to `ORBIT_MAX_GAP` past the planet's surface) outside the playfield. Once captured into that orbit, the comet circled forever off-screen: no automatic escape like flight has, and nothing on-screen for the player to flick to break out manually. That reads exactly like GOLF-1's "eaten, no way to restart" from the player's side.
**Repro:** headless, not manual play — orbit capture requires precise physics timing that's impractical to hit by hand in a live browser session, but the physics/gameplay modules are pure and DOM-free (the same way `tests/black-hole-in-one.test.mjs` already exercises them headlessly under `node --test`). Placed a planet at the course edge, forced an orbit capture at the outer edge of the capture band (`planet.r + ORBIT_MAX_GAP`), and stepped `stepOrbit()` for 10 simulated seconds: the comet sat past `-OB_MARGIN` the entire time and never recovered.
**Fix:** added the same OOB rescue `stepFlight()` already has to `stepOrbit()` — on going out of bounds, clear `world.orbit`, reset the comet to its last rest spot, clear velocity/trail, `sfx.lost()`, toast "🌌 Lost in space — replay from your last spot", check survival game-over. The deliberate no-timeout design of orbit (a captured orbit holds forever until flicked out or it skims the cup — see the comment above `stepOrbit()`) is untouched; only the boundary case changed.
**Open design note (not silently decided):** an earlier inbox note on this same bug explicitly asked for a "force-push back into the map" instead of a teleport-reset. The shipped fix uses teleport-reset (matching `stepFlight()`'s existing pattern exactly) because the priority was closing the unrecoverable-stuck state, not making a product call on the softer alternative. That alternative is tracked separately: "Endless — softer 'lost in space' boundaries/indicators" in Improvements' Explore/Survival polish backlog.
**Regression test:** `tests/black-hole-in-one.test.mjs` — `stepOrbit rescues a comet whose orbit drifts outside the course boundary (GOLF-2 regression)`. Confirmed failing before the fix (comet stayed at `S.phase === 'orbit'`, past `-OB_MARGIN`, forever).
**Commit:** `4ef21bf`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Golf Mode Catch-Up arc, GOLF-1 (P0) + GOLF-2 (P1).

**Verification:** full suite `node --test tests/` 363/363 green (+1 new test), `npm run smoke` clean (all pages load without uncaught errors). Verified in-browser (dev server): game loads with no console errors; orbit's normal in-bounds behavior (holds indefinitely, breaks on flick, sinks on skimming the cup) is provably untouched by the same regression suite. Deploy verified: GitHub Actions run `29703899498` succeeded; live `gameplay.js` fetched directly from `yevrap.github.io` confirms the GOLF-2 fix comment and rescue branch are served.

## 2026-07-19 — 🗺️ MAP-2: Free fast travel on the star map

**Shipped:** Tap a discovered black hole or Town on the star map to warp there — free, any phase, even at 0 fuel. Two-tap confirm: first tap selects (dashed highlight ring + a "⚫ Black hole — Travel?" / "⌂ Town — Travel?" prompt bar with a **Go** button), a second tap on the same target or the Go button travels, a tap elsewhere deselects — no accidental warps. Black-hole arrivals always land in a stable orbit, never free-fall; Town arrivals use the exact same landing contract as a normal black-hole warp. This jumped the Wave 1 checkpoint gate a second time (MAP-1 jumped it first) — asked Yev directly again rather than auto-starting, per the build plan's own rule, and he chose to jump both times. Free travel was also reconfirmed directly (not left as just the spec's default) when greenlighting this item.
**Commit:** `68d1948`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ (v44)
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Orbits & Star Map arc, MAP-2 (P1). Full spec: [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md).

**Implementation:**
- `constants.js` — new `hitTestMapTargets(mx, my, targets)`: picks the closest hit target within its own radius of a point, else `null`. Deliberately placed here rather than in `ui.js` — it's pure/DOM-free and this file's header comment already commits it to being the unit-tested layer, whereas `ui.js` needs a `document` global at module load time (`canvas.getContext('2d')`) and has never been imported by the test suite.
- `explore.js` — new `arriveInOrbit(b, ang = 0)`, extracted from `useReturnPortal()`'s orbit-injection (same `EXPLORE_BLACKHOLE_R + COMET_R + ORBIT_MIN_GAP + 2` arrival radius, proven to clear the `b.r * 0.3` dive-warp trigger). `useReturnPortal()` now calls it instead of duplicating the math — behavior unchanged, confirmed by its existing regression tests. New `travelToBlackHole(id, wx, wy)` jumps the camera/active chunks to the target coords first (so the body actually resolves in `world.bodies`), then arrives via `arriveInOrbit()`; returns `false` defensively if the id isn't found. New `arriveAtTown()` is a thin wrapper around the existing (now-exported-by-use) `completeWarp()` — safe to call directly since `world.warp` is null outside an actual warp.
- `ui.js` — `renderStarMap()` now rebuilds a `mapTargets` list every render (Town + only *discovered* black holes — the loop already only iterates charted chunks, so undiscovered ones are structurally untappable; stations stay informational-only, never a target) and draws a dashed highlight ring around the selected one. New `handleStarMapTap(mx, my)` (canvas pointerdown handler) and `confirmStarMapTravel()` (Go button) drive the two-tap state machine; `updateStarMapPrompt()` syncs the `#sm-travel` prompt bar's visibility and label.
- `index.html` / `style.css` — new `#sm-travel` prompt row (label + `#sm-travel-go` button, ≥44px touch target) between the star map canvas and its legend.
- `main.js` — wired `#starMapCanvas`'s `pointerdown` → `ui.handleStarMapTap(e.offsetX, e.offsetY)` and `#sm-travel-go`'s `click` → `ui.confirmStarMapTravel()`.

**Tests:** 6 new unit tests — `hitTestMapTargets` (radius-contains-point, overlapping-radius tie-breaks toward the closer center, empty list) in `tests/black-hole-in-one.test.mjs`; `arriveInOrbit` (exact radius, clears the dive-warp trigger, defaults to angle 0), `travelToBlackHole` (finds a real seeded black hole via the same chunk-sweep pattern as the existing Return Portal test, arrives in orbit from an unrelated mid-flight phase; returns `false` and touches no state when the id can't be resolved), `arriveAtTown` (lands on the tee rock from a non-rest phase) in `tests/explore.test.mjs`. Existing Return Portal tests pass unchanged, confirming the `arriveInOrbit` extraction didn't alter its behavior. Full suite `node --test tests/` 362/362 green (+8, two more than the 6 new tests since two hit-test edge-case tests were added alongside), `npm run smoke` clean, `npm run e2e` 13/13 green. Verified in-browser at 375px and desktop: real click end-to-end on the **Go** button confirmed a live warp (comet visibly relocated and orbiting, camera/game state all correct) for both a black hole and Town; canvas-tap selection verified via the same `ui.handleStarMapTap()` the real pointerdown listener calls (manual mouse-coordinate aiming against a ~460px/336px canvas proved too imprecise to reliably land clicks by eye — not a code issue, confirmed by a real miss-tap correctly deselecting). Deploy verified: GitHub Actions run `29702671475` succeeded; live `version.json` and the game page both confirmed serving v44 with no console errors.

## 2026-07-19 — ✨ ORB-4: Stardust rings you orbit to collect

**Shipped:** ~25% of non-blackhole planets in Explore now seed a gold pickup ring inside the orbit-capture band. With Orbit Magnet ON, capturing onto a ringed planet snaps the orbit radius onto the ring — riding it sweeps every dot within one revolution instead of leaving them at whatever radius the approach happened to catch. Also fixed a long-standing color bug: every pickup used to render green regardless of type; stardust now reads gold, fuel stays green, and a faint gold guide arc traces the ring so it reads from a distance.
**Commit:** `53784ba`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Orbits & Star Map arc, ORB-4 (P1). Full spec: [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md).

**Implementation:**
- `constants.js` — `STARDUST_RING_CHANCE` (0.25), `STARDUST_RING_COUNT_MIN/MAX` (5–8 dots), `STARDUST_RING_GAP_MIN/MAX` (where in the capture band the ring sits).
- `explore.js`'s `getChunkBodies()` — a new roll consumed **last** in the rng stream (after moons/rings), so existing chunk layouts stay byte-identical. Black holes are excluded; refuel-station and Giant planets can still roll one (jackpot planets).
- `explore.js`'s `getChunkPickups()` — emits evenly-spaced dots on each ringed body's ring, only for bodies whose canonical chunk matches (avoids the 3×3-neighbor lookup tripling dots up), skipping any dot `pickupBlockedByBody` says overlaps another body.
- New `ringSnap(cap, b, magnetOn)` in `explore.js` — no-ops unless the magnet is on and the captured body has a ring, otherwise snaps the orbit radius to `b.stardustRing.radius` and recomputes `omega` for that radius (keeping the capture's direction sign). Wired into `step()`'s capture branch **and** `stepAscend()`'s tap-to-orbit handoff — the latter wasn't in the written spec, but skipping it would leave rings uncollectable via tap-to-orbit (TAP-3), which is the primary way players enter orbit now. Flagged as a judgment call in Improvements.
- Extracted `collectPickups()` (was inlined in `step()`) and call it from both `step()` and `stepOrbit()` — previously orbiting collected nothing, which would have made the whole item dead on arrival for a ringed planet.
- `ui.js`'s `drawPickup()` — was unconditionally green; now branches on `p.type` (stardust gold `#ffd98a`/`#fff3d0`, fuel green unchanged). New `drawStardustRing()` draws the faint gold guide arc.

**Tests:** 17 new tests in `tests/explore.test.mjs` — ring seeding (no black holes, ~25% frequency, geometry inside the capture band, 5–8 dots, determinism), pickup emission (evenly spaced, exact ring radius, no 3×3 duplication, blocked-dot skip), `ringSnap` unit tests (no-op cases, radius/omega/direction correctness), and a full integration test driving `step()` → capture → `stepOrbit()` for one revolution asserting every dot on the ring gets collected. Full suite `node --test tests/` 354/354 green (+17), `npm run smoke` clean, `npm run e2e` 13/13 green. Verified in-browser at 375px and desktop by rendering a synthetic ringed planet through the real render pipeline (ring geometry + guide arc confirmed visually; the gold-vs-green pickup color fix confirmed by sampling canvas pixel data — stardust glow ≈ RGB(146,127,115) warm tan, fuel glow ≈ RGB(27,98,75) green). Deploy verified: GitHub Actions run `29701697340` succeeded; live `explore.js` fetched directly from `yevrap.github.io` confirms `stardustRing`/`ringSnap` are served.

## 2026-07-19 — 🖥️ HUD-2: ☰ Menu redesign (merge + close + no-jump) + HUD-3b: Town Shop ✕

**Shipped:** The ☰ Menu now has two tabs (Play, Settings) instead of three — Settings and Inventory are merged into one Settings tab, with the inventory toggles still gated to Explore mode (same rule as before, just a section instead of a separate tab). A ✕ close button sits next to the tabs, matching the Star Map's `#sm-close`. Switching Play ↔ Settings no longer visibly shifts the tab bar or close button — the header is now pinned at a fixed position instead of living inside a `justify-content: center` box whose height (and therefore centering) changed with the active panel. A new dedicated ⚙️ button in the gameplay corner cluster (below ☰ Menu) opens the menu straight to Settings, no detour through Play. Folded in HUD-3b in the same session: the Town Shop overlay also gets a ✕ (same chrome as `#sm-close`), alongside its existing "🛫 Launch" exit.
**Commit:** `eda74d7`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ (v43)
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Backlog · HUD & Settings, HUD-2 (P1) + HUD-3b (P2), folded together per HUD-2's own note since fixing the jump meant restructuring the same layout both touch.

**Root cause of the jump (diagnosed in the backlog before this session, confirmed while building):** `#howto` was a `position:fixed; inset:0; justify-content:center` overlay holding the tab bar *and* the active panel as flex siblings. The Play panel (title + 2 paragraphs + mode buttons) and the Settings/Inventory panels (a handful of toggle rows) have very different natural heights, and centering the whole overlay on that combined height meant the tab bar's on-screen Y position moved every time the panel below it changed size.

**Fix:**
- `index.html` — restructured `#howto` into `#howto-header` (tabs + new `#howto-close` ✕) and `#howto-body` (the panel area). Removed the standalone `#howtoPanelInventory` div and `#howtoTabInventory` tab button; inventory toggles now render inside `#howtoPanelSettings`.
- `style.css` — split `#howto` out of the shared `#howto, #scorecard, #myMapsDrawer, #survGameOver` centered-overlay rule (those three still center normally — they don't have this problem) into its own top-anchored layout (`padding-top` instead of `justify-content:center`), so `#howto-header`'s screen position is constant regardless of `#howto-body`'s height. `#howto-body` gets a `min-height` sized to the taller Play panel (so the box doesn't visibly shrink on the short Settings tab) and a `max-height` + `overflow-y:auto` (so the Explore-only inventory rows scroll instead of growing the box past the viewport) — same scroll-instead-of-grow convention as `#ts-items`/`#myMapsList`. `.ts-header` switched from `justify-content:center` to `space-between` to make room for the new `#ts-close`, styled identically to `#sm-close`.
- `ui.js` — collapsed `renderHowtoTabs()`'s three-way branch (play/settings/inventory) down to two, and merged `renderHowtoSettings()` + `renderHowtoInventory()` into one `renderHowtoSettingsPanel()` that renders the sound/freeze toggles and then, only when `S.mode === 'explore'`, an "🎒 Inventory" section (reusing the existing `.mode-head` label style) with the same inventory rows as before. Added `closeTownShop()` + a `shopClosedByUser` flag alongside the existing `menuOpen` flag — `updateTownShop()` (called every render frame) now also respects a manual close, and clears the flag the moment `atTown()` goes false so the shop greets you again on the next visit rather than staying closed forever.
- `main.js` — wired `#howto-close` → `ui.hideHowto()`, the new `#settingsBtn` → `ui.showHowto(); ui.showHowtoTab('settings')` (synchronous, so there's no intermediate Play-tab paint), and `#ts-close` → `ui.closeTownShop()`.

**Tests:** Full suite `node --test tests/` 342/342 green (unchanged — no pure-logic module touched), `npm run smoke` clean, `npm run e2e` 13/13 green including the pre-existing `☰ menu fully hides an open Town Shop, both directions` test (unaffected by the merge). Verified live in the browser preview: Play→Settings and Settings→Play both leave the tab bar/close button pixel-identical; the dedicated ⚙️ button lands directly on Settings with the merged Inventory section visible in Explore mode; `#howto-close` hides the menu; `#ts-close` hides the Town Shop and it stays hidden across render frames until leaving and returning to Town, at which point it reappears. Deploy verified: GitHub Actions run `29700134880` succeeded; live page (fetched directly from `yevrap.github.io`) already shows the two-tab header, ⚙️ button, and ✕ close.

## 2026-07-19 — 🐞 Fix: comet permanently freezes if you try to aim while out of fuel (FUEL-3)

**Shipped:** Attempting a mid-flight aim after the tank hits 0 no longer soft-locks the comet. It now drifts (or stays put) exactly like the existing FUEL-1 stranded state — the ↺ restart button pulses red and hitting it recovers normally.
**Commit:** `5aeba9b`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** Bug reported directly by Yev (Freeze mid-flight aim is default-on, so most players would hit this the first time they ran dry mid-air).

**Root cause:** `explore.js`'s `launch()` had two early-return guards: `if (fuel <= 0) return false` and `if (speed < MIN_SHOT) { …restore S.phase…; return false }`. Only the second one restored `S.phase` from `'aiming'` back to `'flight'`/`'rest'`/`'orbit'`. A mid-flight aim (pointerdown sets `S.phase = 'aiming'`) released with an empty tank hit the *first* guard and returned without ever restoring the phase — `S.phase` stayed `'aiming'` forever. No phase-stepping condition in `main.js`'s main loop steps physics for a bare `'aiming'` state, and `canAim` requires `'rest'`/`'orbit'`/`'flight'`, so the player couldn't even start another drag to escape it. Toggling the Freeze setting didn't help because freeze was never the actual cause — the leading theory in the bug report (freeze/`hasThrust()` interaction) turned out to be a red herring; the real bug was the missing phase-restore on the fuel guard.

**Fix:** Folded the no-fuel check into the same branch as the weak-drag cancel, so *any* failed launch attempt restores `S.phase` the same way (`explore.js`, 3-line diff).

**Sibling spotted, not touched:** `gameplay.js`'s Endless-mode `launch()` has the identical pattern (`if (S.mode === 'endless' && S.fuel <= 0) return false` with no phase reset). Traced it and confirmed it's currently unreachable — `checkSurvivalGameOver()` runs on every `'rest'`/`'orbit'` phase entry and forces `S.phase = 'roundover'` before the player can start a new aim at 0 fuel, so Endless never hits this path. Left as-is per smallest-safe-fix; flagged in [Improvements](../../games/black-hole-in-one/ideas.md) in case a future change (e.g. a mid-flight-aim feature for golf modes) makes it reachable.

**Tests:** New regression coverage at both levels — `tests/explore.test.mjs` (`FUEL-3: running out of fuel mid-flight…`, calls `launch()` directly and asserts `S.phase` returns to `'flight'`) and `scripts/e2e.mjs` (`FUEL-3` — drains the tank via real launches, forces the mid-flight-aim state, asserts the comet actually drifts, the restart button pulses, and clicking it fully recovers). Both confirmed to fail on the pre-fix code (`git stash` check) and pass after. Full suite `node --test tests/` 320/320 green (+1), `npm run e2e` 13/13 green (+1). Deploy verified: GitHub Actions run succeeded; live `explore.js` fetched directly from `yevrap.github.io` confirms the fixed `launch()` is served.

## 2026-07-19 — 🗺️ MAP-1: Landmarks on the star map

**Shipped:** The zoom-out star map (OW-9) now shows black holes and refuel stations on every discovered chunk — a soft violet-white glowing dot for each charted black hole, a small green dot for each charted refuel station — instead of just fog/Town/comet. Legend row extended to match.
**Commit:** `368e161`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Orbits & Star Map arc, Wave 2, MAP-1. Full spec: [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md).

**Out of the documented order, by explicit choice:** the build plan gates Wave 2 (this item) behind Wave 1 finishing (ORB-3/ORB-4, both still open) and a Yev playtest checkpoint on Wave 1 — neither had happened. Asked directly whether to hold for the gate or jump to MAP-1 now; Yev chose to jump. ORB-3/ORB-4 and the checkpoint verdict are still outstanding — see the build plan's status line.

**What changed:**
- `explore.js` — new pure `chunkLandmarks(cx, cy, seed)`: re-derives landmarks from `getChunkBodies()`'s existing seeded output (same rng stream, no parallel state) rather than tracking landmarks separately, so they can never drift out of sync with the actual bodies. Filters to `type === 'blackhole'` and `refuelStation` planets, mapping each to `{ kind, x, y, id }`.
- `ui.js` — `renderStarMap()` now loops discovered chunks, calling `chunkLandmarks()` (cached in a per-open `Map` so a future interactive re-render, e.g. MAP-3's pan/zoom, won't regenerate the same seeded list every frame) and drawing each landmark at its actual sub-chunk position (not just the cell center) so two landmarks sharing a chunk don't stack. Black holes render as a soft two-stop radial glow (louder, per spec); stations as a flat dot (fuel-green, matching the in-flight refuel-station glow color already used elsewhere).
- `index.html` / `style.css` — extended `.star-map-legend` with Black hole/Station swatch entries, in the existing swatch-row style (kept the established swatch pattern rather than the build plan's literal emoji-legend wording, since the shipped legend was already swatch-based).
- `tests/black-hole-in-one.test.mjs` — first tests to touch `explore.js`'s world-gen functions directly: determinism (same cx/cy/seed → identical output), agreement with `getChunkBodies()` (every landmark traces back to a real body with the right id/position/kind), and that plain planets/moons/rings never leak through as landmarks. `node --test tests/` 341/341 green (+3).

**Tests:** Full suite 341/341, `npm run smoke` clean, `npm run e2e` 12/12. Verified live in-browser: forced `discoveredChunks` via console (same `import()`-into-page probing pattern the e2e suite already uses) to exercise both a known black-hole chunk and a known station chunk, confirmed correct rendering at both 375px and desktop width, confirmed undiscovered chunks show only fog, and timed a worst-case 1,681-chunk discovered set opening in ~13ms (no hitch). Deploy verified: GitHub Actions run succeeded; live `version.json` (v42) and `explore.js` fetched directly from `yevrap.github.io` confirm `chunkLandmarks` is served.

## 2026-07-19 — 🐞 Fix: Town Shop bottom sheet covers the ☰ Menu button on short viewports

**Shipped:** The Town Shop panel no longer grows tall enough to physically cover the fixed Map/Restart/Menu button cluster — it now scrolls internally past a capped height instead.
**Commit:** `813ff7f`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** found while running the full test suite after the sg-again/sg-menu fix below — `npm run e2e` had one pre-existing failure (`☰ menu fully hides an open Town Shop, both directions`) that predated both of today's other fixes (confirmed via `git stash` against `main`). Not a flaky test.

**Root cause:** `#ts-items` had no `max-height`. A shop with all 3 upgrades listed plus all 3 starter items owned (the common case — Endless Flight/Thruster/Orbit Magnet are all `defaultOn`) renders 6 rows, and the bottom sheet grows to fit them: confirmed 573px tall on an 800×600 viewport via a standalone Puppeteer debug harness, `document.elementFromPoint()` at the Menu button's on-screen center returned `townShop`, not `helpBtn`. Since `#townShop` sits at `z-index: 50` (above the `#btns` cluster), a real tap aimed at Menu landed on the shop's dead space instead and silently did nothing — same failure mode as the sg-again/sg-menu bug below, different cause.

**Fix:** `style.css` — `#ts-items` gets `max-height: 40vh; overflow-y: auto;`, the same scroll-instead-of-grow treatment `#myMapsList` already uses a few lines up. One-line change.

**Tests:** `node --test tests/` 338/338 green (unaffected). `npm run e2e` went from 11/12 → **12/12** — the previously-failing Town Shop test now passes without any change to the test itself. Verified live: resized the browser to 800×600, forced the "at Town" state via console, confirmed via `elementFromPoint` that Menu is reachable, then actually clicked through Town Shop → ☰ Menu → clean Play screen with no overlay left behind. Deploy verified: GitHub Actions run succeeded; `npm run smoke` clean across every page.

## 2026-07-19 — 🐞 Fix: sg-again/sg-menu dead buttons on the survival game-over screen

**Shipped:** Both buttons on the "💥 OUT OF FUEL 💥" survival game-over screen (`#survGameOver`) work again — 🔋 Try Again restarts the run, ☰ Menu returns to the mode-select screen — and the overlay itself now renders with the same full-screen chrome as every other overlay in the game.
**Commit:** `4c91b04`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Backlog · HUD & Settings, flagged as a bug found (not fixed) while shipping HUD-1 the same day.

**Root cause:** `e21281d` (Core Re-alignment + Survival merge, 2026-07-16) deleted the `#sg-again`/`#sg-menu` click listeners from `main.js` without rewiring them to the merged endless/explore mode structure — `git log --all -S"sg-menu" -- games/black-hole-in-one/main.js` confirms they existed pre-merge and vanished in that commit. The old `sg-again` handler called `startRun('survival')`, a mode name the merge retired.

**Fix:** `main.js` — `#sg-again` now calls `startRun(S.mode)` (same pattern as `restartBtn`); `#sg-menu` calls `ui.showHowto()` (same pattern as `#helpBtn`/`#cb-menu`).

**Found while verifying, also fixed (same root problem: this overlay was never fully wired, going back to the original SURV-1 scaffold):**
- `style.css` — `#survGameOver` was never added to the shared overlay/button selectors (`#howto, #scorecard, #myMapsDrawer`, etc.), so even with working listeners the screen rendered unstyled and off-screen (`position: static`, bottom of the document flow) instead of the fixed, centered, backdrop-blurred treatment every other overlay gets. Added it to all five shared selectors.
- `main.js` — `ui.showHowto()` doesn't hide `#survGameOver` (it only hides `#bar`/`#exploreBar`/`#editorBar`/`#customBar`/`#townShop`), and both overlays share `z-index: 10` — so once the CSS fix made the overlay visible, clicking ☰ Menu left "OUT OF FUEL" stacked on top of the menu underneath it (DOM order decides the tie). `#sg-menu`'s handler now calls `ui.hideSurvivalGameOver()` before `ui.showHowto()`.

**Tests:** `node --test tests/` 338/338 green (unaffected — no pure-logic surface changed). Added an e2e test to `scripts/e2e.mjs` (`npm run e2e`) forcing the overlay via direct state/ui import, clicking both buttons, and asserting: Try Again hides the overlay and restores the game bar; Menu opens `#howto` **and** hides the overlay (the stacking bug above). Full suite: 11/12 e2e tests green — the one pre-existing failure (`☰ menu fully hides an open Town Shop`) reproduces identically on unmodified `main` via `git stash`, confirmed unrelated to this fix. Verified live: forced the game-over state via console on the deployed page (GitHub Actions run confirmed green), screenshotted the correctly-styled overlay, and confirmed both buttons work — Try Again clears the overlay, Menu opens a clean Play screen with no leftover overlay behind it.

## 2026-07-19 — 🗂️ HUD-1: Settings & Inventory moved into the in-game ☰ Menu

**Shipped:** The shared arcade gear-icon drawer no longer carries any Black Hole in One content — Sound effects, Freeze mid-flight aim, and the Explore Inventory toggles now live as **Play / Settings / Inventory** tabs on the game's own `#howto` overlay (the same screen `#helpBtn` and `sg-menu` already opened). Play stays the default tab; Inventory only shows in Explore mode, matching the old drawer section's `when` gate.
**Commit:** `1a7a2b5`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — Backlog · HUD & Settings, HUD-1.

**What changed:**
- `main.js` — deleted both `window.KamekoSettings.registerSection(...)` calls (the "⚫ Black Hole in One" settings section and the "🎒 Inventory" section); the arcade drawer's `#settings-game-section` is now empty for this game (verified live — dark mode/gallery/version/dev-mode still show, since those are cross-game). Widened the `#howto` backdrop-tap-to-dismiss guard (`e.target.closest('button, input, label')`) so tapping a Settings/Inventory toggle's label text no longer bubbles into the "tap outside = start/close" fallback; that fallback's auto-start-a-run convenience is now also gated to the Play tab only (judgment call, confirmed as-shipped by Yev the same day — see [questionnaire](../questionnaires/black-hole-in-one-hud-1-menu-tab-behavior.md), archived), so idly tapping blank space on Settings/Inventory before ever starting a run can't accidentally launch one.
- `ui.js` — new tab system (`showHowtoTab`, `isHowtoPlayTab`, lazy `renderHowtoSettings`/`renderHowtoInventory`) rendering the moved toggle markup directly into the overlay; `showHowto()` now resets to the Play tab on every open. Logic (localStorage read/write, `explore.refuelFull()` hook on enabling Endless Flight) is a straight relocation from `main.js`, unchanged.
- `constants.js` — new `LS_KEYS` export (`muted`/`freezeAim`/`inventory`) so `main.js`'s boot-time load and `ui.js`'s new toggle writers share one source of truth for the localStorage key strings instead of duplicating them.
- `index.html` / `style.css` — `#howtoTabs` tab bar + three `.howto-panel` sections wrapping the existing Play content (h1/intro copy/`#modeBtns`/`#sharedMapBtns`, all untouched) plus the two new panels; new `.howto-tab`/`.howto-toggle-row` styles matching the overlay's existing look.
- `tests/black-hole-in-one.test.mjs` — added a test asserting `LS_KEYS`'s three string values, guarding the main.js/ui.js key-sharing contract. The rest of HUD-1 is DOM/wiring with no pure-logic surface — this test suite has never had a DOM-mocking layer (confirmed: no jsdom dependency, no other game's tests touch its own UI module), so the tab switching, toggle rendering, and drawer-emptying were verified by manual playtest instead, consistent with how every other UI-only change in this project has been validated.

**Found, not fixed (out of scope):** `#sg-again`/`#sg-menu` on the survival game-over screen have had no click listeners since a refactor (`e21281d`) dropped them without rewiring to the merged survival mode — both buttons are currently dead. Flagged as a separate background task (not part of HUD-1's diff) rather than fixed inline.

**Tests:** `node --test tests/` 338/338 green (was 337, +1 for `LS_KEYS`). Deploy verified: GitHub Actions run `29694844632` succeeded; live page fetched and screenshotted — Play/Settings tabs render correctly, Sound effects toggle flips `localStorage.blackHoleInOne_muted` and persists, Explore mode reveals the Inventory tab with all three items (Orbit Magnet correctly pre-checked via `defaultOn`), toggling Thruster persists to `blackHoleInOne_inventory`, `#helpBtn` reopens landing on Play, and the arcade gear-icon drawer's game section confirmed empty via its live `innerHTML`.

## 2026-07-18 — 🛫 Feature: Launch button in the Town Shop

**Shipped:** Replaced the static `.ts-launch-hint` caption in the Town Shop with a real `🛫 Launch — Leave Town` button, so leaving Town has a tappable affordance instead of relying only on the ambient drag-and-release flick.
**Commit:** `909f5dc`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — a distinct, later ask filed after Yev played the shipped Town Shop redesign (`207fb50`) and found the drag-hint insufficient. Not the same item as that redesign, even though both touch `#townShop`.

**Root cause / why now:** the Town Shop redesign earlier the same day was a pure visual pass — it added a `.ts-launch-hint` caption explaining the existing pull-back-and-release fling also works as "leave Town," but that caption was still just text, not a control. Yev played it and reported "this approach is not working": a caption pointing at an ambient gesture doesn't read as a real way to leave. The fix needed a tappable action, not better copy.

**What changed:**
- `explore.js` — new `launchFromTown()`: validates `atTown()`, then delegates to the already-shipped `beginAscend()` (TAP-3's ease-into-orbit animation). No new physics; mirrors the existing validate-then-delegate shape of `buyUpgrade()`/`useReturnPortal()`.
- `index.html` — swapped the `.ts-launch-hint` `<div>` for `<button id="ts-launch" class="ts-launch-btn">🛫 Launch — Leave Town</button>`. Used 🛫 rather than 🚀/🧲, since both of those are already item icons (Thruster, Orbit Magnet) rendered in the same shop's "Owned" section.
- `style.css` — replaced `.ts-launch-hint` with `.ts-launch-btn`: full-width accent-green CTA (same `#00e5a0` weight as the mode-select screen's primary button), 48px min-height tap target, capped to the same 420px width as `#ts-items`.
- `main.js` — wired the click once at module scope alongside the other static button listeners (`modeEndless`, `helpBtn`, etc.), not inside `ui.js`'s `renderTownShop()` — that function re-runs on every purchase, and `#ts-launch` is a static element outside the re-rendered `#ts-items`, so wiring it there would have stacked a duplicate listener per purchase. The handler calls `explore.launchFromTown()` then `ui.updateTownShop()` immediately, so the panel closes on the same tap instead of waiting for the next render frame.

**Also re-verified, unchanged:** the tap-the-tee-rock-while-orbiting landing path (TAP-2/TAP-3, shipped earlier) already worked correctly and needed no code changes — just a real-click re-confirmation as part of this work. The drag-and-release flick also still works as an alternate way to leave Town; `canAim`/drag logic in `main.js` was left untouched.

**Tests:** `node --test tests/` 337/337 green, `npm run smoke` green (grepped `tests/`/`scripts/` for `ts-item`/`renderTownShop`/`ts-header`/`ts-launch` first — nothing referenced this markup, confirmed nothing needed updating). Verified in-browser at 375px and desktop via a real Explore run to Town: clicking Launch closes the shop panel immediately and the comet eases into orbit around the tee rock; tapping the tee rock while orbiting lands it and reopens the shop; the drag-and-release flick still flings the comet out of Town. Deploy verified: GitHub Actions run `29671674969` succeeded; live `index.html`/`main.js`/`explore.js`/`style.css` fetched directly from `yevrap.github.io` and confirmed serving `ts-launch`/`launchFromTown`/`.ts-launch-btn`.

## 2026-07-18 — 🐞 Fix: stale "How to play" label in the shared arcade settings drawer

**Shipped:** Relabeled the `#bh-howto` button in the game's registered settings-drawer section from "❓ How to play" to "☰ Menu".
**Commit:** `be87a42`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — 🧹 Inbox Polish Sprint's stale-menu-label line.

**Root cause:** UI-2 (shipped 2026-07-15) relabeled the in-game HUD's menu-access buttons (`#helpBtn`, `#sg-menu`, `#cb-menu`) from "❓ How to play" to "☰ Menu", since clicking them calls `ui.showHowto()` — which fully exits the run back to the mode-select screen, not just a rules popup. It missed a second entry point to that same action: the shared arcade settings drawer (`shared/settings.js`, opened via the top-left ☰ hamburger on any screen) that this game populates via `window.KamekoSettings.registerSection()` in `main.js`. That section's first button (`main.js:302`) still read "❓ How to play" and its click handler (`main.js:311-314`) does the identical `closeDrawer()` + `ui.showHowto()` — so the label had gone stale in one place while the fix landed everywhere else.

**First triage pass got this wrong** — checked only the in-game HUD buttons, found them correct, and marked the item "not reproducible." Yev caught it with a screenshot of the actual drawer showing the stale label. Lesson: a "not reproducible" verdict needs to walk the exact surface the report names, not just the most obvious one.

**Fix:** one-line label change, `main.js:302`. No id rename, no behavior change — `closeDrawer()` + `showHowto()` still fires exactly as before.

**Tests:** `node --test tests/` 337/337 green, `npm run smoke` green (unaffected — no test touches drawer markup). Verified in-browser via local dev server: opened the drawer, confirmed "☰ Menu" renders and still returns to the mode-select screen on click. Deploy verified: GitHub Actions run `29671009215` succeeded; live `main.js` fetched directly via `curl` confirmed serving the new label.

## 2026-07-18 — 🏪 UX polish: Town Shop overlay redesigned for clarity

**Shipped:** Visual-only redesign of the Town Shop bottom sheet — clearer hierarchy for the three upgrade rows and the three owned-inventory rows, plus an explicit "how to leave" affordance. No interaction/behavior changes.
**Commit:** `207fb50`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) — 🧹 Inbox Polish Sprint's Town Shop line.

**Scope confirmed before building:** the interaction model Yev's original inbox note asked for — shop up when landed, hidden while orbiting, easy to see how to leave — already worked exactly as described. `updateTownShop()` (`ui.js`) gates visibility on `explore.atTown() && !menuOpen`, and TAP-2/TAP-3 (shipped earlier the same day) already make tapping the planet the way you land there. What was actually still open, per the backlog's own scoping note, was that the panel *read* poorly and had no visible "how do I leave" cue — a pure visual pass, not a behavior fix.

**What changed:**
- Each `.ts-item` row (Return Portal, the 3 upgrades, the 3 owned inventory items) now leads with a `.ts-item-icon` badge — a small bordered square holding the row's emoji, pulled out of the name line where it used to sit inline.
- `.ts-item-level` (the "L0"/"L0 · MAX" tag) restyled from plain colored text into a pill badge, so tier is scannable at a glance instead of reading as part of the name.
- New `.ts-section-label` eyebrow headers ("UPGRADES" / "OWNED") split the panel into two groups, reusing the same uppercase-tracked convention already established by `.mode-head` on the howto screen — so the shop now visually distinguishes "buy this" from "you already have this" instead of six near-identical cards in a row.
- New `.ts-launch-hint` — a static caption ("🖐️ Pull back & release anywhere to launch — leaves Town") added directly to `index.html` below `#ts-items`, not regenerated by `renderTownShop()` since its content never changes. The fling-to-leave gesture is the exact same pull-back-and-release mechanic taught on the howto screen; it just wasn't called out anywhere inside the shop itself, so a first-time visitor at Town had no obvious exit.

**Why this is safe as a no-behavior-change pass:** every markup change is additive/restructuring around the same IDs and classes `renderTownShop()`'s own `querySelector` calls and the game's event listeners already target (`#ts-items`, `#ts-balance`, `#ts-return`, `.ts-buy[data-upgrade]`) — none of those were renamed or moved. `updateTownShop()`, `atTown()`, `buyUpgrade()`, and `useReturnPortal()` in `explore.js` were untouched entirely.

**Tests:** No existing test touches the shop's markup (`grep` across `tests/` and `scripts/` for `ts-item`/`renderTownShop`/etc. returned nothing), so this was a pure visual change with nothing to regress-test. Full suite unaffected: `node --test tests/` 337/337 green, `npm run smoke` green.

**Verified in-browser** at 375px and desktop: drove a real Explore run to Town (clicked the actual `🌌 Explore` mode button, which starts the player standing on the Town tee rock) and confirmed the redesigned panel renders correctly at both widths — icon badges, level pills, the Upgrades/Owned section labels, and the launch hint all visible and correctly styled. Confirmed disabled buy-button styling (0 starting stardust) via computed style (`opacity: 0.4`, muted border/cursor) — unchanged from before. Read live network requests to confirm no console errors after the change.

**Deploy verified:** GitHub Actions run [29668778315](https://github.com/yevrap/KamekoStudio/actions/runs/29668778315) succeeded; fetched the live `index.html` and `style.css` directly from `yevrap.github.io` and confirmed they serve `.ts-launch-hint`, `.ts-section-label`, and `.ts-item-icon`.

## 2026-07-18 — 🐞 Fix: cold-load flash-of-unstyled-content + slow/flaky shared-map opens

**Shipped:** Yev reported two loading symptoms: an occasional flash of unstyled content on cold loads, and shared-map (`?map=`) links that load noticeably slower and sometimes need a couple of tries. Neither game code nor `shared/` has a service worker or explicit `Cache-Control`, so per Yev's own hunch this was investigated as a real network/timing issue rather than an app-caching bug.
**Commit:** `e53cd76`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** `docs/roadmap.md` p3-17.

**Investigation:** Profiled the actual network waterfall with the Performance Resource Timing API on the *live deployed site* (not a synthetic guess) — both before and after the fix.

**Root cause 1 — the FOUC, confirmed and fixed.** `shared/settings.js` (loaded on every game, not just this one) builds its hamburger-menu button/settings-drawer overlay and appends them to `document.body` inside `injectUI()`, which only runs at `DOMContentLoaded`. The same function also creates the `<link rel="stylesheet" href="shared/settings.css">` — but it did so *inside* `injectUI()` too, so the CSS fetch didn't even start until `DOMContentLoaded`, and the button/overlay were appended immediately after with no wait for that stylesheet to arrive. Since `#settings-hamburger-btn`'s `position: fixed` placement lives entirely in `settings.css`, for that window the button rendered with default browser button styling, inline at the bottom of the page, before snapping into its correct fixed top-left position once the CSS arrived. Measured live: before the fix, `settings.css` didn't start fetching until ~450ms after `settings.js` itself had already finished executing — a ~450ms unstyled window. **Fix:** moved the `loadCSS()` call out of `injectUI()` to fire immediately when `settings.js` executes (top of the IIFE), instead of waiting for `DOMContentLoaded`. Re-measured live after deploy: the gap between `settings.js` finishing and `settings.css` starting dropped to ~5ms, and the residual window between the button being appended and its CSS finishing shrank from ~240ms to ~30ms (about one frame at 60fps) — not a mathematically airtight fix on an extremely slow connection, but the visible flash is gone in practice. A fully airtight fix (hide the button until the stylesheet's `load` event fires) was considered and rejected: it risks a worse failure mode — a permanently invisible menu button if the `load` event doesn't fire as expected for a cached stylesheet on a return visit — for a gain that's very unlikely to be perceptible.

**Root cause 2 — no bug in `decodeMap()`; the waterfall depth explains the shared-map symptom.** `decodeMap()` (`editor.js:295`) and the `?map=` boot handling in `main.js` are 100% synchronous string/JSON decoding — no network calls, no timing dependency. Round-tripped a hand-built map through `encodeMap`/`decodeMap` and through the real boot path (local server, `?map=<hash>`) with zero errors. The actual explanation: this is a no-build-step, bundler-less ES-module site (a hard constraint per the studio's `CLAUDE.md`), so a browser with a cold cache must resolve `main.js`'s import graph in real network rounds — `main.js` → its 7 direct imports → `physics.js` (only imported *transitively*, by `gameplay.js`/`explore.js`/`ui.js`) → the JS-injected `settings.css` — up to 4 serialized round trips before the game is playable. Regular players mostly return with a warm cache and never notice; **shared-map links are disproportionately opened by first-time visitors with a fully cold cache** (someone opening a shared link), so they eat the full waterfall every time, explaining both the extra slowness and — on a flaky mobile connection — the "needs a couple of tries" pattern, since ES modules have no built-in retry: one dropped request among ~13 kills the whole graph silently. **Fix:** added `<link rel="modulepreload">` for all 8 game modules to `black-hole-in-one/index.html`, so the browser's HTML preload scanner discovers and starts fetching the entire module graph in the *first* round instead of waiting for `main.js` to be parsed. Measured live after deploy: `constants.js`, `state.js`, `gameplay.js`, `physics.js`, `explore.js`, `editor.js`, `ui.js`, `sfx.js`, `style.css`, `settings.js`, and `main.js` all now share a single `fetchStart` (~198ms) — the waterfall that was previously 3 rounds is now 1.

**Not implicated:** checked live response headers for `index.html`, `main.js`, `style.css`, `settings.js`, `settings.css`, `version.json` — all GitHub Pages defaults (`cache-control: max-age=600`, served via Fastly edge `x-served-by: cache-pao-*`). No app-level caching bug, confirming Yev's hunch that this wasn't app code.

**Tests:** No existing harness covers load-timing/FOUC (network waterfall behavior isn't something the Node unit suite or Puppeteer smoke test observes), so this was verified by direct measurement instead of an automated regression test — see Verified below. Full unit suite still green: 337/338 tests (`node --test tests/`).

**Verified in-browser:**
- Before/after Resource Timing profiling on the live deployed site (both linked above) — the two waterfall changes above, measured directly, not inferred.
- `npm run smoke` (full-site Puppeteer load check) green after the fix; one `river-run` failure (`Tone is not defined`, `net::ERR_INTERNET_DISCONNECTED`) reproduced identically with the fix stashed out, confirming it's a pre-existing CDN-availability flake in the sandbox, unrelated to this change.
- Manually built a synthetic map hash, loaded `?map=<hash>` on the local server: "🔗 Someone shared a custom map with you." screen appeared correctly, "Play this map" booted straight into the custom map (Hole 1, custom-map bar), and the URL's `?map=` param was correctly stripped after decode. Zero console errors throughout.
- Opened the settings drawer and confirmed it renders fully styled (no regression from moving `loadCSS()`); dark/light mode toggle unaffected.

**Deploy verified:** GitHub Actions run `29668222682` (pages-build-deployment) succeeded; fetched the live `index.html` and `settings.js` from the Pages URL directly and confirmed they serve the `modulepreload` hints and the reordered `loadCSS()` call. `docs/roadmap.md` p3-17 added and marked shipped in the same commit.

## 2026-07-18 — 🌀 TAP-4: Tap the black hole you're orbiting to warp to Town

**Shipped:** Fourth and final item of the TAP redesign's Wave 1 tap system. Tapping the black hole you're currently orbiting (Orbit Magnet ON) now triggers the same spiral-warp-to-Town as diving into it, instead of being a no-op.
**Commit:** `8bfdb93`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) (TAP-4).

**Root cause:** Wild black holes have been orbit-capturable since OW-10 (`orbitCapture()`/`magnetCapture()` don't filter by body type), but `handleTap()` only hit-tested `b.type === 'planet' || b.type === 'tee'` — a black hole was never a valid tap target, so once orbiting one, tapping it did nothing. The only way in was to eject back to flight and re-dive.

**Implementation details:**
- Added `'blackhole'` to `handleTap()`'s hit-test loop in `explore.js`.
- When `S.phase === 'orbit' && world.orbit?.b === hit && hit.type === 'blackhole'`, call `beginWarp(hit)` instead of `beginDescentFromOrbit()` — an orbited black hole has no landed rest state to descend into, so it warps rather than lands.
- Orbited planets/tee still call `beginDescentFromOrbit()` unchanged; tapping a black hole while in flight or at rest is still a no-op (tap only acts on the currently engaged body, same as before).

**Tests:** +1 unit test in `tests/explore.test.mjs` (`TAP-4: tapping the black hole you're orbiting warps to Town, not descend-and-land`) — orbits a synthetic black hole, calls `handleTap` on it, asserts `S.phase === 'warp'` and `world.warp.b` is the black hole. Full suite: 338 tests green (`node --test tests/`).

**Verified in-browser:** Loaded the live dev server, confirmed Explore mode loads with no console errors. Drove the actual deployed-shape ES modules directly via the browser's `import()`: ran `startRun()`, force-set `world.orbit` onto a synthetic black hole, called the real `handleTap(bh.x, bh.y)`, and confirmed `S.phase` flipped to `'warp'` with `world.warp.b` pointing at the black hole — same result as the Node test, in the actual browser environment.

**Deploy verified:** GitHub Actions run `29664535329` (pages-build-deployment) succeeded; fetched the live `explore.js` from the Pages URL directly and confirmed it serves the `'blackhole'` hit-test and the TAP-4 branch. `docs/roadmap.md` p3-16 updated in the same commit.

Wave 1 of the Orbits & Star Map arc is now TAP-1 → TAP-2 → TAP-3 → TAP-4 all shipped. Remaining: ORB-3 (station-orbit refuel trickle + Town refuel), ORB-4 (stardust rings).

## 2026-07-18 — 🧲 TAP-3: Tap-triggered scripted orbit launch (from resting on a planet)

**Shipped:** Third item of the TAP redesign. A tap on the planet you're currently resting on triggers a scripted ~0.5s ascent into a stable orbit around it, reusing `magnetCapture`'s band calculations.
**Commit:** `f56dd53`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Tap to Land or Orbit Build Plan (July 2026)](../plans/black-hole-in-one-tap-to-land-or-orbit-build-plan-july-2026.md) (TAP-3) → [Improvements](../../games/black-hole-in-one/ideas.md).

**Implementation details:**
- Added a new `world.ascend` state and `'ascend'` phase in `main.js`'s animation loop.
- Implemented `beginAscend(b)` and `stepAscend(dt)` in `explore.js` to ease radius outward.
- Wired the handoff to `world.orbit` using `magnetCapture` for mathematical consistency.
- Updated `drawPlanetLabel` in `ui.js` to read fresh state on entry, showing 🧲 or 🪐 appropriately.
- Tap ascent is currently free (0 fuel cost).
- Added the first-use toast for ascending.

## 2026-07-18 — 🛬 TAP-2: Tap-triggered scripted landing (from flight or orbit)

**Shipped:** Second item of the TAP redesign (replacing ORB-2). A tap on a planet when in flight (and within the orbit band) or when orbiting now triggers a scripted ~0.7s descent to land, regardless of approach speed or angle.
**Commit:** `37349f6`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Tap to Land or Orbit Build Plan (July 2026)](../plans/black-hole-in-one-tap-to-land-or-orbit-build-plan-july-2026.md) (TAP-2) → [Improvements](../../games/black-hole-in-one/ideas.md).

**Implementation details:**
- Added a new `world.descent` state and `'descend'` phase in `main.js`'s animation loop.
- Created two entry points in `explore.js`: `beginDescentFromFlight(b)` (decomposes current velocity into radial/tangential for a smooth ease) and `beginDescentFromOrbit()` (eases from circular orbit).
- Created `stepDescent(dt)` which eases the comet to the planet's surface, then reuses the exact `placeOnRest()`/refuel/sound-effect path used by normal landings.
- Tap landing is currently free (0 fuel cost), per the build plan's default for intuitive feel.
- Added a persistent on-planet label (`drawPlanetLabel` in `ui.js`) that shows "🪐 Tap again to orbit" when resting on a planet that was just tapped, using the MAP-2 visual style.

**Tests:** Updated the TAP-1 unit tests in `explore.test.mjs` that tested tap behavior to check for the correct transition to `descend` instead of doing nothing or staying in flight. Verified that the `stepDescent` handles the `comet.rest` state properly. Full suite remains green (334 tests).

**Verified in-browser:** 
Tested tapping on planets while in flight within the orbit band and while successfully orbiting. Confirmed the ~0.7s descent looks smooth and lands the comet precisely on the planet. Confirmed the "Tap to orbit" label appears when resting. Deploy verified.

Next up: TAP-3 (Tap-triggered scripted orbit launch).
## 2026-07-18 — 👆 TAP-1: Tap gesture detection + retire ORB-1's auto-capture

**Shipped:** First item of the TAP redesign (replacing ORB-1 auto-capture and ORB-2 flick). Added `TAP_MAX_LEN` (10px threshold) to distinguish taps from flicks in `main.js` `pointerup` for Explore mode.

**Physics & Capture:** Retired the automatic `magnetCapture` from `explore.js`'s flight loop. The loop now exclusively uses `orbitCapture()` (matching Golf's strict behavior exactly), regardless of the item's state. The 🧲 Orbit Magnet item instead gates `handleTap(wx, wy)`.
If the item is ON, `handleTap` hit-tests planets within `r + 15` and routes to `beginDescentFromFlight`, `beginAscend`, or `beginDescentFromOrbit` (currently stubs for TAP-2/TAP-3) based on the comet's current phase.
If the item is OFF, `handleTap` returns early doing nothing.

**Tests:** Rewrote the ORB-1 integration tests in `explore.test.mjs` to assert the new TAP-1 behaviors: item ON/OFF no longer automatically captures a dive trajectory, `handleTap` correctly returns early when OFF and hits the stubs when ON, and black hole dive-warp tests pass correctly with the auto-capture removed.
All 334 tests green (`node --test`), plus smoke and e2e passing.

**Commit:** TBD · **Live:** GitHub pages deploy pending.

Full spec: [Black Hole in One — Tap to Land or Orbit Build Plan (July 2026)](../plans/black-hole-in-one-tap-to-land-or-orbit-build-plan-july-2026.md). Next up: TAP-2 (Tap-triggered scripted landing).
## 2026-07-18 — 🔄 ORB-2 redesign requested: tap to land, tap again to orbit (planning only, no code)

**Right after ORB-1 shipped, Yev changed his mind on the interaction model:** *"I want a plan for having a tap on the planet to land and another tap to orbit to be the functionality tied to that item/setting/feature."* This is a bigger ask than just ORB-2 (the planned flick-at-the-planet landing) — depending on how it's answered, it could also rework ORB-1's just-shipped automatic band capture, since a deliberate tap-to-choose model is a different feel than "any approach auto-captures you."

No code changed. Wrote up [Black Hole in One — Tap to Land or Orbit Questionnaire (July 2026)](../questionnaires/black-hole-in-one-tap-to-land-or-orbit-july-2026.md) instead of guessing — the open questions: does this replace ORB-1's auto-capture or just reshape ORB-2 (Q1); is "another tap" a second tap on the same planet (Q2); does a tap need proximity or work from anywhere (Q3); Explore-only or golf too (Q4); how the player discovers the two-tap sequence (Q5). Flagged in [Improvements](../../games/black-hole-in-one/ideas.md) — ORB-2's original flick-at-the-disc spec is struck through, kept for reference, do not build it as written.

## 2026-07-18 — 🧲 ORB-1 shipped: Orbit Magnet (orbit band captures on approach)

**Shipped:** First item of the Orbits & Star Map arc's Wave 1. New Explore inventory item, 🧲 Orbit Magnet, **ON by default** — a new `defaultOn` field on the `ITEMS` registry (`constants.js`) flows through `defaultInventory()`, and `mergeInventory()`'s existing per-key shallow-assign gives it to saves from before the item existed with no migration code.

**Physics:** new pure `magnetCapture(p, b)` in `physics.js`, right beside `orbitCapture()` — same `[ORBIT_MIN_GAP, ORBIT_MAX_GAP]` band and body types (`planet`/`blackhole`), but drops every velocity condition, so any entry into the band captures regardless of approach speed or angle. `orbitCapture()` itself is untouched — golf and item-OFF Explore reproduce today's strict capture exactly, satisfying the build plan's "no per-frame ghost physics, ever" lesson from the reverted OW-11.

**Hook:** `explore.step()`'s capture loop picks `magnetCapture` over `orbitCapture` when `S.inventory.orbitMagnet?.enabled` — every existing guard (`phase === 'flight'`, `throttle === 0`, `orbitCooldown <= 0`) stays in place, so a comet launched from rest still can't insta-recapture on the way out.

**Affordance:** a faint dashed capture-band ring (`ui.js`) around every planet/black hole while flying with the item ON — "these will catch you." Gone instantly when the item is OFF.

**Tests:** 10 new (334 total, all green) — `magnetCapture` unit tests (band edges, omega direction sign, zero-velocity fallback, non-planet rejection, black-hole acceptance), `defaultInventory`/`mergeInventory` ORB-1 defaulting, and three `explore.step()` integration tests: item ON vs OFF on the identical dive trajectory, the `ORBIT_COOLDOWN` regression, and the black-hole dive-warp-vs-capture-band ordering the build plan flagged as needing an explicit assertion.

**Verified in-browser** at 375px and desktop: capture ring renders/hides correctly with the item toggle, a pure radial dive (which strict `orbitCapture` rejects) swings cleanly into orbit with the item ON. `npm run smoke` green.

**Commit:** `301effb` (version bumped to v40) · **Live:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ — deploy run [29654334313](https://github.com/yevrap/KamekoStudio/actions/runs/29654334313) succeeded, live module confirmed serving `orbitMagnet` with `defaultOn: true`.

Full spec: [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md) (ORB-1) · checklist: [Improvements](../../games/black-hole-in-one/ideas.md). Next in Wave 1: ORB-2 (flick-at-planet guaranteed landing), which depends on this item.

## 2026-07-18 — 🧲 Arc pick: Orbits & Star Map (planning session, no code)

**Picked:** The [Black Hole in One — Next Arc Questionnaire (July 18, 2026)](../questionnaires/black-hole-in-one-next-arc-july-18-2026.md) came back answered and was turned into a full two-wave build plan the same day: [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md). Questionnaire archived (footer convention).

**The decisions:**
- **Q1=A — OW-11 is superseded, not retried.** Instead of snapping the aim onto an orbit trajectory (the reverted grid-search approach), the orbit band itself captures the comet — a 🧲 Orbit Magnet inventory item, ON by default, with a flick-at-the-planet guaranteed landing as the "second jump." No trajectory search anywhere in the new design; the OW-11 revert's perf lesson (no per-frame ghost physics) is now an architecture rule in the plan.
- **Orbits do things:** refuel-station orbits trickle fuel (ORB-3, folding in the "Town should refuel you" fix) and ~25% of planets get gold stardust rings you orbit to collect (ORB-4, consuming the Orbital Collectibles backlog line + the P3 pickup-color fix). Orbit-scan and slingshot-boost were offered and parked.
- **Q2/Q3 — the map shows more and does more:** Wave 2 adds black-hole/station landmarks to the OW-9 star map (MAP-1), free tap-to-fast-travel to discovered black holes + Town with black-hole arrivals dropping you into orbit (MAP-2), and pan/zoom + a look pass (MAP-3). The editor-minimap half of the Q2 write-in became **MM-16**, design-gated until after Wave 2.

**Execution model:** unchanged — one session per item, sequential on `main`, ⏸️ Yev-plays checkpoint between waves. Wave 1 order: ORB-1 → ORB-2 → ORB-3 → ORB-4.

**Flagged for the Wave 2 checkpoint:** free fast travel + Town refuel = a stranded comet can self-rescue via the map, deliberately softening FUEL-1's stranded state; fallback ("fast travel requires fuel > 0") is noted in the plan if it guts the fuel tension in play.

## 2026-07-17 — ⏪ Revert: Orbit Aim Assist (Nav Computer)

**Reverted:** The Phase 2 Orbit Aim Assist feature was removed.
**Commits reverted:** `b66ae4f`, `58ba90f`, `4d3f4e8`
**Reason:** The auto orbit feature had significant performance issues due to running hundreds of ghost physics steps in a grid search. Additionally, the blue arrow preview did not guarantee a clean orbit capture because of grid resolution constraints and simulation mismatch. It is parked for now; we'll try again in a future session using a different mathematical approach (perhaps analytic orbit solving rather than brute-force simulation).

## 2026-07-17 — 🎯 Phase 2: Orbit Aim Assist (Navigation Computer)

**Shipped:** Added "Nav Computer" to Explore mode (off by default, unlocked for 0 stardust). When enabled, drawing a shot near a valid orbital capture trajectory automatically snaps the aim line into perfect alignment and turns it blue. Releasing a blue snapped shot guarantees the comet enters orbit around the target.

**Commit:** `4d3f4e8`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Orbit Assist & Warp Mechanics Build Plan](../plans/black-hole-in-one-orbit-assist-and-warp-mechanics-build-plan.md) Phase 2.

**Implementation details:**
- Added `navComputer` to `ITEMS` in `constants.js`.
- Implemented `getSnappedAim(rawDrag, state, comet)` in `ui.js`: simulates 120 ticks of `stepBody` forward to detect valid orbits, sweeping through a fan of adjacent angles (`-0.15` to `+0.15` radians) to find a capturing trajectory.
- Updated `ui.js`'s `drawAim` and `main.js`'s `pointerup` to apply `getSnappedAim`, rendering a blue line for snapped orbits and converting the snapped angle back to the final launch vector.
- Verified test cases in `ui.test.mjs` against `getSnappedAim`: confirms the logic properly simulates gravity well capture by detecting stable orbits while adhering to `orbitCapture` constraints. Fixed realistic mass configuration (m=100) on mock planets to prevent test physics breaching `MAX_V` limitations. All tests passed.

## 2026-07-17 (Part 2) — 🎯 Guaranteed Orbit Assist

**Shipped:** Guaranteed Orbit Assist Refinements
**Commit:** `58ba90f`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Widened `getSnappedAim`'s sweep range from `0.15` to `0.30` radians to increase capture sensitivity, and added `comet.navTarget` state tracking. When the UI highlights a trajectory blue, `navTarget` is saved upon launch. `physics.js` detects the match and applies extremely permissive tolerances (ignoring the usual 1.5u–6.0u altitude gap and speed checks) to guarantee the comet enters orbit. Also aligned the navigation computer's simulated ghost physics (including liftoff grace damping) perfectly with the live physics loop. Re-fixed the `ui.test.mjs` assertions to pass with the new, wider capture tolerances.


## 2026-07-17 — 🌀 Phase 1: Explore Black Holes (The Gravity Well)

**Shipped:** Wild black holes in Explore now capture the comet into orbit from afar. Warping to Town only happens if the player flies (or flicks) directly into the center event horizon (`< b.r * 0.3`). Using the Return Portal from Town spawns the comet back at the black hole, perfectly locked into a stable orbit.

**Commit:** `d4a2eff`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Orbit Assist & Warp Mechanics Build Plan](../plans/black-hole-in-one-orbit-assist-and-warp-mechanics-build-plan.md) Phase 1.

**Implementation details:**
- Removed unused `exploreBlackHoleWarpR` and `EXPLORE_BLACKHOLE_WARP_MARGIN` constants.
- Added `blackhole` to the `orbitCapture()` valid body types in `physics.js`.
- Tightened the warp trigger radius to `b.r * 0.3` in `explore.step()`.
- Updated `useReturnPortal()` in `explore.js` to calculate a stable orbit gap and inject the comet directly into `S.phase = 'orbit'` rather than free-flight.
- Updated the `explore.test.mjs` test suite to match the new warp mechanics and orbit injection rules. All tests passed.

## 2026-07-17 — 🗺️ OW-9: Zoom-out star map + fog-of-war discovery tracking (Open World Sprint 2, Wave 2)

**Shipped:** a toggleable 🗺️ overlay in Explore showing the whole charted sector — Town always marked, the comet's last-known spot, and every chunk the comet has physically flown through lit up against fog everywhere else.

**Commit:** `92256eb`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** Yev redirected Sprint 2 straight to this right after Wave 1 shipped, dropping OW-6's named regions but keeping the fog-of-war idea → [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md)'s Sprint 2, Wave 2, OW-9 (re-spec'd there to stand alone, no dependency on OW-6/7/8) → [Improvements](../../games/black-hole-in-one/ideas.md).

**The load-bearing design choice: pause the run instead of building a live-updating map.** A naive version would redraw the map every frame so it stays in sync with a comet that might still be flying underneath. Pausing on open (dispatching the same generic `settingsOpened`/`settingsClosed` events `shared/settings.js` already documents as "game should pause"/"game should resume" — the exact contract the settings drawer already relies on, so no new plumbing in `main.js`) sidesteps the whole staleness question: nothing can change while the map is up, so one `renderStarMap()` call at open-time is permanently accurate for as long as it stays open. Simpler code, and it reads as the more honest UX too — you're not flying blind while consulting a map.

**Discovery is "flown through," not "visited," on purpose.** `markDiscovered(comet.x, comet.y)` — a new one-line addition — is called at the tail of both `step()` and `stepOrbit()` in `explore.js`, so free flight and orbiting both count. It's deliberately *not* called from `startRun()`, `completeWarp()`, or `useReturnPortal()` — all three teleport the comet — so a warp destination doesn't retroactively count as charted territory the player never actually traversed. In practice this makes no visible difference for Town specifically (the very first `step()` after leaving it marks that chunk anyway), but it keeps the semantics honest for future teleport-adjacent features.

**Chunk math reused verbatim, not reinvented.** `chunkKeyAt(x, y)` is exactly `Math.floor(x / CHUNK_SIZE) + '_' + Math.floor(y / CHUNK_SIZE)` — the same floor-division already used by `updateActiveChunks()` — so a chunk key computed for discovery tracking and a chunk key computed for streaming/culling always agree. `discoveredChunks` (a plain `Set<string>`) persists to `blackHoleInOne_discoveredChunks`, same lifetime convention as `exploreHome`/stardust/upgrades: not reset by `startRun()`, cleared only by Clear All Game Data (key registered there too, `shared/settings.js`).

**The map itself is a second, independent `<canvas>`** (`#starMapCanvas`, inside a new `#starMap` full-screen overlay reusing the `#howto`/`#scorecard` blur-backdrop pattern), not a repurposing of the main game canvas — avoids any transform-stack interference with the live camera/zoom rendering pipeline in `ui.js`'s `render()`. It draws a 19×19 grid spanning the full bounded sector (`SECTOR_LIMIT`/`CHUNK_SIZE` + a chunk of margin), fills each cell fogged or charted by checking `discoveredChunks.has(gx + '_' + gy)`, then draws Town's marker (fixed, always shown regardless of fog — it's a landmark, not a discovery) and the comet's marker (a snapshot of wherever it was when the map opened) on top.

+5 unit tests (325 total): `chunkKeyAt` matches the module's existing floor-division convention, flying marks the current chunk and fires `hooks.discovery` exactly once per genuinely new chunk (not every physics tick), `discoveredChunks` survives a `startRun()` reset, `loadDiscoveredChunks` tolerates null/undefined/non-array saved payloads, and orbiting marks the orbited chunk too. `node --test tests/` 325 green (320 baseline + 5 new — zero regressions across every other game's suite, confirming golf's ~300 tests and everything else stayed byte-identical).

**Verified in-browser** against the real running game, not a standalone script — and against a fresh wrinkle this session: the preview tab ran fully backgrounded (`document.hidden` true throughout, confirmed directly), so `requestAnimationFrame` never ticked at all, not even throttled. Real pointer drags and synthetic `PointerEvent`s both landed on the canvas correctly (confirmed via `canvas.setPointerCapture` not throwing) but produced zero motion since nothing was stepping physics — so verification drove `explore.step()` directly in a loop (the same production function `main.js`'s frame loop calls, just invoked manually), the same workaround INV-3b's and OW-3's Dev Log entries used for their own backgrounded-tab sessions. With the comet actually flown and landed via that path, opened the map with a real click on the new HUD button and confirmed by both screenshot and direct `canvas.getImageData()` pixel sampling that Town's marker sat exactly at the grid's mathematical center and the comet's marker sat exactly one cell over, with only those two chunks (of 361) rendered as charted. One screenshot genuinely came back blank immediately after `showStarMap()` was called via a separate tool round-trip — pixel-sampling the same canvas moments later showed it was correctly painted the whole time, so this reads as a compositing/paint-timing quirk specific to this backgrounded headless tab, not a rendering bug in the shipped code (a follow-up screenshot after any further interaction always matched the pixel data). Reloaded the page for a genuine fresh navigation (confirmed via a single `performance.getEntriesByType('navigation')` entry rather than assuming) and reopened the map: both discovered chunks were still charted, `localStorage.getItem('blackHoleInOne_discoveredChunks')` round-tripped exactly. Confirmed `S.paused` flips true/false in lockstep with the overlay opening/closing, and that the 🗺️ button stays hidden in Endless — golf modes fully untouched, only Explore's own files plus the shared `clearAllGameData` registry were touched. Deploy verified: GitHub Actions run `29618771767` succeeded, live page confirmed serving `#mapBtn`/`#starMap`/`#starMapCanvas`.

**Not done in this pass:** OW-7 (wormhole pairs) and OW-8 (derelict/artifact loot) stay parked, per Yev's explicit redirect — un-scoped, no design work done. If either gets picked up later, their discovered content is meant to layer onto this same overlay as a follow-up, not a rebuild.

## 2026-07-17 — 🌙 OW-5: Moons & rings, decorative only (Open World Sprint 2, Wave 1)

**Shipped:** Giant planets in Explore now render with a small orbiting moon or a static ring arc, seeded deterministically per chunk. Pure render-layer richness — zero gravity, zero collision, zero landing.

**Commit:** `28a6990`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ (v39)
**Context:** [Next Arc Questionnaire](../questionnaires/black-hole-in-one-next-arc-july-2026.md) Q6 (moons/rings picked, decorative-only scope confirmed) → [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md)'s Sprint 2, Wave 1, OW-5 → [Improvements](../../games/black-hole-in-one/ideas.md).

**The load-bearing design choice: decoration as a property, not a body.** The build plan's Done-when explicitly called for confirming zero physics interaction "by checking they never enter the gravity-bearing body list (not just 'looks fine visually')." The simplest way to guarantee that isn't a runtime check — it's making it structurally impossible: `b.moon`/`b.ring` are set directly on the planet object already sitting in `getChunkBodies()`'s return array, never pushed as their own array entries. `gravityAt()`, `stepBody()`, and `orbitCapture()` (`physics.js`) only ever iterate the `bodies` array itself, so a moon/ring can't be summed into gravity or hit-tested for collision — there's no code path that could accidentally do either, not just an absence of one today. `physics.js` needed zero changes, same as OW-3's approach to not touching shared/tested code.

**Giants tagged at generation, not inferred from radius.** Giants (`r` 25–40) never numerically overlap Normal (`r` 8–20) or Binary-member (`r` 10–18) planets in this generator, so a `b.r >= 25` check would have worked too — but an explicit `giant: true` flag set in the same branch that rolls the giant's size (`getChunkBodies()`) reads as intent rather than a magic-number inference, and survives if the size ranges are ever retuned.

**Rolled last in the rng stream, same convention as every prior chunk-generator addition (refuel stations, black holes).** One `rng() < MOON_RING_CHANCE` coin flip and a `rng() < MOON_VS_RING_CHANCE` branch per Giant survivor, consumed after body generation, overlap resolution, the refuel-station roll, and the black-hole roll — so adding moons/rings changes none of their odds or positions for a given seed, and vice versa.

**Rendering:** `drawRing()` draws one tilted arc (y-scale squash, `ctx.arc` with `arcStart`/`arcLen`) behind the planet body — a single pass, not a front/back Saturn-split, since "decorative only" didn't call for that complexity. `drawMoon()` positions itself via the new pure `moonPosition(planetX, planetY, moon, t)` helper (`constants.js`) fed `S.time` — the same cosmetic clock already driving pulsar spins and refuel-station pulses, so the moon's motion costs nothing extra in the render loop and needs no new per-frame physics step.

+6 unit tests (320 total): only Giants ever get decorated and never both moon+ring on one planet (swept ~400 chunks), a frequency sanity check that the moon/ring rate among Giants reads as "a meaningful share" (40–90%, not a token few-percent), every `getChunkBodies()` return value stays a real physics `type` (`'planet'`/`'blackhole'` only — proves a moon/ring can never leak in as its own array entry), roll determinism for a repeated seed, and `moonPosition` determinism + the fixed-radius-orbit guarantee (distance from planet center never drifts) + one-full-orbit-per-`period` math. `node --test tests/` 320 green, `npm run smoke` green.

**Verified in-browser against the actual running game, not a standalone script.** Flying to a specific seeded Giant by hand was impractical to script reliably through drag/keyboard input in this session's preview harness (the Thruster item was left enabled from a prior session's `localStorage`, so a plain drag routed to the floating-stick handler instead of a flick — discovered mid-verification, not assumed), so verification instead dynamically imported the *live* `explore.js`/`state.js` module singletons from the browser console (`import('/games/black-hole-in-one/explore.js')` — the exact same instances `main.js`'s running render loop uses, confirmed by reading `S.phase`/`comet` state that matched the on-screen game). Centered the camera on a real seeded Giant with a moon and screenshotted: the moon rendered as a distinct small sphere at the correct orbital offset. Waited 3 real seconds and screenshotted again: the moon had visibly advanced along its orbit (the live `requestAnimationFrame` loop was still ticking `S.time`), and the same view showed a second Giant with a static tilted ring arc rendering correctly. Separately drove `physics.js`'s real `gravityAt`/`stepBody` with the comet flown straight through a ring-decorated giant at speed (240Hz steps): exactly one collision after 17 steps — the planet itself — with a normal finite gravity sample, no extra interaction traceable to the ring. Zero console errors throughout. Golf/Endless confirmed untouched — no changes outside Explore's own files (`explore.js`, `constants.js`, `ui.js`), and none of those files' golf-mode code paths were touched. Deploy verified: GitHub Actions run `29615949914` succeeded, live `explore.js` confirmed serving `MOON_RING_CHANCE` via a direct fetch against `yevrap.github.io`, `version.json` → v39.

**Not done in this pass:** OW-6 (named regions) is the last remaining Wave 1 item — Wave 2 (wormhole pairs, derelict loot, star map) doesn't start until Yev plays Wave 1 and confirms the direction, per the build plan's checkpoint convention. Three non-blocking tuning defaults (Giants-only scope, moon/ring chance and geometry constants, single-pass ring rendering) are logged in the build plan's OW-5 entry for Yev to weigh in on after playing, rather than a standalone questionnaire — same convention OW-3 used for its own defaults.

## 2026-07-17 — 🌀 OW-3: Black-hole wormhole → Town → return portal (Open World Sprint 2, Wave 1)

**Shipped:** Explore's chunk generator now seeds rare black-hole landmarks; flying close enough warps the comet to Town (additive to the existing tee-rock landing), and a 🌀 Return Portal in the Town Shop sends it back to the exact spot it came from.

**Commit:** `8ad331c`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ (v38)
**Context:** [Next Arc Questionnaire](../questionnaires/black-hole-in-one-next-arc-july-2026.md) Q2/Q3 → [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md)'s Sprint 2, Wave 1, OW-3 (re-spec'd there — the original Sprint 1 OW-3 spec predated Town/the Shop existing) → [Improvements](../../games/black-hole-in-one/ideas.md).

**Confirmed against current code before building, per the build plan's own instruction not to take the recommended approach as gospel.** The spec was right that Explore had zero black holes (`world.blackHole` hardcoded `null` in `startRun()`) and that `physics.js`'s `blackHole` param is a single golf/editor-only slot backing ~300 tests — not retrofitted. Two things the spec flagged as open turned out to have clean answers once checked against the actual chunk generator and `stepBody()`:

- **Would a seeded black hole's gravity break the Thruster escape guarantee (INV-3c)?** `getChunkBodies()`'s existing bodies use `m = r²` density, and that formula's surface gravity is monotonically increasing in `r`, asymptoting to `G` (400) — the shipped Giant already sits at `r`≤40 → ~369.7 u/s², under `THRUST_A` (385) with ~4% margin. Picking `r=22` for the black hole (same `m=r²` convention, no multiplier) lands at ~347.6 u/s² — safely under, and for free: the existing INV-3c sweep test iterates `getChunkBodies()` with no type filter, so it validates the new body type automatically, no special-casing needed.
- **Would the black hole get treated as a planet collision (bounce/land) instead of warping?** It sits in `world.bodies` so `stepBody()`'s own hit-loop would eventually flag it (`d < r + COMET_R` = 23.6 at r=22) if nothing intervened first. Fix: the warp's own proximity radius (`r` + a 10-unit margin = 32) is checked in `explore.step()` *before* `res.hit` is handled, comfortably outside the collision radius — at `MAX_V`'s per-step travel distance (~0.73 units), the warp always fires first by a wide margin. `physics.js` itself needed zero changes.

**The Return Portal's "send them back to the exact spot" turned out to need a small deliberate default not spelled out in the spec:** naively restoring the comet to its captured (x,y) would place it right at the warp boundary by definition — the instant that chunk regenerates, it's back in warp range and re-triggers immediately. Bookmarked the black hole's center too (not just the comet's position), so the Return Portal can nudge the landing spot 3 units past the warp radius along the same approach direction — reads as "the same place," doesn't loop. Logged as a build default, not a design fork worth a questionnaire (Sprint 1's own convention for this kind of thing).

Reused the *visual pattern* of golf's inward spiral (`gameplay.js`'s `beginSink`/`stepSink` math: `r = r0(1-t)²`, `a = a0 + t·7`) as a fresh implementation in `explore.js` (`beginWarp`/`stepWarp`), not the functions themselves — golf's `holeComplete()` is strokes/par/scorecard scoring that doesn't exist in Explore. `drawBlackHole()` in `ui.js` was refactored to take a body + ring-radius param so golf's singleton and Explore's seeded bodies share one render function at two different scales (golf's CAPTURE_R=4.6 ring vs. Explore's ~32-unit warp ring).

11 new unit tests (314 total): chunk-gen determinism and non-overlap for the new body type, density sampled against `EXPLORE_BLACKHOLE_CHANCE` across ~625 chunks, the THRUST_A invariant re-asserted directly for black holes specifically (belt-and-suspenders on top of the existing sweep), the warp-vs-collision-radius margin, the proximity trigger preempting a would-be planet collision (including a case constructed to already be inside `stepBody`'s own collision radius), full spiral-to-completion landing at Town, and Return Portal's no-op/happy-path behavior including the exact nudge-distance math. `node --test tests/` 314 green, `npm run smoke` green.

**Verified in-browser** against the real dynamically-imported modules (`import('/games/black-hole-in-one/explore.js')` from the live dev-server page): injected a debug black hole near the comet, screenshotted the warp mid-spiral (matches golf's cup-capture visual, scaled up), drove `stepWarp()` to completion (real-time `requestAnimationFrame` was throttled by this session's backgrounded preview tab — a tooling artifact, not a game bug, worked around by forcing steps directly the same way the unit tests do), confirmed landing on the tee rock with camera reset to (50,85) and `atTown()` true, clicked the real `🌀 Go` button in the Town Shop panel, and confirmed the comet landed exactly `exploreBlackHoleWarpR + 3` units from the black hole along the recorded approach direction with zero velocity. Also loaded Endless Golf fresh and confirmed it renders identically — no `blackhole`-type bodies exist outside Explore, so golf's render/physics paths are untouched. Deploy verified: GitHub Actions run succeeded, live `explore.js` confirmed exporting `useReturnPortal`/`exploreHome`, `version.json` → v38.

**Not done in this pass:** OW-5 (moons & rings) and OW-6 (named regions) are the remaining two Wave 1 items — Wave 2 (wormhole pairs, derelict loot, star map) doesn't start until Yev plays Wave 1 and confirms the direction, per the build plan's checkpoint convention.

## 2026-07-17 — 🐞 Bug fix: Shop Options Bleed (Open World Sprint 2, Wave 1)

**Symptom:** opening the ☰ menu while the Town Shop panel was open in Explore left the shop visibly bled over the menu overlay, instead of being replaced by it.

**Root cause:** `ui.showHowto()` hid `#bar`/`#exploreBar`/`#editorBar`/`#customBar` but never `#townShop` — a straightforward omission from whichever earlier commit added the shop panel to that hide list's siblings but not the panel itself.

**The literal one-line fix from the backlog entry (add `#townShop` to the hide list) turned out incomplete when actually reproduced.** `updateTownShop()` runs every render frame and re-derives visibility from `explore.atTown()` alone, cached in a module-local `shopVisible` flag purely to avoid redundant DOM writes. Hiding `#townShop` directly and resetting that cache made the *very next* render frame recompute `show = atTown()` (still true — the menu doesn't change the comet's physical location), see it differ from the just-reset cache, and immediately un-hide the shop again — a race that undid the fix within one frame (~16ms), invisible to a casual glance but caught by scripting several simulated frames in a row and by the first e2e test run (which initially passed by pure timing luck before I tightened it).

**Real fix:** a `menuOpen` boolean in `ui.js`, set `true`/`false` by `showHowto()`/`hideHowto()`, folded directly into `updateTownShop()`'s own visibility computation (`explore.atTown() && !menuOpen`) — so the render loop's periodic re-evaluation and the menu's open/close state agree by construction instead of racing. `showHowto()` still force-hides `#townShop` immediately too (for instant feedback, no one-frame flash), but that's now belt-and-suspenders on top of the structurally-correct gate, not the whole fix.

**Commit:** `185f903`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** flagged in the 🔄 Core Re-alignment Sprint cleanup (2026-07-17), bundled into 🌌 Open World Sprint 2 Wave 1 per [Next Arc Questionnaire](../questionnaires/black-hole-in-one-next-arc-july-2026.md) Q3 → [Improvements](../../games/black-hole-in-one/ideas.md).

**Regression test:** new e2e case `black-hole-in-one: ☰ menu fully hides an open Town Shop, both directions` in `scripts/e2e.mjs`. Forces "resting at Town" directly via the state modules (`S.mode/phase`, `comet.rest`) rather than flying there — reaching the tee rock legitimately needs live flight physics, and the project's existing e2e tests already establish this state-import pattern for keypad-quest. Drives the actual `#helpBtn` click and the `#howto` pointerdown-to-close handler in real headless Chrome, asserting the shop is hidden with the menu open and reappears after it closes. **Proved the test was meaningful, not a tautology:** reverted just the `ui.js` fix (kept the new test) and re-ran — it failed with exactly the reported symptom ("Town Shop still visible behind the ☰ menu"), then re-applied the fix and it passed again.

`node --test tests/` 303 green, `npm run e2e` 11/11 green, `npm run smoke` green. Deploy verified: GitHub Actions run `29613615403` succeeded, live `ui.js` confirmed serving `menuOpen` and the `#townShop` hide line via a direct `fetch` against `yevrap.github.io` (bypassing cache).

**Verified in-browser** two ways. (1) Scripted: drove `ui.showHowto()`/`hideHowto()`/`updateTownShop()` directly through the live module bindings across ~10 simulated render frames each direction, confirming the shop stays hidden the whole time the menu is open (not just the first frame) and reappears once closed. (2) Real interaction: read the actual DOM refs and clicked the real `#helpBtn` — screenshot confirmed the shop panel fully gone behind the menu (previously it bled through at the bottom) — then closed the menu and confirmed the shop panel slid back into view, at both desktop and 375px mobile widths. (This preview tab's `requestAnimationFrame` loop doesn't tick reliably while backgrounded — a tooling quirk of the preview pane, unrelated to the shipped fix — so the scripted check forced render ticks directly where needed; the real e2e suite's real Chrome tab doesn't have that limitation and is the primary proof.) Golf/Endless untouched — the whole fix is contained to `ui.js`'s Town Shop section.

## 2026-07-17 — 🧹 Docs/repo cleanup pass — no code shipped, docs reconciled

**Not a ship — a housekeeping pass** after the Fuel Economy & Thruster Feel sprint closed, to leave the project clean for whatever's picked next. No code changed; `git status` was clean before and after.

**Reconciled known staleness (flagged by a prior session, closed this one):** the 🔄 Core Re-alignment Sprint checkboxes in Improvements.md (P0 mode re-alignment, P1 laptop full screen, P1 shop-bleed) had never been checked off even though two of the three shipped July 16 under OW-1/OW-2. Verified against the **live code**, not the commit message, before touching any checkbox:
- P0 (9-hole removal) and P1 (full-screen responsive world) — confirmed shipped (`index.html`'s mode buttons, `constants.js`'s `WORLD_W`/`COURSE_H`) — checked off.
- P1 (Shop Options Bleed) — confirmed **still broken**: `ui.showHowto()` hides every settings bar except `#townShop`, so the shop panel bleeds over the menu if you open ☰ while it's open. Left open, called out explicitly rather than silently reconciled away. One-line fix, not made here (a behavior change belongs in a dev-fix pass, not a docs cleanup).

**Archived the fully-answered [Black Hole in One — Thruster Feel & Fuel Economy Questionnaire](../questionnaires/black-hole-in-one-thruster-feel-and-fuel-economy.md)** to `docs/archive/`, matching the convention already used for the Post-Promotion Polish and Verdict & Direction questionnaires.

**Open World arc reconciled:** OW-1/OW-2 checked off as shipped; OW-3 (wormhole→town→return) and OW-4 (stardust pickups) — never built as originally spec'd, but functionally superseded (Town via the tee rock + EXP-1's stardust economy cover the same ground through a different path). Flagged as an explicit open question rather than silently marked done or silently left looking un-started.

**Updated for currency:** [Black Hole in One](../../games/black-hole-in-one/README.md) overview (added a "Current state" section — the Promotion-era description of 9-hole mode + fixed letterboxed course was two arcs stale), the notes index's Black Hole in One entry, and the KamekoStudio repo's root `CLAUDE.md` games-table row (was still describing the pre-Survival two-mode/letterboxed version) — regenerated `GEMINI.md` via `scripts/generate-context-docs.js` per the repo's own sync-discipline convention rather than hand-editing it. `--check` confirms all four `GEMINI.md` files are in sync.

**Opened [Black Hole in One — Next Arc Questionnaire (July 2026)](../questionnaires/black-hole-in-one-next-arc-july-2026.md)** — nothing is currently queued now that the Fuel Economy sprint closed. Covers: confirming/overriding the agent-observed flying-vs-flicking verdict, picking the next arc (Style & Stats / Map Maker continuation / Open World Sprint 2), whether to fix the shop-bleed bug standalone or bundle it, and a standing "anything from real play?" catch-all.

## 2026-07-17 — ⛽ FUEL-2: Refuel station planets — sprint closed
**Shipped:** a `refuelStation` flag on one planet per Explore chunk (75% of chunks — "most chunks have one," Yev's default), checked in the landing (not bounce) collision path. Landing on a flagged planet calls the existing `refuelFull()` and fires a "⛽ Refueled!" toast; bouncing off one without landing is untouched. Visually distinct: a pulsing warm-green glow + ring on `drawPlanet()` (same hue as the fuel pickup, distinct from the Town beacon's gold).
**Commit:** `226258b`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ (v37)
**Context:** [Black Hole in One — Thruster Feel & Fuel Economy Questionnaire](../questionnaires/black-hole-in-one-thruster-feel-and-fuel-economy.md) (Q2, answered 2026-07-17) → [Improvements](../../games/black-hole-in-one/ideas.md)'s ⛽ Fuel Economy & Thruster Feel sprint, FUEL-2 — the last item in the sprint.

Implementation notes: the station roll happens in `getChunkBodies()` *after* the body-generation/overlap-resolution rng calls (one `rng() < 0.75` coin flip, one `rng()` index pick among survivors) — same rng stream, consumed last, so it never perturbs the existing giant/dwarf/binary/normal mix, positions, or the INV-3c escape-guarantee tests that sample real generated chunks. A new pure predicate, `isRefuelStation(body)`, gates the refuel call in `step()`'s landing branch, mirroring the `isStranded`/`atTown` pattern already in the file. `REFUEL_STATION_CHANCE = 0.75` lives in `constants.js` as a named tunable.

+5 unit tests (303 total): station frequency sampled across ~190 real generated chunks (bounds 0.6–0.9, ~11 std devs of margin — not flaky), at-most-one-per-chunk by construction, rng-stream determinism, the `isRefuelStation` predicate directly, and two `step()`-driven integration tests — one places the comet just inside a flagged station's collision boundary moving in at `REST_V`-under speed (lands, fuel jumps to max, toast fires) and one at high speed (bounces — `collide()`'s velocity-response actually ran, confirmed by asserting `comet.vx` changed — fuel untouched). `node --test tests/` 303 green, `npm run smoke` green. Deploy verified: GitHub Actions run `29598840104` succeeded, live `explore.js` confirmed serving `REFUEL_STATION_CHANCE`/`isRefuelStation`, `version.json` → v37.

**Verified in-browser** against the actual live-served code (this session's dev-server port was held by another chat, so verification ran through a second `npx serve` instance on port 4321 rather than the shared `launch.json` config): loaded Explore, confirmed a station's green glow/ring rendering distinctly from the Town beacon in a screenshot, then drove the real dynamically-imported `explore.js`/`state.js` module bindings directly — drained fuel via a real `launch()`, teleported the comet just inside a live-generated station's collision boundary at landing speed, called the real `step()`: fuel jumped 85→100, phase→`'rest'`, toast fired "⛽ Refueled!". Re-ran at bounce speed on the same station: fuel stayed at 85, phase stayed `'flight'`. Golf/Endless untouched — no changes outside Explore's own files.

**Sprint closed.** All three items (FUEL-1, INV-3c, FUEL-2) are shipped. Q5's flying-vs-flicking verdict, held until the tuned version was complete, is now logged: [Kameko Playtest Log](../../playtest-log.md).

## 2026-07-17 — 🚀 INV-3c: Thruster feel pass
**Shipped:** `THRUST_A` softened 400→385; `gravityAt()`'s escape-floor clamp raised 0.8·r→1.0·r; exhaust particle density tuned down; and a root-cause fix the original design math missed — Explore's Giant/Dwarf mass-density multipliers, which meant thrust genuinely couldn't beat some planets even before this pass.
**Commit:** `a53fe66`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Thruster Feel & Fuel Economy Questionnaire](../questionnaires/black-hole-in-one-thruster-feel-and-fuel-economy.md) (Q3/Q4, answered 2026-07-17) → [Black Hole in One — Thruster & Flight Controls](../plans/black-hole-in-one-thruster-and-flight-controls.md)'s INV-3c decisions table → [Improvements](../../games/black-hole-in-one/ideas.md)'s ⛽ Fuel Economy & Thruster Feel sprint.

**The root cause the design doc's own math missed.** INV-3c's decisions table says "raise the floor multiplier... tune both constants together until `THRUST_A` (lowered) still clears the new clamped max at the biggest body (r≈40 giant)," citing surface gravity of ~370 u/s² at a giant. That number assumes uniform planet density (`m = r²`) — but Explore's chunk generator (`getChunkBodies()`, shipped in the original OW-1/OW-2 commit, predating the Thruster arc entirely) gives Giants a **1.5×** mass multiplier and Dwarfs a **2.0×** multiplier on top of `r²`. Recomputing surface gravity (`G·m/(r+COMET_R)²`) with those multipliers included: **Giant approaches ~555 u/s² near r=40, and Dwarf ~555 u/s² near r=8** — both far above `THRUST_A=400`, the value INV-3a/b shipped with. So the Thruster's "beats every planet, no upgrade required" promise (T2) has been quietly false since INV-3a shipped on 2026-07-16, for any sufficiently large Giant or Dwarf — this is almost certainly the concrete mechanism behind Yev's playtest complaint *"I don't like that I can't get out of some gravity."* Verified by direct calculation, not guesswork — see the reasoning trail if this needs revisiting.

Q3b's answer ("Base thrust should beat everything on its own, unconditionally — no upgrade required") and Q3a's answer ("lower `THRUST_A`") can't both hold with those multipliers in place: a large body's surface gravity approaches `G` itself (400) as `r` grows regardless of density, and the multipliers pushed the worst case to ~555 — no `THRUST_A` below ~560 could unconditionally clear that, let alone a *lowered* one. **Fix: dropped both multipliers back to `m = r²`**, matching golf/Endless's existing formula. Giants and Dwarfs stay visually and physically distinct purely through `r²` mass scaling (a giant at r=40 still outweighs a dwarf at r=4 by 100×) — they just no longer carry an extra density tax on top of their size. This is a value change beyond what the decisions table literally named (it only mentioned the `physics.js` floor), made because it's what actually makes Q3b's "unconditionally" true; flagging it here in case Yev wants to weigh in on giants/dwarfs losing their extra density flavor.

With that fixed, the true worst case (Giant, r→40, `m=r²`) is **~369.7 u/s²** — almost exactly what the original design doc assumed. `THRUST_A=385` clears it with ~4% margin (self-reinforcing once escape starts: gravity drops as distance grows, so even a thin margin at the exact worst point only gets easier from there). `THRUST_A` couldn't go much lower than that and still satisfy Q3b "unconditionally" — a large body's surface gravity is structurally bounded below by `G`'s asymptote, not by density, so this is close to the floor of what "lower `THRUST_A`" can mean while keeping the escape guarantee. The `physics.js` floor multiplier (0.8·r → 1.0·r, exactly as the decisions table suggested) turned out to have **zero effect on any reachable surface distance** in any mode — a body's own surface (`r + COMET_R`) is always `> 1.0·r` for any `r`, so this only guards the truly unreachable deep-penetration case (collision detection stops the comet at the surface well before it could tunnel that deep, given `MAX_V/240` step distance is under `COMET_R`). It's cheap, harmless insurance, not the load-bearing fix — the density-multiplier removal is.

Exhaust particle density (`Math.random() < throttle * 0.15` → `* 0.06`): at full throttle and 240 physics steps/s, the old value steady-stated ~23 concurrent particles (average 0.65s particle life × ~36/s spawn rate) trailing the comet — a dense smear rather than a wisp. 0.06 settles to ~9.

**Two new tests** (298 total) lock the escape guarantee in directly against `gravityAt()`: one asserts `THRUST_A` beats surface gravity at each chunk-generator size class's `r` ceiling (Giant/Dwarf/Binary/Normal, nudged to their exclusive upper bound since `rng()` never reaches it), the other samples ~900 real generated chunks and asserts the same holds for actual generator output, not just the theoretical worst case. `node --test` 298 green — **STAB-1's exact liftoff-grace values are unchanged**, confirmed by both the passing exact-value regression tests and by the math: golf's biggest planet (r=15) and every golf/Endless body sits well under the 1.0·r floor's engagement threshold, so `gravityAt()` returns bit-identical output there before and after. `npm run smoke` green.

**Verified live**, two independent ways since this session's preview tab came up backgrounded (`document.hidden === true`, blocking `requestAnimationFrame` and canvas rendering — a known quirk of this harness, not a regression): (1) a standalone Node script importing the actual shipped `explore.js`/`physics.js`/`state.js` modules, placing a comet at rest on a synthetic r=39.999999 giant (the generator's true ceiling) with the Thruster on and full throttle held outward — cleared the surface cleanly and monotonically (distance 41.6→399 over 3s, phase stayed `'flight'`, no re-capture); (2) the identical scenario driven through the *browser's own* dynamically-imported modules (`import('/games/black-hole-in-one/explore.js')` from the live dev-server page, not a copy), confirming the exact code path the browser actually serves behaves the same way (finalD 224 after 2s, escaped=true). Deploy verified: GitHub Actions run `29597914281` succeeded, and `curl`ing the live `constants.js`/`physics.js`/`explore.js` from `yevrap.github.io` directly confirms `THRUST_A = 385`, the `1.0·r` floor comment, and both density-multiplier removals are what's actually being served.

**Not done in this pass (per Q5):** the flying-vs-flicking verdict stays held until FUEL-2 (refuel station planets) also ships.

## 2026-07-17 — ⛽ FUEL-1: No auto-tow anywhere; restart button signals "stranded"
**Shipped:** Explore's forced tow-to-town on an empty tank is gone entirely, in every phase and Thruster state. An empty tank just leaves the comet where it is; `#restartBtn` pulses/glows red and a one-time toast fires the frame it happens, clearing the moment fuel recovers.
**Commit:** `146fb8a`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ (v36)
**Context:** [Black Hole in One — Thruster Feel & Fuel Economy Questionnaire](../questionnaires/black-hole-in-one-thruster-feel-and-fuel-economy.md) (Q1, answered 2026-07-17) → [Improvements](../../games/black-hole-in-one/ideas.md)'s ⛽ Fuel Economy & Thruster Feel sprint, FUEL-1.

Root cause of the original complaint stood: `shouldTowHome(fuel, inventory, phase)` in `explore.js` never fired from `phase==='orbit'`, so an orbit-captured, out-of-fuel comet with the flick scheme active got stuck spinning forever. But Yev's answer broadened the fix beyond that one gap — *"I don't need auto go back to town,"* full stop, no phase or Thruster carve-out — so the actual work was deleting the tow mechanism, not patching it.

`step()`'s `if (shouldTowHome(...)) respawnTown();` call site and the `respawnTown()` function are both gone. `shouldTowHome(fuel, inventory, phase)` is replaced by a phase-independent pure predicate, `isStranded(fuel, inventory) = fuel <= 0 && !inventory.endlessFlight?.enabled` — simpler than its predecessor since Endless Flight is now the only thing that matters; `launch()`/thrust already refuse to fire on an empty tank on their own, so "stranded, wherever you are" needed zero new physics.

The button pulse/toast lives in `main.js`'s `frame()` loop, not inside `explore.step()` — deliberately, because `step()` only runs during `flight` and `rest`-with-thrust (per the existing phase gate in `frame()`), so an orbit-captured or plain-resting-with-no-thrust stranding would never be observed if the check lived there. `frame()` checks `explore.isStranded(explore.fuel, S.inventory)` every tick regardless of phase, diffs it against a `wasStranded` flag to toggle `restartBtn.classList` and fire the one-time toast only on the false→true edge, and clears both the moment fuel recovers or the player leaves Explore mode. CSS: a `.stranded` class on `#btns button` with a `box-shadow` pulse keyframe animation, red (`#ff4444`) to read as urgent/blocked rather than celebratory.

`shouldTowHome`'s INV-1/INV-3a unit tests (phase × Endless Flight × Thruster matrix) were rewritten as `isStranded` tests — the matrix collapsed since phase and Thruster no longer affect the result, so the old "Thruster on: mid-flight tow" cases became one assertion that fuel and Endless Flight are the only two inputs. +0 net tests (rewrote in place, same file), `node --test` 296 green, smoke green, deploy verified: GitHub Actions run `29596610411` succeeded, live `explore.js` contains `isStranded` and no trace of `shouldTowHome`/`respawnTown`, `version.json` reports v36.

**Verified in-browser**, driving the real game through dynamically-imported live module bindings (`import('./explore.js')` from the console returns the same singleton `main.js` uses) rather than a headless harness, covering the three phases explicitly called out in FUEL-1's Done-when:
- **Rest:** drained fuel to 0 via repeated real `launch()` calls from Town — comet was not teleported home; it drifted under nearby gravity and re-landed *on its own physics*, still at 0 fuel, restart pulsing throughout the transition from flight back to rest.
- **Flight:** confirmed mid-drain — pulse + one-time "🚫 Stranded" toast fired on the exact frame fuel hit 0, toast did not repeat on subsequent frames.
- **Orbit:** the actual regression case — force-placed the comet into a live `world.orbit` at 0 fuel (simulating passive orbit-capture while already dry, since thrusting to drain fuel *while* orbiting would itself eject the orbit by existing design) and let the real `stepOrbit()` tick for 2s of wall-clock: phase stayed `'orbit'`, position stayed far from Town (`X:-337 Y:-55`, "Asteroid Belt" — nowhere near the tee), restart stayed pulsing the whole time. This is exactly the scenario the original bug report was about, now fixed by removal rather than a gap-closing patch.
- **Recovery:** `refuelFull()` from all three states cleared the pulse and the class within one real animation frame (confirmed via `document.hidden`/frame-timing that the one stale read was a tooling artifact of this preview browser backgrounding `requestAnimationFrame` between tool calls, not the game).
- Clicking the real restart button afterward still works exactly as before (`↺ Fresh start` toast, comet back at Town, tank refilled) — the click handler itself was untouched, only its `getElementById` call was hoisted to a module-level const.

Golf/Endless: zero lines touched in `gameplay.js`/`physics.js`; the frame-loop check is gated on `S.mode === 'explore'` the same way the Thruster arc gated itself.

## 2026-07-16 — 🚀 INV-3b: Thruster — floating stick + juice
**Shipped:** Mobile completion of the 🚀 Thruster — touch anywhere in Explore with the item on and a floating analog stick appears under your thumb; the old drag-to-flick gesture is now fully replaced (not just co-existing) while the item is enabled.
**Commit:** `6664585`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Thruster & Flight Controls](../plans/black-hole-in-one-thruster-and-flight-controls.md) (design doc; INV-3c — feel pass + the flying-vs-flicking verdict — is next)

Fully-specified design doc (own words: "nothing is blocked on Yev"), so straight to implementation. Four pieces, all exactly where the design doc pointed:

**`ui.toView(e)`** — new, mirrors `toWorld()` but stops before the camera translate and STAB-2 zoom: `(e.clientX - rect.left) / view.scale`. This is the whole reason the ring doesn't drift — `toWorld()` bakes in `explore.camera` and `view.zoom`, so a stick anchored there would slide out from under the thumb the instant the camera eased toward the flying comet.

**`explore.js` stick state** — `stickDown/Move/Up/Cancel(vx, vy, id)`, one pointer at a time (a second touch while one is live is ignored), mirroring the id-tracked pattern `editor.pointerDown/Move/Up` already established. `setViewScale(s)` is the one piece of new plumbing: `stickThrottle(d)` shipped in INV-3a with a CSS-px contract (deliberately left unchanged), but the stick's `ox/oy/cx/cy` are stored in *view* units per the design doc's explicit warning, so converting the stored drag distance back to CSS px before calling `stickThrottle()` needs `view.scale` — pushed in from `ui.resize()` on every resize rather than importing `ui.js` into `explore.js` (which already imports `explore.js`; a back-import would be circular).

**`thrustVec()` composition** — sums the stick's analog vector (`stickVector()`: unit direction × `stickThrottle()`, magnitude ≤ 1) with the keyboard's unit vector (magnitude exactly 0 or 1, INV-3a's shipped behavior) and clamps the result to magnitude 1. Keyboard-alone is bit-for-bit unchanged by construction (stick contributes zero when absent) — verified as an explicit regression test, not just assumed.

**The flick gate** — `main.js`'s `pointerdown`/`pointermove`/`pointerup` now branch to the stick handlers *before* reaching the old `canAim`/`drag` logic whenever `S.mode==='explore' && S.inventory.thruster?.enabled`, so the flick path structurally never runs in that state (no `S.phase==='aiming'` is reachable, which also means `drawAim()` never fires — T10's "no aim arrow" falls out for free rather than needing its own suppression check). This resolves the ⚠️ scope note INV-3a's entry above flagged: yes, the stick fully takes over the gesture, exactly as T6 says.

**Rendering** — `drawThrusterStick()` runs in `ui.js`'s `render()` right after the final `ctx.restore()`, i.e. in the same screen-anchored, no-camera, no-zoom transform the stars use — a ring at `STICK_R_PX / view.scale` (cancels back out to a fixed 46 CSS-px radius on any device) and a nub clamped to the ring edge, tinted with the same green→gold→red ramp `drawAim()`'s power arrow already uses. A new `ui.stepStick(dt)` eases `stickAlpha` toward 1 (stick live) or 0 (released) over ~0.12s — a genuine tap releases before alpha reaches full, so it fades partway in and instantly out rather than strobing. Exhaust is a single `hooks.burst()` particle per physics step, gated at `Math.random() < throttle * 0.15`, spawned opposite the thrust vector in the comet's own trail color (`#ffcf8a`) — a by-eye placeholder, explicitly flagged in Improvements.md for INV-3c's feel pass.

+9 unit tests (296 total): stick pointer tracking and the one-stick-at-a-time id gate, mode/item gating with stick+keys both held, analog throttle direction and magnitude from a fresh stick, the deadzone, the `setViewScale` CSS-px↔view-unit conversion (same view-unit drag reads a different throttle at two different scales — proves the conversion is live, not a no-op), both the under-1 and clamped-to-1 branches of stick+keyboard summing, and a keyboard-only regression pinned to INV-3a's exact shipped output. `node --test` (296) and `npm run smoke` green.

**Verification note — this session's cloud tab did *not* background between tool calls** (contrary to the pattern recorded in the INV-3a entry above): `requestAnimationFrame` kept running in real time throughout, confirmed by re-reading comet position across two calls with a 300ms gap and seeing it move on its own. Adapted rather than assumed: dispatched real `PointerEvent`s at the canvas (exercising the actual production listeners, not calling `explore.*` functions directly), then for deterministic physics checks additionally drove `explore.step()` manually the same way prior sessions did, and — since a thin, faint, screen-anchored ring is genuinely hard to eyeball in a compressed screenshot — read `canvas.getContext('2d').getImageData()` directly for pixel-exact confirmation rather than trusting visual inspection alone. That caught what a screenshot-only pass would have missed or taken on faith: the nub's peak red channel value matched the hand-calculated alpha-compositing math to within a few units at the exact predicted device-pixel offset; the ring held that *exact* device-pixel position after 500 manually-stepped physics ticks of camera-moving flight (camera.y moved ~300 world units; the ring's screen pixel didn't move at all); a down+up with no move in between produced `{x:0,y:0,throttle:0}` throughout, confirming a tap fires no thrust; `S.phase` stayed `'flight'` (never `'aiming'`) with the Thruster on, confirming the aim arrow is structurally unreachable rather than merely unlikely; and — the mobile-vs-laptop crux of this slice — the ring's peak-red offset from origin landed at exactly 92 device px (46 CSS px × dpr 2) at both a 375px-phone `view.scale` of 3.75 and a 1280×800-laptop `view.scale` of 4.706, i.e. two very different `view.scale` values producing the identical physical ring size, which is the whole point of dividing by `view.scale` at draw time. Zero console errors at either viewport. Deploy verified: GitHub Actions run succeeded, live `explore.js` fetched from the deployed URL contains `stickDown`/`setViewScale`/the exhaust comment, zero console errors on the live page.

## 2026-07-16 — 🚀 INV-3a: Thruster — thrust core + keyboard flight
**Shipped:** Explore-only 🚀 Thruster item, first slice — with it enabled, WASD/arrows fly the comet directly instead of flicking; no touch UI yet (that's INV-3b).
**Commit:** `2857836`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Thruster & Flight Controls](../plans/black-hole-in-one-thruster-and-flight-controls.md) (design doc, self-contained — architecture, tuning-constant rationale, and the full slice plan live there)

Fully-specified design doc, so no plan pause. **`burnFuel(amount)`** is the one load-bearing refactor: extracted from `launch()`'s inline `fuel -= 15` so every fuel cost in Explore — the flick, and now the Thruster's per-second burn — goes through the same Endless-Flight fuel-lock check. That's literally where Yev's *"works with never running out of fuel as well as with metered fuel"* is implemented; nothing about the composition is special-cased at either call site. Keyboard state (`keys`, a `Set` of held `KeyboardEvent.code`s — `ArrowUp/Down/Left/Right`, `KeyW/A/S/D`) lives at `explore.js` module scope, not in `S`, since it's transient input, not game state; `main.js` owns the actual `window.addEventListener('keydown'/'keyup', ...)` calls (matching how it already owns every other input listener) and forwards into `explore.keyDown(code)`/`keyUp(code)`. `keysToVector()` sums held keys into a unit vector — diagonals normalized so they aren't √2 faster, opposite keys cancel to zero — and `thrustVec()` is the single gate: returns zero unless `S.mode==='explore' && S.inventory.thruster?.enabled`, so nothing downstream needs its own inventory check. `stickThrottle()` (the deadzone-then-linear ramp INV-3b's pointer code will call) shipped now too, pure and unused, because the design doc's own Done-when checklist asked for it ahead of the stick UI.

Three phase transitions, all in `explore.js`: resting + any throttle → flips straight to `'flight'` before the thrust force is applied (no liftoff grace — `THRUST_A=400` already clears every planet's surface gravity, so grace-plus-thrust would fire the comet off like a cannon); a live orbit + any throttle ejects to `'flight'` inside `stepOrbit()` with no velocity fixup needed (the orbit's own tangential-velocity write already left the right value in `comet.vx/vy`); orbit capture is skipped entirely while `throttle>0` so flying past a planet tangentially can't yank you into an unwanted orbit mid-burn. `shouldTowHome()` grew a `phase` parameter — Thruster-on tows home the instant fuel hits 0 in *any* phase (T8: "mid-flight or not"), while the flick scheme keeps today's rest-gated tow bit-for-bit (a flick charges −15 at launch, so an unconditional tow would yank the player out of the very shot they just paid for).

+7 unit tests (292 total): `stickThrottle` (deadzone floor, linear ramp, clamp, d=0), `keysToVector` (each key, diagonal normalization, opposite-key cancellation, empty set), and a `shouldTowHome` matrix covering fuel/Endless/Thruster/phase combinations including the Thruster-on-mid-flight case and Endless-wins-over-everything. `node --test` (287) and `npm run smoke` green.

**Verification hit a real tooling gap worth recording:** this preview browser's synthetic `key` press action dispatches a `KeyboardEvent` with `key` set but `code: ""` — it never populates the standard `code` property my listener reads (confirmed by attaching a tracer listener). Real browsers always populate both. Rather than weaken the shipped code to read `e.key` (worse for WASD on non-QWERTY layouts, and not what the design doc's file:line architecture calls for), verification dispatched hand-constructed `KeyboardEvent`s with `code` set correctly directly at `window`, driving the exact same production listener a real keypress would. Separately, this cloud tab appears to background (`document.hidden`) between tool calls, which pauses `requestAnimationFrame` — a wall-clock `setTimeout` wait showed zero physics movement despite correct input state, until the harness's own `explore.step()`/`stepOrbit()` were pumped manually the way the real `frame()` loop would (same technique prior Black Hole in One ships in this log used for the same reason). With that isolation: thrust saturates at `MAX_V` in ~0.44s exactly as the design doc's rationale predicted, fuel burns at exactly 8/s and stops the instant the key releases, Thruster-off reproduces flick-Explore bit-for-bit (position identical after 60 ticks of held W), both items on together burn zero fuel over a 2-second hold, T8's mid-flight tow fires at exactly tick 3000 (100÷8=12.5s, bit-exact), orbit ejects on any throttle, and orbit capture is provably skipped while thrusting on a textbook capture trajectory. Zero console errors throughout. Deploy verified: GitHub Actions run succeeded, live `version.json` reports v35, and the live `explore.js`/`constants.js` both contain the new exports.

**One scope call flagged for Yev, not silently decided:** INV-3a leaves the existing mouse/touch drag-to-flick path completely untouched — even with the Thruster on, dragging the canvas still fires the old flick alongside keyboard thrust. Read T6's "Thruster replaces the flick entirely" as describing the end state once INV-3b's stick takes over the same gesture, not a requirement to gate the flick ahead of any stick existing — the Done-when checklist (otherwise exhaustive) never mentions it. Full note, and the one-line fix if this reading is wrong, in the design doc's new ⚠️ callout. INV-3b (floating touch stick) is next; INV-3c (feel-pass + the flying-vs-flicking verdict) after that.

## 2026-07-16 — 🐞 Fix: Explore — items no longer spawn inside planets
**Shipped:** Fuel and stardust pickups in Explore mode never spawn inside (or unreachably close to) a planet's collision radius.
**Commit:** `93cd07f`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) (🧹 Explore/Survival Polish backlog)

**Root cause:** `getChunkPickups()` rolled a pickup's (x,y) uniformly at random across its chunk with no knowledge of that chunk's planet positions — so a pickup could land dead-center in a planet, or otherwise closer to its center than the comet's own collision boundary (`b.r + COMET_R`), making it permanently unreachable (matches the inbox report: "Planets have items in them I can't get").

**Fix:** new pure helper `pickupBlockedByBody(px, py, r, bodies)` in `explore.js` — true if a candidate spot is within `b.r + COMET_R + pickup.r + 2` (a small clearance buffer) of any body. `getChunkPickups()` now reject-and-resamples a candidate position up to 10 times, skipping the pickup entirely if a chunk is too crowded to find a clear spot (rare — a giant planet filling most of the chunk). First pass only checked bodies from the pickup's own chunk; an in-browser sweep (7459 generated pickups) caught 6 residual violations — a binary pair's second body or a giant planet's radius can bleed past its own chunk's boundary into a neighbor, which a same-chunk-only check misses. Widened `updateActiveChunks()` to gather each pickup chunk's *3×3 neighborhood* of bodies (cached per chunk key so neighbor overlap doesn't recompute work) before calling `getChunkPickups()`. Re-swept after the fix: 0/7450 violations.

+3 regression tests (`tests/explore.test.mjs`, 283 total): `pickupBlockedByBody` boundary math, a single-chunk sweep across 3 seeds × 169 chunk pairs asserting no pickup overlaps its own chunk's bodies, and a full-pipeline sweep through `updateActiveChunks()` across a 17×17 chunk camera crawl asserting no pickup overlaps *any* active body (this is the one that would have caught the cross-chunk bleed). `node --test` (283), `npm run smoke`, and `npm run e2e` all green. Verified in-browser: loaded Explore, confirmed pickups render clear of planet bodies; re-ran the violation sweep directly against the deployed `explore.js` fetched from the live URL.

## 2026-07-16 — 🚀 INV-2: Shop lists items as already acquired
**Shipped:** The Town Shop now lists every `ITEMS` registry entry (currently just ♾️ Endless Flight) with a read-only "✅ Acquired" chip in place of a buy button — no purchase path yet, but the shop foreshadows the eventual buy path per Yev's explicit ask.
**Commit:** `5861d46`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Inventory System](../../games/black-hole-in-one/plans/explore-inventory-system.md)

Small, well-specified slice — no design ambiguity, no plan pause needed. `renderTownShop()` (`ui.js`) now renders two row groups into `#ts-items`: the existing `UPGRADES` buy rows (untouched) plus a new set mapping `ITEMS` (imported from `constants.js`) to `.ts-item` rows ending in a `<span class="ts-acquired">✅ Acquired</span>` instead of a `<button class="ts-buy">`. Using a `<span>` rather than a disabled `<button>` was a deliberate small deviation from "reuse `.ts-buy`" verbatim: a `<span>` can never receive a click listener or fire `explore.buyUpgrade()`, so there's no reliance on `disabled` semantics blocking a stray purchase — correctness by construction rather than by convention. New `.ts-acquired` CSS mirrors `.ts-buy:disabled`'s muted look (same padding/radius/font, grey border/text) so it reads as "same shop, different state," not a new UI pattern.

No new pure logic, so no new unit tests — `node --test` stayed green at 280. Verified in-browser at Town: the Endless Flight row shows the ✅ Acquired chip; `read_page` interactive-element scan confirmed only the three real upgrades' `✨ 15` buttons are clickable elements in the shop, the chip isn't one. Smoke test (`npm run smoke`) green across all pages. Deploy verified: GitHub Actions run #244 (`pages-build-deployment`) completed successfully against `5861d46`, and a live fetch of the deployed `ui.js` confirmed the `ts-acquired` code is actually served. (`gh run list` itself failed locally — the CLI's cached auth token is invalid, unrelated to this change; verified via the Actions web UI instead and confirmed the raw GitHub API works fine.) INV-3 (push-modifier item, the real extension-point test) is next.

## 2026-07-16 — 🐞 Fix: Endless Flight widened to a fuel-lock
**Shipped:** Endless Flight (INV-1) now instantly refuels to tank max and stops fuel from draining at all while enabled; disabling it resumes normal draining from wherever the tank is.
**Commit:** `7b8304b`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Inventory System](../../games/black-hole-in-one/plans/explore-inventory-system.md)

**Root cause:** not a bug in the wiring — the shipped INV-1 spec was narrower than what Yev actually wanted. Reported as "the toggle doesn't seem to work, I expect it to fill fuel to 100% and stop it from running out." Reproduction showed the code matched its own tests and the same-day design questionnaire exactly: `shouldTowHome()` only ever gated the empty-tank tow-back-to-Town teleport, never touched the fuel value, and `launch()` still drained 15/shot regardless of the toggle. Rather than silently reinterpreting the chat description as the new spec, asked directly (`AskUserQuestion`) whether to keep the narrower design or widen it — confirmed: widen it.

**Fix:** `explore.js` — `launch()` skips `fuel -= 15` while `S.inventory.endlessFlight?.enabled`; new exported `refuelFull()` sets `fuel = tankMaxFuel(S.upgrades.tank)` and fires the `bar()` hook. `main.js`'s Inventory checkbox handler calls `refuelFull()` the moment the box is checked, so enabling doesn't wait for the next drain/pickup tick. `constants.js`'s `ITEMS` desc text updated ("Full tank, forever — fuel stops draining until you switch it off") since the old "no tow back to Town" copy no longer described the mechanic.

**Regression tests** (`tests/explore.test.mjs`, +3, 280 total): launch doesn't drain fuel while enabled; launch resumes the normal −15 drain once disabled; `refuelFull()` tops off to the *current* tank level's max (not a hardcoded 100 — caught via an L1-tank scenario). Verified end-to-end in-browser: drained fuel via the real game loop, opened the drawer, clicked the checkbox live — fuel bar jumped to full immediately; confirmed via console that `launch()` no longer drains while enabled and drains normally again once toggled off.

**Deploy infra fix, same session:** this commit (and the immediately following `GEMINI.md` regen, `fbb4665`) both failed to deploy — GitHub Pages' Jekyll build step calls `api.github.com` mid-build (via the `github-metadata` plugin) and that call hit a `503`, three builds in a row. Root cause of *why* the site was exposed to that at all: the repo had no `.nojekyll` marker, so every deploy ran through Jekyll processing despite this being a pure static-file project with zero Jekyll/Liquid usage (`CLAUDE.md`: "No build step... everything must work as static files"). Added `.nojekyll` (`bfb0cd2`) — this removes the `github-metadata` dependency entirely rather than just retrying past it. Confirmed live: build succeeded clean on the first try after the marker landed, and `constants.js` on the actual Pages URL now serves the updated Endless Flight text. If a Pages build ever fails again, check for a Jekyll-step Liquid Exception before assuming it's a code problem.

## 2026-07-16 — 🚀 INV-1: Inventory registry + Endless Flight item
**Shipped:** Explore mode gets a settings-drawer 🎒 Inventory section — a mechanic testbed, not a shop — with its first toggle, Endless Flight (no tow-back to Town on an empty tank).
**Commit:** `6d4e1a5`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Inventory System](../../games/black-hole-in-one/plans/explore-inventory-system.md)

First slice of the reframed Explore Inventory arc — Yev's answers to the design questionnaire cut the buy/find acquisition layer entirely and turned this into "items to test out more game mechanics." An `ITEMS` registry (one entry: `endlessFlight`) backs a `when`-gated (`S.mode === 'explore'`) drawer section that renders one checkbox row per item; `S.inventory` persists to `blackHoleInOne_inventory` (registered in `clearAllGameData`, which lives outside the game folder in `shared/settings.js` — the design doc flagged this as easy to miss). Endless Flight itself hooks into the existing empty-tank tow-back in `explore.js`'s `step()` through a new pure predicate, `shouldTowHome(fuel, inventory)` — enabled, the comet just sits at 0 fuel instead of `respawnTown()` teleporting it home; disabled reproduces today's behavior exactly.

**One implementation deviation from the design doc, not a product decision:** the doc sketched the `ITEMS` registry living in `ui.js` beside the Town Shop's `UPGRADES` array. Shipped it in `constants.js` instead — this game's existing "DOM-free, unit-tested" static-data module — so the registry is unit-testable and `state.js` can derive `S.inventory`'s defaults directly from it (`defaultInventory()`) rather than hand-duplicating the item list in two places. `main.js` (drawer) and the future INV-2 Town Shop code both import `ITEMS` from there. Noted in the design doc for the record; nothing here needs Yev's input.

`node --test` green (277, +8 for `shouldTowHome` and the `mergeInventory` default-merge round-trip incl. null/corrupt/missing-key cases — `fuel` has no exported setter so the actual `respawnTown()` wiring itself is verified in-browser, per the design doc's own testing note). Verified in-browser: 🎒 Inventory section appears only in Explore (confirmed absent in Endless golf); toggling the checkbox updates live state and `localStorage` immediately; persists across a hard reload; resets to default after simulating the key removal `clearAllGameData` performs, then reload. Wiring verified by driving `explore.js` directly through the console — drained fuel via repeated `launch()` calls, forced `S.phase = 'rest'` away from Town, and called `step(0)`: with Endless Flight ON the comet stayed put at 0 fuel; OFF, it towed home and refilled to full, exactly matching pre-INV-1 behavior. Zero console errors in either mode. INV-2 (Shop lists items as already acquired) is next.

## 2026-07-16 — 🚀 EXP-1e: Town visual identity — arc complete
**Shipped:** The Explore-mode tee rock (Town) now has a distinct warm glow, visible whether or not the shop is open.
**Commit:** `3826adf`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md)

Fifth and final slice of the Explore Progression arc. `drawTee()` (`ui.js`) now draws a pulsing warm-gold radial halo plus a thin ring at the rock's surface whenever `S.mode === 'explore'` — golf and editor tees share the exact same function and `'tee'` body type (a fresh spot every hole, not a persistent place), so they're untouched by the `S.mode` gate. Purely cosmetic: no new state, no persistence, no dependency on the other EXP-1 slices.

**Verification hit a real snag worth recording:** the comet already has its own pre-existing warm white-to-orange glow (`drawComet()`, unrelated to this ship, always been there), which sits directly on top of the tee rock whenever the comet is at rest there — the two glows are easy to mistake for each other at a glance. A first verification pass also got confused by the page's own `requestAnimationFrame` loop still running in the background during direct-module testing: manually setting `S.mode`/`camera` and then screenshotting after a delay let the live loop's camera-follow smooth the view back toward the comet before the screenshot landed, producing misleading results. Fixed the verification (not the game) by setting `S.paused = true` to freeze the real loop, then moving the comet 40 world-units off the rock so its glow no longer overlaps — with that isolation, Explore's Town clearly shows the new halo/ring and Endless's tee renders exactly as before, in both cases confirmed directly against the deployed and local code.

`node --test` (274, unchanged — no new pure logic to test) and smoke both green. **This closes the EXP-1 arc**: stardust wallet (1a) → Town Shop + Fuel Tank (1b) → data-driven shop config (1b.5) → Fuel Siphon (1c) → Long-Range Sensor (1d) → Town visual identity (1e), all shipped 2026-07-16.

## 2026-07-16 — 🚀 EXP-1c + EXP-1d: Fuel Siphon & Long-Range Sensor upgrades
**Shipped:** Two more Town Shop items — Fuel Siphon and Long-Range Sensor, both purchasable and persisting alongside Fuel Tank.
**Commit:** `e4a64da`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md)

Third and fourth slices of the Explore Progression arc, both added via the EXP-1b.5 config with no shop-panel markup work needed. **EXP-1c (Fuel Siphon):** the pickup fuel gain in `explore.js` (Explore's copy only) now scales 20/28/36/45 by tier through a new `siphonGain()` helper in `constants.js`; Endless's own `+20` in `gameplay.js` is untouched by design. **EXP-1d (Long-Range Sensor):** `updateActiveChunks()`'s active-chunk load radius now scales 1/2/3/4 chunks by tier through a new `sensorChunkRadius()` helper — higher tiers load bodies and pickups farther from the camera. Buying the sensor while resting at Town forces an immediate chunk reload (`lastChunkX`/`lastChunkY` reset + `updateActiveChunks()` call), since the loop's chunk-unchanged guard would otherwise delay the effect until the next chunk crossing.

**Judgment call, caught by testing before shipping:** the design doc scoped Sensor's tiers as +25/50/75% of the base radius, but a literal rounding of those percentages onto whole chunks (the loading granularity is necessarily an integer) produced two dead tiers — L1 identical to L0, L3 identical to L2, i.e. real stardust spent for zero observable effect. In-browser verification caught this before commit (measured 38 bodies at both L0 and the naive L1). Shipped instead as one full extra ring per tier (radius 1→2→3→4), confirmed distinct and increasing at every level: 38→103→199→318 loaded bodies across L0-L3. Noted in [Improvements](../../games/black-hole-in-one/ideas.md) and the design doc for the record; no open question for Yev — the fix was mechanical, not a product-shape decision.

+4 unit tests (274 total green) for the new pure helpers (`siphonGain`, `sensorChunkRadius`), smoke green. Verified in-browser via direct module calls (same technique as EXP-1b, since the preview tab backgrounds and pauses the rAF loop): drained fuel via direct `launch()` calls, confirmed a simulated pickup's fuel gain matches `siphonGain()` exactly before and after a purchase; bought Sensor through all 4 tiers and confirmed `world.bodies.length` scales correctly at each step, MAX-state gating works, and the rendered shop panel shows both new items with correct icon/label/cost. Endless mode's own fuel gain confirmed untouched via source read. Only EXP-1e (Town visual identity, P3) remains open in this arc.

## 2026-07-16 — 🚀 EXP-1b.5: Data-drive the Town Shop panel
**Shipped:** `renderTownShop()` now maps over a small `UPGRADES` config instead of hand-writing the Fuel Tank's HTML.
**Commit:** `42fe8f2`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md)

Shop-panel debt paydown ahead of EXP-1c (Fuel Siphon) and EXP-1d (Long-Range Sensor), both of which add a second/third item to the same panel. `renderTownShop()` in `ui.js` previously hand-wrote the Fuel Tank's `.ts-item` block; replaced with a `UPGRADES` array (`key`, `icon`, `label`, `desc(level, maxed)`) that the function `.map()`s over, joining the results into `#ts-items`. Buy buttons switched from a per-upgrade hardcoded id (`#ts-buy-tank`) to a `data-upgrade` attribute + a single delegated `querySelectorAll('.ts-buy')` wire-up, so N items need zero new plumbing.

Pure refactor — no gameplay or persistence change, no new product surface. Verified: unit suite green (268 tests, unchanged), then in-browser both locally and on the deployed site — Fuel Tank still renders/purchases identically through the new path (L0→L1, stardust deducted, persists across reload). Temporarily added a second stub config entry to prove the "done when" criterion (a second `.ts-item` appears with no HTML duplication), confirmed visually and via DOM inspection, then reverted the stub before committing — only the real Fuel Tank entry ships. EXP-1c and EXP-1d can now each add one `UPGRADES` entry plus their own gameplay-effect wiring, no shop-panel markup work needed.

## 2026-07-16 — 🚀 EXP-1b: Town Shop + Fuel Tank upgrade
**Shipped:** Resting at Town shows a shop panel; buying the Fuel Tank raises max fuel and persists.
**Commit:** `5c036d1`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md)

Second slice of the Explore Progression arc, after EXP-1a's wallet persistence. Resting the comet at Town (the tee rock, Explore mode only) now shows a bottom-sheet shop panel — reusing the existing editor/custom-map bar chrome rather than a new UI system — with the stardust balance and the Fuel Tank's next tier/cost. Buying deducts stardust, levels the tank (100/130/160/200 max fuel across L0-L3, shared 15/35/60✨ cost curve across all three planned upgrades), and adds the capacity delta to current fuel rather than topping it off to full — a judgment call flagged in Improvements for Yev to confirm before EXP-1c/1d.

New `explore.atTown()` (true only when resting on the tee) and `explore.buyUpgrade(key)` (validates cost/max level, deducts, levels, fires `stardust`/`upgrades` hooks) do the work; `blackHoleInOne_upgrades` (`{tank,siphon,sensor}`) persists via a new hook in `main.js`, registered in `clearAllGameData`. Explore's three hardcoded `fuel = 100` sites (start, respawn-at-empty-tank, pickup cap) now read `tankMaxFuel(S.upgrades.tank)`; Endless's own `S.fuel` path in `gameplay.js` is untouched by design, so its high-score runs stay comparable session to session.

The shop panel only re-renders on open and right after a purchase (not every frame) so a button can't get swapped out from under an in-progress tap. +7 unit tests (275 total green), smoke green. Verified through the real hooks in-browser: buying raises max fuel immediately, survives a reload (upgrade level loads before the boot-time Explore run computes its starting fuel), a maxed L3 tank refuses further purchases without any state change, and Endless's `S.fuel` stays exactly 100 regardless of the tank level. (Note: this browser preview environment reports the tab as backgrounded, which pauses the game's own rAF loop per its existing `visibilitychange` handler — verification used the same direct-module-call technique as this repo's e2e smoke tests to exercise the real code path.)

## 2026-07-16 — 🚀 EXP-1a: Persist the stardust wallet
**Shipped:** Stardust now survives a reload.
**Commit:** `38f830e`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md)

First slice of the new Explore Progression arc (Yev picked "Open World / Explore longevity" → "meta-progression via stardust" for the Inbox note "make explore last longer, roguelike"). `blackHoleInOne_stardust` previously reset on every reload despite being described as persistent — there was no load/save path at all. Added a `stardust(total)` hook (mirrors the existing `roundEnd`/`bestRound` pattern) fired from both `gameplay.js` (Endless) and `explore.js` (Explore) on pickup; `main.js` loads it on boot and persists it via the hook. Registered `blackHoleInOne_stardust` in `clearAllGameData`, and fixed the pre-existing but unregistered `blackHoleInOne_freezeAim` key while touching that list. +2 unit tests (262 total green), smoke green, verified live: collected stardust survives a reload on the deployed site. No UI yet — that's EXP-1b (Town Shop + Fuel Tank upgrade), next.

## 2026-07-16 — 🐞 Fix: Explore mode frozen on start
**Shipped:** Removed dangling survivalBar references.
**Commit:** `bce36e7`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** Bug fix

Root cause: The previous HUD revamp removed the `<div id="survivalBar">` element from the DOM (since Survival mode mechanics were natively merged into Endless and Explore), but `main.js` and `ui.js` still attempted to hide it using `document.getElementById('survivalBar').classList.add('hidden');`. This caused a TypeError when clicking the Explore mode button.
Fix: Removed the dangling references from both files.

## 2026-07-16 — 🚀 OW-2: Explore Mode HUD & Metrics Revamp
**Shipped:** Visual fuel tank, compass pip, stardust, dynamic region names.
**Commit:** `a6e5983`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md)

Implemented a complete HUD overhaul for Explore and Endless modes:
- **Visual Fuel Gauge:** Replaced raw `100%` text with a smooth segmented bar that turns gold when low and red when critical.
- **Navigation & Compass:** Added an edge-of-screen compass pip pointing back to Town `{50, 85}`. Coordinates are now displayed on the HUD.
- **Dynamic Regions:** The region name smoothly updates based on distance from Town (e.g., "The Shallows", "Asteroid Belt").
- **Stardust Wallet:** Added `✨ Stardust` generation to the chunk builder and HUD tracking for collected stardust (in preparation for Town Upgrades).

## 2026-07-16 — 🚀 OW-1: Explore Mode Vertical Slice Complete & Endless Revamp
**Shipped:** Responsive Maps, Merged Survival, Town Respawn
**Commit:** `095ff6c`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md), [Black Hole in One — Survival Mode Build Plan](../plans/black-hole-in-one-survival-mode-build-plan.md)

Completed Phase 1 of the open world/survival revamp. The static 100x170 letterboxed limit has been removed — the game now features 200x200 generated courses and a dynamic global camera that seamlessly follows the comet or tracks orbit focuses across all modes. Survival mechanics (fuel consumption, running out of fuel = game over, fuel pickups) have been merged natively into Golf (Endless) Mode. The standalone 9-Hole Round and Survival modes were removed. Explore Mode also consumes fuel now, but instead of Game Over, running out of fuel "tows" the player back to `{x: 50, y: 85}` with a refueled tank to continue exploring. 

## 2026-07-16 — 🚀 SURV-4: Moving Asteroids
**Shipped:** Added drifting asteroids to Survival Mode.
**Commit:** `9a51da1`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Survival Mode Build Plan](../plans/black-hole-in-one-survival-mode-build-plan.md)

Asteroids now spawn in Survival Mode (starting from hole 4). They drift endlessly across the screen with a linear velocity, wrapping around the edges. They move even while the player is aiming, applying time pressure to shots. Colliding with an asteroid smashes the comet and triggers Game Over.

## 2026-07-16 — 🚀 SURV-3: Hazards (Space Mines & Gravity Traps)
**Shipped:** Added Space Mines and Gravity Traps to Survival Mode.
**Commit:** `33df066`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Survival Mode Build Plan](../plans/black-hole-in-one-survival-mode-build-plan.md)

Introduced deadly hazards to Survival Mode. Space Mines (jagged red circles) sit silently in the play area, while Gravity Traps (swirling purple holes) pull the comet in with extreme force. Hitting either hazard instantly destroys the comet, triggering Game Over.

## 2026-07-16 — 🚀 SURV-2: Fuel Refreshes
**Shipped:** Added fuel pickups to Survival mode levels.
**Commit:** `a687b0e`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Survival Mode Build Plan](../plans/black-hole-in-one-survival-mode-build-plan.md)

Fuel pickups now randomly spawn in Survival mode levels (1 to 3 per hole). Collecting one restores 20 fuel and triggers a green particle burst and a pleasant chime.

## 2026-07-16 — 🚀 SURV-1: Survival Mode Scaffold & Fuel System
**Shipped:** Added the initial Survival Mode UI flow, discrete level structure, and the fuel metric.
**Commit:** `85ddd89`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Survival Mode Build Plan](../plans/black-hole-in-one-survival-mode-build-plan.md)

Implemented the scaffolding for Survival mode. Booting into Survival mode gives the player 100 fuel. Each flick costs 15 fuel. Running out of fuel immediately triggers a Game Over screen. Reaching the black hole proceeds to the next level indefinitely (no 9-hole limit).

## 2026-07-16 — 🐞 Fix: Explore mode map flash on boot
**Shipped:** Seamless transition to Explore mode without map swapping
**Commit:** `c91cbf5`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** Bug fix

Root cause: the game was hardcoded to generate a golf map to render behind the menu on boot. When clicking "Explore", it would swap to the Explore map, causing a visual flash as the menu faded out.
Fix: boot now reads the last played mode and pre-generates the correct map (Explore or Golf) for the menu background. Transitions are now perfectly seamless.

## 2026-07-16 — 🚀 OW-0: Mid-flight aim toggle (Explore Mode)
**Shipped:** Added "Freeze mid-flight aim (Explore)" setting to the drawer
**Commit:** `a6f5523`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Yev liked both the live-moving comet during aim and the frozen-comet behavior for accuracy. Made it a toggleable setting in the Game Menu. Defaults to true (frozen).


## 2026-07-16 — 🚀 OW-0: Mid-flight pushes (Explore Mode) — feel tuning
**Shipped:** Freeze comet during mid-flight aim (OW-0 feel tuning)
**Commit:** `4b0fa19`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Post-ship tuning: Yev found mid-flight pushes hard to aim because the comet kept moving while he was dragging. Fix: freeze physics during mid-flight aim — the comet holds position while you plan the push, resumes on release. One line removed from the main loop.

## 2026-07-16 — 🚀 OW-0: Mid-flight pushes (Explore Mode)
**Shipped:** Mid-flight force-push flicks in Explore mode
**Commit:** `2dce5c1`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) (Active Sprint — Explore Mode)

In Explore mode, the comet can now be flicked **mid-flight** to change direction without waiting to land. Extends the BH-4 orbit force-push impulse model to all flight: the drag vector is added to the comet's current velocity, bending the trajectory instead of overwriting it. Physics keeps stepping while you aim (the comet moves under you), the trail is preserved across pushes, and a one-time "🚀 Mid-flight push!" toast fires on the first mid-flight use.

**Key design decisions:**
- Physics keeps stepping during mid-flight aim — the comet is alive while you plan your push, making it feel urgent and responsive
- Trail preserved across pushes — your path is one continuous ribbon, not choppy segments
- Orbit cooldown still resets on every push — prevents instant re-capture near planets
- Golf modes completely unchanged — the `flight → aim` transition is gated on `S.mode === 'explore'`

**Files changed:** `state.js` (+`prevPhase`), `main.js` (input gating + physics-during-aim), `explore.js` (launch logic + hint), `ui.js` (rest-ring suppression). +4 unit tests (261 total, all green).

## 2026-07-16 — 🐞 MM-14: editor trash drop-zone now deletes
**Shipped:** Fix for Yev's "delete box does not work in edit mode"
**Commit:** `2c7b9ad`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md) (STAB-3 follow-up)

Yev flagged that the editor's "🗑️ Drag here to delete" box still didn't delete. Root cause: `pointerUp` hid the trash element (`classList.add('hidden')` → `display:none`) **before** calling `getBoundingClientRect()` on it — and a hidden element returns an all-zeros rect, so the over-trash hit-test was `cx>=0 && cx<=0 && cy>=0 && cy<=0`, true only at exactly (0,0), i.e. never. The bug shipped with MM-5 and my STAB-3 refactor kept the ordering. Fix: measure the trash rect **while visible**, decide the hit, then hide. +1 regression test (257 total). Root cause: `getBoundingClientRect` on a `display:none` element.

## 2026-07-16 — 🧹 Stability Sprint STAB-6 + sprint CLOSE
**Shipped:** Map serialize round-trip + regression coverage; **sprint complete, feature freeze lifted**
**Commit:** `f34782f`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Stability Sprint (July 2026)](../plans/black-hole-in-one-stability-sprint-july-2026.md), [Improvements](../../games/black-hole-in-one/ideas.md)

Final stability item — backfilled the coverage the fast-shipped surfaces never got. Test count **27 → 256**: `encodeMap`/`decodeMap` round-trip (URL map-share can't silently corrupt a shared link), editor add/drag/delete + wedge-safety, `fitZoom` zoom math, and the STAB-1 escape behaviour. Test-only change (no runtime diff).

**Sprint close — game health check (all green):**
- Core golf loop proven beatable: an aim search from the tee sinks **hole 1 on 51 of 300 shots** (plus 10 orbit captures) — a healthy aim window, no soft-lock.
- **Golf never zooms** (`view.zoom` stayed 1 across a full auto-played run) — the one-screen pillar is intact; the STAB-2 zoom-out only engages for Explore's giants.
- Menu clean at 375px, shared-map arrival correct, editor drag/delete solid, zero console errors, `node --test` (256) + smoke green.

**Feature freeze LIFTED.** Resume one arc at a time — Style & Stats (BH-1/2/3) is the lowest-risk re-entry; Open World needs its own scope pass; Map Maker MM-6/7/11/12/13 unblocked.

## 2026-07-16 — 🧹 Stability Sprint STAB-4/5
**Shipped:** Decluttered start menu + fixed the shared-map arrival flow
**Commit:** `0e8450e`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Stability Sprint (July 2026)](../plans/black-hole-in-one-stability-sprint-july-2026.md), [Improvements](../../games/black-hole-in-one/ideas.md)

Consumed decisions **D2/D3** and Yev's raw note *"Menu looks bad? Play shared map button doesn't make sense and what is the ignore and go to main menu?"* The root cause was a **missing CSS rule**, not just wording: `#sharedMapBtns.hidden` and `#modeBtns.hidden` had **no `display:none` rule**, so the "Play Shared Map / Ignore" buttons were showing on the *normal* menu the entire time (and a `?map=` arrival showed the full mode list *and* the shared card at once). That's exactly why the button "made no sense" — it was on the main menu where it didn't belong.

- Added the missing hide rules → the shared-map card now appears **only** for `?map=` links, and the normal modes hide while it's up.
- Reworded the arrival flow to plain language: **"🔗 Someone shared a custom map with you."** / **"▶ Play this map"** / **"No thanks"** (was "▶ Play Shared Map" / "❌ Ignore & Go to Main Menu").
- Grouped mode select into labelled sections — **Play** (9-Hole Round, Endless, highlighted primary) and **Make & explore** (Map Maker, Explore) — so it reads as a menu, not a flat pile. **Explore stays first-class (D3=c)** — no demotion; **STAB-5 resolves to keep-as-is**.
- Moved the primary-button highlight off `:first-child` onto an explicit `.mode-go` class so it survives the grouping.

Verified in-browser at 375px through the real handlers: normal menu clean (no stray shared buttons), shared link shows only the card, "Play this map" loads the custom map (`mode: custom`, tee + planet), "No thanks" restores the menu, zero console errors. 254 unit tests + smoke green. Root cause: shared-map & mode-list containers had no `.hidden` display rule.

## 2026-07-16 — 🧹 Stability Sprint STAB-3
**Shipped:** Map Maker drag/delete no longer wedges on mobile
**Commit:** `8c418cc`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Stability Sprint (July 2026)](../plans/black-hole-in-one-stability-sprint-july-2026.md), [Improvements](../../games/black-hole-in-one/ideas.md)

Third stability item — a proper `dev-fix` (reproduced the wedge in-browser first). MM-5/MM-8 had patched symptoms; the actual root cause was **two compounding bugs**:

1. **`sfx.pop()` didn't exist.** `main.js` wires the editor's `sfx` to the game's `sfx` object, which has no `pop()`, so `addPlanet`/`addPulsar`/delete all called a missing method and **threw**. In `pointerUp` the throw landed *between* filtering the object out and `dragged = null`, so after deleting once the editor was wedged (a stuck `dragged` makes every later `pointerDown` early-return). → added a `pop()` blip to `sfx`.
2. **`pointercancel` passed id `-1`**, which never matches the real drag id, so a canceled touch never cleared `dragged` and wedged the editor. → added `editor.cancelDrag()` (unconditional release), called from the `pointercancel` handler.

Hardened `pointerUp` to clear `dragged` **before** firing any hook, so a throwing hook can never wedge it again. Verified in-browser through the real handlers with the real `sfx`: full add → drag → cancel → delete → regrab flow works, nothing throws, editor never wedges, zero console errors. +3 regression tests (254 total green). Root cause: missing `sfx.pop` + `-1` pointercancel id.

## 2026-07-16 — 🧹 Stability Sprint STAB-2
**Shipped:** Temporary zoom-out for big orbits / large bodies
**Commit:** `4d1f6fc`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Stability Sprint (July 2026)](../plans/black-hole-in-one-stability-sprint-july-2026.md), [Improvements](../../games/black-hole-in-one/ideas.md)

Second stability item. **Problem:** Explore's giant planets (r up to ~40) don't fit the normal one-screen scale — orbiting one, the planet fills the view and the orbit runs off-screen (*"when in orbit it should zoom out of a planet too big"*). **Fix** (decision **D2=b** — gentle temporary zoom-out while orbiting/hugging a large body, snap back after):

- `fitZoom()` (pure, in constants, unit-tested): scales the view so the focus span (orbit diameter, or a big body you're resting on) fills `ZOOM_FIT` of the smaller viewport dim, clamped to `[ZOOM_MIN,1]`. Returns **1 whenever the span already fits — always true for golf's small bodies**, so the golf one-screen/no-camera pillar is preserved automatically (verified in-browser: golf zoom == 1, identical framing).
- `ui.updateZoom()` eases `view.zoom` toward target each frame; `render()` applies it about the screen centre to the world layer only (stars stay at true scale); `toWorld()` inverts it so aiming stays accurate while zoomed.
- `explore.stepOrbit()` now centres the camera on the orbited body (not the comet on the rim) so the whole orbit is framed — also removes the MM-4 dizzy spin at its source.

Verified in-browser on a 375-wide viewport: a giant orbit settles to ~0.85 zoom with the full ring readable and margin on both sides; golf holes render identically at zoom 1. +2 tests (251 total green), smoke clean, zero console errors.

## 2026-07-16 — 🧹 Stability Sprint STAB-1
**Shipped:** Liftoff grace — big planets can no longer trap the comet
**Commit:** `044336a`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Stability Sprint (July 2026)](../plans/black-hole-in-one-stability-sprint-july-2026.md), [Improvements](../../games/black-hole-in-one/ideas.md)

First item of the stability sprint. **Root cause** (headless repro through the real physics pipeline): near a big planet the surface gravity exceeds a full flick, so a comet resting on it was dragged straight back and re-landed in place — a soft-lock. On the biggest generatable planet (r=15, escape velocity ≈103 vs `MAX_LAUNCH` 120), **68 of 192** sampled full-power flicks were instant re-captures (never got >6u off the surface).

**Fix** (decision **D1=C** — keep big planets, no size change, no new mechanic): a brief **liftoff grace** that damps *only the launch planet's* gravity for 0.35s after flicking off its surface, ramping back to full. Every other body's pull (the "gravity is the club" feel) is untouched; tee shots don't arm it. Instant re-captures dropped **68→15** on r=15 (residual = shots aimed straight into the planet body, which correctly land); all radially-outward full flicks now clear. `gravityAt`/`stepBody` gained an optional `{body,factor}` damp; the aim preview applies the same ramp so the drawn path stays honest. +3 regression tests (249 total green), verified in-browser through the real launch→stepFlight pipeline.

## 2026-07-15 (Part 10)
**Shipped:** URL Share Onboarding Flow (UI-4)
**Commit:** `dc47044`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Players arriving via a `?map=` URL are now shown the main how-to menu with dedicated "Play Shared Map" and "Ignore & Go to Main Menu" buttons, providing clear onboarding instead of immediately starting the map. Opening the menu from a custom map now properly displays the main game mode buttons to easily exit the map.

## 2026-07-15 (Part 9)
**Shipped:** Clearer Menu Button (UI-2) and Remove Redundant "New Run" (UI-3)
**Commit:** `7ab5bdd`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Fixed the P1 UI-2 and P2 UI-3 issues in Black Hole in One. The "?" help button has been replaced with a clear "☰ Menu" button, making it obvious how to return to mode selection. The redundant "New Run" button in the settings drawer has been removed to streamline the UI, since mode selection is handled by the main menu.

## 2026-07-15 (Part 8)
**Shipped:** HUD / Start Screen Overlap (UI-1)
**Commit:** `92db574`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Fixed the P1 UI-1 issue where the top gameplay HUD (`#bar`) was cluttered and overlapped with the menu on small screens. The HUD elements are now hidden when the start screen (`#howto`) is open, and dynamically restored to their correct states when gameplay begins or resumes.

## 2026-07-15 (Part 7)
**Shipped:** URL Map Import/Export Navigation (MM-10)
**Commit:** `87f2be2`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Added "Import from URL" to the My Maps drawer and added a Custom Map UI bar when playing a custom map via URL with a "Save to My Maps" button and a "Menu" button to return to the game mode select screen.

## 2026-07-15 (Part 6)
**Shipped:** Mobile Layout UI (MM-9)
**Commit:** `eae237b`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Fixed the mode buttons and editor toolbar getting cut off on narrow phone screens by allowing them to wrap and centering them.

## 2026-07-15 (Part 5)
**Shipped:** Mobile Map Maker Bug Fixes (MM-5, MM-8)
**Commit:** `3ec8254`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Fixed two critical map maker bugs for mobile devices:
1. **MM-5 Mobile Deletion**: Added a visual trash drop zone (`🗑️ Drag here to delete`) to the top of the editor. Dropping objects here deletes them, providing a reliable alternative to dragging off-screen on phones where screen edge gestures interfere.
2. **MM-8 Pulsar moving**: Fixed an issue where pulsars were impossible to drag on mobile by increasing their hit radius from ~7.8 up to 12.6 to match planet tappability.
## 2026-07-15 (Part 4)
**Shipped:** Global Orbit Camera Lock (MM-4)
**Commit:** `a8eeb68`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Improvements](../../games/black-hole-in-one/ideas.md)

Fixed the camera behavior in Explore mode so that it locks in place when the comet enters a stable orbit. Previously, the camera would continuously smooth-follow the comet during orbits, spinning in circles and causing dizziness.
## 2026-07-15 (Part 3)
**Shipped:** Map Maker (MM-2) — Local Saves
**Commit:** `ff95686`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Questionnaire](../questionnaires/black-hole-in-one-map-maker.md), [Improvements](../../games/black-hole-in-one/ideas.md)

Added the `localStorage` persistence layer with save slots for the Map Maker (`blackHoleInOne_myMaps`). A new "My Maps" drawer overlay allows saving the current map layout from the editor, loading a saved map to edit/test, renaming existing saves, and deleting maps. The drawer respects the Johnny.Decimal overlay styling conventions and uses a clean list UI. Hooked the key into the global clear-data command.

## 2026-07-15
**Shipped:** 🌌 Explore Mode (OW-1) + Seeded Sector Generation & Spatial Culling (OW-2)
**Commit:** `97bdf38`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md)

Implemented the first half of Sprint 1 (vertical slice). Added a new "Explore" mode to the start screen. In Explore mode, the camera smoothly follows the comet across a large, seeded sector populated deterministically with stars, giants, dwarfs, and binary pairs. To maintain performance (perf proof), implemented a chunk-bucketed spatial culling system where only bodies in a 3x3 chunk grid around the camera exert gravity and render. Reused the `physics.js` core. The mode allows unlimited free-fling without any cup pressure or par limits.

## 2026-07-15 (Part 2)
**Shipped:** Map Maker (MM-1) — The Editor Core
**Commit:** `6296f2b`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
**Context:** [Black Hole in One — Map Maker Questionnaire](../questionnaires/black-hole-in-one-map-maker.md)

Implemented the core drag-and-drop map maker. Added an "Editor" mode and an `#editorBar` to `index.html`. Created `editor.js` which manages editor state (dragging objects, adding planets/pulsars, restoring state). Hooked into `main.js` input system to intercept pointer events when in edit mode. You can drag the tee, cup, and celestial bodies around the map, delete bodies by dragging them off-screen, and seamlessly "Test Play" the layout through the physics engine. Test play state safely restores back to edit state after playing.
