# Black Hole in One — Explore Progression (Stardust Upgrades)

> **Status: DECIDED July 16, 2026.** Yev picked **Open World / Explore longevity** as the next arc to work on, and **meta-progression via stardust** as the shape for the Inbox note "ways to make explore last longer, roguelike." Overview: [Black Hole in One](../../games/black-hole-in-one/README.md) · consumes the Inbox line, tracked as **EXP-1** in [Improvements](../../games/black-hole-in-one/ideas.md) · repo `games/black-hole-in-one/`.
>
> **Design pass, July 16, 2026 (post EXP-1b):** resolved the Fuel Tank fill question, found that EXP-1d's premise doesn't match the shipped code, and scoped the shop-panel work needed before EXP-1c/1d land. See "Design pass" section below.
>
> **Questionnaire answered, July 16, 2026:** [Black Hole in One — Explore Progression Questionnaire](../questionnaires/black-hole-in-one-explore-progression.md) — Sensor reframe **confirmed** (EXP-1d proceeds as the chunk-radius version); Town visual identity **confirmed** as EXP-1e, capstone **declined**. Both folded into the slices and table below — nothing left blocked in this arc.
>
> **EXP-1c and EXP-1d shipped, July 16, 2026 (`e4a64da`).** All three Town Shop upgrades (Fuel Tank, Fuel Siphon, Long-Range Sensor) are now live.
>
> **EXP-1e shipped, July 16, 2026 (`3826adf`) — arc complete.** The Town tee rock now has a distinct warm-glow visual identity. All five slices (a, b, b.5, c, d, e) are shipped — nothing open in this arc.

## The problem

Two things ship without a purpose right now:
- **Stardust is a counter with nothing to spend it on.** `S.stardust` (state.js) increments on pickup but is **session-only — it resets on reload**, despite the Dev Log describing it as persisting. There's no shop, no sink.
- **Town is a coordinate, not a place.** `explore.js` `respawnTown()` just teleports the comet back to `{50, 85}` (the tee rock) with a toast and a full tank. Nothing distinguishes it visually or interactively from anywhere else in the sector.

Net effect: Explore currently has no reason to go home, and no reason to keep flying longer than you feel like. That's the "roguelike longevity" gap Yev's inbox note flagged.

## The design

**Persist the wallet, then give it a shop.** Three permanent upgrades, bought at Town with stardust, scoped to **Explore only** — Endless keeps its fuel system untouched so its high-score runs stay comparable session to session (a maxed-out player shouldn't trivially outlast a fresh one on the same leaderboard). This mirrors the Style & Stats sprint's "golf stays pure" precedent.

| Upgrade | What it does | L0 (default) | L1 | L2 | L3 |
|---|---|---|---|---|---|
| **Fuel Tank** | Max fuel capacity | 100 | 130 | 160 | 200 |
| **Fuel Siphon** | Fuel gained per pickup | +20 | +28 | +36 | +45 |
| **Long-Range Sensor** | Active-chunk load radius (reframed from the original hazard-visibility framing, confirmed by Yev July 16) | current default (3×3 chunks) | +25% | +50% | +75% |

Cost curve (shared across all three, tune in build): **15 / 35 / 60 ✨** for L1/L2/L3.

**Town becomes a lightweight shop, not a screen redesign.** No new scene — when the comet is at rest at the Town coordinate, a small panel/button appears (reuse the existing HUD/drawer patterns, not a new UI system) showing the stardust balance and the three upgrades with their next tier and cost. Buying deducts stardust and persists the new level immediately.

**Persistence:**
- `blackHoleInOne_stardust` — integer, the wallet. Currently missing entirely; must be added.
- `blackHoleInOne_upgrades` — JSON `{tank: 0, siphon: 0, sensor: 0}`.
- Both registered in `clearAllGameData`.

**Read paths to change:** `explore.js`'s hardcoded `fuel = 100` (initial + respawn) becomes `100 + tankBonus(level)`; the `+20` pickup gain in both `gameplay.js` and `explore.js` (Explore's copy only) becomes `siphonAmount(level)`; hazard visibility/render distance in `explore.js`'s chunk/culling logic gains a sensor-level multiplier.

