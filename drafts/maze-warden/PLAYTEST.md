# Maze Warden — Playtest Notes

**Concept:** Maze-building tower defense (vault concept: [[Maze Warden — Concept & Directions]], design decisions: [[Maze Warden Questionnaire — Design Decisions]]). Your towers ARE the walls — where you place them shapes the shortest open route enemies must walk to your core. Endless escalating waves; core HP hits 0 → game over.

**Iteration 1 (2026-07-21):** core loop only — grid, towers-as-walls, BFS-validated placement, pathfinding, 2 tower types, gold economy, endless waves, core HP, restart. No meta-progression, no persistence.

**Iteration 2 (2026-07-21, same day — verdict was Keep):** per [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Maze Warden Questionnaire — Verdict & Direction|Maze Warden Questionnaire — Verdict & Direction]] Q7=A, plus two Q8 free-space fixes:

- **🔮 Mirror of the Warden — permanent upgrade tree.** Dying banks **Essence** (`floor(waveReached/2) + floor(kills/10)`, a flagged tuning knob), spent on 5 nodes, `localStorage`-persisted (`mazeWarden_meta`): 💰 Deep Pockets (+10 start gold/rank, next run), ❤️ Fortified Core (+3 start HP/rank, next run), 🔨 Cheap Walls (-10% tower cost/rank, immediate), ⚡ Overcharge (+15% tower dmg/rank, immediate), 🟡 Volt Coil unlock (a 3rd tower, immediate). 3 ranks each except Volt Coil (single unlock) — a minimal tree per the design questionnaire's Q10=A, adapted from Improvements.md's node list (dropped "draft re-roll" since no draft system exists this iteration; added Overcharge in its place for a direct "stronger every run" power feel). Accessible any time via the 🔮 topbar icon, or from the game-over screen.
- **Tower balance pass (Q4 flagged Spire/Prism as indistinguishable).** Spire pushed further into long-range single-target focus fire (range 1.7→2.1, dmg 4→5 at lvl 1); Prism pushed further into short-range crowd control (range 1.4→1.15, radius 0.95→1.25, slow 0.45→0.55, dmg lowered 5→4 to pay for it). Volt Coil (new, Mirror-unlocked) is a third archetype: cheap, short-range, very rapid low-damage chip damage — a distinct early-game/synergy role, not a reskin of the other two.
- **Auto-pause removed (Q8).** Iteration 1 auto-paused on blur/hidden/pagehide (Flow Glider precedent) — Yev's feedback: the run should keep going in the background; pause only via the explicit ⏸ button or opening a menu (help/Mirror).
- **Fixed the "can't build during a run" root cause (Q8).** Not actually phase-gated — `placeTower`/`upgradeTower`/`sellTower` never blocked on `phase==='wave'`. The real bug: the build/tower-action sheet's full-screen backdrop absorbed the *next* tap when switching to a different cell while a sheet was already open (closing the old sheet but eating the tap meant for the new cell), forcing a tap-to-close-then-tap-again pattern that felt like broken input, especially reacting fast mid-wave. Fixed by routing a backdrop tap that lands over the board straight into the same cell-selection handler instead of only closing.
- **Harness note:** the local preview pane doesn't deliver real `pointerdown` events to the canvas (`document.hidden` reads `true` even though the tab is frontmost — the same rAF-throttling artifact iteration 1 hit, not a game bug). Verified via a temporary debug hook driving `placeTower`/`upgradeTower`/`sellTower`/`triggerGameOver`/`buyNode` directly (removed before commit): mid-wave build/upgrade/sell all succeed, cost/damage scaling match the formulas above, essence awards and persists across reload, rank caps enforced. Visually confirmed the Mirror and updated game-over screen render correctly.

**Iteration 3 (2026-07-21, same day — verdict was Keep):** per [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Maze Warden Questionnaire — Iteration 2 Verdict & Direction|Maze Warden Questionnaire — Iteration 2 Verdict & Direction]], a legibility/UI-polish pass — Yev's own words: "more industry standard polish and patterns that make it easy to understand what is going on, it feels a bit wordy." The Q5 picks (second enemy type, further Mirror/balance tuning) stay queued for a later iteration per the vault's tight-iteration convention; this pass is scoped to presentation only, no economy/combat numbers changed.

