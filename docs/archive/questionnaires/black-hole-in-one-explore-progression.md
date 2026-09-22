# Black Hole in One — Explore Progression Questionnaire

> **Answered July 16, 2026.** Sensor reframe → ship it. Town identity → yes; capstone → no. Folded into [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md) and [Improvements](../../games/black-hole-in-one/ideas.md).

Two decisions surfaced in the July 16, 2026 design pass on [Black Hole in One — Explore Progression (Stardust Upgrades)](../plans/black-hole-in-one-explore-progression-stardust-upgrades.md), before EXP-1c/1d reuse the Town Shop panel. Answer inline.

## 1. Long-Range Sensor — reframe or hold?

The design doc's original Sensor upgrade was "render/warning distance for hazards (mines, gravity traps, moving asteroids)." Checked the code: none of that exists. `explore.js`/`physics.js` have no crash, damage, or hazard concept at all — bodies are gravity wells you land on or bounce off, nothing more. This doc's own "Not in this pass" section already parks "escalating hazards" as undecided future work, so EXP-1d as originally written can't ship against anything real.

Proposed reframe: Sensor increases the **active chunk load radius** in `updateActiveChunks()` (currently a fixed 3×3-chunk window around the camera). Higher tiers render bodies and pickups farther out before you reach them — earlier warning of a giant to route around, earlier sight of fuel/stardust to path toward. Keeps the "sensor" flavor and the +25/50/75% shape from the original table, ships against code that exists today.

- [x] **Ship the reframe** — Sensor = chunk load radius, as proposed above. EXP-1d goes ahead on the original schedule.
- [ ] **Wait for real hazards** — park EXP-1d until a hazard/danger system is separately designed and scoped, then revisit what Sensor reveals. (Leaves the shop at two items for now.)
- [ ] Other:

## 2. Town visual identity + completion capstone — in this arc, or later?

Two small additions surfaced but weren't committed:

- **Town visual identity** — the design doc's own "problem" section already flags Town as "a coordinate, not a place." Even with the shop panel now docking there, nothing distinguishes the tee rock visually from any other body in the sector. A small treatment (distinct glow/color, a bit of ambient decoration) would make flying home read as arriving somewhere.
- **Completion capstone** — a one-time toast/badge when all three upgrades hit L3 (330 stardust total spent), rewarding full mastery without new mechanical complexity.

Both are additive, don't block EXP-1c/1d, and are small enough to be a single EXP-1e slice if wanted.

- [ ] **Add both now** — scope as EXP-1e, ships after EXP-1c/1d.
- [x] **Add Town identity only** — skip the capstone for now.
- [ ] **Add capstone only** — skip Town identity for now.
- [ ] **Neither, not this arc** — keep the arc scoped to the three upgrades and revisit later.
- [ ] Other:

---
*Answered questionnaires get folded back into the design doc and [Improvements](../../games/black-hole-in-one/ideas.md) by whichever agent picks up the next slice.*