## Shippable slices (agent-shippable, in order)

- **EXP-1a — P1 — Persist the stardust wallet.** ✅ **Shipped 2026-07-16 (`38f830e`).** Load `blackHoleInOne_stardust` on boot, save on every change, register in `clearAllGameData`. No UI yet — this just stops the counter lying about persisting. *Done when:* collect stardust, reload the page, the total is unchanged; Clear All Game Data zeroes it; unit test on the load/save round-trip.
- **EXP-1b — P1 — Town Shop UI + Fuel Tank upgrade.** ✅ **Shipped 2026-07-16 (`5c036d1`).** Bottom-sheet panel appears while resting at Town (reuses the editor/custom-map bar chrome). Shows balance + Fuel Tank's next tier/cost; purchase deducts stardust, persists the level, and adds the capacity delta to current fuel (see [Improvements](../../games/black-hole-in-one/ideas.md) for the flagged judgment call on full-refill-vs-delta). *Done when:* buying at Town raises max fuel in Explore and persists after reload; can't buy below cost or past L3; Endless and golf fuel/scoring are provably untouched; verified in-browser. — **all met.**
- **EXP-1b.5 — P1 — Data-drive the shop panel.** ✅ **Shipped 2026-07-16 (`42fe8f2`).** `renderTownShop()` now maps over a small `UPGRADES` config (key, icon, label, `desc(level, maxed)`) — one `.ts-item` per entry, same markup/CSS, buy buttons wired via a delegated `data-upgrade` handler instead of a per-upgrade hardcoded id. *Done when:* Fuel Tank still renders and purchases identically through the new config path; adding a second config entry (test stub is fine) produces a second `.ts-item` with no HTML duplication. — **both met**, verified in-browser locally and on the deployed site.
- **EXP-1c — P2 — Fuel Siphon upgrade.** ✅ **Shipped 2026-07-16 (`e4a64da`).** Second shop item, via the EXP-1b.5 config (+20→28→36→45 fuel per pickup, `siphonGain()` in `constants.js`). `explore.js` line ~241's flat `+20` now scales with tier; Endless's own gain in `gameplay.js` stays untouched. *Done when:* pickup fuel value scales with the purchased tier, persists, purchasable alongside Fuel Tank. — **met**, +2 unit tests, verified in-browser.
- **EXP-1d — P2 — Long-Range Sensor upgrade, reframed. Confirmed by Yev July 16 — clear to build.** ✅ **Shipped 2026-07-16 (`e4a64da`).** The original "hazard render/warning distance" framing had no target (no mines/traps/hazards exist anywhere in the code); shipped instead as active-chunk radius. Sensor increases the **active chunk radius** in `updateActiveChunks()` (`explore.js`), currently a fixed 3×3-chunk window (`CHUNK_SIZE=400`) around the camera. A higher tier loads/renders bodies and pickups farther out — earlier sight of a giant to route around, earlier sight of fuel/stardust to path toward. **Implementation note:** the +25/50/75% framing above doesn't map onto whole chunks (radius is the loading granularity and must be an integer) — literal rounding produced two dead tiers (L1 = L0, L3 = L2: stardust spent for zero effect), caught by testing before shipping. Shipped instead as radius `1→2→3→4` (one full extra ring per tier, `sensorChunkRadius()`), so every tier is a distinct, verified improvement — measured 38→103→199→318 loaded bodies across L0-L3 in-browser. Buying while resting at Town forces an immediate chunk reload (the load loop only otherwise recomputes on a chunk crossing). *Done when:* active-chunk radius scales with tier, persists, purchasable alongside the other two, verified by observing bodies/pickups appear at a greater camera distance at higher tiers. — **met**, +2 unit tests.
- **EXP-1e — P3 — Town visual identity. Confirmed by Yev July 16 (capstone idea declined — not building that).** ✅ **Shipped 2026-07-16 (`3826adf`).** Give the Town tee rock a distinct look so arriving reads as a place, not a coordinate the shop panel happens to pop up at — shipped as a pulsing warm-gold radial halo plus a thin ring at the rock's surface in `drawTee()` (`ui.js`), gated on `S.mode === 'explore'` so golf/editor tees (same function, same `'tee'` type, a fresh spot every hole) stay plain. Visible whether or not the shop panel is open. Purely visual, no new state or persistence, no dependency on EXP-1b.5/1c/1d. *Done when:* the tee rock is visually distinguishable from other bodies in the sector at a glance, in both light passes over the sector (arriving fresh and returning later). — **met**, verified in-browser (comet moved off the rock to isolate the tee's own appearance from its pre-existing glow; Explore's Town clearly stands out, Endless's tee unchanged).

