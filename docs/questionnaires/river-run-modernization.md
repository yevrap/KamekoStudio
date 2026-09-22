# River Run Questionnaire — Modernization Direction

> Created 2026-07-22, from planning session. Yev asked to plan a sprint to make River Run "more interesting and complete." The resulting backlog is in the repo `docs/roadmap.md`: **p1-48…p1-51** (score-display fix + juice polish, no open questions — agent-shippable as-is) plus the pre-existing **b-01, p1-05, p2-29** (also agent-shippable, already fully specified) and **p2-10** (biome transitions — visual-only baseline is agent-shippable). **p2-40…p2-44** below each have a real creative fork gated on this note. Answer in chat or edit this file; write-ins welcome after any answer.

## Q1 — Hit/death model (gates p2-40)

*Today any obstacle contact is instant game over — no lives, shield, or health bar. That's arguably part of river-run's current identity: fast, tense, dodge-or-die.*

- [ ] **A** — Keep it exactly as-is: one hit, game over. It's the point of the game.
- [ ] **B** — Add a shield/lives system (describe how many hits, and whether it's earned, a power-up, or both): ______
- [ ] **C** — Something in between — e.g. a brief invincibility/"graze" window right after a hit instead of full lives.
- [x] Other: i like the power ups idea in q2______

## Q2 — Floating power-ups (gates p2-41)

*No pickups exist today — only rocks/logs to dodge or shoot.*

- [x] **A** — Yes, add power-ups. Which ones interest you (check any):
  - [x] Shield / extra hit
  - [ ] Score multiplier
  - [x] Rapid-fire / spread shot
  - [ ] Speed control (temporary slow-down or boost)
  - [ ] Other: ______
- [ ] **B** — Not now — keep the river to just obstacles.

## Q3 — Near-miss scoring (gates p2-43)

*p1-51 ships a near-miss visual/audio cue (whoosh + flash) with zero score change, regardless of your answer here.*

- [ ] **A** — Yes, award bonus points for a tight dodge — the closer, the more (risk/reward).
- [ ] **B** — No, keep it a pure flourish — no scoring change.
- [x] **C** — Something else (e.g. a separate streak/multiplier instead of flat bonus points): i like the idea of a streak______

## Q4 — Obstacle/enemy variety (gates p2-42)

*Only two obstacle types exist today (rock, log), both static floating hazards that drift straight down the river with no motion relative to the boat.*

- [x] **A** — Add moving obstacles (e.g. ones that drift side to side, or track toward the boat's lane).
- [ ] **B** — Add an enemy that shoots back (return fire to dodge, not just collide with).
- [x] **C** — Tie new hazards to biome (p2-10) — e.g. lava chunks in the volcanic stretch, debris in space — instead of/in addition to generic new types.
- [ ] **D** — Keep it to rock/log for now — the two-type simplicity is fine. i want them to look nicer though
- [ ] Other: ______

## Q5 — Mode structure (gates p2-44)

*River Run has exactly one endless mode today.*

- [x] **A** — Keep it single-mode — endless is the whole point.
- [ ] **B** — Add a second mode (describe: Score Attack vs. Survival split like materials-run? A no-fail "Zen" visualizer mode? Something else?): ______

## Q6 — Biome transitions: visual-only or gameplay too? (gates p2-10's scope)

*p2-10 (forest → canyon → volcanic → space as score climbs) is already scoped as visual-only — fog/water-tint/lighting/geometry-color changes, no gameplay change — and is agent-shippable at that scope without waiting on this answer.*

- [ ] **A** — Visual-only is enough for now — ship p2-10 as scoped, revisit gameplay hooks later if it feels flat.
- [x] **B** — Go further — biomes should change gameplay too (pairs naturally with Q4=C above if you also want biome-specific hazards). i want the friction mechanic and the different bioms to be more noticible
- [ ] Other: ______

## Q7 — Free space

*Anything else you want folded into this pass — a mechanic idea, a game you've seen that nails this "river runner" feeling, anything.*

-

---
*When done, leave it here — the next session reads it, applies your answers to p2-10/p2-40…p2-44 in `docs/roadmap.md`, and archives this note. The score-display fix and juice items (p1-48…p1-51) don't need this and can ship independently any time.*
