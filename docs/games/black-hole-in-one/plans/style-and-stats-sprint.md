# Black Hole in One — Style & Stats Sprint (July 2026)

> **Status (updated 2026-07-18): still fully unbuilt — nothing in this sprint has shipped.** Repeatedly deprioritized behind Orbits/Open World, most recently confirmed still-queued-but-not-picked by the Next Arc Questionnaire (July 17, 2026), Q2. **⚠️ BH-2 needs re-scoping before it's built:** its spec below draws the session dashboard into the laptop letterbox margins, but those margins stopped existing when the world went full-screen responsive (Core Re-alignment, 2026-07-16) — re-scope the "wide-screen panel" half, the rest of BH-2 (counters + drawer stats block) is unaffected. BH-1 and BH-3 are unaffected by that change and can ship as spec'd. Note: BH-1's "⭐-on-orbit" tie-in was **declined** (orbit-tuning Q2), so BH-1 is golf-side style stars only. Consumes the answered [Black Hole in One Questionnaire — Post-Promotion Polish](../../../archive/questionnaires/black-hole-in-one-post-promotion-polish.md) (four decisions below, in `docs/archive/`). Overview: [Black Hole in One](../README.md) · backlog & candidates: [Improvements](../ideas.md) · repo `games/black-hole-in-one/`, roadmap `docs/roadmap.md`.
>
> **Theme: bragging rights, not new rules.** The verdict was *keep the golf pure* — Q2 explicitly declined mechanical rewards. So this sprint adds a **flourish + stats layer around** the game (style stars, a session dashboard, and the empty laptop margins put to work) without touching strokes, par, or physics. Zero gameplay-balance risk.

## Decisions (Post-Promotion Polish questionnaire, answered July 15, 2026)

| Q | Answer | Consequence |
|---|---|---|
| **Q1 — laptop letterbox** | "Works, but **use the side margins for something** (scorecard-so-far, session stats, bigger aim room)" | → **BH-2**: on wide screens, render the session dashboard in the letterbox margins instead of empty starfield |
| **Q2 — hop/slingshot rewards** | "**Style stars** — hops/slingshots/aces bank ⭐ next to the best round (bragging rights, **no gameplay effect**)" | → **BH-1**. The "mechanical teeth" option is **declined** → Parked in Improvements |
| **Q3 — Russian localization** | Write-in: "**RU should not be a default**; I'll ask for localization when needed. Default = English only" | **No work.** Policy recorded — the studio's EN/RU convention is *opt-in per game*, not automatic. BHIO stays EN-only until Yev asks |
| **Q4 — which mode is "the game"** | "Yes — **rounds are the real score**, endless is the toy" (default) | **No work.** Confirms current emphasis; endless stays the drifting toy. (Kills the "endless-first" and "daily-hole-as-headline" flips — daily hole survives as a *non-headline* backlog idea) |

## Sprint items — agent-shippable

### BH-1 — **P1** Style stars (⭐) — *Q2*
Hops, slingshots, and aces bank ⭐ that accumulate next to the best-round record. Pure bragging rights — **strokes, par, scoring, and physics are untouched.**
- Award rule (proposal, tune in build): **hop = 1⭐, slingshot = 1⭐, ace (black hole in one) = 3⭐.** Awarded at the moment they're already celebrated (the existing `landOn` hop toast, the `SLINGSHOT!` fire in `stepFlight`, the ace branch in `holeLabel`/`holeComplete`).
- Lifetime ⭐ total persists in a new `blackHoleInOne_stars` LS key (registered in `clearAllGameData`).
- ⭐ shown next to the best-round line on the scorecard overlay and on the start menu.
- *Done when:* landing a hop, completing a slingshot, and sinking an ace each increment ⭐; the total survives reload and shows on scorecard + menu; the golf score is provably unchanged (no stroke/par path touched); the award logic has unit tests in the existing headless suite; `node --test` + smoke green; deploy verified live and a run driven in-browser showing ⭐ ticking up.

### BH-2 — **P1** Session dashboard + laptop side panel — *Q1 + reinstates the cut "Stats surface"*
Track this-session counters and surface them two ways: a **stats block in the settings drawer** (all devices) and, on wide screens, **rendered into the letterbox margins** where there's currently only starfield.
- Counters: holes played, aces, slingshots, planet-hops, best round, lifetime ⭐. Reintroduce `sessionSlings` counting (dropped in the v25 module split — the Improvements note flags it).
- Drawer: a read-only stats section added to the existing `KamekoSettings.registerSection` block in `main.js`.
- Margins: when `view.ox` exceeds a threshold (real letterbox, i.e. laptop/desktop — see `ui.js` `resize()`/`view.ox`), draw the dashboard into the left or right margin; on phone (`view.ox ≈ 0`) nothing changes.
- *Done when:* the counters update live during play; the drawer shows them; on a ≥1000px-wide window the margin panel renders and stays legible; at 375px-wide the layout is byte-for-byte the phone experience (no panel, no reflow); verified in-browser at both widths + drawer open; tests cover the session-counter accounting.

### BH-3 — **P2** Pulsar telegraphing (one-time coach hint) — *from Improvements*
The first pulsar a player meets currently teaches by shoving them. Add a **one-time coach hint** the first time a pulsar appears on screen (holes 6+): a toast like "⚡ Repulsor pulsar — white stars *push away*." Fires once per session (or once-ever, persisted — build's call), never repeats.
- *Done when:* reaching a hole that generates a pulsar shows the hint exactly once; subsequent pulsar holes stay silent; no hint on pulsar-free holes; verified by playing to a pulsar hole twice.

## ✅ BH-4 (orbit-and-flick) — SHIPPED v27 (`4dfb217`), ahead of this sprint
Yev answered the stable-orbits question ([Black Hole in One — Stable Orbits Exploration](../../../archive/plans/black-hole-in-one-stable-orbits-exploration.md)) → **BH-4, a live-orbit mechanic you flick out of with a force-push impulse** — and it shipped first, since it was the piece he was most keen on. Kept out of this sprint's commits by design: BH-1/2/3 are a zero-risk flourish/stats layer that never touches strokes, par, or physics, whereas BH-4 changed the core flight loop. Details in [Black Hole in One](../README.md) "Orbits", the Dev Log, and [Black Hole in One — Stable Orbits Exploration](../../../archive/plans/black-hole-in-one-stable-orbits-exploration.md). **One tie-in left for this sprint:** when **BH-1** lands the ⭐ system, wire a ⭐ onto the orbit toast in `beginOrbit` (noted in Improvements follow-ups). Open feel/tuning decision: [Black Hole in One — Orbit Tuning Questionnaire](../../../archive/questionnaires/black-hole-in-one-orbit-tuning.md).

## Not in this sprint — backlog (stays in [Improvements](../ideas.md))
- **P2** Tune late-game par (playtest-gated) · **P2** Music / richer audio · **P2** Aim practice-mode toggle
- **P3 depth ideas** Daily seeded hole · ghost of last shot · landing marks · more body types / hole modifiers / objects index

## Parked / declined
- **Mechanical hop/slingshot rewards** — declined by Q2 (chose style-only). Do not build stroke-shaving or label upgrades.
- **Moving bodies (orbiting moons)** — cut at draft for pause-proofing; the stable-orbits exploration is the *only* re-open path and only "while the comet flies."

---

*Recommended order: BH-1 → BH-2 (share the ⭐/stats plumbing, ship as one or two commits) → BH-3 as a small tail. When shipped: log in [Dev Log](../../../archive/dev-logs/black-hole-in-one.md), move items to Shipped in Improvements, and archive the questionnaire to `docs/archive/` per its own footer.*
