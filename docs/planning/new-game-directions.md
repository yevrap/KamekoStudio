# Kameko Studio — New Game Directions (July 2026)

> **What this is:** proposals for the arcade's next new games, worked up from the July 14 [Improvements](ideas.md) inbox (fast physics game, TD roguelike, Balatro-style mechanic blending). Picks happened in [Kameko Studio Questionnaire — New Game Directions](../archive/questionnaires/kameko-studio-new-game-directions.md).
>
> **✅ Answered & picked up July 14, 2026 — this note is now the design source for the scheduled jams.** Winners → repo roadmap P3 rows: **A1 flow glider (p3-06 — 🧪 jammed same day: [Flow Glider](../games/flow-glider/README.md), ❌ same-day KILL verdict: shipped as a Tiny Wings copy; the no-reskins rule is now in `docs/brief.md`)**, **C3 pachinko roguelike (p3-07 — 🧪 jammed same day: [Pachinko Bazaar](../games/pachinko-bazaar/README.md), KEEP → promoted to the arcade)**, **B1+ one-tower TD with hero sortie + light unlocks (p3-08, next queued jam)**, **C1 durak score-attack (p3-09)**. Steering: pause-proof is a strong preference, not a house rule (Q2=B); look/tech per-game agent call (Q6=C); standard Lab loop, no straight-to-gallery (Q7=A). Not picked: A3, B2, B3, C2 — they stay here unscheduled. **A2 was un-benched the same evening by Yev's direct request** (the new-signal path) and jammed to the Lab as **[Black Hole in One](../games/black-hole-in-one/README.md) (p3-10)** — verdict **keep**, promoted to the arcade July 15, 2026, and by far the most actively developed game in the studio since (Orbits, Map Maker, Open World Explore mode, Thruster flight, fuel economy — full history in its own [Dev Log](../archive/dev-logs/black-hole-in-one.md)). `docs/brief.md` updated (closes Taste & Tiers Q3); questionnaire archived to `docs/archive/`.
>
> **Relation to other open planning:** [What to Build Next — Proposals & Questionnaire (July 2026)](../questionnaires/what-to-build-next.md) is the *arcade-adjacent experiences* menu (Colosseum, Skazka Trail…). This note is *in-arcade new games*. Independent tracks — answering one doesn't block the other. Answering this questionnaire also finally closes **Q3 of [Kameko Studio Questionnaire — Taste and Tiers](../questionnaires/taste-and-tiers.md)** (jam genre directions), which `docs/brief.md` currently flags as TBD.

## Ground rules every concept respects

From the taste brief and current direction:

- **Prototype bar: Modest** — playable + phone-comfortable + restart. Jam to the Lab, promote by playtest verdict.
- **5–10 minute sessions**, free arcade (no tokens), vanilla JS (+ Three.js where it earns its keep).
- **Pausable** — Yev called this out explicitly: any game must survive being dropped mid-second and picked up an hour later. Each concept below notes *how* it pauses. (Whether "pause-proof" becomes a house rule for all future games is Q2 of the questionnaire.)
- Promotion checklist applies at gallery time: settings drawer registration, `clearAllGameData` keys, e2e test (p1-36 suite), module split.

---

## Direction A — Fast physics game (River Run energy, but cooler)

Yev's ask: *"Fun, fast physics game like river run. i want it to look cool and play fun… but pausable."*

The mechanic/loop menu worth stealing from, filtered for one-thumb phone play:

| Loop | Prior art | Why it could work here |
|---|---|---|
| One-touch momentum flow (hold to dive, release to soar) | Tiny Wings, Alto's Odyssey | The classic "looks gorgeous, plays itself into a flow state" loop; near-miss/combo scoring |
| Turn-based flick through physics | Desert Golfing, Angry Birds | Physics spectacle with zero time pressure — **inherently pausable** |
| Gravity wells / orbital slingshot | Orbital, Gravity Rider | Cheap to simulate, looks great with trails and particles |
| Steer a fast object down a course | Slope, Marble It Up | Pure speed thrill; Three.js makes it a showpiece |
| Physics pachinko / pinball | Peggle, Peglin | Bounces are the fun; overlaps Direction C (see C3) |

### A1 — One-touch flow glider ⭐ (the "looks cool" pick) — 🧪 jammed July 14, 2026 → [Flow Glider](../games/flow-glider/README.md)

Hold to dive, release to ride procedurally generated hills; chain perfect landings for speed and score multipliers. Sunset-gradient sky that shifts with your streak, motion trails, parallax layers — the beauty *is* the reward loop. Pause: auto-pause the instant the tab/app loses focus + a big pause button; runs are 2–3 minutes so a dropped run is cheap.
**Scope:** S–M jam. 2D canvas is enough; Three.js optional for the sky.

### A2 — Flick golf through gravity wells (the "pausable by construction" pick) — 🧪 jammed July 14, 2026 → [Black Hole in One](../games/black-hole-in-one/README.md)

Turn-based: drag to aim, release to fling a comet across a field of planets whose gravity bends the shot; infinite procedurally generated holes, par tracking. Between flicks the game is fully at rest — interruption costs literally nothing. Desert Golfing proved the chill one-more-hole loop.
**Scope:** S jam. Trails + gravity lensing glow for the cool factor.

### A3 — 3D marble slope (the Three.js showpiece)

Steer a marble down a winding elevated track at speed; drift, jump gaps, collect. Checkpoint-based so pausing/resuming lands you at a safe restart.
**Scope:** M — camera + track generation are real work; highest visual ceiling, highest risk of feeling bad on a phone.

**Recommendation:** jam **A2** first (smallest, perfectly interruptible, physics-forward), with **A1** as the second jam if the appetite is for spectacle. A3 only if Three.js showpiece is the explicit goal.

---

## Direction B — Tower defense roguelike

Yev's references, decoded: **Kingdom Rush** (towers + a hero you reposition) · **The Tower** ("for its simplicity, similar to Keypad Quest") · **Green TD** (WC3 custom — shared-field wave survival, mazing) · **UnderDark, Castle Busters** · plus a second list — **Rift Busters, Endless Wanderer, Hero Wars, mo.co** — which are hero-action games. Two signals: *simplicity as a virtue*, and *a controllable hero is fun*. TD is also naturally pause-friendly (between waves, or pause-anytime).

### B1 — One-tower roguelike ⭐ (The Tower × Keypad Quest simplicity)

A single central tower; enemies converge from all sides in waves. Between waves, draft 1-of-3 upgrades (pierce, chain lightning, orbiting shield, crit…). A run is 5–10 minutes and ends in death; the fun is the build you assemble. No maps, no placement UI — the entire game fits one screen, which is exactly the simplicity Yev flagged.
**Scope:** S–M jam — the least design risk of the three, and drafting-between-waves gives a natural pause point every 30 seconds.

### B2 — Lane TD with a hero (Kingdom Rush-lite)

One fixed-path map, 3–4 tower types, plus one hero unit you reposition by tap to plug leaks. Roguelike layer: each run offers a random tower/upgrade pool and a map modifier. Scratches the Kingdom Rush + hero itch directly.
**Scope:** M–L — pathing, tower AI, hero AI, and map art all at once. Better as an invest-tier follow-up if B1's verdict is strong.

### B3 — Maze-builder TD (Green TD homage)

Open grid; your towers *are* the walls, so placement forms the maze. Draft towers between waves from a random shop. The mazing brain-teaser is the hook.
**Scope:** M — pathfinding (A*) plus placement UX on a phone need care.

**Recommendation:** **B1** as the MVP slice — it matches the stated taste ("The Tower for its simplicity"), jams in a session, and its upgrade-draft system becomes reusable groundwork for B2/B3 later. If the hero feeling is essential, B1 can add a tappable "hero sortie" ability without becoming B2.

> **Update July 21, 2026 — B3 un-benched by new signal.** Yev asked directly for a **maze-building TD + Hades-style "stronger every run" meta + a migrating difficulty curve** (Underdark × Hades) — deeper than B1+/p3-08's "light unlocks." That fuses B3's maze-building with a real meta-tree into its own concept: [Maze Warden — Concept & Directions](../games/maze-warden/plans/concept-and-directions.md) (decisions in [Maze Warden Questionnaire — Design Decisions](../archive/questionnaires/maze-warden-design-decisions.md)). Whether it replaces/absorbs the queued p3-08 is Q2 there.

---

## Direction C — Mechanic-blending roguelike (Balatro / Scritchy Scratchy)

**The Lab lesson first:** durak-alchemist/-dungeon/-tactics were genre *mashes*, and the verdict was "mixed mechanics interesting, not worth the main-page spot." Balatro's trick isn't mashing genres — it's **one familiar base mechanic + escalating score quotas + a shop of rule-breaking modifiers**. The blend happens at the scoring layer, not the genre layer. Every concept here follows that formula.

### C1 — Durak-deck score-attack roguelike (the nostalgia play)

Base mechanic: beating cards from the 36-card deck — the thing the taste questionnaire says makes durak the benchmark (nostalgia + cultural connection). Runs: clear escalating score quotas by winning beats/transfers; between rounds buy folk-flavored modifiers (a домовой that doubles trump beats, a самовар that brews an extra card slot…). Not another durak *variant* — durak as Balatro's poker.
**Open tension (Q5 of the questionnaire):** durak-likes were just demoted to the Lab. Is durak-as-scoring-base different enough, or is the durak well tapped for now?
**Scope:** M. Card rendering and deck logic already exist in the repo to borrow from.

### C2 — Scratch-card roguelike (Scritchy Scratchy-like)

Scratch tickets with a swipe of the thumb; symbols score, items warp the odds ("all 7s adjacent to a cherry are wild"), quotas escalate, shop between rounds. The scratch gesture is delightfully tactile on a phone and utterly pause-proof (a half-scratched ticket just sits there).
**Scope:** S–M jam — smallest concept in this direction, and the furthest from anything already in the arcade.

### C3 — Pachinko roguelike (Peglin-style — bridges Directions A and C)

Drop orbs through a peg field (real physics — the Direction A itch); pegs score, orbs level up, shop between drops. One build ticks both the "fast physics" and "mechanic blending" boxes if choosing hurts.
**Scope:** M.

**Recommendation:** **C2** for novelty (nothing like it in the arcade, tiny jam) or **C3** if it should double-count with Direction A. C1 only if the nostalgia answer in the questionnaire is a clear yes.

---

## What happens after the questionnaire

1. Winning direction(s) → jam brief(s), Lab prototype at the Modest bar, entry in [Kameko Playtest Log](../playtest-log.md) after Yev plays.
2. Repo `docs/roadmap.md` gets P3 rows for the picked games (none added yet — deliberately, so the roadmap doesn't carry speculative rows).
3. `docs/brief.md`'s TBD genre-directions section gets updated from the answers (closes Taste & Tiers Q3).

*Created July 14, 2026, from the Improvements inbox triage. Decisions live in [Kameko Studio Questionnaire — New Game Directions](../archive/questionnaires/kameko-studio-new-game-directions.md).*
