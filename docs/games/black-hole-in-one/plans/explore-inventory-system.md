# Black Hole in One — Explore Inventory System

> **Status (updated 2026-07-18): INV-1 and INV-2 shipped July 16 2026 (`6d4e1a5`, `5861d46`). INV-3a/b/c (the 🚀 Thruster, its own note) are all shipped and complete — see [Black Hole in One — Thruster & Flight Controls](../../../archive/plans/black-hole-in-one-thruster-and-flight-controls.md) in `docs/archive/` (fully consumed, archived 2026-07-18).** All four original open questions answered by Yev (verbatim in **Decisions** below); the answers cut the acquisition layer entirely and reframed the arc as a mechanic testbed. **Still open in this arc: INV-4 (🪝 cast-to-pull, design-gated) and INV-5 (⚡ Precision Thrusters, P3) — see the Slices list below.** Overview: [Black Hole in One](../README.md) · sibling system: [Black Hole in One — Explore Progression (Stardust Upgrades)](../../../archive/plans/black-hole-in-one-explore-progression-stardust-upgrades.md) (EXP-1, shipped complete, archived) · tracked as **INV-1…INV-5** in [Improvements](../ideas.md) · repo `games/black-hole-in-one/`.
>
> **⭐ INV-3 has its own note: [Black Hole in One — Thruster & Flight Controls](../../../archive/plans/black-hole-in-one-thruster-and-flight-controls.md).** Yev asked for a circle-controller flight scheme directly on July 16; it's big enough (new control scheme, new fuel model, new input surface, keyboard support) to warrant a self-contained spec rather than a slice bullet here. It reslotted the arc — the old INV-3 (⚡ Precision Thrusters) is now INV-5.
>
> **INV-1 implementation note:** the `ITEMS` registry ended up in `constants.js`, not `ui.js` as sketched below — `constants.js` is this game's existing "DOM-free, unit-tested" static-data module, so the registry can be unit-tested directly and `state.js` derives `S.inventory`'s defaults from it (`defaultInventory()`) instead of hand-duplicating the shape. `main.js` and (later) `ui.js` both import `ITEMS` from there. Everything else below matches what shipped.
>
> **Agents: this note is self-contained.** Architecture, file:line anchors, slice order, Done-when criteria, and the known gotchas are all below. Nothing here is blocked on Yev — build INV-1 first.

## ⚠️ Open question — Endless Flight behavior mismatch (reported July 16 2026, same day as ship)

Yev reported the toggle "doesn't seem to work," describing the expected behavior as: **ON sets fuel to 100% and stops it from depleting at all; OFF resumes normal fuel use.**

That is not what's built, and not what's in the Decisions table above. What shipped (and is unit-tested — `tests/explore.test.mjs`, `INV-1: shouldTowHome …`, 5 tests, all green) is narrower: **ON only skips the auto-teleport-home when the tank hits empty at rest.** Fuel still drains identically either way; `shouldTowHome()` (`explore.js:292-294`) never touches the fuel value itself, only whether `respawnTown()` fires. Confirmed the checkbox itself wires and persists correctly (verified live in-browser July 16), so this isn't a wiring bug — the shipped spec is just narrower than today's chat description of it.

Two ways to close this gap — **Yev's call, not an agent call, since it changes an already-decided mechanic:**

1. **Keep today's design as shipped.** No tow-back only; fuel still depletes and still gates pushing at 0. Matches the Decisions table verbatim (*"i want to have these items to test out more game mechanics"* — a fairness-preserving toggle, not a cheat). If this is right, the mismatch was just a description slip in chat, nothing to change.
2. **Widen the mechanic to a fuel-lock.** ON → fuel jumps to `tankMaxFuel(S.upgrades.tank)` and stops depleting entirely while enabled; OFF → resumes normal drain from wherever it is. This is a materially bigger item than what the Decisions table scoped — closer to a practice/god-mode toggle than "skip the teleport." Would need its own `ITEMS` desc text (current desc — *"Run dry and keep coasting — no tow back to Town"* — would no longer be accurate) and a spot in the Slices/testing notes above.

**Resolved 2026-07-16 (chat, `AskUserQuestion`): option 2, widen to a fuel-lock.** Shipped in `7b8304b` — `launch()` skips the fuel drain while the toggle is enabled, and a new `explore.refuelFull()` tops the tank off the instant it's switched on (called from the drawer checkbox handler in `main.js`). `shouldTowHome()`/`respawnTown()` are untouched and now effectively dead code paths while the toggle is on (fuel never reaches 0), but left in place as the correct fallback for the OFF state. `ITEMS` desc updated to *"Full tank, forever — fuel stops draining until you switch it off."* Root-cause writeup: [Dev Log](../../../archive/dev-logs/black-hole-in-one.md). **The Decisions table below is now superseded for Endless Flight specifically** — its acquisition/panel/roadmap answers still stand, only the mechanic itself widened.

