# Kameko Studio Questionnaire — New Game Directions

> **Archived July 14, 2026 — answered and consumed same day.** Q1=A · Q2=B (strong preference, not a house rule) · Q3=A1 · Q4=B1+ with light unlocks · Q5=C1 **and** C3 (both) · Q6=C · Q7=A. Decisions applied: repo roadmap rows **p3-06 (A1 flow glider — next jam), p3-07 (C3 pachinko), p3-08 (B1+ one-tower TD), p3-09 (C1 durak score-attack)**; `docs/brief.md` genre-directions section rewritten (closes Taste & Tiers Q3). Concepts stay live in [Kameko Studio — New Game Directions (July 2026)](../../planning/new-game-directions.md). Kept as the record of the decisions.

## Q1 — Which direction jams first?

*Why it matters: sets the order of the next 1–3 jam sessions.*

- [x] **A** — Fast physics game (A1 flow glider / A2 gravity flick golf / A3 3D marble)
- [ ] **B** — Tower defense roguelike (B1 one-tower / B2 lane+hero / B3 maze-builder)
- [ ] **C** — Mechanic-blend roguelike (C1 durak scorer / C2 scratch cards / C3 pachinko)
- [ ] **D** — Two jams back-to-back — write which pair: ______
- [ ] **E** — None yet / rethink (write why): ______

## Q2 — Should "pause-proof" become a house rule?

*Why it matters: you wrote "but pausable" on the physics idea. If it's a hard requirement for **all** future games, jam briefs and the promotion checklist should say so (auto-pause on losing focus + instant resume), and concepts get filtered by it up front.*

- [ ] **A** — Yes, house rule: every new game must survive being dropped instantly and resumed later
- [x] **B** — Strong preference, not a rule — judge per game
- [ ] **C** — Only meant it for the physics game

## Q3 — Direction A: which physics concept?

*Why it matters: A2 is the recommended first jam (smallest, turn-based = perfectly interruptible); A1 has the highest "looks cool" ceiling; A3 is the Three.js showpiece but the riskiest on a phone.*

- [x] **A1** — One-touch flow glider (Tiny Wings-style dive/soar, streak-driven visuals)
- [ ] **A2** — Flick golf through gravity wells (recommended first)
- [ ] **A3** — 3D marble slope (Three.js showpiece)
- [ ] Skip this direction for now

## Q4 — Direction B: which TD frame, and how much hero?

*Why it matters: B1 matches your "The Tower for its simplicity" note and jams in a session; the hero question decides whether the Kingdom Rush / mo.co itch is core or a later layer.*

- [ ] **B1** — One-tower roguelike, no hero (recommended MVP)
- [x] **B1+** — One-tower roguelike **with** a tappable hero-sortie ability
- [ ] **B2** — Lane TD with a repositionable hero (Kingdom Rush-lite, bigger jam)
- [ ] **B3** — Maze-builder TD (Green TD homage)
- [ ] Skip this direction for now

Meta-progression between runs (unlocks that persist)?
- [ ] Pure runs, nothing persists (Balatro-clean)
- [x] Light unlocks (new upgrade cards join the pool after milestones)

## Q5 — Direction C: which blend base — and is durak fair game?

*Why it matters: the durak-likes were just demoted to the Lab as genre mashes. C1 blends at the scoring layer instead (durak as Balatro's poker) — but only worth building if the durak well isn't tapped for you.*

- [x] **C1** — Durak-deck score-attack roguelike — yes, nostalgia-as-base is exactly the point
- [ ] **C2** — Scratch-card roguelike (most novel for the arcade, smallest jam)
- [x] **C3** — Pachinko roguelike (double-counts as the physics game — pick this and Direction A can wait)
- [ ] Skip this direction for now

## Q6 — Look and tech for the winners?

*Why it matters: "i want it to look cool" — the answer decides whether jams budget for Three.js scenes or polished 2D canvas (particles, gradients, trails), which changes jam size.*

- [ ] **A** — Polished 2D canvas by default; Three.js only where the concept demands it (recommended — matches Modest bar)
- [ ] **B** — Three.js 3D as the default ambition for new games
- [x] **C** — Per-game judgment call by the agent

## Q7 — Scope path for winners?

*Why it matters: decides what "done" means for the next dev session.*

- [x] **A** — Standard loop: jam to the Lab at the Modest bar → you playtest → verdict decides promotion (recommended; matches [Kameko Studio — Agent Game Loop Roadmap](../../planning/agent-game-loop.md))
- [ ] **B** — Skip the Lab for the single top pick: build straight to gallery quality (drawer, e2e, module split from day one)

---

*When answered: triage moves winners to repo roadmap P3 rows + jam briefs, updates `docs/brief.md` (Taste & Tiers Q3), then archives this note to `docs/archive/`.*