- **Game speed toggle (0.5x/1x/2x/3x).** Directly answers Yev's Q6 free-space ask ("a speed setting so I can speed up or slow down the mobs"). Topbar icon cycles through `SPEED_LEVELS`, persisted in `localStorage` (`mazeWarden_speed`). Scales the simulation `dt` uniformly (enemies, towers, projectiles, particle/animation timing) — a standard Bloons TD/Kingdom Rush-style fast-forward pattern.
- **Locked-tower discoverability (Volt Coil).** Q3 free-text flagged "I don't see the new tower type" — not a bug: Volt Coil is Mirror-gated and iteration 2 simply omitted it from the build sheet until unlocked, which read as broken/missing rather than "not yet". Iteration 3 always lists it, greyed out with a 🔒 lock icon and a direct "Unlock in the 🔮 Mirror" hint; tapping it shows a toast instead of silently doing nothing. The howto overlay's tower legend is now rendered from `TOWER_DEFS` at open time (single source of truth) and reflects the same locked/unlocked state live.
- **Range-ring preview on tapped towers.** Selecting a built tower (opening its action sheet) now draws a dashed range ring on the board in the tower's own color — the classic "what can this actually hit" TD legibility pattern, previously absent (flagged in Improvements.md as a future cheap addition).
- **Wave-progress bar replaces the ambiguous "N + M left" text.** The old `waveStatusText` read "Wave 3 in progress — 2 + 5 left" (alive vs. queued split that isn't a meaningful distinction to a player). Now a slim progress bar (resolved/total this wave) plus a single "👾 N left" remaining count — computed from the existing `waveEnemyCount(wave)` formula, no new state needed.
- **Copy trim across the board.** Howto overlay collapsed from a paragraph + 3-sentence bullet list to 2 short bullets + 1 status bullet; tower sheet descriptions shortened (e.g. "Single target, long range, high focus-fire damage" → "Long range, single target"); Mirror node descriptions dropped the repeated "— applies immediately" / "— starting next run" suffix on every row in favor of a single compact "NOW" / "NEXT RUN" badge next to the node name.

**Grid:** 8×14 square grid (portrait), chosen to closely match a phone's usable board-area aspect ratio (minimizes empty matte). Same board is centered/letterboxed on desktop — matches Black Hole in One's fixed-course-letterboxed-into-any-viewport precedent.

**Look/tech (Q9=D, abstract/neon geometric):** 2D canvas, dark void background with a subtle twinkling starfield, glowing neon shapes (no sprites/art dependency) — cyan diamond (Pulse Spire), violet triangle (Frost Prism), amber six-point spark (Volt Coil), amber→red enemies escalating by tier, a pulsing violet hexagon core. Tiny WebAudio synth blips for build/upgrade/sell/shoot/hit/death/leak/wave events — no audio assets.

## What this playtest should evaluate (iteration 3)

1. **Does the game read more clearly now?** Less wordy, easier to tell what's going on at a glance — the actual ask this iteration was scoped to.
2. **Does the speed toggle solve the "stuck waiting" complaint?** Try 2x/3x during a wave and 0.5x if you want to watch combat more closely.
3. **Is the locked Volt Coil slot clear now?** Does seeing it greyed-out with a lock read as "not unlocked yet" rather than "broken"?
4. **Is the range ring useful, or does it get in the way?** Shown only when a built tower's action sheet is open.
5. **Mobile vs. laptop parity** — re-confirm the wave-progress bar and speed button both read fine on a phone.

### Evaluated in iteration 2 (carried context, not re-asked)

1. Does the Mirror's "stronger every run" loop land? — answered Q2=A (yes) in the iteration 2 verdict questionnaire.
2. Do Spire vs. Prism feel meaningfully different now? — answered (yes, better differentiated); Volt Coil visibility was the open thread, addressed above.
3. Does removing auto-pause and fixing the sheet-switching bug resolve "can't build during a run"? — answered Q4=A (yes).

**Tuning knobs flagged (numbers are first-guess, easy to retune):** base start gold 120, base start core HP 20, leak damage 1/enemy, wave enemy count `6 + 1.5n`, wave enemy HP `9 + 3.3n`, wave enemy speed `min(1.1 + 0.035n, 2.4)` cells/sec, kill reward `3 + floor(n/4)`, wave-clear bonus `10 + 2n`, tower costs 25/40/15g (spire/prism/volt), sell refund 60%, essence reward `floor(wave/2) + floor(kills/10)`, Mirror node costs (3 ranks) `[3,5,8]` or `[4,6,9]` essence, Volt Coil unlock 6 essence.

## Known simplifications / cut scope (still open)

No draft-1-of-3, no best-score/high-wave tracking, no hero ability, no Heat/Pact difficulty knob, no hex grid, no second enemy type (only tier-based color/size escalation), no lane offset for overlapping enemies on the same corridor, EN-only. Wall-migrates difficulty framing (design Q6 first half) still needs a real playtest read now that the tree exists. Range-ring preview is shown only for already-built towers, not while choosing what to build in the build sheet (would need a hover/preview interaction model, deferred). All captured in [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Improvements|Improvements]].

## Verdict line for the vault log

```
YYYY-MM-DD — maze-warden (iteration 3) — keep|meh|kill — <why>
```

Then fill the iteration-3 verdict questionnaire (to be created in the vault) — it decides iteration 4's direction (the deferred Q5 picks — second enemy type, further Mirror/balance tuning — plus a Heat knob, chambered runs, hex mode, or theme pass).
