# Black Hole in One — Next Arc Questionnaire (July 18, 2026)

> **Status: ✅ ANSWERED & CONSUMED — 2026-07-18, archived same day.** Q1=A (orbit-attract replaces aim assist — OW-11 superseded, not retried), Q2=write-in (map landmarks + fast travel + editor minimap), Q3=A (landmarks are the map content; OW-6/7/8 stay parked). Consumed—together with four follow-up decisions from the planning chat (item ON by default · flick-at-planet guaranteed landing · refuel trickle + orbital collectibles · free fast travel to discovered black holes + Town)—by [Black Hole in One — Orbits & Star Map Build Plan (July 2026)](../../games/black-hole-in-one/plans/orbits-and-star-map.md). The editor-minimap half became **MM-16** (design-gated) in [Improvements](../../games/black-hole-in-one/ideas.md). Supersedes [Black Hole in One — Next Arc Questionnaire (July 2026)](black-hole-in-one-next-arc-july-2026.md) (fully consumed — its Sprint 2 pick is done).

**Where things stand:** Open World Sprint 2 (Richness) shipped in full on 2026-07-17 — Wave 1 (Shop Options Bleed fix, OW-3 wormhole→Town, OW-5 moons & rings) plus a same-day redirect straight to Wave 2's OW-9 (zoom-out star map). The same day, a separate side-quest — [Black Hole in One — Orbit Assist & Warp Mechanics Build Plan](../plans/black-hole-in-one-orbit-assist-and-warp-mechanics-build-plan.md) — shipped Phase 1 (OW-10: wild black holes now capture into orbit from afar) and then shipped-then-reverted Phase 2 (OW-11: Orbit Aim Assist / "Nav Computer" — grid-search performance problems and an unreliable "guaranteed orbit" guarantee). Full trail in the Dev Log. **No arc is currently chosen or in flight** — this questionnaire picks the next one and clears two loose threads.

## Q1. Orbit Aim Assist (OW-11) — retry, or drop it?

The Dev Log's revert note guesses a fix: *"try again in another session using a different mathematical approach — perhaps analytic orbit solving rather than brute-force simulation."* That's a guess made in the moment, not a commitment.

- [x] **A — Retry with a different approach** (analytic orbit solving instead of grid-search simulation, or write in another idea): like the black holes that go to town - I want an item that makes the orbit of objects the one that attracts. So the player can always get into orbit and then another flick to land on the planet itself ______
- [ ] **B — Drop it for good.** Orbits are already reachable and readable without assistance (BH-4's live orbits, OW-10's capture-from-afar); an aim-assist layer isn't worth a second attempt.
- [ ] **C — Haven't missed it in play — leave parked, revisit only if it comes up again naturally** *(default if left blank)*

## Q2. Which arc next?

Nothing is in flight. Candidates, roughly in the order they've been queued:

- [ ] **Style & Stats (BH-1 style stars, BH-2 session dashboard, BH-3 pulsar hint).** Needs re-scoping first — BH-2's original spec drew the dashboard into laptop letterbox margins that no longer exist since the world went full-screen responsive (Core Re-alignment, 2026-07-16). Small, zero gameplay-balance risk otherwise. Spec: [Black Hole in One — Style & Stats Sprint (July 2026)](../../games/black-hole-in-one/plans/style-and-stats-sprint.md).
- [ ] **Map Maker continuation** (MM-11 play maps without the editor, MM-12 playlists/multi-select, MM-13 custom-map HUD clarity, MM-6 size chooser, MM-7 map merging, MM-15 planet size options). Editor core is shipped and stable; these are the deferred niceties.
- [ ] **Open World Sprint 3 — Town & cosmetics.** Real town hub, stardust → comet/trail skins (cosmetics only, no power creep), beacons + fast-travel list, optional boost/metered-travel toggles. Per [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md).
- [ ] **Revive OW-6/7/8 (named regions, wormhole pairs, derelict loot)** — all three were parked, not declined, when Sprint 2 redirected to the star map. Ties directly into Q3 below if the map should show more.
- [ ] Something else — write in: i want the mini map show landmarks and allow fast travel. i also want the mini map to be used in making maps, so you can place landmarks and items. we need some way for this to work on multiple map sizes. could be a good time to add scrolling and zooming______

## Q3. "The map should show more things"

A raw inbox line — *"the map should show more things. maybe have an option to make it on the map"* — that predates or postdates OW-9 (the fog-of-war star map, shipped the same day) isn't clear from the note alone. Today the map shows only Town's marker and fog-of-war-charted chunks; nothing else.

- [x] **A — More map content is exactly OW-6/7/8's job** (named regions, wormhole-pair markers, derelict/artifact markers) — picking "Revive OW-6/7/8" in Q2 answers this too.
- [ ] **B — Something narrower first**, write in what the map should show that it doesn't: ______
- [ ] **C — The map is fine as-is; this was feedback on something else** (write in if you remember what): ______
- [ ] **D — Haven't looked at the map since OW-9 shipped — leave open, don't build anything until I have**

## Q4. Anything from real play you haven't written down yet?

The pattern of "drop a raw note, it gets triaged into a sprint" has worked well through the Fuel Economy and Open World arcs. Anything sitting in your head from playing the tuned build (Explore, golf, Map Maker, or the two orbit changes from OW-10) that hasn't made it into Improvements.md's Inbox yet?

- [ ] Nothing right now
- [ ] Write-in: ______

---

*When answered: the next Black Hole in One session applies Q1/Q2/Q3, logs the pick in the Dev Log, and archives this note to `docs/archive/`.*
