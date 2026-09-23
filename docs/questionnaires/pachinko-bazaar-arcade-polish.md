---
title: "Pachinko Bazaar Questionnaire — Arcade Polish"
type: questionnaire
status: partly-answered
game: pachinko-bazaar
created: 2026-07-14
gates: []
tags: [questionnaire, pachinko-bazaar]
---

# Pachinko Bazaar Questionnaire — Arcade Polish

**Related:** [Studio Dashboard](../README.md) · [Pachinko Bazaar](../games/pachinko-bazaar/README.md) · [Roadmap](../roadmap.md) · [Playtest log](../playtest-log.md)

> **Status: PARTIALLY ANSWERED.** Created July 14, 2026; Q3–Q6 answered July 15, 2026. **Q1 and Q2 are still open — play the arcade version (https://yevrap.github.io/KamekoStudio/games/pachinko-bazaar/) for a run or two and check them off.** Write-ins welcome after any answer. Overview: [Pachinko Bazaar](../games/pachinko-bazaar/README.md).

## Q1 — Physics & Aim Assist — ⏳ PENDING (needs a play session)

*The draft felt too fast/random and lacked agency. We toned down restitution (`REST_PEG`) and added the dotted-line first-bounce aim assist.*

- [ ] **A** — Feels great. The arc gives enough control, and bounces feel physical but readable.
- [ ] **B** — The aim assist arc is good, but physics still feel off (write what needs tuning: too slow? too floaty?): ______
- [ ] **C** — The aim assist isn't enough; we still need mid-fall agency (nudge/tilt buttons).
- [ ] **D** — The aim assist is actually *too* strong; it feels less like a physics toy now.

## Q2 — Audio & Juice — ⏳ PENDING (needs a play session)

*We added Web Audio synthesis for peg hits/buckets, plus screen shake and slow-mo on big drops.*

- [ ] **A** — Perfect. Satisfying without being overwhelming.
- [ ] **B** — Sound is good, but the visuals (shake/slow-mo) are annoying/distracting.
- [ ] **C** — Visuals are good, but the sound effects are annoying/grating.
- [ ] **D** — Needs *more* juice. It still feels a bit flat. (What would you add?): ______

## Q3 — The Bazaar & Items — ✅ ANSWERED (2026-07-15)

*We added Ghost Orb and Peg Upgrader, but right now items are one-time buys, meaning a good run empties the shop.*

- [ ] **A** — Keep the 1-time purchase model, just add a few more items to delay emptying the shop.
- [ ] **B** — Shift to a Balatro-style shop: Repeatable/stacking items with escalating prices.
- [x] **C** — Shift to a Peglin-style model: We should be buying *orb types* to choose from per drop, not just global passive buffs.

## Q4 — Board Variety (Future Depth) — ✅ ANSWERED (2026-07-15)

*Currently, the peg layout is the same staggered grid every round.*

- [x] **A** — The static board is fine; depth should come from items and orb choices.
- [ ] **B** — We need layout variety (funnels, diamonds, moving rows) to keep rounds interesting.
- [ ] **C** — We need "Boss Rounds" (e.g. "gold pegs are worth 0 this round", "meet quota in 2 drops").

## Q5 — Localization — ✅ ANSWERED (2026-07-15)

*The game is currently EN-only. Most arcade games are EN/RU.*

- [x] **A** — EN-only is fine for this game. No need to translate.
- [ ] **B** — Now that it's in the arcade, add RU localization to match the rest of the studio.

## Q6 — What's next for Pachinko Bazaar? — ✅ ANSWERED (2026-07-15)

- [ ] **A** — Polish based on this feedback, then it's "done" for now. Move on to the jam queue (flow glider).
- [x] **B** — It's fun enough to be a flagship. Let's do a deep feature sprint (stacking items, multiple boards) before moving on.
- [ ] **C** — Actually, I think I'm over it. Leave it as is and jump straight to the flow glider.

---

*Q3–Q6 are answered but not yet picked up into a roadmap row — no Pachinko Bazaar work has shipped since the promotion (roadmap still shows only p3-07 ✅). Once Q1/Q2 are also answered, the next session applies all of it as a sprint, logs it in the Dev Log, and archives this note.*
