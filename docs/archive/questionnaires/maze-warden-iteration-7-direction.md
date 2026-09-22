# Maze Warden Questionnaire — Iteration 7 Direction

> **Status: ANSWERED — July 21, 2026.** Q1=**C** (both the gold ceiling and the "solved maze, nothing left to think about" problem contribute roughly equally). Q2=**A ⭐** (escalating tower cost "inflation" — the leanest single fix: one new run-scoped counter, no new UI). Q3=**A ⭐** (ship the gold-sink fix *alone* first, get a fresh playtest read, decide separately whether the "solved maze" half needs its own follow-up — iteration 7 does **not** touch maze-engagement or Bomber tuning beyond the bugfix below). Q4 free space ("seems like the bombing doesn't happen...") got clarified in chat the same day: not a spawn-rate complaint — Yev isn't confident he can visually pick a Bomber out of a busy board, and critically, **towers don't appear to take damage when a Bomber does detonate**, which is a real bug, not a subjective read. Decision (chat, July 21): bundle that bugfix into iteration 7 alongside the gold-sink fix rather than routing it through a separate dev-fix pass. A per-enemy-type breakdown on the wave-progress bar (distinct colors/counts) was also raised in the free space — parked as a future legibility idea, not committed this round; see [Improvements](../../games/maze-warden/ideas.md). Scoped backlog with *Done when* criteria and a ready-to-paste prompt: same note. This is the confirmation [Maze Warden](../../games/maze-warden/README.md) and Improvements were waiting on, and it comes back as an override of the pending **keep**: iteration 6's verdict in [Kameko Playtest Log](../../playtest-log.md) was agent-verified only ("flagging for him to confirm or override"). Yev's actual read: *"I get too much money and nothing to spend it on and the game maxes out everything pretty quick and feels useless and boring in some ways... I want the game to feel less flat and simple before promoting it to the main arcade."* **Promotion to the main arcade is explicitly gated on this pass.**

> **Diagnosis, grounded in the shipped source (`drafts/maze-warden/index.html`):** iteration 6 deepened the **Essence/Upgrades** economy (rank caps 3→5, new 🛡️ Reinforced Walls node — 266 essence to max, ~34 runs) and the **late-wave difficulty curve** (count/hp/speed keep escalating past wave 37 instead of flattening) — but it touched nothing in the **in-run gold economy**, and that's almost certainly the real culprit behind "too much money, nothing to spend it on."
>
> The numbers: fully maxing one tower costs a fixed, one-time total — 🟦 Spire `25+20+35=`**80g**, 🟪 Prism `40+30+45=`**115g**, 🟡 Volt `15+15+20=`**50g** (`TOWER_DEFS`, per-level `cost`). Across the whole 8×14 (112-cell) board, that means **fully building and maxing the entire maze has a hard ceiling** — a few thousand gold at most — reachable within the first 15–25 waves given a 120g starting stake and cheap per-tower costs. Gold *income*, meanwhile, is unbounded and grows faster than linear with wave number: `killReward(n) × waveEnemyCount(n)` ≈ `(3+⌊n/4⌋)(6+⌊1.5n⌋)`, plus `waveClearBonus(n) = 10+2n` — at wave 30 that's already **~580g in one wave**; at wave 50, **~1,325g in one wave**. Once the maze is built out (early, by design — towers are cheap on purpose), every coin earned after that point has **zero use**. It doesn't even flow into Essence — `essenceEarned = ⌊wave/2⌋ + ⌊kills/10⌋` has no gold term at all. This isn't a number iteration 6 could have retuned; there's simply no system that spends late-game gold. That's the gap this iteration should close.
>
> The quieter half of "maxes out... feels useless and boring" may also be structural, not just economic: once a working maze layout is found, there's currently nothing that forces you to revisit it — 💣 Bomber can destroy a tower and force a rebuild, but only if you leave it undefended near one, which a maxed-out maze rarely lets happen. Q1 below asks which half you're actually feeling.

## Q1 — Does this diagnosis match what you're feeling?

