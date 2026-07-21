# Maze Warden — Playtest Notes

**Concept:** Maze-building tower defense (vault concept: [[Maze Warden — Concept & Directions]], design decisions: [[Maze Warden Questionnaire — Design Decisions]]). Your towers ARE the walls — where you place them shapes the shortest open route enemies must walk to your core. Endless escalating waves; core HP hits 0 → game over.

**Iteration 1 scope (Yev's call, 2026-07-21):** core loop only — grid, towers-as-walls, BFS-validated placement (can never fully seal the core), pathfinding, 2 tower types, gold economy, endless waves, core HP, restart. **No meta-progression yet** (no permanent tree, no cross-run currency, no persistence — every run starts from scratch). That's iteration 2, gated on this loop itself earning a keep/meh signal.

**Grid:** 8×14 square grid (portrait), chosen to closely match a phone's usable board-area aspect ratio (minimizes empty matte). Same board is centered/letterboxed on desktop (Yev's call) — matches Black Hole in One's fixed-course-letterboxed-into-any-viewport precedent.

**Pause story:** auto-pauses on tab/window blur, visibilitychange (hidden), and pagehide, with a "Paused" overlay (resume only via explicit tap — matches Flow Glider's pattern). Also a manual ⏸ button. The game is naturally pausable between waves (board fully at rest, no timer pressure to start the next wave).

**Look/tech (Q9=D, abstract/neon geometric):** 2D canvas, dark void background with a subtle twinkling starfield, glowing neon shapes (no sprites/art dependency) — cyan diamond (Pulse Spire), violet triangle (Frost Prism), amber→red enemies escalating by tier, a pulsing violet hexagon core. Tiny WebAudio synth blips for build/upgrade/sell/shoot/hit/death/leak/wave events — no audio assets.

## What this playtest should evaluate

1. **Does "towers are walls" read as a maze puzzle, not just a wall-off?** Is it satisfying to shape a long corridor, or does the seal-rejection ("🚧 Path must stay open") feel like a wall you keep bumping into rather than a creative constraint?
2. **Is the pacing right for a 5–10 minute session?** Wave 1 is deliberately soft (tuning knob flagged below); waves escalate via `waveEnemyCount`/`waveEnemyHp`/`waveEnemySpeed` — does the difficulty ramp feel fair, or does it spike/flatline? How many waves before it stops being fun without any meta help?
3. **Do the two tower types create real placement decisions?** Pulse Spire (single-target, long range) vs. Frost Prism (splash + slow, shorter range) — is the tradeoff legible, or does one obviously dominate?
4. **Mobile vs. laptop parity** — same board, same difficulty, centered either way. Does it feel equally comfortable to build/tap on a phone and to click on a laptop? Touch targets are ~45px cells.
5. **Is losing without any meta-progression a dead end, or does "just try again" still feel worth doing?** This tells us whether the core loop alone can carry a run, or whether the "stronger every run" hook (iteration 2) is load-bearing sooner than expected.

**Tuning knobs flagged (numbers are first-guess, easy to retune):** start gold 120, start core HP 20, leak damage 1/enemy, wave enemy count `6 + 1.5n`, wave enemy HP `9 + 3.3n`, wave enemy speed `min(1.1 + 0.035n, 2.4)` cells/sec, kill reward `3 + floor(n/4)`, wave-clear bonus `10 + 2n`, tower costs 25/40g, sell refund 60%.

## Known simplifications / cut scope (this iteration)

No meta-tree, no draft-1-of-3, no persistence/best-score (session-only, per the draft bar), no hero ability, no Heat/Pact difficulty knob, no hex grid, no second enemy type (only tier-based color/size escalation), no lane offset for overlapping enemies on the same corridor, EN-only. All captured in [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Improvements|Improvements]].

## Verdict line for the vault log

```
YYYY-MM-DD — maze-warden (draft) — keep|meh|kill — <why>
```

Then fill [[30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Maze Warden/Maze Warden Questionnaire — Verdict & Direction|Maze Warden Questionnaire — Verdict & Direction]] — it decides what iteration 2 builds (meta-tree shape, pacing fixes, or a kill).
