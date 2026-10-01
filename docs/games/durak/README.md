---
title: "Durak"
type: game
slug: durak
tier: invest
status: arcade
play_url: https://yevrap.github.io/KamekoStudio/games/durak/
code: games/durak/
tags: [game, card-game]
---

# Durak

**Links:** [Studio Dashboard](../../README.md) · [Lineup](../README.md) · [Roadmap](../../roadmap.md) · [Playtest log](../../playtest-log.md) · [Ideas](ideas.md)

Durak is a classic Russian card game for 2–6 players. Modes include vs Computer (1 human + 2–5 AI) and Hot-seat (2–6 humans sharing a device, with a pass-device cover at 3+ players).

## Rules / Mechanics
- Classic multi-player rules: throw-ins only from the two seats adjacent to the defender, 6-card attack cap.
- Pile-on during the defender's take — capped like any throw-in: unbeaten cards never outnumber the defender's hand (p1-53, 2026-09-30; before that the pile-on was capped only at 6).
- **Forced moves play themselves** (p1-53, 2026-09-30): when your only legal move is Pass, Done or Take, the game makes it after a 0.7s beat with a status line ("Nothing to throw — passing…" / "Nothing beats it — taking…"). In hot-seat a forced move by the next player is made at once, with no pass-device cover. On your turn, cards you can't legally play are dimmed.
- Ordered end-of-bout draws (attacker → contributors → defender).
- Elimination when hand and deck are both empty.
- Last player holding cards is the Durak.
- **Finishing placements** (July 11, 2026): the game-over screen lists every seat's finish — 1st, 2nd, … with your row highlighted and the Durak marked in red — not just who lost. Seats that empty on the same bout tie in seat order (see questionnaire Q3).

### Settings & Variants
- **Perevodnoy (Transfer):** When enabled, a defender may transfer the attack to the next player by playing a card of the same rank as the attack.
  - **First Turn Transfer:** An optional sub-rule allowing the very first attack of the game to be transferred.
  - **Transfer-or-beat choice** (July 11, 2026; inline since September 30, 2026 — p1-23): when a tapped card is legal as *both* a transfer and a defense (a trump matching the attack rank), the card lifts out of the hand and a small bar above the hand offers ⇄ Transfer or 🛡 Beat. Tap the card again, another card, or anywhere else to cancel. (It was a centered modal covering the table until p1-23.) Previously the game silently auto-transferred, taking the decision away.
  - **Multi-attack defense** (July 11, 2026; tap-to-target since September 30, 2026 — p1-22): after a transfer the field holds several undefended attacks. The defender keeps priority until all of them are covered (or they Take), and a defense card may cover *any* open attack it beats. When your card could cover more than one, it lifts, those attacks glow, and you tap the one to cover. A card that fits only one open attack still plays on a single tap.
- **Hand Sort** (July 11, 2026): ☰ menu → Current Match → Hand Sort: Off / Suit / Strength (weakest → strongest, trumps last). Display-only — the actual hand order never changes — and the preference persists across games.
- **Coach Hints:** When enabled, the game continuously queries the Hard AI for its recommended move during the human's turn. The advice is displayed in a banner above the cards and recorded into the Game Log to allow reviewing past hints.
- **Trump chip shows suit only, not rank** (p1-24, shipped): the actual trump card is already face-up under the deck, so the chip repeating its value would be redundant — it just shows the suit symbol.
- **Watch Mode** (☰ menu, unified 2026-07-12 — Settings & Automation Cleanup Sprint 3, p2-27): watch the AI play every seat, including yours; tap any card to seamlessly take over — if you're faster than the AI, your action executes. The drawer's Watch section (visible only while watching) holds Speed (Slow/Normal/Fast), a **Reveal all hands** toggle, and auto-restart.
- **Language / Язык** (p2-36, shipped 2026-07-20): full EN/RU toggle in the always-visible ☰ Quick Actions section, mirroring Tysiacha and Astro Salon — card faces (Cyrillic Т В Д К), status text, roles, coach banner, game log, gameover, rules overlay, and names/pass-device screens all switch live with no restart, including mid-match.

