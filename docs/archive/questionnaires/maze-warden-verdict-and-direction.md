# Maze Warden Questionnaire — Verdict & Direction

> **Status: ANSWERED & ACTED ON — July 21, 2026.** Q1=Keep. Iteration 2 shipped same day: the 🔮 Mirror of the Warden meta-progression tree (Q7=A), a tower balance pass + Volt Coil as a 3rd archetype (Q4 flagged Spire/Prism as indistinguishable), auto-pause removed and the sheet-backdrop tap-through bug fixed (both from Q8 free space). Full detail: [Dev Log](../dev-logs/arcade.md)'s 2026-07-21 iteration 2 entry, `drafts/maze-warden/PLAYTEST.md`. Next round: [Maze Warden Questionnaire — Iteration 2 Verdict & Direction](maze-warden-iteration-2-verdict-and-direction.md) (open — fill after playing iteration 2).
>
> Original ask, for reference: fill after playing https://yevrap.github.io/KamekoStudio/drafts/maze-warden/ — try it on both your phone and laptop if you can, since that parity was a specific ask this iteration. Overview: [Maze Warden](../../games/maze-warden/README.md) · design history: [Maze Warden — Concept & Directions](../../games/maze-warden/plans/concept-and-directions.md) · cut-scope inbox: [Improvements](../../games/maze-warden/ideas.md).
>
> Reminder: iteration 1 was **core-loop-only, no meta-progression** — that was Yev's own scope call in chat, tighter than the design questionnaire's Q10. This questionnaire decided iteration 2 built that meta layer.

## Q1 — Verdict

- [x] **Keep** — the maze-building loop is fun on its own; move straight to iteration 2 (meta-progression)
- [ ] **Meh** — the core idea is worth another pass, but something below needs fixing first
- [ ] **Kill** — direction closed; stays in the Lab as a curio

Also log the one-liner in [Kameko Playtest Log](../../playtest-log.md):
`2026-MM-DD — maze-warden (draft) — keep|meh|kill — <why>`

## Q2 — Does "towers are walls" read as a maze puzzle?

- [x] **A. Yes** — shaping the corridor is the fun part, exactly the Underdark hook
- [ ] **B. Sort of** — fun once I got it, but the "path must stay open" rejection felt confusing at first (say what would've helped: a preview? clearer messaging?)
- [ ] **C. No** — it played more like generic tower placement; the maze-shaping didn't register as the point
- [ ] Notes:

## Q3 — Pacing for a 5–10 minute session 🔑

- [x] **A. About right** — waves ramp at a fair clip, a run naturally lands in the 5–10 min window
- [ ] **B. Too slow to start** — wave 1–2 drag, speed up the early ramp
- [ ] **C. Spikes too hard** — some wave feels like a cliff, not a ramp (say which wave if you noticed one)
- [ ] **D. Never got tough** — I could tank forever with basic play; steepen the endless scaling
- [ ] Notes on which of `waveEnemyCount`/`waveEnemyHp`/`waveEnemySpeed`/kill reward/wave-clear bonus/tower costs feels off, if you can tell:

## Q4 — Tower balance

- [ ] **A. Both matter** — real placement tradeoffs between Pulse Spire and Frost Prism
- [ ] **B. One dominates** — say which, and why (cost? range? damage?)
- [x] **C. Didn't notice a difference** — the two towers felt interchangeable
- [ ] Notes:

## Q5 — Does losing without any meta-progression feel like a dead end?

This is the sharpest question in this run — iteration 1 deliberately has no "stronger every run" hook yet.

- [ ] **A. No** — "just try again" still feels worth it; the core loop alone carries a run
- [x] **B. A little** — fine for a few tries, but it'd get old fast without the meta layer landing soon
- [ ] **C. Yes** — losing and restarting from zero already feels flat; the meta-progression isn't a nice-to-have, it's load-bearing — bump it to the very next thing built

## Q6 — Mobile vs. laptop parity 🔑

Same board, same difficulty, centered either way — the design bet from this iteration's scope call.

- [x] **A. Feels equally good on both** — the centered/letterboxed approach works, keep it for iteration 2
- [ ] **B. Better on one than the other** — say which and why (touch targets? tapping precision on laptop? something else?)
- [ ] **C. Want desktop to use the extra width** — revisit widening the desktop layout (the option not picked this iteration) instead of just centering
- [ ] Notes:

## Q7 — If Keep/Meh: what should iteration 2 build first?

- [x] **A. ⭐ The meta-progression tree** (Q5/Q6 from the design questionnaire — permanent upgrades, banked currency, next run starts stronger) — the original hook, go build it
- [ ] **B. Pacing/balance fixes first** — get the core loop feeling right before adding the meta layer on top of it
- [ ] **C. A second enemy type or more tower variety** — the maze feels right but combat needs more texture before meta
- [ ] Notes:

## Q8 — Free space

Anything the questions above don't cover — a specific moment that felt great or bad, a tower/enemy idea, a visual note, a hard "don't do this":

i don't like that it pauses when i loose focus. it should keep going unless i click to pause or use a menu

i want to be able to build and upgrade and sell towers mid round as the mods are going. now i can't build during the run and i need to click off of a tile and back on before i can add one