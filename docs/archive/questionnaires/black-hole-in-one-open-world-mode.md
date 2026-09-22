# Black Hole in One — Open World Mode (🌌 Explore) — Design Questionnaire

> **Status: ANSWERED July 15, 2026 → consumed into the build plan: [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md).** This note stays as the concept/decision record. Overview: [Black Hole in One](../../games/black-hole-in-one/README.md) · the orbit mechanic this builds on: [Black Hole in One — Stable Orbits Exploration](../plans/black-hole-in-one-stable-orbits-exploration.md).

## The vision (Yev, July 15)

> *"Open world mode with procedurally generated things you can explore. I like the game and want more freedom to be in this world. But also to make the game feel more rich and smooth. I want complexity and this math/physics feel but not at the expense of performance. An option to go to a town with a teleport you can get back to — like teleports in Diablo. What else can we add?"*

Three pulls, and one of them is a guardrail:
1. **Freedom** — stop being one-screen-per-hole; roam a continuous space.
2. **Richness + smoothness** — more to see and do, more of the gravity/physics feel, buttery motion.
3. **Performance is a hard constraint** — complexity must not cost frame rate.

## Reality check (so the questions make sense)

The current game is deliberately *one screen per hole, no camera* — every hole is a fixed 100×170 diorama. **Open world breaks that frame**: a camera that follows the comet across a space far bigger than the screen, with the world **streamed in procedurally as you go**. That's the single biggest change, and it's what makes performance the live risk. The good news: the hard part — real gravity flight, orbits, slingshots, landing, the black-hole cup — already exists and is DOM-free/headless-testable. Open world is mostly **camera + streaming + what-you-find**, reusing the physics wholesale.

This is **not a one-ship item** — it's a multi-sprint direction. So the first question is about how big a bite to take.

---

## Q1. First bite — how much do we build before you play it?

- [x] **Vertical slice first** *(recommended)* — a small bounded "sector": camera follow, free flinging in all directions, a starfield you drift through, a handful of procedural bodies, and **one town + one return-teleport**. Enough to feel the freedom and judge performance before investing. Everything else (economy, missions, huge world) waits for your verdict on the slice.
- [ ] Go big — commit to the full mode (world streaming, economy, missions, map) in one arc.
- [ ] Just a "no-goal sandbox" — the golf holes, but with a camera and no cup pressure; fling around freely. Smallest possible.
- [ ] Write-in:

## Q2. What's the *point* of exploring? (pick as many as appeal — multi)