## The reframe — what this actually is

The original pitch was an economy: buy items, find items, own them. **Yev's answers cut that.** Items start owned; there's no purchase and no discovery for now. What's left is the part he actually wants:

> *"i want to have these items to test out more game mechanics"*

**This is a mechanic testbed, not a progression system.** The inventory is a switchboard for experimental gameplay modifiers — flip one on, fly, see if it's fun. Its value is measured by how cheap it makes the *next* experiment, not by the first item. That single sentence should drive every design call in this arc: when in doubt, favor "adding item N+1 is one config entry + one hook" over anything else.

The buy/find layer isn't cancelled, just deferred — Yev: *"I think at some point it can be found in world or sold in the shop."* So the data model keeps an `owned` flag (defaulted true) rather than pretending ownership doesn't exist. That's the one piece of speculative generality worth paying for here, because retrofitting it later would reshape every call site.

## Decisions (Yev, July 16 2026 — verbatim, do not re-litigate)

| Question | Yev's answer |
|---|---|
| **Acquisition for Endless Flight** | *"I think at some point it can be found in world or sold in the shop. for now i want the items to be listed in the shop as already acquired. and for me to see the items in my inventory and be able to toggle them"* |
| **If found: guaranteed or random?** | *"skip for now"* |
| **Panel location** | *"settings drawer is fine"* |
| **Item roadmap beyond #1** | *"let's start with what we have already. we have flight, lets have an item for endless flight. maybe items that adjust how the push works. maybe an item makes you need to cast a special item that pulls you. i want to have these items to test out more game mechanics"* |

**What these lock in:**
- ❌ No purchase mechanic, no stardust cost, no pickup/discovery — **out of scope this arc.**
- ✅ Items default to `owned: true`; the Shop *lists* them as already acquired (Yev asked for this explicitly — it foreshadows the eventual buy path).
- ✅ Toggle lives in the shared settings drawer, reachable mid-run.
- ✅ Three named item directions: **Endless Flight**, **push modifiers**, **a cast-to-pull mechanic**.

## Architecture

**Explore-only, same as EXP-1.** Every item gates on `S.mode === 'explore'`. Endless and the golf modes stay bit-for-bit untouched — the established pillar from the Stardust Upgrades arc (their high-score runs must stay comparable session to session). The drawer's `when` option makes this free.

**The registry is the whole point.** `ui.js:698-730` already has the `UPGRADES` config array that `renderTownShop()` (`ui.js:742`) maps over with zero per-upgrade markup — the EXP-1b.5 refactor. The item registry is the same shape and lives beside it:

```js
// One entry per experimental mechanic. Adding item N+1 = one entry + one hook.
const ITEMS = [
    { key: 'endlessFlight', icon: '♾️', label: 'Endless Flight',
      desc: 'Run dry and keep coasting — no tow back to Town.' },
];
```

**State + persistence** — mirrors `blackHoleInOne_upgrades` exactly:
- `state.js:15` has `upgrades: { tank: 0, siphon: 0, sensor: 0 }`. Add alongside it:
  `inventory: { endlessFlight: { owned: true, enabled: false } }`
- New LS key `blackHoleInOne_inventory` in the `LS` map (`main.js:16-21`), saved via a helper mirroring `upgrades(u)` (`main.js:68`), loaded on boot mirroring `main.js:322-323`.
- **⚠️ Register the key in `clearAllGameData` — it lives OUTSIDE the game folder**, in `shared/settings.js:220-221`, next to `'blackHoleInOne_stardust', 'blackHoleInOne_upgrades'`. Easy to miss; EXP-1 got it right, match that.
- Load must be defensive: merge saved values over defaults (`Object.assign`-style, as `main.js:323` does) so a save written before a new item existed doesn't leave that item `undefined` at every call site.

**The drawer panel** — the drawer is a *shared arcade component*, not per-game markup:
```js
window.KamekoSettings.registerSection('black-hole-in-one-inventory', {
    title: () => '🎒 Inventory',
    when: () => S.mode === 'explore',     // Explore-only, free gating
    render(container) { /* map over ITEMS → checkbox rows */ },
});
```
- API contract at `shared/settings.js:325-333`. Sections are **re-rendered from scratch on every drawer open**, so checkbox state always reflects live game state — no manual refresh needed.
- Mirror the existing registration at `main.js:236-264` (`'black-hole-in-one-settings'`, the How-to-play / Sound / Freeze-aim section). The `Freeze mid-flight aim` checkbox at `main.js:246-261` is the **closest precedent for an item toggle** — read it first; it's the same shape (checkbox → mutate `S` → write LS).
- Register it as a **second section**, not more rows in the existing one — separate id, own `when`, and it keeps the Inventory out of the drawer entirely in golf/Endless.
- Opening the drawer pauses the game (`main.js:231-232`, `settingsOpened` → `S.paused = true`) and closing resumes, so mid-run toggling is already safe.

