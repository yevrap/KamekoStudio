---
title: "Materials Run Questionnaire — Modernization Direction"
type: questionnaire
status: partly-answered
game: materials-run
created: 2026-07-22
gates: [p2-06, p2-37, p2-38]
tags: [questionnaire, materials-run]
---

# Materials Run Questionnaire — Modernization Direction

**Related:** [Studio Dashboard](../README.md) · [Materials Run](../games/materials-run/README.md) · [Roadmap](../roadmap.md) · [Playtest log](../playtest-log.md)

> Created 2026-07-22, from planning session. Yev asked to plan improvements to make [Materials Run](../games/materials-run/README.md) feel more modern and visually interesting, and to develop the mechanic further — he likes it and called it "somewhat chaotic play" in the taste questionnaire (keep that quality, don't smooth it away). The resulting backlog is in the repo `docs/roadmap.md`: **p1-42…p1-47** (visual/juice polish, no open questions — agent-shippable as-is) and **p2-06, p2-37…p2-39** (mechanic depth — each below has a real creative fork gated on this note). Answer in chat or edit this file; write-ins welcome after any answer.

## Q1 — Material combo intensity (gates p2-06)

*Cross-material transitions (ice→sand = skid, water→ice = frozen slide) add momentum-affecting mechanics on a boundary crossing, not just visuals. How disruptive should they be?*

- [x] **A** — Mild flavor: a brief, readable nudge that doesn't really threaten a run.
- [ ] **B** — Lean into the chaos: combos should meaningfully throw the player around — bigger, harder-to-predict momentum swings, closer to the "somewhat chaotic" quality you already like.
- [ ] **C** — Something in between — build mild first, we can turn it up later once it's playable.
- [ ] Other: ______

## Q2 — New Survival enemy behavior (gates p2-38)

*All enemies today share one behavior: pure random-walk. p2-38's default (absent your steer) is a slow "hunter" that biases its walk toward the player instead of choosing randomly.*

- [ ] **A** — Go with the hunter default — simple, adds real pressure.
- [ ] **B** — I'd rather it interact with materials — e.g. an enemy that's much faster on ice, or slowed by water/sand (ties enemy behavior to the same material system the player deals with).
- [ ] **C** — Something else entirely (describe): ______
- [ ] **D** — Skip this one for now — the danger zone is enough variety.

## Q3 — Score Attack combo/streak system (gates p2-37)

*A hit-streak multiplier rewards chaining target hits quickly.*

- [ ] **A** — Numbers-only is fine: score-per-hit escalates, shown as a multiplier near the score.
- [x] **B** — Make it a bigger deal at high streaks — visual escalation (bigger bursts, maybe a brief speed/target-respawn change) so a hot streak actually *feels* different, not just scores different.
- [ ] **C** — Skip this one for now.

## Q4 — Sound

*The game currently has zero sound anywhere — no hits, no collisions, no danger-zone warning. Several sibling games (tysiacha, maze-warden, pachinko-bazaar) already have some audio layer.*

- [x] **A** — Yes, add sound as part of this pass — hit, collision, danger-zone warning, material-crossing cues.
- [ ] **B** — Not now — visual polish first, revisit sound as its own later pass.
- [ ] **C** — Only a couple of key cues (say which): ______

## Q5 — Visual identity vs. shared arcade chrome

*The visual polish items (p1-42…p1-46) are effects layered on the existing look — retro "Press Start 2P" pixel font, flat-ish UI, matching every other game's chrome. They don't touch that shared identity.*

- [x] **A** — Keep it consistent with the rest of the arcade — effects only, same font/chrome as every other game.
- [ ] **B** — I'm open to Materials Run having its own more distinct visual identity beyond the shared arcade look (describe anything specific you have in mind): ______

## Q6 — Free space

*Anything else you want folded into this pass — a mechanic idea, a game you've seen that nails this "chaotic skating" feeling, anything.*

-

---
*When done, leave it here — the next session reads it, applies your answers to p2-06/p2-37/p2-38 in `docs/roadmap.md`, and archives this note. The visual items (p1-42…p1-47) don't need this and can ship independently any time.*
