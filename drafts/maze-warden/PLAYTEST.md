# Maze Warden — Playtest Notes

**Concept:** Maze-building tower defense (vault concept: [[Maze Warden — Concept & Directions]], design decisions: [[Maze Warden Questionnaire — Design Decisions]]). Your towers ARE the walls — where you place them shapes the shortest open route enemies must walk to your core. Endless escalating waves; core HP hits 0 → game over.

**Iteration 1 (2026-07-21):** core loop only — grid, towers-as-walls, BFS-validated placement, pathfinding, 2 tower types, gold economy, endless waves, core HP, restart. No meta-progression, no persistence.

**Iteration 2 (2026-07-21, same day — verdict was Keep):** per [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Maze Warden Questionnaire — Verdict & Direction|Maze Warden Questionnaire — Verdict & Direction]] Q7=A, plus two Q8 free-space fixes:

- **🔮 Mirror of the Warden — permanent upgrade tree.** Dying banks **Essence** (`floor(waveReached/2) + floor(kills/10)`, a flagged tuning knob), spent on 5 nodes, `localStorage`-persisted (`mazeWarden_meta`): 💰 Deep Pockets (+10 start gold/rank, next run), ❤️ Fortified Core (+3 start HP/rank, next run), 🔨 Cheap Walls (-10% tower cost/rank, immediate), ⚡ Overcharge (+15% tower dmg/rank, immediate), 🟡 Volt Coil unlock (a 3rd tower, immediate). 3 ranks each except Volt Coil (single unlock) — a minimal tree per the design questionnaire's Q10=A, adapted from Improvements.md's node list (dropped "draft re-roll" since no draft system exists this iteration; added Overcharge in its place for a direct "stronger every run" power feel). Accessible any time via the 🔮 topbar icon, or from the game-over screen.
- **Tower balance pass (Q4 flagged Spire/Prism as indistinguishable).** Spire pushed further into long-range single-target focus fire (range 1.7→2.1, dmg 4→5 at lvl 1); Prism pushed further into short-range crowd control (range 1.4→1.15, radius 0.95→1.25, slow 0.45→0.55, dmg lowered 5→4 to pay for it). Volt Coil (new, Mirror-unlocked) is a third archetype: cheap, short-range, very rapid low-damage chip damage — a distinct early-game/synergy role, not a reskin of the other two.
- **Auto-pause removed (Q8).** Iteration 1 auto-paused on blur/hidden/pagehide (Flow Glider precedent) — Yev's feedback: the run should keep going in the background; pause only via the explicit ⏸ button or opening a menu (help/Mirror).
- **Fixed the "can't build during a run" root cause (Q8).** Not actually phase-gated — `placeTower`/`upgradeTower`/`sellTower` never blocked on `phase==='wave'`. The real bug: the build/tower-action sheet's full-screen backdrop absorbed the *next* tap when switching to a different cell while a sheet was already open (closing the old sheet but eating the tap meant for the new cell), forcing a tap-to-close-then-tap-again pattern that felt like broken input, especially reacting fast mid-wave. Fixed by routing a backdrop tap that lands over the board straight into the same cell-selection handler instead of only closing.
- **Harness note:** the local preview pane doesn't deliver real `pointerdown` events to the canvas (`document.hidden` reads `true` even though the tab is frontmost — the same rAF-throttling artifact iteration 1 hit, not a game bug). Verified via a temporary debug hook driving `placeTower`/`upgradeTower`/`sellTower`/`triggerGameOver`/`buyNode` directly (removed before commit): mid-wave build/upgrade/sell all succeed, cost/damage scaling match the formulas above, essence awards and persists across reload, rank caps enforced. Visually confirmed the Mirror and updated game-over screen render correctly.

**Grid:** 8×14 square grid (portrait), chosen to closely match a phone's usable board-area aspect ratio (minimizes empty matte). Same board is centered/letterboxed on desktop — matches Black Hole in One's fixed-course-letterboxed-into-any-viewport precedent.

**Look/tech (Q9=D, abstract/neon geometric):** 2D canvas, dark void background with a subtle twinkling starfield, glowing neon shapes (no sprites/art dependency) — cyan diamond (Pulse Spire), violet triangle (Frost Prism), amber six-point spark (Volt Coil), amber→red enemies escalating by tier, a pulsing violet hexagon core. Tiny WebAudio synth blips for build/upgrade/sell/shoot/hit/death/leak/wave events — no audio assets.

## What this playtest should evaluate (iteration 2)

1. **Does the Mirror's "stronger every run" loop land?** Does spending Essence between runs feel meaningful, or too slow/fast to matter over a handful of runs?
2. **Do Spire vs. Prism feel meaningfully different now?** Long-range focus fire vs. short-range crowd control — is the tradeoff legible in actual placement decisions? Where does Volt Coil fit once unlocked?
3. **Does removing auto-pause and fixing the sheet-switching bug actually resolve the "can't build during a run" feeling?** Confirm on a real phone and laptop, not just this harness.
4. **Mobile vs. laptop parity** — unchanged from iteration 1, re-confirm it still holds with the new topbar icon and Mirror overlay.

**Tuning knobs flagged (numbers are first-guess, easy to retune):** base start gold 120, base start core HP 20, leak damage 1/enemy, wave enemy count `6 + 1.5n`, wave enemy HP `9 + 3.3n`, wave enemy speed `min(1.1 + 0.035n, 2.4)` cells/sec, kill reward `3 + floor(n/4)`, wave-clear bonus `10 + 2n`, tower costs 25/40/15g (spire/prism/volt), sell refund 60%, essence reward `floor(wave/2) + floor(kills/10)`, Mirror node costs (3 ranks) `[3,5,8]` or `[4,6,9]` essence, Volt Coil unlock 6 essence.

## Known simplifications / cut scope (still open)

No draft-1-of-3, no best-score/high-wave tracking, no hero ability, no Heat/Pact difficulty knob, no hex grid, no second enemy type (only tier-based color/size escalation), no lane offset for overlapping enemies on the same corridor, EN-only. Wall-migrates difficulty framing (design Q6 first half) still needs a real playtest read now that the tree exists. All captured in [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Improvements|Improvements]].

## Verdict line for the vault log

```
YYYY-MM-DD — maze-warden (iteration 2) — keep|meh|kill — <why>
```

Then fill the iteration-2 verdict questionnaire (to be created in the vault) — it decides iteration 3's direction (Heat knob, second enemy type, chambered runs, hex mode, theme pass, or further balance work).
