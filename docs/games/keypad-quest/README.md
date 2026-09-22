# Keypad Quest

**Status:** Live (Production) — Invest tier, no dedicated design documentation until this pass (2026-07-22)
**Repo Path:** `games/keypad-quest/`
**Live URL:** https://yevrap.github.io/KamekoStudio/games/keypad-quest/

> **Planning (2026-07-22) — sprint scoped.** Yev asked to plan a sprint to make Keypad Quest "more interesting and complete." Taste & Tiers verdict was terse — "fun visualiser and learning things" (Invest) — same shape as river-run's "needs better auto run" and materials-run's "like the mechanic," both of which turned into modernization passes. Reading the actual code surfaced the real gap: **the tower-defense half of the game has almost no player agency and no fail state.** Full triage below and in [Improvements](ideas.md); creative forks in [Keypad Quest Questionnaire — Sprint Direction](../../questionnaires/keypad-quest-sprint-direction.md). **Nothing built yet — planning only.**

## What it is

A trivia-typing tower defense hybrid: answer flashcard-style Q&A pairs (World Capitals, Multiplication, Elements, or your own custom/imported decks) using one of three input modes — Tap-to-Spell (T9 scroll), T9 Smart (predictive), or Keyboard. Enemies orbit an elliptical track forever, growing in HP and speed every wave; towers placed around the track auto-fire at anything in range. There's no separate "build" action — every **correct answer places a tower**, and the tower type you get is whatever tier your current answer streak has unlocked (Basic → Rapid → Sniper → Splash at streak 0/3/5/8). A wrong answer resets your streak to 0 (no other penalty). Every 10th correct answer auto-levels-up one random existing tower for free.

## How it plays

- **Decks** are key→value pairs (`{k: 'France', v: 'Paris'}`); built-in decks are World Capitals (20), Multiplication (12), Elements (16); a full deck manager supports creating, editing, importing (plain-text paste or a base64 share-link URL param), and toggling which decks are active for a session.
- **Three input modes**, switchable mid-run without losing progress on the current answer: **Tap to Spell** (classic T9 multi-tap scrolling through letters per key), **T9 Smart** (predictive — press the key for each letter, the game validates against the known answer as you go), **Keyboard** (type directly, filtered to alphanumeric).
- **Streak → tower tier.** `typeForStreak(streak)` is the only thing that decides which of the 4 tower types gets built on a correct answer — the player never chooses. The tower-strip UI shows live progress toward the next tier ("2 more" etc.), which reads as a clear reward ladder.
- **Tower placement is fully automatic** (`bestSlot()` greedily maximizes distance from existing towers); the player can drag-reposition an already-placed tower by tapping it then tapping an empty slot, but can't choose where a new one lands.
- **Upgrades are automatic and random** — `upgradeRandom()` bumps one random tower's level every 10th correct answer, free, no player choice of target or stat.
- **Waves scale forever**: enemy HP ×1.2/wave, speed ×1.03/wave, more enemies per wave (`5 + wave×2`). **There is no lose condition** — enemies that aren't killed in time just keep orbiting; nothing costs the player anything. This was a deliberate 2026-07-11 call (Dev Log: "Keypad Quest operates on continuous, endless waves and has no discrete game-over state"), made in the context of removing a dead Auto-Restart toggle, not a considered "should this game have stakes" design decision.
- **Chill/Practice mode** halves enemy speed, otherwise identical. **Watch/Spectate mode** runs a "Virtual Typist" auto-player that types real answers into whichever input mode is active.
- **Progress persists**: high wave, best-clear-time per wave, and a checkpoint (every 5th wave, resumable from the menu) all save to `localStorage`.
- **Zero audio** — `fx.js` has a decent particle/ripple/float-text layer (bursts on kill/build, ripples on build/upgrade, floating combat text), but no sound anywhere in the game (confirmed: no `AudioContext`/`audio`/`sfx` reference in any of the 7 source files).
- **No in-game rules explanation** beyond the menu subtitle ("Build your defense by answering questions") — no help/howto overlay like Maze Warden's ❓ or Astro Salon's rules card.

## Design decisions and why

- **Correct answer = tower, not currency** — collapses "play the trivia game" and "play the tower defense game" into one action, which is what makes 5-minute sessions on a phone work without a second UI layer. This is a strength, not a gap — nothing in this pass proposes decoupling them.
- **Streak-gated tower tier reads as a reward ladder, but isn't a decision** — the tower-strip UI (showing the next unlock threshold) does real work making the streak feel like progress, but the player is never asked to choose anything about the tower-defense layer: not what to build, not where, not what to upgrade. Contrast every other Kameko TD/roguelike-adjacent game (Maze Warden's Upgrades tree, Pachinko's item choices, Materials Run's planned combo depth) — Keypad Quest is the one Invest-tier game where the "game" half of the hybrid is pure spectacle with zero agency.
- **No fail state is currently an accident of scope, not a verdict** — it was never actually chosen as "this game should be zero-stakes forever"; it was a side note when removing a dead Auto-Restart switch. Worth treating as an open question rather than a fixed design pillar.

## Known simplifications / cut scope

Only one enemy archetype exists (a plain HP/speed-scaling dot — no behavior variety, unlike Maze Warden's Bomber or Materials Run's planned hunter enemy). Only 3 built-in decks. No sound. No help overlay. Tower type/placement/upgrade are all automatic, not player-chosen (roadmap **p2-04**, open since 2026-07-07, is exactly this gap and has sat unpicked because it's gated on a real design fork, not a quick slot-in). Full list and roadmap cross-references: [Improvements](ideas.md).

## What happens next

Ship-now item (no creative fork): **p1-52**, an in-game help/rules overlay. Everything else — a real fail/pressure state, player-chosen tower type, deepening upgrades into a real spend, a second enemy behavior, sound, and built-in deck topics — is a genuine creative-direction fork and gated on [Keypad Quest Questionnaire — Sprint Direction](../../questionnaires/keypad-quest-sprint-direction.md) (open, asked 2026-07-22). Roadmap rows: **p1-52**, **p2-45…p2-49** (new), **p2-03/p2-04** (existing, enriched with this pass's findings). Full backlog: `docs/roadmap.md`.
