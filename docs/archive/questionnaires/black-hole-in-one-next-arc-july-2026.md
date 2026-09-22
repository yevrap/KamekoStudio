# Black Hole in One — Next Arc Questionnaire (July 2026)

> **Status: ANSWERED & CONSUMED — 2026-07-17.** Q1–Q4 below turned into the **Open World Sprint 2 (Richness)** plan: [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md) (full item specs, Wave 1/Wave 2 split) · backlog checklist: [Improvements](../../games/black-hole-in-one/ideas.md) · overview: [Black Hole in One](../../games/black-hole-in-one/README.md). Kept here as the decision record — don't re-answer.

**Where things stand:** the ⛽ Fuel Economy & Thruster Feel sprint (FUEL-1, INV-3c, FUEL-2) shipped and closed 2026-07-17. The Core Re-alignment items from the July 16 Next Steps questionnaire were reconciled the same cleanup pass — 9-hole removal and the full-screen responsive world were both already live, just never checked off. One genuine bug turned up during that reconciliation (Q3 below). The feature freeze from the July 16 stability sprint has been lifted since that day; nothing is currently blocking new work, but no arc has been chosen since Open World Sprint 1 / the Inventory-Thruster-Fuel line finished.

## Q1. The flying-vs-flicking verdict — confirm or override

[Kameko Playtest Log](../../playtest-log.md) has an entry from 2026-07-17: *"now that INV-3c/FUEL-1/FUEL-2 are all shipped, Explore reads better as a flying game than a flicking game."* That's **agent-observed on the tuned build, not a real play session** — it was explicitly flagged for you to confirm or override.

- [ ] **Confirm — flying is the better identity for Explore** *(default if left blank)*
- [ ] Override — flicking (Thruster off) is still what I want Explore to be
- [x] Both have a place, no single verdict needed — write-in on how they should coexist: items modify game play. it's fine that clicking is the default for now.
- [ ] Haven't played it yet — leave open, don't build anything off this verdict until I have

## Q2. Which arc next?

Freeze is lifted, nothing is currently in flight. Candidates, in the order they're queued in Improvements.md:

- [ ] **Style & Stats** — ⭐ style stars (BH-1) + session dashboard (BH-2). **Needs re-scoping first**: BH-2's original spec draws the dashboard into the laptop letterbox margins, but those margins no longer exist since the world went full-screen responsive. Small, zero gameplay-balance risk otherwise.
- [ ] **Map Maker continuation** — MM-11 (play maps directly, no editor), MM-12 (playlists/multi-select), MM-13 (custom-map HUD clarity), MM-6 (size chooser), MM-7 (map merging). Editor already shipped and stable; these are the deferred niceties.
- [x] **Open World Sprint 2 ("richness")** — moons/rings, wormhole pairs, drifters, derelict/artifact loot, a zoom-out star map, named regions. Builds on the Explore sector-streaming architecture, which is already proven.
- [ ] Something else — write in:

**A note on OW-3/OW-4, in case that changes your answer:** the original [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md) still lists **OW-3** (dive into a black hole → minimal Town → return portal) and **OW-4** (seeded stardust pickups) as the next unchecked items in Sprint 1. But both arrived anyway, through a different path than spec'd: Town is reached by landing on the tee rock (not by diving into a black hole), and stardust pickups already exist and already spend at the Town Shop (shipped as EXP-1). If you pick Open World above, worth deciding explicitly whether OW-3's wormhole-dive entrance is still wanted as an *additional* way into Town, or whether the tee-rock version fully supersedes it and OW-3/OW-4 should just be marked done-differently and dropped from the plan.
- [x] OW-3's wormhole-dive entrance is still wanted, on top of the tee-rock Town
- [ ] **Tee-rock Town + existing stardust supersede OW-3/OW-4 — mark them done-differently, drop from the plan** *(default)*

## Q3. The Shop Options Bleed bug — fix now or bundle later?

Found live during this cleanup's verification pass (not fixed yet): opening the ☰ menu while the Town Shop panel is open in Explore leaves the shop UI visibly bled over the menu. `ui.showHowto()` hides every other bar except `#townShop`. One-line fix.

- [ ] **Fix it now as a standalone dev-fix, don't wait for the next arc** *(default — it's small and it's a real visible bug)*
- [x] Bundle it into whichever arc Q2 picks
- [ ] Not worth fixing — write in why:

## Q4. Anything from real play you haven't written down yet?

The last four Inbox lines you added turned into the whole Fuel Economy sprint — that pattern (drop raw notes, they get triaged into a sprint) is working. Anything sitting in your head from playing the tuned build that hasn't made it into Improvements.md's Inbox yet?

- [x] Nothing right now
- [ ] Write-in:
