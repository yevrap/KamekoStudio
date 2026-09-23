---
title: "Tysiacha (1000)"
type: game
slug: tysiacha
tier: invest
status: arcade
play_url: https://yevrap.github.io/KamekoStudio/games/tysiacha/
code: games/tysiacha/
tags: [game, card-game]
---

# Tysiacha (1000)

**Links:** [Studio Dashboard](../../README.md) · [Lineup](../README.md) · [Roadmap](../../roadmap.md) · [Playtest log](../../playtest-log.md) · [Ideas](ideas.md)

> **Status:** arcade game · roadmap `p3-04` ✅
> **Play:** https://yevrap.github.io/KamekoStudio/games/tysiacha/
> **Code:** `games/tysiacha/`

## What it is

A 3-player trick-taking card game from the Russian/Belarusian card canon — the other classic besides durak. You play against two AI opponents (Vera and Boris), racing to **1000 points**. Built July 9, 2026 as the first jam through the new studio loop (pitched in-session; you picked it *without knowing the rules*, which set the core design constraint: **the game must teach itself**).

## Rules as implemented

- **Deck:** 24 cards — 9, J, Q, K, 10, A in each suit. Strength order **A > 10 > K > Q > J > 9** (the 10 outranks the King — the game's signature quirk).
- **Card points:** A=11, 10=10, K=4, Q=3, J=2, 9=0 → exactly **120 points per deal**.
- **Deal:** 7 cards each, 3 to the **talon** (face-down center pile).
- **Bidding:** the player left of the dealer is *forced* to open at 100; others raise by 10 or pass (passing is final). The winner is the **declarer** 👑.
- **Talon & exchange:** the talon is revealed to everyone, joins the declarer's hand; the declarer then passes one unwanted card to each opponent (hands even out at 8/8/8).
- **Tricks:** declarer leads. You must **follow suit**; if you can't, you must **play a trump**; only then anything. Highest of the led suit wins unless trumped. Winner leads next. 8 tricks per deal.
- **Marriages 💍:** holding K+Q of one suit, you may declare when *leading* one of them (after winning at least one trick — except the declarer may declare on the opening lead). The suit becomes trump immediately and scores: **♥100 / ♦80 / ♣60 / ♠40**. A later marriage overrides the trump.
- **Scoring:** declarer gets **+bid exactly** if trick points + marriages ≥ bid, otherwise **−bid**. Defenders keep their exact points. First to 1000 wins.

## Match setup — the New Match screen *(reworked July 11, 2026 — settings sprint)*

Everything match-scoped lives on a **New Match screen**, not in the drawer (same pattern as durak's start screen; your questionnaire pick Q1=A). The game boots to this screen — no more auto-spending a token on page load. It holds **player names** (rename any seat, persists), **target score**, and the classic rules below. The Play button is honest about cost: `▶ Play · 1 🪙` when starting fresh; changing rules mid-session restarts **free** (Q2=A). The ↺ button and the drawer's "🔁 New match / rules…" quick action both open it. Match settings persist across reloads now (they used to silently reset).

The ☰ drawer keeps only instant, persisted settings — language, AI difficulty, sound, 1-tap play — plus quick actions (rules, coach, new match) and the shared arcade chrome (game switcher, tokens, theme).

## Watch Mode (unified 2026-07-12 — Settings & Automation Cleanup Sprint 3)

A single **▶ Watch** entry point lets you watch the AI play against itself. The original "Simulated Tournament" / "Auto Play Visualizer" naming and its separate binary Fast Forward toggle are gone — every game's automation now shares one drawer section, visible only while watching:
- **Speed** — Slow / Normal / Fast, a 3-way segmented picker (not the old binary Fast Forward).
- **Reveal all hands** — toggle to see every seat's cards face-up while watching.
- **Take over / stop** — tap any card to seamlessly take over the human seat mid-watch; if you're faster than the AI, your action executes. A stop action ends the watch and hands control back.
- **Auto-restart** — starts a new match automatically when the current one ends.

Classic tournament rules, toggled on the New Match screen:
- **Target Score**: Default is 500 (Quick Match) but can be set to the classic 1000.
- **The Barrel (бочка)**: When a player reaches 120 points below the target (e.g. 880 or 380), they sit on the barrel. They must win the bid and fulfill it to win the match. Three failed attempts in a row knock them down 120 points.
- **Bolts (болты) ⚡**: If a player takes 0 tricks in a deal, they receive a bolt. Earning 3 bolts incurs a −120 point penalty.
- **Rounding**: Trick scores can optionally be rounded to the nearest 5 at the end of a deal.
- **Hidden Points**: Hides opponents' running score totals during play for a more authentic, hardcore experience.
- **Raspasy**: If all 3 players pass during bidding, the deal becomes a negative round. The talon is discarded and every point taken in a trick subtracts from your total score.
- **Re-raise**: The declarer may raise their own bid after picking up the talon, prior to leading the first card.

## Language, opponents & sound (added 2026-07-10 — the "Language & Opponents" sprint)

- **🇷🇺 Русский язык**: full Russian translation behind a toggle in ⚙️ — every banner and log line, the coach, the rules overlay, settings, scoring notes, and the rank letters on the cards themselves (Т В Д К instead of A J Q K). Switching applies **live, mid-deal, no restart**, and because game history is stored as typed events, the whole 📜 log re-renders in the new language. Default English; you're addressed as «Вы». Wording settled July 12, 2026: «объявляет марьяж» stays (no «Хвалюсь!»), English default stays — per the archived [Tysiacha Questionnaire — Language, Difficulty & Sound](../../archive/questionnaires/tysiacha-language-difficulty-and-sound.md).
- **AI difficulty** (⚙️, live): **Easy** — timid bids, ~⅓ random misplays, forgets marriages, never re-raises; **Normal** — the original heuristic; **Hard** — tight bid pricing, protects K+Q pairs, contests points sooner, and wins a trick specifically to unlock declaring a held marriage. No look-ahead at any level, by design.
- **Player names** (on the New Match screen since July 11; applied at next match): rename any of the three seats; defaults stay localized (You/Vera/Boris ↔ Вы/Вера/Борис). Renaming yourself switches the log to third person; Russian lines use «игроку <имя>» so custom names never need grammatical declension. *(Was briefly broken July 10 by the drawer migration — the boot crash fixed in p0-12.)*
- **Sound** (⚙️ toggle, default on): three synthesized WebAudio effects, no audio files — card snap on every play, a two-note chime on a declared marriage, a gavel knock when the bidding is won.

## The teaching layer (the point of this draft)

- **Single-page Rules Reference** accessible via the `Rules` button.
- **Hint bar** (toggleable via the `Hint` button, off by default): contextual one-liners at every decision — hand-strength estimate during bidding with a risk ceiling, what to dump in the exchange, marriage opportunities when leading, "must follow ♥ / must trump" when following, which of your cards would win the current trick.
- **Legal-move enforcement:** illegal cards are dimmed and unplayable; tapping one explains *why*.
- **Two-tap play:** first tap raises a card, second confirms — no fat-finger misplays.
- **Full transparency:** everyone's running deal points and trick counts are visible (unless Hidden Points is enabled).
- **Trick clarity** *(added 2026-07-09, sprint slice 1 — see [Tysiacha — Game Log & Clarity Design](../../archive/plans/tysiacha-game-log-and-clarity-design.md))*: a gold **led** badge marks who led the trick; during a trick the corner chip shows both facts that decide it ("♦ led · no trump"); the winning card pulses before the sweep; and the trick banner says *why* it won ("+13 — highest ♦" / "trumped with 9♠"). Under the hood every game action logs to a match-long event stream.
- **📜 Game log** *(added 2026-07-09, sprint slice 2)*: the scroll button on the table opens a reviewable history of the whole match — deals in collapsible groups, tricks labeled, marriages/bids/results color-coded — and it records what the Hint coach *would have said* at every one of your decision points even when hints are off, so a confusing moment can be replayed after the fact. Completed tricks render as **audit rows** — the three cards in play order, leader tagged, winner gold-bordered — and the deal-end screen has a "📜 Review deal" button into the log. Closed by default; the game plays on underneath.

## Design decisions & simplifications

| Decision | Why |
|---|---|
| Forced 100 opening bid | Every deal has a declarer; teaches the bid/fail drama immediately (the standard rule, kept unless Raspasy is enabled). |
| Talon revealed to all | Common home variant; better for learning than a hidden talon. |
| Declarer may declare a marriage on the opening lead | Common variant; helps the declarer make the bid, feels good, one less rule exception to teach. |
| AI: heuristic, no look-ahead | Bids from hand estimate + marriage value; leads aces / declares marriages / wins tricks cheaply. Good enough to punish mistakes, not oppressive. Difficulty (2026-07-10) tunes the estimate noise and adds/removes play mistakes rather than adding search. |
| Russian: formal «Вы», «марьяж» terminology | Neutral defaults pending Yev's wording pass — «ты» and «Хвалюсь!» are one-line switches in `i18n.js`. |
| Names never declined in Russian | Log lines phrase around «игроку <имя>» so any custom name works without case endings. |
| Sound synthesized, not sampled | Keeps the repo asset-free (static-files constraint); each new sound is a few lines in `sfx.js`. |
| Hints in the log are snapshots | The 📜 log records what the coach *said at that moment*, so hints logged before a language switch keep their original language — an accurate record, not a bug. |

## How it was verified

Full browser playthroughs at phone size: a deal as declarer (♣ marriage declared, 100 bid made → +100) and as defender (AI declarer failed her bid → −100). The 120-point invariant held in both deals; zero console errors. Repo test suite unaffected (drafts carry no tests by design).

## Where this goes next

1. **All questionnaires answered & archived** as of July 12, 2026 — Rules & Direction, Language/Difficulty/Sound, and (same day, evening) [Tysiacha Questionnaire — Open Decisions (July 2026)](../../archive/questionnaires/tysiacha-open-decisions-july-2026.md). That last one confirmed the relaxed-bidding all-pass default (p2-30), made Scripted First Deal the teaching priority with an added tutorial-mode ask (p2-15), greenlit AI personalities (new: p2-31), and confirmed Hot-Seat Mode should actually be built (p3-05).
2. **Next up on the roadmap:** turn/phase + contract HUD (p1-26), more sounds (p1-27), free match-end restart (p1-28), relaxed bidding (p2-30), scripted first deal + tutorial (p2-15), AI personalities (p2-31). Idea inbox: [Improvements](ideas.md).

*Related: [Kameko Arcade](../README.md) hub · [Kameko Studio — Agent Game Loop Roadmap](../../planning/agent-game-loop.md) · ship details in [Dev Log](../../archive/dev-logs/arcade.md).*
