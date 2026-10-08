---
title: "In-Game Rule Checks Questionnaire"
type: questionnaire
status: open
created: 2026-10-08
gates: [p1-59, p1-60, p1-61, p2-53]
tags: [questionnaire, studio-wide]
---

# In-Game Rule Checks Questionnaire

**Related:** [Studio Dashboard](../README.md) · [In-Game Rule Checks plan](../planning/in-game-checks.md) · [Durak](../games/durak/README.md) · [Roadmap](../roadmap.md) · [Playtest log](../playtest-log.md)

> **Status: open, asked 2026-10-08.** You asked for tests that are "visible and runnable from the ui … runnable as if part of the game". The [plan](../planning/in-game-checks.md) puts a **🧪 Checks** panel in each game's ☰ drawer, piloted on Durak (p1-58). p1-58 needs none of these answers and ships on its own. Each question below gates a later slice. Tick one box per question; ⭐ is the recommendation.

## Q1 — ▶ Watch a check on the real table: what happens to the match you're playing? (gates p1-60)

p1-60 lets a check play out on Durak's real table, move by move, with the line above the hand narrating.

- [ ] **A ⭐ Pause it, play the check, put you back exactly where you were.** The panel sets your match aside, the check plays on the table, and **Back to my game** restores every card. Your record is never touched by the check.
- [ ] **B — Only between matches.** ▶ Watch appears on the start screen and after game over, never mid-match. Simpler, but you can't check a rule in the middle of a game where it confused you.
- [ ] **C — In a small table inside the panel,** not on the real one. Safe, but it doesn't look like the game.

## Q2 — Live rule guard: who sees it when a real match breaks a rule? (gates p1-61)

p1-61 checks the game's promises (no card vanishes, the player to move always has a move, the 6-card cap holds) after every move of a real match.

- [ ] **A ⭐ Developer Mode only.** With ☰ → ⚙️ App → Developer Mode on, a broken rule shows a 🐞 banner with **Copy bug report** (the state, the log and the version), which you can paste into a `fix` session. With it off, the guard is silent.
- [ ] **B — Everyone.** A gentle "something went wrong at the table" banner with the same Copy button, for anyone playing.
- [ ] **C — Don't build it.** The simulated games in the panel are enough.

## Q3 — Jam prototypes: do they get a minimal check list? (gates the `new-game` half of p1-59)

`new-game` says Lab prototypes get no unit tests today.

- [ ] **A ⭐ Yes, just the simulation promises:** a seeded run of the core loop that never gets stuck, ends, and conserves its pieces (cards, gold, cells). That's about 15 minutes of a jam, and it catches stuck loops before your phone playtest.
- [ ] **B — No.** Prototypes stay test-free; the promotion checklist adds checks when a draft graduates.
- [ ] **C — Yes, the full set,** rules included, from the first prototype.

## Q4 — A Check Room for the whole arcade? (gates p2-53)

- [ ] **A ⭐ Yes, one page.** It opens from the gallery's ☰ drawer and runs every game's checks, with a card per game showing its count, so you can check the whole arcade in one go. Game cards in the gallery stay as they are.
- [ ] **B — Yes, and badge the gallery cards too:** a small ✓ 52/52 on each game card from the last run. That needs one new saved key per game.
- [ ] **C — No.** Each game's own 🧪 panel is enough.

## Q5 — Anything else?

Free space: checks you want to see, what "looks nice" means to you here, or a game you want next after Durak.

&nbsp;
