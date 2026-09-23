---
title: "Keypad Quest Questionnaire — Sprint Direction"
type: questionnaire
status: partly-answered
game: keypad-quest
created: 2026-07-22
gates: [p2-04, p2-45, p2-46, p2-47, p2-49]
tags: [questionnaire, keypad-quest]
---

# Keypad Quest Questionnaire — Sprint Direction

**Related:** [Studio Dashboard](../README.md) · [Keypad Quest](../games/keypad-quest/README.md) · [Roadmap](../roadmap.md) · [Playtest log](../playtest-log.md)

> Created 2026-07-22, from planning session. Yev asked to plan a sprint to make [Keypad Quest](../games/keypad-quest/README.md) "more interesting and complete." The two real gaps found reading the code: **no fail state** (waves scale forever but nothing ever goes wrong) and **no player agency in the tower-defense half** (tower type is streak-automatic, placement is auto-greedy, upgrades are random-automatic — the only real decision in the whole game is "answer correctly, fast"). One ship-now item (an in-game help overlay, roadmap **p1-52**) needs no answer here. Everything below is a genuine creative-direction fork — answer in chat or edit this file; write-ins welcome after any answer.

## Q1 — Should the game have a way to lose? (gates p2-46)

*Today: enemy HP/speed scale forever, but nothing bad happens if enemies aren't killed in time — they just keep orbiting. This was a side effect of a 2026-07-11 fix (removing a dead Auto-Restart switch because "no discrete game-over state exists"), not a deliberate zero-stakes design call. No fail state also means no natural session end beyond "I got bored and hit menu."*

- [ ] **A** — Yes, add real stakes: some way for a wave to actually fail (e.g. a "focus" meter that drains when enemies complete multiple full orbits alive, or an enemy that occasionally slips past and costs something). Gives the game an actual game-over + restart loop and makes "high wave reached" mean something, like every other Kameko TD.
- [x] **B** — No — keep it endless and zero-stakes on purpose. That's the appeal (answer at your own pace, nothing punishes a bad streak beyond losing the current tower tier). Instead of a fail state, make later waves *feel* harder without a way to actually lose (e.g. a visual "overwhelmed" escalation, or lean scoring/pacing rewards instead of survival pressure).
- [ ] **C** — Split it: keep Chill/Practice permanently zero-stakes (matches its name and existing half-speed tuning), but give **Play** mode (and Watch/Spectate) a real fail condition. Turns the existing Play-vs-Chill split into a real stakes difference, not just a speed multiplier.
- [ ] Other: ______

## Q2 — Should tower type be a player choice? (gates p2-45)

*Today `typeForStreak()` alone decides which of the 4 tower types (Basic/Rapid/Sniper/Splash) gets built on a correct answer — you never choose. The tower-strip already shows live progress toward the next unlock, which reads well as a reward ladder.*

- [ ] **A** — Keep the streak-gated unlock ladder exactly as is, but once a tier is unlocked, let the player tap its tower-strip chip to choose which *unlocked* type gets built next (instead of always defaulting to the highest tier). Small change, adds real tactical choice (e.g. deliberately building cheap Rapid towers for crowd control even after Sniper unlocks) without touching the streak-reward feel.
- [ ] **B** — Go further: decouple tower type from streak entirely. Streak instead governs something else (e.g. a damage/rate bonus, or the unlock pace), and every correct answer earns a build the player assigns a type to from the tower-strip. Bigger change, most agency.
- [x] **C** — Leave it alone — the automatic streak-tier ladder is the point (typing is the whole game; tower choice is a visual reward, not a decision), spend the sprint elsewhere.
- [ ] Other: ______

## Q3 — What should tower upgrades actually be? (deepens p2-04, already open since 2026-07-07)

*Today `upgradeRandom()` auto-bumps one random tower's level every 10th correct answer — free, automatic, not a choice. p2-04's original 2026-07-07 scope was "spend in-game currency (kills) on fire rate/splash/range."*

- [x] **A** — Build p2-04 as originally scoped: kills (or correct answers) become a spendable currency; a simple panel lets the player choose which stat to boost on which tower. The automatic every-10 level-up goes away, replaced by player spending.
- [ ] **B** — Keep the automatic free level-up as a nice "you're getting better" trickle, and add a *separate* optional currency-spend layer on top (e.g. a small persistent meta-currency across waves or runs) for deeper choices — additive, not a replacement.
- [ ] **C** — Leave upgrades automatic/random — not worth the added UI for a 5-minute session game.
- [ ] Other: ______

## Q4 — Enemy variety (gates p2-47)

*Only one enemy exists today — a dot that orbits and takes damage, HP/speed scale with wave. No behavior variety at all. (Every other Kameko TD added a second enemy specifically to fix a "too easy/samey" verdict — Maze Warden's Bomber, Materials Run's planned hunter.)*

- [ ] **A** — Add a second enemy type, but only once there's a real fail-state to threaten (i.e. gate this on Q1=A/C) — e.g. a fast enemy worth fewer points but harder to path/kill in time, tied to whatever stakes Q1 picks.
- [ ] **B** — Add enemy variety even without new stakes — e.g. a tankier/slower "boss" enemy every N waves as a pacing/visual beat (more HP, distinct color/shape), no new systems, works regardless of Q1's answer.
- [ ] **C** — Skip enemy variety this pass — the deck/question content already is the game's variety; put the effort into agency (Q2/Q3) instead.
- [ ] Other: ______

## Q5 — Sound

*Zero audio anywhere in the game today (confirmed via code search) — no correct/wrong cue, no tower-fire/enemy-death sound, no wave-clear fanfare. Several siblings (tysiacha, maze-warden, pachinko-bazaar, astro-salon) already have some audio layer; this is the same fork Materials Run's modernization pass just asked.*

- [x] **A** — Yes, add a basic WebAudio layer as part of this pass: correct/wrong cue, tower fire, enemy death, wave-clear/new-best fanfare (matches the FX moments `fx.js`/`gameplay.js` already have one-for-one).
- [ ] **B** — Not now — defer sound to its own later pass, focus this sprint on mechanics/agency.
- [ ] **C** — Only a couple of key cues (say which): ______

## Q6 — Built-in deck content (gates a lightweight p2-49)

*Only 3 built-in decks today (World Capitals, Multiplication, Elements), ~12-20 pairs each. Custom/imported decks already cover personal use cases, so this is only about what ships by default.*

- [x] **A** — Add a few more built-in decks — specific topics wanted: i want some easy math questions, us state abbreviations and spelled out states asking both, state capitals, country capitals______
- [ ] **B** — Fine as is — 3 built-ins plus custom/import coverage is enough, skip this round.

## Q7 — Free space

*Anything else to fold into this pass — a mechanic idea, something you've seen elsewhere that fits the trivia+TD blend, anything.*

- 

---
*When done, leave it here — the next session reads it, applies your answers to p2-45…p2-49 in `docs/roadmap.md`, and archives this note. p1-52 (help overlay) doesn't need this and can ship independently any time.*