*Recommended order: EXP-1a unblocks everything (nothing is worth buying if it can't be kept) → EXP-1b proves the shop UI end-to-end with the upgrade Yev is most likely to feel immediately → EXP-1b.5 pays down the shop-panel debt once, before duplicating it → EXP-1c and EXP-1d both ship clean off that config, in either order → EXP-1e is independent and can slot in anywhere (including in parallel).*

## Design pass — July 16, 2026

**Fuel Tank fill policy: confirmed as delta, not top-off — no code change.** The flagged judgment call (EXP-1b added the capacity delta to current fuel rather than refilling to full) turns out to matter less than it looks, and the reason to keep it is stronger once EXP-1c/1d are in view:
- Emptying the tank already gives a **free full refuel** via `respawnTown()`'s auto-tow — that's the game's existing safety net. Most Town visits happen this way, and arriving full means delta-vs-top-off produces the *identical* result (old max + delta = new max exactly). The distinction only shows up when a player deliberately flies home to shop while fuel remains — a smaller, more deliberate slice of play.
- Once Fuel Siphon and Sensor ship, a blanket "any purchase tops off the tank" policy would make buying whichever upgrade is *cheapest* — regardless of what it actually does — the correct move any time you're low on fuel and near Town. That decouples refueling from cost entirely and flattens the resource-management tension this whole arc exists to create.
- Siphon and Sensor don't touch fuel capacity at all, so there's no equivalent "top off" question for them — the policy is simply *Fuel Tank purchases add their capacity delta to current fuel; nothing else affects fuel.* Nothing to reconcile before EXP-1c/1d ship.

**Balance note (not a blocker, flag for playtest once EXP-1c ships):** a fully maxed Tank (100→200, 2×) stacked with a fully maxed Siphon (+20→+45 per pickup, 2.25×) compounds to roughly **4.5× effective range** over a fresh save. That's a large late-game power curve for a 330-stardust full-mastery cost. Worth a feel-check once both are live, not a redesign now — the shared 15/35/60 cost curve already gives room to retune per-upgrade if one stat ends up dominating.

**Two ideas surfaced, both decided July 16, 2026:** Town visual identity is confirmed and scoped as **EXP-1e** above; the completion-capstone idea is declined — not building it this arc.

## Not in this pass (parked, revisit after the above lands)
- **Escalating hazards with distance/time** and **real stakes on hazard collision** — both considered in the same decision round, not picked. Could layer on top later if the shop alone doesn't make Explore feel long enough; would need its own scoping pass, not assumed here.
- **Stardust spend as cosmetics** (Open World Build Plan's original Sprint 3) — superseded in priority by the upgrade shop; revisit if Yev wants a look-based sink too.
- **OW-3's original wormhole-dive-to-warp mechanic** — the simpler auto-tow-on-empty-fuel already covers "getting home." A deliberate dive-in mechanic stays parked unless it turns out to matter once the shop exists.