- [x] **Discovery** *(recommended)* — the map reveals as you go; you find and can **name** star systems (No Man's Sky-ish), and revisiting a place shows the same thing (seeded by coordinates).
- [x] **Collect** — gather **stardust / comet-tails** scattered in space; it's the currency the town spends.
- [x] **Landmarks & loot** — derelict stations, ancient rings, artifacts you fling into to pick up.
- [x] **Missions/bounties** — the town hands out goals ("reach the blue giant", "orbit 3 pulsars", "sink into the far black hole").
- [x] **Pure vibe** — no goals at all, just a beautiful physics sandbox to drift in. i want the features to be optional and for it to be fun to fly around
- [ ] Write-in:

## Q3. The town & the return-teleport (your Diablo waypoints)

How you get *home* — and back out to where you were. My recommendation leans into the game's own namesake.

- [x] **Black holes are wormholes** *(recommended)* — dive into any black hole to warp to **town**; a "🌀 Return Portal" in town drops you back at the **last black hole you used** (your bookmark). On-theme (the cup becomes travel), and it reuses the capture spiral you already have.
- [x] **Beacons you activate** — Diablo waypoints exactly: fling to a beacon, it lights up, and from town you can fast-travel to **any lit beacon**. More control, more UI (a waypoint list).
- [x] **Town-portal item** — carry a portal charge; open one anywhere to make a two-way door home, like Diablo's Town Portal scroll.
- [ ] Write-in:

**Persistence for "get back to the same location":** the world is **seeded** so any coordinate always regenerates identically, and your discovered towns/beacons + home bookmark are saved to `localStorage`. *(This is assumed regardless of the pick above — flag if you'd rather it reset each session.)*

## Q4. How does travelling far *feel*? (the traversal skill)

- [x] **Free flinging + slingshot highways** *(recommended)* — flinging stays free (golf spirit); the skill is **chaining gravity assists** — slingshot off a planet, catch an orbit, whip out at speed — to cross distance efficiently. Rewards the physics mastery you already built.
- [x] Add a **boost/charge** — a rechargeable thruster tap for a burst, on top of flinging.
- [x] **Metered flings** — flinging costs a little energy that refills at rest/stars, so travel has resource texture (less chill, more survival). have an option for unlimited travel 
- [ ] Write-in:

## Q5. Shape of the world & camera

- [x] **Bounded sector, smooth-follow camera** *(recommended for the slice)* — a big but finite region with soft edges; camera eases behind the comet, parallax starfield layers for depth. Predictable to generate and cull.
- [ ] **Truly infinite drift** — chunks stream forever in every direction; no edges. More "open world," more streaming complexity.
- [ ] Write-in:

## Q6. New things to encounter — what else can we add? (multi — my "what else")

Grounded in the current engine, roughly cheap → rich:

- [x] **Moons & rings** — planets get orbiting moons / ring gates you thread (moons move only while you fly, so still pause-safe).
- [x] **Wormhole pairs** — enter one, exit its twin elsewhere (separate from the black-hole-home teleport).
- [ ] **Asteroid fields & comet debris** — dense clusters to weave through; flavor + light hazard.
- [ ] **Nebula currents** — regions that push/drag your flight (extends the pulsar idea to areas).
- [x] **Star variety** — giants, dwarfs, binary pairs (two-body gravity you can thread or get flung by).
- [x] **Derelict stations / artifacts** — landable loot spots that feed the economy or the map.
- [x] **Rogue comets / drifters** — gentle moving NPC bodies; the first "life" in the world.
- [x] **Named regions & a zoom-out star map** — a Diablo-style map screen showing what you've found + your waypoints.
- [ ] **Photo mode** — pause and frame a shot; the visuals are already gorgeous.
- [ ] Write-in:

## Q7. The town — what's actually *in* it?

- [x] **Cosmetics only** *(recommended for the slice)* — comet skins / trail colors bought with stardust; no power creep, keeps it chill.
- [ ] **Upgrades** — bigger orbit-capture window, longer trails, a map upgrade, extra portal charges (mild progression).
- [ ] **Hub & missions** — a proper social-feeling hub that dispenses bounties and tracks discoveries.
- [ ] **Just rest & save** — a calm place to bookmark and stop; no economy at all.
- [ ] Write-in:

## Q8. Relationship to the golf modes

- [x] **Third mode, golf untouched** *(recommended)* — start screen gains **🌌 Explore** next to ♾ Endless and ⛳ 9-Hole Round; the golf modes stay exactly as they are.
- [ ] Explore *replaces* Endless (Endless becomes the open world).
- [ ] Golf feeds Explore — round scores earn stardust for the town.
- [ ] Write-in:

## Q9. Performance guardrails (confirm — these are non-negotiable, just checking the bar)

These are how "complexity without frame drops" gets kept. Default: **all on.**

- [x] Only bodies near the camera exert gravity & get drawn (spatial culling) — everything off-screen sleeps.
- [x] World generated in **chunks**, seeded by coordinate; distant chunks unloaded.
- [x] Hard caps on particles/trail length; parallax starfield is cheap layered noise, not thousands of sprites.
- [ ] Also: cap the target device — if it must hold 60fps on your phone specifically, say so and that becomes the test bar.
- [ ] Write-in a perf worry I haven't listed:

---

## My recommended v1 (if you'd rather just green-light a shape)

A **vertical slice** (Q1): bounded sector, smooth-follow camera, free flinging with slingshot-chaining as the traversal skill (Q4/Q5). **Black holes are home-wormholes**, town has a return portal to your last black hole (Q3). Exploring is about **discovery + collecting stardust** (Q2); town spends stardust on **cosmetic comet/trail skins** (Q7). Seed-persistent world with saved home bookmark. Ships as a **third 🌌 Explore mode**, golf untouched (Q8), with all perf guardrails on (Q9). First encounters kept cheap: **moons, asteroid fields, a zoom-out map** (Q6) — the richer bodies come after your verdict on the slice.

- [ ] **Yes — build the recommended v1 slice** (then I answer the rest after playing it)
- [ ] I'll answer the questions above instead

---

*When answered: this becomes a design note + a sliced backlog (camera/streaming first, then encounters, then town/economy) in [Improvements](../../games/black-hole-in-one/ideas.md). Big enough that it'll be several ships, not one.*
