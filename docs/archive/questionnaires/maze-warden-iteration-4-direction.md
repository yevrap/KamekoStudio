# Maze Warden Questionnaire — Iteration 4 Direction

> **Status: ANSWERED — July 21, 2026.** Q1 = **A**, three small individually-verdicted passes (iteration 4 = bugfix/wording, iteration 5 = second enemy type, iteration 6 = replayability/difficulty). Q2=A (help opens directly, no intermediate pause screen), Q3=A (cap build sheet to mobile width on desktop), Q4=A (rename "Mirror of the Warden" → "Upgrades"). Q5 — **all four enemy archetypes checked (A/B/C/D)**, with C (Breaker) starred; scoped iteration 5 to ship C first since it's the one that structurally answers "too easy," with A/B/D parked as a follow-on variety pass — flagged as an open question below since checking all four is ambiguous. Q6 = **A + C** (deepen the Mirror tree, retune late-game wave scaling) — B (best-wave tracking) and D (Heat/Pact knob) were left unchecked and stay parked. Full triage and the three iteration prompts are in [Improvements](../../games/maze-warden/ideas.md). Overview: [Maze Warden](../../games/maze-warden/README.md) · iteration 3 answers: [Maze Warden Questionnaire — Iteration 3 Verdict & Direction](maze-warden-iteration-3-verdict-and-direction.md).
>
> Reference numbers pulled from `drafts/maze-warden/PLAYTEST.md`: Essence per run = `floor(wave/2) + floor(kills/10)`. Mirror nodes cost `[3,5,8]` essence per rank (3 ranks each) for Deep Pockets/Fortified Core/Cheap Walls/Overcharge, plus 6 essence to unlock Volt Coil — **~70 essence to max the whole tree**, likely well under 10 runs. Wave scaling: enemy count `6+1.5n`, HP `9+3.3n`, speed `min(1.1+0.035n, 2.4)` cells/sec (capped). These numbers are almost certainly why the tree maxes out fast and the late game may be flattening rather than escalating.

## Q1 — How to sequence this

