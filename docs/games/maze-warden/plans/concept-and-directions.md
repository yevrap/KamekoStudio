# Maze Warden — Concept & Directions

> **Working title: "Maze Warden"** (final name is Q1 of the questionnaire — shortlist there). A new Kameko Arcade game: a **maze-building tower defense with a Hades-style "stronger every run" roguelike layer** and a difficulty curve that migrates from front to back over time.
>
> **What this is:** the concept + design forks for Yev's July 21, 2026 ask — *"tower defense with maze building elements, roguelike elements that after every run I get a little stronger, and an endgame where the game gets easier and easier at first but then harder in late game. Thinking Underdark on mobile and Hades on consoles."* Decisions get made in [Maze Warden Questionnaire — Design Decisions](../../../archive/questionnaires/maze-warden-design-decisions.md), then a jam brief + backlog follow.
>
> **Relation to what's already queued (important):** the July 14 [Kameko Studio — New Game Directions (July 2026)](../../../planning/new-game-directions.md) doc already scoped a **Direction B — Tower defense roguelike** with three sub-concepts. Two of them are relevant here:
> - **B1+ "one-tower roguelike with hero sortie"** is queued as repo roadmap **p3-08** — but its meta-progression is only *"light unlocks"* (new cards join the draft pool). That is far shy of Hades' "get permanently stronger every death."
> - **B3 "maze-builder TD (Green TD homage)"** was **considered and benched** — on the `docs/brief.md` "don't re-pitch without new signal" list.
>
> **Yev's ask is that new signal.** It un-benches B3 (maze-building is now the *core*, not a variant) and fuses it with a real Hades-depth meta layer that goes beyond p3-08. That makes it its own concept, not a tweak to p3-08 — the same "new-signal path" that turned benched A2 flick-golf into [Black Hole in One](../../black-hole-in-one/README.md). *Whether this replaces, absorbs, or runs alongside p3-08 is **Q2** of the questionnaire.*

---

## The concept in one paragraph

You are warding a core against waves of things that want to reach it. The board is an open grid, and **your towers are also your walls** — where you place them decides the path the enemies must walk. The fun is shaping a long, twisting kill-corridor out of limited pieces (you can never fully seal the core — a path must always exist). You fight escalating waves until the core falls; a run is **5–10 minutes**. When you die you bank a currency and spend it on a **permanent upgrade tree**, so the *next* run starts stronger — and the one after that stronger still. Over many runs the opening waves get trivial (easier and easier), while a late-game difficulty that keeps scaling — plus an optional voluntary "crank it up" knob — keeps the back of the run hard. The wall moves later; it never disappears.

