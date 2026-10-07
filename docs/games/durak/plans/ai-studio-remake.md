# Durak — Google AI Studio Prompt: A Simple Version With the Rules Right

**Links:** [Durak](../README.md) · [Ideas](../ideas.md) · [Roadmap](../../../roadmap.md) · [Playtest log](../../../playtest-log.md)

> **What this is:** a prompt for Google AI Studio's **Build** mode (it should also work in Gemini Canvas) that makes a very simple Durak whose rules are exactly right. Written 2026-10-07 from `games/durak/`'s rules engine and decision history, and rewritten the same day at Yev's direction: *"i don't want it to have any russian references. i want the prompt to make a very simple version of durak but for the rules to be right."*
>
> **What's in and what's out:** the rules section is the arcade engine's, word for word in meaning, including the parts settled by playtests and bug fixes: only the defender's neighbours add cards (p1-56), the cap on unbeaten cards and moves that play themselves (p1-53), and the refill order. Left out for simplicity: the Transfer variant, hot-seat, difficulty levels, sound, coach, game log, Watch mode, stats and themes.
>
> **Who attacks first:** the player holding the lowest trump, at the start of every game. That's the classic rule and Yev's call (2026-10-07), for this prompt and for the arcade build. The arcade build still lets the human lead every game until roadmap [p1-57](../../../roadmap.md) ships.

## How to use it

1. In AI Studio's Build mode, pick the most capable Gemini model and paste the **Prompt** below on its own.
2. Play a game or two in the preview, then paste **Check the rules**. It makes Gemini prove the rules with a hidden test page and fix whatever fails.
3. If a rule still looks wrong, use the **Bug report** template.

The prompt forbids the Gemini API on purpose. Build mode likes to wire Gemini into apps, which would need an API key and a network connection. The computer players should be ordinary code.

## Prompt

```text
Build a very simple web version of the card game Durak: one human against 1–5 computer players, in the browser. Keep the look and the features minimal. What matters most is that the rules are exactly right.

CONSTRAINTS
- Client-only: no backend, no login, no database. Do NOT use the Gemini API or any AI/LLM service; the computer players are ordinary code. It must work offline and need no API key.
- No external image, font or audio files. Draw the cards with SVG or CSS. No sound.
- Put the rules in their own module with no React and no DOM (e.g. src/engine/durak.ts): pure functions over a plain game-state object, exposing legalMoves(state, seat) and applyMove(state, move). The screen and the computer players only ever choose from legalMoves.

RULES — implement exactly
Cards
- A 36-card deck: 6, 7, 8, 9, 10, J, Q, K, A in four suits. Ace is high.
- Shuffle and deal 6 cards to each player. Turn the bottom card of the deck face up: its suit is trump. It lies face up under the deck and is the last card drawn. With 6 players every card is dealt, so the last card dealt is shown to everyone to set trump, and it stays in that player's hand.
- A card beats another if it is the same suit and higher, or if it is a trump and the other card is not. A trump beats a lower trump.
- Who attacks first, at the start of every game: after the deal, the player holding the lowest trump in their hand. The face-up trump under the deck is not in anyone's hand, so it doesn't count (with 6 players it was dealt, so it does). Show everyone the card, e.g. "CPU 2 has the lowest trump, 7♥, and attacks first". If nobody holds a trump, the human attacks first.
- Play goes clockwise. The attacker always attacks the next player clockwise who is still in the game; that player is the defender.

A bout
1. The attacker plays any one card face up. This is an attack card.
2. The defender must beat it with one card from their hand, or Take.
3. Once every attack card on the table is beaten, another attack card may be added, but only one whose rank matches a card already on the table (any attack or defence card). The defender must beat it, or Take, before anyone adds again.
4. Only the defender's neighbours may add attack cards: the nearest player still in the game on each side of the defender. One of them is always the attacker. Nobody else joins the bout. With 2 players left that is just the attacker; with 3, both other players.
5. When every attack card is beaten, the attacker gets the first chance to add a card or Pass. If the attacker passes, the other neighbour gets the chance. When every neighbour has passed in a row, the defence succeeded (with 2 players, the attacker's pass ends it). A newly added card resets this: once it is beaten, the attacker gets the first chance again.
6. Limits: at most 6 attack cards in one bout, and the unbeaten attack cards on the table may never outnumber the cards in the defender's hand.
7. Take: instead of beating an open attack, the defender may Take. The neighbours may then add more matching-rank cards (the attacker first, same limits), then tap Done. When every neighbour is done, the defender picks up every card on the table.
8. If the defence succeeded, all the cards on the table go face down to the discard pile and are out of the game.

After each bout
- Players refill their hands to 6 from the deck in this order: the attacker first, then the other neighbour, then the defender last. Stop when the deck runs out.
- If the defence succeeded, the defender attacks next (or, if they just went out, the next player still in the game). If the defender took, they are skipped, and the next player still in the game after them attacks next.

End of game
- At the end of each bout, after refilling: once the deck is empty, any player with no cards left is out (they have escaped). Players only go out at the end of a bout, never in the middle of one.
- The last player still holding cards is the Durak and loses. If the last players run out of cards in the same bout, the game is a draw.

PLAYING
- Tap a card to play it. Dim the cards that can't be played right now.
- Show Take, Pass or Done buttons only when they are legal, at least 44px tall.
- One line above the hand always says what to do now, for example: "Your attack: play any card", "Beat the 9♠ or Take", "Add a 7 or a 10, or Pass", "CPU 2 is taking: add more or tap Done". When the neighbour rule leaves you out, say so: "Only CPU 1 and CPU 3 may add cards".
- If your only legal move is Pass, Done or Take, show a short message ("Nothing to add, passing…") and make the move after about 0.7 seconds.
- Computer players move after about half a second, so you can follow what happened.
- The game must never get stuck: whoever's turn it is always has a legal move.

LOOK
Simple and clean. A green table. Standard-looking cards: white faces, red and black suits, a large rank and suit in the corner. The opponents across the top, each showing a name, a card back with how many cards they hold, and whether they are attacking or defending. The deck with its count and the trump card visible under it, the discard pile, and a label naming the trump suit. Your hand along the bottom, overlapping if needed, with every rank readable. A short slide when a card moves is all the animation it needs. It must fit a phone screen in portrait without scrolling, and also work on a laptop.

SCREENS
- Start: the number of players (2–6, default 2) and a Play button.
- Game, with a Rules button that shows a short summary of the rules above.
- End: the order players escaped in, who is the Durak, and Play again.

COMPUTER PLAYERS
One sensible level: attack and add with the lowest non-trump cards (the lowest trump only when they hold nothing else), beat with the cheapest card that works (same suit before trump), keep trumps while the deck is big, and Take rather than spend high trumps early in the game.

DONE MEANS
Full games play to the end with 2, 3, 4, 5 and 6 players and never get stuck, all 36 cards are always accounted for, and every rule above holds.
```

## Check the rules

```text
Now check the rules. Add a hidden test page (open it by adding ?test to the URL) that runs the rules module without the screen and shows PASS or FAIL for each check.

1. Play 500 games with every seat played by the computer, 100 at each player count from 2 to 6, from fixed seeds. After every move, check that: the player whose turn it is has at least one legal move; all 36 cards are accounted for (deck + hands + table + discard); a bout never has more than 6 attack cards; unbeaten cards never outnumber the defender's hand. Every game must end within 1000 moves.
2. Set up these positions by hand and check the result:
   - Beating: a higher card of the same suit beats; a lower one doesn't; a card of a different non-trump suit never does, however high; any trump beats any non-trump; a higher trump beats a lower trump.
   - With 6 attack cards on the table, all beaten, nobody can add a 7th, even when the defender holds plenty of cards.
   - 4 players: the player across from the defender cannot add a card, even one with a matching rank.
   - 3 players: both other players may add cards.
   - A defender holding 2 cards who takes with 1 unbeaten card on the table can be given at most 1 more.
   - A defender who beats with their last card while the deck is empty: nobody can add, and the bout ends as a successful defence.
   - Refill order: the attacker, then the other neighbour, then the defender. With 3 cards left in the deck and everyone short, the defender gets none.
   - A successful defence makes the defender the next attacker; a Take skips them.
   - Deck and hand both empty means out, checked only at the end of the bout. The last two players running out in the same bout is a draw.
   - The player holding the lowest trump attacks first, whichever seat they're in, in every new game, not just the first. The face-up trump under the deck doesn't count. If nobody holds a trump, the human attacks first.
   - With 6 players, the last card dealt sets trump and stays in that player's hand, and counts when finding the lowest trump.
   - The game makes the Pass, Done or Take move by itself exactly when it is the player's only legal move.

Fix the rules module until everything passes, then show me the results.
```

## Bug report

```text
Bug: <what happened>.
Setup: <number of players>.
Table at the moment: <attack and defence cards on the table, whose turn it was, how many cards each player held, deck count>.
Expected: <what the rules in my first message say should happen>.
First add a test that reproduces this on the ?test page and show it failing. Then fix the rules module and show the whole test page passing. Don't change anything else.
```

## Quick check on your phone

- [ ] A full game at 2 players and one at 4 both end without getting stuck.
- [ ] Each new game opens by showing who holds the lowest trump, and that player attacks first, even when it isn't you.
- [ ] You can read every card in your hand, the trump under the deck, and each opponent's card count.
- [ ] At 4 players, when you're across from the defender, the line above your hand says you can't add cards.
- [ ] After you Take, the neighbours can add more, and you're skipped for the next attack.
- [ ] With the deck empty, the game ends with the right Durak.
