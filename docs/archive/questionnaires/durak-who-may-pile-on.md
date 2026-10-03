---
title: "Durak Questionnaire — Who May Pile On"
type: questionnaire
status: answered
game: durak
created: 2026-10-03
gates: []
tags: [questionnaire, durak]
---

# Durak Questionnaire — Who May Pile On

**Related:** [Studio Dashboard](../../README.md) · [Durak](../../games/durak/README.md) · [Roadmap](../../roadmap.md) · [Playtest log](../../playtest-log.md)

> **Status: answered 2026-10-03 (Q1=A, Q2=A), shipped the same day as p1-56.** Yev: *"no i want the traditional rules for only the nearest neigbors can pile on."* Asked 2026-10-03. Yev, from a phone game (4 players, vs Computer, Transfer on): *"i think i should have been able to add more to the bout but the computer auto played and didn't ask me to pile on."*

## What happened, replayed in the engine

Bout 1 from the game log: you attacked CPU 1 with 10♣ → CPU 1 transferred with 10♠ → CPU 2 covered with J♣ and Q♦ → CPU 1 threw in J♥ → CPU 2 took → CPU 1 passed → CPU 3 piled on Q♠ → CPU 3 passed → the bout ended. You held a 10 and a jack and were never asked.

That bout was replayed card for card in the engine (`games/durak/gameplay.js`). It does exactly what the log shows, on purpose. Only the **two seats next to the defender** may throw in (`adjacentContributors()` in `state.js`, and the README's "classic multi-player rules"). The transfer made CPU 2 the defender, and CPU 2's neighbours are CPU 1 and CPU 3. You sit across the table, so the game counted you out of that bout, even though you started it. Even with priority handed to you, `legalAttack` refused your 10♦.

The rule bites only at 4–6 players: at 2–3, every other seat already sits next to the defender. At 4 players you're shut out whenever the defender is the seat across from you. At 6, three seats sit out every bout.

**Nobody chose this rule.** An agent picked neighbours-only when multiplayer shipped (commit `63b56a8`), and you were never asked. **The game also contradicts itself:** ☰ → Rules says *"Other players can pile on by playing cards of the same rank"*, and the start screen says *"the others may throw in"* (EN and RU). Either way, that text gets fixed with your answer.

## Q1 — At 4–6 players, who may throw cards into a bout? 🔑

- [x] **A — Neighbours only (today).** Keep the classic rule and fix the Rules and start-screen text to say so. After a transfer, you can still be shut out of a bout you started.
- [ ] **B ⭐ — Everyone except the defender, as a start-screen rule switch next to Transfer, on by default.** This is what you expected mid-game, and it's a common way the game is played at home. The switch keeps the classic rule one tap away. Turn order: the attacker first, then clockwise. A seat that passed gets another chance whenever someone adds a card (today's rule, extended to every seat). The 6-card cap and the defender's-hand cap stay. Bouts get harder for the defender, and 5–6 player tables get more AI turns.
- [ ] **C — Everyone except the defender, always.** Same as B, with no switch; the neighbours-only rule goes away.

## Q2 — When the rule does shut you out, should the game say so?

*Only matters with A, or with B's switch off.*

- [x] **A ⭐ — Yes, on the line above your hand.** For example: *"CPU 2 is taking — only CPU 1 and CPU 3 (next to them) may pile on."* Today it says *"CPU 2 is taking — CPU 3 may pile on"* and gives no reason why you can't.
- [ ] **B — No.** The Thrower badges on the opponent tiles are enough.

## Q3 — Free space

Anything else about how a bout plays at a big table:

