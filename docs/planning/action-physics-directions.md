# Kameko Studio — Action Physics Directions (July 2026)

> **What this is:** proposals for a *new* arcade game, from Yev's ask (July 21, 2026): *"something with some action and maybe adventure. I like Black Hole in One with its physics… fast paced and fun to play with good physics and visuals."*
>
> **Status:** 🟡 awaiting picks in [Kameko Studio Questionnaire — Action Physics Game (July 2026)](../questionnaires/action-physics-game.md). This note is the design source; the questionnaire is where the decisions get made. Nothing is built yet.
>
> **Relation to other planning:** distinct from [Kameko Studio — New Game Directions (July 2026)](new-game-directions.md) (that queue's winners are p3-06…p3-09) and from [Maze Warden — Concept & Directions](../games/maze-warden/plans/concept-and-directions.md) (TD roguelike). This is a fresh wildcard direction Yev asked for directly — the brief welcomes un-seeded pitches (`docs/brief.md`, "Un-seeded/wildcard pitches are still welcome").

## The core idea — and why it isn't just "more Black Hole in One"

Yev loves BHiO's physics. But BHiO is **turn-based and calm**: you aim, flick, and the world rests between shots; even Explore is a drifting, chill traversal. Yev's ask here is the opposite word — **action, fast-paced**. So the new game's whole reason to exist is:

> **Real-time gravity.** Take the gravity feel Yev already loves — planets bending your path, slingshots, orbital momentum, comet trails — and make it a *live* game you're steering and reacting to every second, where **momentum is the mechanic you play with**, not just the thing that carries a shot.

That's a genuinely different game from BHiO (which stays exactly as it is), while reusing the part Yev likes. It also reuses real code: BHiO's `physics.js` is a 119-line, DOM-free gravity integrator — the hard, already-solved part. A jam here is mostly *new game feel on top of proven physics*, which is why the scope estimates below are friendly.

## Ground rules every concept respects (from `docs/brief.md`)

- **No reskins** — the Flow Glider lesson. Named prior art below is *feel reference only*; each concept states what's genuinely **new**. The hook must be original.
- **Modest prototype bar** — playable + phone-comfortable + restart button. Jam to the Lab, promote by playtest verdict (Q7=A, the standard loop).
- **5–10 min sessions**, mobile-first portrait, **one thumb where possible**, free arcade, vanilla JS (+Three.js only if the concept demands it).
- **Pausability is a strong preference, not a house rule** (Q2=B). BHiO already relaxed it for live motion — *"auto-pause is enough, live/complicated motion is the point."* A real-time action game inherits that ruling: auto-pause on blur + short runs = interruption costs nothing. (Confirm in Q6.)
- **Don't rebuild what the arcade has:** BHiO owns turn-based gravity golf + explore; River Run owns fast direct-steer dodging; Pachinko owns peg physics. Each concept notes how it stays clear of those.

---

## Direction A — Momentum-as-weapon (real-time gravity combat)

**The through-line:** gravity + speed *are the combat system*, not just navigation. This is the most direct translation of "BHiO's physics, but action."

### A1 — Slingshot Smash ⭐ (the pick: fast, physical, lowest new-tech risk)

You pilot a small craft in a bounded arena studded with gravity wells (planets). Enemies spawn and converge in waves.

- **Original hook: you have no gun — your *speed* is your weapon.** You only destroy an enemy by hitting it while moving fast enough; slow, you bounce off harmlessly (or take a hit). To build lethal speed you **slingshot around the gravity wells** — whip around a planet to charge up, then release into a cluster and scatter them like a comet through a crowd. BHiO's "gravity is the club" becomes **"gravity is the sword."**
- **Control (one thumb):** drag-anywhere to set a continuous thrust vector (BHiO's exact drag-aim gesture, but sustained thrust instead of a one-shot flick), or tap-to-pulse toward a point. A **heat glow** on the craft/trail shows when you're "hot" (lethal) vs. cold — reading your own speed *is* the skill.
- **Visuals:** comet trail that ramps dull → gold → white-hot with speed; enemies pop in particle bursts; gravity wells glow with lensing (reuse BHiO's look); screen-shake + freeze-frame on big smashes. The beauty is the speed.
- **Adventure / roguelike layer:** survive a wave → draft **1-of-3 upgrades** between waves (heavier hull = more knockback; magnetic tail = drag enemies into wells; afterburner; splitting comet). Sectors escalate; a run is 5–10 min and ends in death — the fun is the build you assemble. (Shares the upgrade-draft pattern with p3-08, so groundwork is reusable both ways.)
- **How it pauses:** real-time, but auto-pause on blur/visibilitychange; the between-wave draft is a natural rest point every ~30–45 s.
- **Scope: M jam.** Reuse `physics.js`'s gravity integrator directly. New work = craft control, the speed-gates-damage rule, an enemy spawner, collision, and the draft. Feels nothing like BHiO despite the shared physics.
- **New vs. lifted:** *new* — speed-gates-damage combat, slingshot-to-charge as the core loop, weaponless ramming. *Feel reference only* — arena-survival waves (any twin-stick), gravity look (BHiO's own).

### A2 — Well Brawl (orbital sumo)

You and 2–3 AI rivals orbit a central black hole; **ram each other out** past the arena edge / event horizon. Momentum + mass duel.

- **Original hook: a mass economy.** Eating stardust makes you heavier — more knockback when you hit — but slower and harder to pull out of a dive. Bulk up to bully, or stay nimble to dodge. Best-of rounds or last-one-standing.
- **Scope: M.** Highest risk is AI feel (rivals must brawl believably). Very physics-forward, very short sessions. Include as a contender if the "duel / king-of-the-hill" flavor appeals more than wave survival.
- **New vs. lifted:** *new* — the mass↔knockback↔agility tradeoff around a shared well. *Feel reference* — sumo/knock-out arenas generally.

*(Also considered under A: **Gravity Lance** — a half-real-time flick-combat variant where you dive through enemies and the gravity arc is the aiming puzzle. Closer to BHiO's input = lower risk, but less "fast-paced," so it's ranked below A1. Mentioned for completeness; pick it in Q1 write-in if the calmer feel is actually what's wanted.)*

---

## Direction B — Tether / grapple traversal (the adventure-forward pick)

**The through-line:** a physics **tether** for swinging momentum. Leans "adventure" (traverse a world) more than "combat."

### B1 — Chain Comet ⭐ (the adventure pick)

You fling a tether onto planets/anchors and **swing**; gravity *and* the pendulum both act on you; release at the right moment to sling forward. Travel a scrolling world of anchors, hazards, and gates at speed.

- **Original hook: the tether *charges* from the well it grabs.** Latch a strong gravity well and the swing winds up stored energy; release to fire off a boost scaled to the well's depth. Grappling becomes a **gravity-powered slingshot** — which is neither a plain swing game nor BHiO, but a fusion of the two. Chain clean swings and you flow; miss the release timing and you stall.
- **Control (one thumb):** tap toward a body to fire the tether, hold to stay latched and swing, release to let go (with the wound-up boost).
- **Visuals:** taut glowing tether, wide swing arcs, a speed ribbon, parallax star layers — a real sense of *flow* and journey.
- **Adventure:** a **route** through sectors — checkpoints, optional collectible/hazard gauntlets, a light "getting somewhere" framing. This is the concept that most delivers the "adventure" word.
- **How it pauses:** real-time but **checkpoint-based** (resume at last checkpoint), auto-pause on blur.
- **Scope: M–L.** Tether/pendulum physics + route generation are genuinely new work (more than A1). Highest adventure ceiling, highest risk of feeling fiddly on a phone — the release-timing gesture has to feel *great* or the whole game feels bad (the Blob Zapper control lesson).
- **New vs. lifted:** *new* — well-charged tether-slinging, gravity + pendulum combined. *Feel reference only* — swing/rope traversal generally (never a specific game's signature hook).

### B2 — Chain Comet: arena mode (combat variant)

The same tether in a combat arena: **yank yourself into enemies, or yank enemies into gravity wells**; grabbing one enemy and slinging it into another chains a combo.

- Probably a **mode of B1**, not a separate game — flag it in Q2 (how much combat vs. traversal). Fuses Directions A and B.

---

## Direction C — Pure speed thrill (fast flow, light action)

### C1 — Comet Rush (gravity slalom)

Continuous high-speed flight threading a procedural gravity gauntlet — slalom through wells, thread gates, graze for near-miss speed boosts.

- **Original hook: you don't steer directly — you choose which well to "grab," and gravity does the cornering.** A rhythm of latch/release cornering at speed, not a steering game.
- **⚠️ Overlap flag:** this is the closest to **River Run**'s "fast dodge visualizer" territory. The no-direct-steer hook is the differentiator, but if River Run scratches this itch already, C1 is the weakest pick. Included for completeness.
- **Scope: S–M.** Smallest concept here.

---

## Recommendation

**Jam A1 (Slingshot Smash) first.** It's the most direct answer to every word Yev used — *action, fast-paced, good physics, good visuals* — it reuses BHiO's proven gravity integrator (so the risk is game-feel, not physics), and it feels **completely unlike** BHiO despite the shared DNA. Its upgrade-draft also seeds groundwork reusable by p3-08.

**Hold B1 (Chain Comet) as the follow-up** if the appetite is adventure/traversal over arena combat — it's the bigger "adventure" swing, but also the bigger risk (the tether gesture must feel perfect).

Decisions that shape the jam are in the questionnaire.

## What happens after the questionnaire

1. Picked concept → a **seeded jam brief** + a ready-to-paste **jam prompt** for a fresh execution session (per the planning convention — every planning session ends with paste-ready prompts).
2. Jam to the Lab at the Modest bar → Yev playtests → verdict in [Kameko Playtest Log](../playtest-log.md) (Q7=A loop) → keep decides promotion.
3. No repo `docs/roadmap.md` P3 row until a concept is picked (roadmap carries no speculative rows — same discipline as the July 14 note).

*Created July 21, 2026, from Yev's direct ask. Decisions live in [Kameko Studio Questionnaire — Action Physics Game (July 2026)](../questionnaires/action-physics-game.md).*