**Where each item hooks in** (`explore.js`, all DOM-free behind injected hooks — `explore.js:13-17`):

| Item | Hook site | Current behavior |
|---|---|---|
| ♾️ Endless Flight | `explore.js` `launch()` (drain skip) + `refuelFull()` (instant top-off, called from `main.js`'s checkbox handler) | **Widened 2026-07-16, see "Open question" above.** `launch()` skips `fuel -= 15` while enabled; the drawer checkbox calls `refuelFull()` on check. `shouldTowHome()`/`respawnTown()` (`explore.js:283-309`) are unchanged and remain the correct OFF-state behavior — teleports to `{50,85}`, refills the tank, toasts *"Empty tank! Towed back to town."* — but are now unreachable while the toggle is ON since fuel never hits 0. |
| ⚡ Push modifiers | `launch()`, `explore.js:182-209` | Impulse **adds** to current velocity (`:201-202`, `comet.vx += dx/len*speed`); flat `fuel -= 15` (`:191`); guard `if (fuel <= 0) return false` (`:183`) |
| 🪝 Cast-to-pull | new — no hook exists | See INV-4; needs a design pass first |

## Slices (agent-shippable, in order)

- [x] **INV-1 — P1 — Inventory registry + drawer panel + Endless Flight, end-to-end.** ✅ **Shipped 2026-07-16 (`6d4e1a5`).** The vertical slice: `ITEMS` config, `S.inventory` state, `blackHoleInOne_inventory` persistence (incl. `clearAllGameData`), the `when`-gated drawer section, and Endless Flight actually wired to `respawnTown()`. Enabled → running dry at rest no longer teleports home; the comet keeps coasting/falling under gravity and is pushable again once a fuel pickup lands. Disabled (the default) → today's tow-back, bit-for-bit. *Done when:* the 🎒 Inventory section appears in the drawer **only in Explore**; the Endless Flight checkbox flips, persists across reload, and survives Clear All Game Data by resetting to default; ON demonstrably skips the tow-back on an empty tank; OFF reproduces the current tow-back exactly; golf + Endless provably untouched; unit-tested per the testing note below; verified in-browser in both toggle positions.
- [x] **INV-2 — P1 — Shop lists items as already acquired.** ✅ **Shipped 2026-07-16 (`5861d46`).** Yev's explicit ask. `renderTownShop()` (`ui.js`) now renders each `ITEMS` entry as a `.ts-item` row ending in a read-only `<span class="ts-acquired">✅ Acquired</span>` — a `<span>`, not a disabled `<button class="ts-buy">`, so there's no click-listener path into `buyUpgrade()` at all (correctness by construction, not by relying on `disabled` blocking the click). New `.ts-acquired` CSS mirrors `.ts-buy:disabled`'s muted look; the three real upgrades' rows and buy buttons are untouched. `node --test` (280) + smoke green, no new pure logic to unit-test. Verified in-browser at Town: the Endless Flight row shows the chip; an interactive-element scan confirmed only the three `✨ 15` buy buttons are clickable in the shop. Deploy verified serving the change.
- **INV-3a/b/c — P1/P1/P2 — 🚀 Thruster: fly with a circle controller instead of pushing. → [Black Hole in One — Thruster & Flight Controls](../../../archive/plans/black-hole-in-one-thruster-and-flight-controls.md)** ⭐ **Reslotted 2026-07-16 — Yev asked for this directly** (*"Fly with circle controller not push. item that works with never running out of fuel as well as with metered fuel"*, plus arrow/WASD keys). It takes the INV-3 slot from ⚡ Precision Thrusters (now INV-5, below) because it's the far more informative experiment: it doesn't modify the push, it **replaces the entire control scheme** and asks whether Explore is a better game as a *flying* game than a flicking one. All ten design questions answered same day. The linked note is self-contained — architecture, tuning constants with rationale, file:line hooks, gotchas, Done-when criteria.
  - It is still the extension-point proof INV-3 was always meant to be: if the new `ITEMS` entry doesn't pick up state, persistence, the drawer panel, and the Shop's ✅ Acquired row with **zero** further plumbing, INV-1's abstraction is wrong and should be fixed there.
  - It forces the one refactor this arc was always going to need: **`burnFuel()`**, a single choke point for every fuel cost that respects the Endless Flight lock. That function is where Yev's *"works with never running out of fuel as well as with metered fuel"* actually lives — and it's what makes item N+1's fuel interaction free instead of special-cased.
- **INV-4 — P3 — 🪝 Cast-to-pull (tractor anchor). ⚠️ Still needs its own design pass — but INV-3 softened the gate.** Yev: *"maybe an item makes you need to cast a special item that pulls you."* This is **not a toggle** — it's a new mechanic with new state (an anchor), new rendering (the anchor + its beam), and, hardest, **a new input gesture**. The blocker was that today's canvas input is a single drag → aim → launch (`main.js:84-138`) with nothing to spare. **INV-3 changes that:** on a laptop, keyboard flight frees the mouse drag entirely, and with the Thruster on the drag becomes a *held* gesture, so tap-to-cast no longer collides. Anchor lifetime and pull-force are still unanswered. *Done when:* a short design note answers the input gesture, anchor lifetime, and pull-force model — **then** slice the build. Don't start until the Thruster has shipped and been played.
- **INV-5 — P3 — ⚡ Precision Thrusters (was INV-3, demoted 2026-07-16).** The push *replaces* velocity instead of adding to it (`explore.js:250-251`), i.e. the pre-BH-4 golf feel: momentum cancels, every push aims true. A one-line fork and still a real question for flick-Explore — but **narrower than it was**: it modifies the flick, which the Thruster replaces wholesale, so the two are mutually exclusive by construction. Same-family candidates: 🪶 cheaper-but-capped push (`fuel -= 5`, lower `MAX_LAUNCH`), 💨 Afterburner (raised `MAX_LAUNCH`). *Done when:* the item toggles independently of the others, ON gives absolute-aim pushes and OFF is today's additive impulse, golf's `game.launch()` untouched, unit-tested, verified in-browser. **Log the handling verdict in [Kameko Playtest Log](../../../playtest-log.md)** — this item exists to answer a design question, so the playtest note *is* the deliverable.

*Order rationale: INV-1 is the vertical slice that proves the whole pattern (registry → panel → persistence → real mechanic). INV-2 is small and closes Yev's explicit Shop ask. INV-3 is now the real test twice over — the extension-point proof *and* the biggest live design question in Explore; its own 3a slice is deliberately shaped to answer that question on a keyboard before any stick UI gets built. INV-4 is the ambitious one and is still design-gated. INV-5 is a cheap experiment whenever there's an hour spare.*

## Testing notes (read before writing INV-1's tests)

**`explore.js` has zero test coverage today** — `tests/black-hole-in-one.test.mjs` (555 lines, 43 tests) imports `constants.js`, `physics.js`, `state.js`, and `gameplay.js`, but never `explore.js`. It *is* importable (DOM-free, hooks injected via `setHooks()` at `explore.js:17`), so this is opportunity, not blocker.

**The gotcha:** `fuel` is module-level state (`explore.js:11`, `export let fuel = 100`) with **no exported setter**. A test can read `explore.fuel` through the live binding but can't set it — so "what happens at empty tank" can't be arranged directly. Draining it through 7× `launch()` (7 × 15 = 105 > 100) works but is a brittle, indirect test of the wrong thing.

**Recommended:** extract the decision into a small pure exported predicate and unit-test *that*, then assert the wiring in-browser:
```js
export function shouldTowHome(fuel, inventory) {
    return fuel <= 0 && !inventory.endlessFlight?.enabled;
}
```
`explore.js:283` becomes `if (S.phase === 'rest' && shouldTowHome(fuel, S.inventory)) respawnTown();`. This is exactly the pattern EXP-1 used and the arc's precedent — `orbitCapture()` and `fitZoom()` are pure, unit-tested, and their integration was verified in-browser. Follow it. Also unit-test the persistence round-trip (save → load → merge over defaults, including the unknown-key case above).

**Definition of done** is the studio standard: `node --test` green, pushed to main, GitHub Pages deploy verified serving the change. Per house rule, ship without pausing for plan approval — stop only for ambiguous scope or anything touching releases/accounts/money.

## Not in this pass

- **Buy / find acquisition** — explicitly deferred by Yev ("at some point"). The `owned` flag exists so this lands later without reshaping call sites; nothing else about it is designed.
- **Per-item stardust cost** — moot while nothing is purchasable. If it returns, reuse the existing `upgradeCost()` curve (15/35/60 ✨, `constants.js:84`) rather than inventing a second economy.
- **Consumable / timed items** — Yev's framing ("options that you can enable") is permanent-ownership-with-toggle. Not assumed in scope; flag if that reading is wrong.
- **Inventory for Endless or golf modes** — Explore-only, matching EXP-1's pillar. Don't widen it without a decision from Yev.
- **Item Magnetism / Orbital Collectibles** — still sitting in the Explore/Survival Polish backlog in [Improvements](../ideas.md) as always-on ideas. They're plausible future registry entries, but Yev said start with what we have — don't fold them in yet.