**Name shortlist (Q1):** Maze Warden · Nightward · Deepward · Warren · Gloomroot · Хранитель (*Khranitel* — "the Keeper," leans into the arcade's Slavic thread) · write-in.

---

## Three pillars, decoded from the references

### Pillar 1 — The maze *is* the game (Underdark)

**What Underdark does:** a hex grid where you lay tiles to build the enemies' path; enemies pathfind through whatever gaps you leave, and your towers double as maze walls. The spatial puzzle — force the longest, most-exposed route — is the whole hook.

**How it lands in the arcade:** this is the differentiator. The arcade has no TD yet, and "your towers are the walls" is a genuinely different verb from anything shipped. It's **naturally pausable** — you plan while the board is at rest between waves — and **one-thumb** (tap an empty cell to place, tap a tower to upgrade/sell). One screen, no camera, no scrolling. This is the pillar the jam MVP must nail first.

*Design rule that keeps it honest:* enemies always take the **shortest currently-open path** (A* / BFS), and any placement that would fully seal the core is rejected. That single rule is what makes maze-building a puzzle instead of a wall-off.

### Pillar 2 — You get stronger every run (Hades' Mirror of Night)

**What Hades does:** deaths aren't wasted. You earn a persistent currency (Darkness), bank it across runs, and spend it in the **Mirror of Night** — a permanent skill tree (more health, a dash strike, a bonus revive…). New weapons and tools unlock over time too. Losing *is* progression.

**How it lands in the arcade:** a small **permanent meta-tree** in `localStorage` (no backend — see arcade fit below). A lost run pays out "embers" (currency name is themeable) that buy nodes like: *start each run with +X gold · core +1 HP · a new tower type joins your build pool · walls cost 10% less · one free re-roll of the between-wave draft.* Each node visibly makes the next run open easier. **This is the roguelike hook Yev named** — "after every run I get a little stronger" — and it's what turns a 5-minute loss into a reason to tap "again." *Shape of the meta layer is **Q5**.*

### Pillar 3 — The difficulty migrates (Hades' God Mode ramp + Heat/Pact)

Yev's phrase: *"an endgame where the game gets easier and easier at first but then harder in late game."* Decoded, Hades has **two** knobs that together produce exactly this shape:

- **God Mode** — an accessibility ramp where each death grants a small permanent damage-resistance boost, so the game *literally eases the more you struggle*. Combined with the meta-tree, the **front of every run gets easier and easier** as you play.
- **Heat / Pact of Punishment** — once you can clear content, you *voluntarily* stack difficulty modifiers for bigger rewards. This is the **"harder in late game"** — an endgame that keeps steepening on purpose.

**The intended curve, stated plainly:** meta-progression flattens the early waves (power fantasy up front), while endless late-game scaling — and optionally the voluntary Heat-style knob — steepens the late waves. **The difficulty wall migrates later and later; it never goes away.** That migration *is* the "endgame." *Confirming this reading vs. alternatives is **Q6** — it's the subtlest decision in the whole design, so it gets its own question.*

---

## Three shapes it could take

Same three pillars, three different bets on grid / run-structure / scope. Ordered leanest-first.

### Shape A — Endless Maze Survivor ⭐ (recommended jam MVP)

One square grid, one core, waves spawn from fixed edges and escalate forever. Towers are walls; between waves, gold-from-kills buys/upgrades towers and you **draft 1-of-3** new options. Death ends the run, banks meta currency, you spend it on a small permanent tree, next run starts stronger. **Contains all three pillars in the smallest possible slice**, and every system built here (grid, pathfinding, wave loop, meta-tree, save format) is reusable groundwork for B and C.
**Scope: S–M jam.** The recommended first Lab prototype (full slice spec below).

### Shape B — Descent (Hades' run structure)

A run is a **sequence of 3–5 short chambers**, each a tiny maze board with its own wave set, an elite/mini-boss at the end, then you descend to the next. Meta-tree between *runs*, small boons between *chambers*. More faithful to Hades' "escape attempt" arc and biome variety.
**Scope: M–L.** Multiple boards, transitions, boon system, boss behavior all at once. Best as the *post-verdict* evolution of Shape A, not the jam.

### Shape C — Hex Warden (Underdark-faithful)

Hex grid, tile-placement maze exactly like Underdark, plus a tappable **hero-sortie ability** (this is where p3-08's hero itch folds in — an ability, not a repositionable unit). Highest fidelity to the mobile reference.
**Scope: M.** Hex pathfinding is real work and hex touch-targets on a phone need care (the risk). Square-grid Shape A de-risks everything first; hex becomes a Q4 decision or a later mode.

**Recommendation:** **jam Shape A.** It's the smallest build that still lets Yev feel all three pillars — maze-building, get-stronger-every-run, and the migrating wall — so the playtest verdict is about the *fusion*, not about hex ergonomics or biome plumbing. If the hero feeling matters (Q8), add one cheap tappable hero-sortie ability to Shape A without becoming Shape C. Hex (C) and biomes (B) are post-keep evolutions.

---

## Recommended MVP jam slice (Modest bar)

What the first `drafts/` prototype actually contains — playable, phone-comfortable, restart button, nothing more (polish is earned post-verdict, per the standard loop):

- **Board:** one square grid (~9×11), one core cell, 1–2 enemy spawn edges. Portrait, fills the phone screen, no camera.
- **Maze-building:** tap an empty cell to place a wall/tower; tap a placed tower to upgrade or sell. **Placement that would fully seal the core is rejected** with a clear "path must stay open" nudge. Enemies **A*/BFS to the core** along the shortest open route and re-path when you build.
- **Towers:** 2 types — a basic single-target and a slow/AoE — enough to make placement decisions matter.
- **Waves:** endless, escalating HP / speed / count. Core has HP; a leak costs core HP; core at 0 ends the run.
- **Between waves (the pause point):** gold from kills → buy/upgrade towers, **draft 1-of-3** options. Board fully at rest — plan as long as you like.
- **Death → meta:** run ends → banks a currency → a **3–5 node permanent tree** in `localStorage` (e.g. *+start gold · +core HP · unlock a 3rd tower into the pool · cheaper walls · one draft re-roll*). The next run visibly starts easier — the whole point.
- **Feel:** synth SFX (WebAudio, no assets), particles/glow for the "looks cool" bar, auto-pause on tab blur + a pause button, teach-in-game how-to overlay, restart.

That slice is playable *and* contains the entire loop (build → survive → die → grow → build easier). Everything else is post-verdict.

## Post-verdict roadmap (deferred — not in the jam)

Only if the playtest verdict is **keep**: bigger meta-tree, more tower/enemy types, elites/bosses, **Shape B biomes**, the **voluntary Heat-style difficulty knob** (the deliberate "harder in late game" endgame), a **hex mode (Shape C)**, a theming/art pass (see theme, Q9), and RU localization to match the studio. None of this is spent up front.

---

## How it fits Kameko Arcade

| Constraint | How Maze Warden meets it |
|---|---|
| **No backend / GitHub Pages** | All state is client-side `localStorage` (meta-tree, best run, settings). Static files only — nothing to host. ✅ |
| **Vanilla JS (+Three.js only if earned)** | 2D canvas is plenty; the cool factor is trails, glows, particle bursts, a shifting palette. Three.js not needed (Q6-look is a per-game call, brief Q6=C). |
| **5–10 min sessions** | A run is one sitting; death banks progress so quitting mid-meta never loses anything. |
| **Pausable (strong preference)** | Pause-friendly *by construction* — you plan between waves with the board at rest — plus auto-pause on blur and a pause button during waves. |
| **Teach-in-game** | TD-with-maze isn't universally known; a short how-to overlay + "path must stay open" coaching covers it. |
| **Modest prototype bar** | The MVP slice above is a single self-contained `drafts/` file; tests/modules/theme integration are promotion costs, deferred. |
| **Standard loop (no straight-to-gallery)** | Jam to the Lab → Yev playtests → verdict decides promotion, like every other game. |

## Original hooks vs. lifted (the no-reskins rule)

Per the Flow Glider lesson (`docs/brief.md`): **Underdark and Hades are feel/tone references, not blueprints.**
- **Reference only:** Underdark → the "towers-are-walls, you shape the path" maze verb. Hades → "death is progress" meta-tree + the God-Mode/Heat difficulty framing.
- **Genuinely ours:** the *fusion itself* (maze-building TD carrying a Hades-depth permanent tree **and** a migrating difficulty wall is not a common combo — most maze TDs have no roguelike meta, most roguelikes aren't maze TDs), plus the tower/enemy roster, the theme, and the specific difficulty-migration math. The jam must not ship a 1:1 Underdark grid or a Hades chamber clone — name what's new before building.

---

## Open questions → the questionnaire

The forks that actually change the build are in [Maze Warden Questionnaire — Design Decisions](../../../archive/questionnaires/maze-warden-design-decisions.md): the name, whether this replaces/absorbs p3-08, the exact maze mechanic, hex vs square, the meta-progression shape, the difficulty-curve reading, run structure, hero-or-not, theme, and how much meta to put in the jam MVP.

## What happens next

1. **Yev answers [Maze Warden Questionnaire — Design Decisions](../../../archive/questionnaires/maze-warden-design-decisions.md)** (no chat back-and-forth needed).
2. A short planning pass turns the answers into a **jam brief + `Backlog.md`** in this folder (and, if it earns a row, a repo `docs/roadmap.md` P3 entry — or an amendment to p3-08 if Q2 says to absorb it).
3. **Jam to the Lab** at the Modest bar → Yev plays → [Kameko Playtest Log](../../../playtest-log.md) verdict decides promotion.

**Ready-to-paste prompt for the jam (after the questionnaire is answered):**
> *"Read `Maze Warden — Concept & Directions` and the answered `Maze Warden Questionnaire — Design Decisions`. Turn the answers into a jam brief + Backlog.md in the Maze Warden folder, then jam the MVP slice to the KamekoStudio Lab (drafts/) at the Modest bar. Log it in the Kameko Playtest Log for my verdict."*

*Created July 21, 2026 from Yev's TD-roguelike ask. Decisions live in [Maze Warden Questionnaire — Design Decisions](../../../archive/questionnaires/maze-warden-design-decisions.md). Design-source lineage: [Kameko Studio — New Game Directions (July 2026)](../../../planning/new-game-directions.md) §B (B3 un-benched + B1+/p3-08 deepened).*