- [ ] **A ⭐ Yes — the gold ceiling is the main thing.** Once my maze is built and towers maxed (usually pretty early), gold just piles up doing nothing for the rest of the run, and that's most of what reads as flat/boring.
- [ ] **B — It's more that a "solved" maze has nothing left to think about**, gold aside. Once I find a layout that works, waves just resolve themselves and I'm not making real decisions anymore — money is a symptom, not the cause.
- [x] **C — Both, roughly equally.**
- [ ] **D — Something else** — say what (e.g. run length, visual pacing, a specific wave range where it drags).

## Q2 — Primary fix: what should absorb late-game gold? 🔑

*All of these are ongoing/repeatable sinks — the point is nothing here should ever "max out" the way the current 2-upgrade-levels-per-tower system does. Check as many as you want; A is the leanest single fix if you want to ship and re-test fast, matching the tight-iteration convention.*

- [x] **A ⭐ Escalating tower costs ("inflation")** — each *additional* tower placed this run costs progressively more (e.g. `effectiveCost()` gains a multiplier keyed off total towers built so far). Expanding or rebuilding the maze stays a real trade-off at wave 40 the same way it is at wave 4, instead of being "solved" once and then free forever. Smallest scope: one new multiplier, no new UI, no new state beyond a counter.
- [ ] **B — Repeatable mid-wave abilities, gold-costed** — a small toolbar of active, re-buyable powers: e.g. 🔨 *Rebuild Surge* (full-HP repair, all towers), ⚡ *Overcharge Pulse* (temp dmg buff, all towers, N seconds), 🛡️ *Emergency Barrier* (temp core shield). Directly answers the "boring/passive, just watching waves resolve" half of the complaint by giving you something to *do* during a wave, not just before it. Biggest scope here — new UI, new targeting-free effects, new balancing surface.
- [ ] **C — Mid-run core upgrades, gold-costed** — spend gold (not essence) on extra core HP, reduced leak damage, or a slow HP regen, purchasable any time, any number of times (rising cost per purchase). Always useful, and it directly counters the exact thing iteration 6 just made harder (late-game pressure). Medium scope: mirrors the existing `effectiveHp()`/`effectiveDmg()` multiplier pattern, no new abilities/targeting.
- [ ] **D — Gold → Essence overflow conversion** — at each wave-clear, unspent gold above some threshold converts to a small Essence trickle (e.g. 20g → 1 essence) instead of sitting idle. Cheapest possible fix, but passive — doesn't add a moment-to-moment decision, just stops gold from being *wasted*. Good pairing with A/B/C, weak as a standalone.
- [ ] **E — More tower tiers (levels 4–5 per tower, pricier)** — deepens the existing per-tower sink rather than adding a new system. Still a fixed one-time ceiling per tower, just a higher one — likely delays the problem more than solves it, flagging as the weakest option here.
- [ ] **Write-in:**

## Q3 — Sequencing

- [x] **A ⭐ Ship the gold-sink fix alone first** (whatever's picked in Q2), get a fresh playtest read, then decide if the "solved maze, nothing to think about" half (Q1=B/C) needs its own follow-up pass — same tight-iteration approach as 1→6.
- [ ] **B — Bundle the gold fix with a maze-engagement fix in one iteration** — if you're confident both halves need fixing regardless of what a gold-only playtest shows, worth naming what "maze-engagement" fix to bundle in the free space below (e.g. tune Bomber to appear/threaten more often now that towers are cheap to rebuild, or a periodic event that pressures an existing layout).
- [ ] **Write-in:**

## Q4 — Free space

Anything the above doesn't cover — a specific run/wave that dragged, a tower or ability idea, a hard "don't do this," or how far past "flat" this needs to go before you'd consider promoting it:

- seems like the bombing doesn't happen. i saw it a couple times bi

---

*Answers here scope iteration 7 (the "before promoting to the main arcade" bar). See [Improvements](../../games/maze-warden/ideas.md) for the rest of the still-open idea inbox — Runner/Tank/Splitter variety, best-wave tracking, the voluntary Heat/Pact knob, hex grid, chambered runs — none of which this round touches unless you write one in above.*