- [x] **A ⭐ Three small, individually-verdicted passes** — same tight-iteration approach as 1→2→3 (which all shipped the *same day*, so this isn't about slowing down): **(4)** a bugfix/wording pass — help modal, laptop layout, Mirror rename; **(5)** the second enemy type; **(6)** the replayability/difficulty pass — Mirror depth, scaling retune, best-wave tracking, maybe the Heat/Pact knob. Each gets its own quick playtest read before the next starts, so if something regresses you know exactly which change did it.
- [ ] **B — One bundled iteration 4** covering everything below in a single pass, like a bigger jam session.
- [ ] **C — Two passes**: bugfix/wording first (4), then bundle second-enemy-type + replayability together into (5).
- [ ] **Write-in:**

## Q2 — Help/pause modal fix

- [x] **A ⭐ Tapping ❓ pauses (if running) and opens the help content directly** — no intermediate "game paused, tap to resume" screen to dismiss first. Tapping anywhere on the backdrop closes the sheet (not just an explicit ✕) and resumes if the game had been running.
- [ ] **B — Same, but keep an explicit resume step** (don't let a backdrop tap both close *and* resume) — say why if you want this split.
- [ ] Also apply "tap backdrop to close" to the Mirror sheet and any other modal with the same click-off-then-back-on friction, for consistency across the game?
  - [ ] Yes, make it a standing pattern for all sheets/overlays
  - [ ] No, just the help modal
- [ ] Notes:

## Q3 — Laptop tower-picker width

- [x] **A ⭐ Cap the build sheet to the same width it uses on mobile** — a centered column, regardless of viewport. Most directly matches "should look closer to how it is on mobile."
- [ ] **B — Redesign as a compact horizontal bar across the top** instead of a bottom sheet — more desktop-native, but a bigger layout change.
- [ ] **C — Keep it a bottom sheet but just constrain max-width + padding** — lighter touch than A, less of a rebuild.
- [ ] **Write-in:**

## Q4 — Drop the "Mirror" naming

*Currently "🔮 Mirror of the Warden" — a fairly direct nod to Hades' "Mirror of Night." The rest of the game is abstract/neon-geometric (your own Q9 pick from the design questionnaire), so a plainer or more geometric name would also fit the existing look better, not just dodge the comparison.*

- [x] **A ⭐ Plain and lore-light: "Upgrades"** (icon ⬡ or ⚙️ instead of 🔮) — drops the fantasy/scrying framing entirely, matches the abstract look, reads unambiguously as "the permanent-progression menu" with zero borrowed lore.
- [ ] **B — "Warden's Cache"** (icon 💠) — keeps a light thematic name tied to your own Warden branding, no mirror/scrying imagery.
- [ ] **C — "Ascension"** (icon ✦) — power-growth framing, a common roguelite term, not Hades-specific.
- [ ] **D — Keep the concept, just restyle**: drop "of the Warden" and swap the 🔮 icon for something geometric, but keep calling it "Mirror" — if it's the crystal-ball/scrying *icon* that reads as Hades more than the word itself.
- [ ] **Write-in:**

## Q5 — Second enemy type

*All options keep the same wall/pathing rules — just a new stat profile and (for C) one new interaction.*

- [x] **A — Runner**: low HP, high speed. Punishes slow single-target play, rewards Volt Coil's rapid fire and Prism's slow. Smallest scope.
- [x] **B — Tank/Armored**: high HP, slow, resists Volt Coil's chip damage. Rewards Prism's splash+slow and Spire's focus fire. Same scope as A.
- [x] **C ⭐ Breaker**: if it's blocked from any path for a few seconds, it starts chipping down an adjacent player-built tower until either a path reopens or the tower falls. This is the one that actually answers "too easy" — right now a finished maze is a permanent safe solution you never have to revisit; a Breaker makes a static layout a liability again in the late game. Bigger scope: needs tower HP + a damaged-tower visual state.
- [x] **D — Splitter**: splits into 2 weaker copies on death. Punishes single-target-only builds, rewards AoE (Prism).
- [ ] **No preference — agent's call** (recommendation: A first if you want this shipped fast and safe; C if you want it to be the actual fix for "too easy," accepting more scope)
- [ ] Notes:

## Q6 — Difficulty & replayability (pick as many as you want — not mutually exclusive) 🔑

*This is the headline complaint. These four levers hit different parts of it — Yev's exact words were "maxed out pretty fast" (tree too shallow) AND "too easy... not a lot of replayability" (no lasting challenge or goal).*

- [x] **A ⭐ Deepen the Mirror tree** — raise rank caps (3→5+) and/or add 2-3 new nodes, so maxing out takes meaningfully more than a handful of runs. Directly targets "maxed out pretty fast."
- [ ] **B ⭐ Best-wave / best-run tracking** — persist and show "Best: wave N" on the topbar and game-over screen. Cheapest of the four to build, and gives you something to chase even after the tree is fully maxed — targets "not a lot of replayability" on its own.
- [x] **C — Retune late-game wave scaling** — the speed cap (2.4 cells/sec) and linear HP/count growth may be flattening rather than escalating late. Numbers-only, no new systems, easy to bundle with A.
- [ ] **D — Voluntary Heat/Pact knob** (flagged since the original design questionnaire, still deferred) — once you can clear runs reliably, choose to stack pre-run modifiers for a bigger Essence payout. Biggest scope here — a new pre-run screen — worth doing only after A–C land and you've re-tested whether it's still too easy.
- [ ] Notes:

## Q7 — Free space

Anything the above doesn't cover — a specific run that felt too easy, a tower/node idea, a hard "don't do this":

-

---

*Answers here scope iteration 4 (and 5/6 if you picked Q1=A). See [Improvements](../../games/maze-warden/ideas.md) for the rest of the still-open idea inbox — theme/art pass, hex grid, chambered runs — none of which this round touches unless you write one in above.*