## Decisions & Why (July 11, 2026 sprint)
- **Bug fixed — post-transfer draw:** the seat that threw the original attack in a transferred bout stopped drawing replacement cards for the rest of the game (`playTransfer` was overwriting the internal draw-order list instead of adding to it). The existing test suite had unknowingly asserted the buggy behavior — a reminder that a variant this stateful needs tests written *against the reported bug*, not just against the code as first written.
- **Bug fixed — post-transfer hang:** Yev's playtest found the game stuck after a transfer ("CPU 2 attacking…" forever, screenshot in the inbox). Root cause: after covering one attack, priority went back to the attacker even with attacks still open — the attacker could neither add a card nor legally pass, so the AI spun forever. Priority now stays with the defender until the field is fully covered. Regression-tested; the perevodnoy variant had shipped with zero transfer tests, the suite now covers it.
- **Choice popup over auto-play:** a modal keeps the tap-to-play flow for the 95% case (single-purpose cards play immediately) and only interrupts when the card is genuinely ambiguous. *Update July 12, 2026: questionnaire Q2=C — the modal will be replaced by inline Transfer/Beat buttons above the hand (roadmap p1-23).*
- **Automatic defense targeting:** the defender never picks a target attack explicitly; each card covers the first open attack it can beat. Full control is still possible via tap order. A tap-attack-to-target flow was considered and deferred (questionnaire Q1). *Update July 12, 2026: Q1=B — tap-to-target is now the chosen direction (roadmap p1-22).*

## Decisions & Why (September 30, 2026 — p1-53)
- **Bug fixed — dead turns:** Yev was offered throw-ins the game wouldn't take — the defender had run out of cards, yet "Throw on or Pass" stayed up and the bout waited on Pass. Root cause: the engine gives priority to a seat with no playable card, and only the AI knew to pass. The same stall hit pile-on (Done), a thrower holding 0 cards, and a defender with nothing that beats or transfers (Take); hot-seat even put up a pass-device cover just to press Pass.
- **Auto-play forced moves, with a beat:** Yev chose a ~0.7s pause over an instant pass so the last card is seen landing, and auto-Take too (only when no defense *and* no transfer is legal). `forcedAction(seat)` in `gameplay.js` is the single definition of "only one move left"; the AI keeps its own pacing.
- **Dim unplayable cards:** a tap that won't work should look like it — covers the transfer case too (same-rank card when the next player holds too few cards to take the transfer).
- **Classic pile-on cap:** a defender who takes can't be handed more unbeaten cards than they hold — the same rule the throw-in already followed, now one shared `canThrow()` check so the two can't drift again.

## Decisions & Why (September 30, 2026 — p1-22 / p1-23)
- **One selection state for both:** a defense card that can mean more than one move — transfer or beat, or which of several attacks to cover — is *selected* rather than played; the inline bar and the glowing attacks are two faces of that one state, so the two features can't fight over the tap handler.
- **Unambiguous taps never ask** (agent's call): Q1 asked for "tap a card, then the attack". With 2+ open attacks, a card that can beat only one of them still plays at once — a second tap with exactly one legal answer is friction, and it's the same rule Q2 settled for transfer/beat. Easy to flip if you'd rather always pick explicitly with 2+ open: `playOrSelectDefense` in `main.js`.
- **The whole pair is the target:** the empty slot under an open attack overlaps the card's lower half, so a tap anywhere on the attack's pair counts — a bigger target on a phone.

## Known Simplifications
- AI personalities are limited by difficulty (Easy, Normal, Hard) and do not have unique per-seat behaviors.
- Same-bout eliminations tie in seat order on the placement list rather than being marked as explicit ties.
- The AI defender declares Take as soon as the first open attack has no beater in hand (it doesn't partially defend first — no benefit under the rules).
- **Default player names don't retranslate on their own** — a seat's default name (`CPU 2`, `Player 3`, …) is assigned once at match start; switching language mid-match re-derives any name the player hasn't overridden, but a name typed into the Edit Names screen mid-match (not reachable through the normal UI, which only exposes that screen from the start menu) would stay frozen in whichever language it was set in.

## Status
Playable. Live at [Kameko Studio - Durak](https://yevrap.github.io/KamekoStudio/games/durak/) — check `version.json` in the repo for the current build (a hardcoded version here goes stale fast; durak has kept shipping since v14).
Source: `games/durak/`

## Related
- [Improvements](ideas.md)
- [Durak Questionnaire — Open Decisions (July 2026)](../../archive/questionnaires/durak-open-decisions-july-2026.md) — answered & archived July 12, 2026 (AI personalities → p2-07 confirmed, token cosmetics → new p2-32, seeded deals → p2-12 confirmed, spectate reveal → p2-27 unblocked)
- [Durak Questionnaire — Perevodnoy UX](../../archive/questionnaires/durak-perevodnoy-ux.md) — answered & archived July 12, 2026 (tap-to-target, inline choice, win semantics)
- [Russian Localization Sprint](../../archive/plans/durak-russian-localization-sprint-july-2026.md) — p2-36 plan, shipped 2026-07-20, archived
- [Dev Log](../../archive/dev-logs/arcade.md)
