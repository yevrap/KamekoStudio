# Build Durak v1

Build version 1 of **Durak**, a card game, as a web app. Keep it simple. The most important thing is that the rules below are exactly right; looks and extras can come later.

## What to build

- One human against 1–5 computer players (2–6 players in total). The player count is chosen on the start screen; the default is 2.
- It runs entirely in the browser. No backend, no login, no database.
- Do **not** use the Gemini API or any AI service. The computer players are ordinary code. The game must work offline and need no API key.
- No external image, font or sound files. Draw the cards with SVG or CSS. No sound in v1.
- It is made for a phone held upright, and must also work on a laptop.

## The rules of Durak — implement exactly

### Cards

- A 36-card deck: 6, 7, 8, 9, 10, J, Q, K, A in each of the four suits. Ace is high.
- Shuffle and deal 6 cards to each player. Then turn the bottom card of the deck face up: its suit is the **trump** suit. That card stays face up under the deck and is the last card anyone draws.
- With 6 players all 36 cards are dealt. The last card dealt sets the trump suit instead: show it to everyone, and it stays in that player's hand.
- A card beats another card if it is the same suit and higher, or if it is a trump and the other card is not. A higher trump beats a lower trump. Nothing else beats a card.

### Who goes first

- At the start of every game, the player holding the **lowest trump** attacks first. Show everyone that card, for example: "CPU 2 has the lowest trump (7♥) and attacks first".
- The face-up trump under the deck is not in anyone's hand, so it doesn't count. (With 6 players it was dealt, so it does.)
- If nobody holds a trump, the human attacks first.

### Turn order

- Play goes clockwise.
- The attacker always attacks the next player clockwise who is still in the game. That player is the **defender**.

### A bout

1. The attacker plays any one card face up. This is an attack card.
2. The defender must beat it with one card from their hand, or **Take**.
3. Once every attack card on the table is beaten, another attack card may be added, but only one whose rank matches a card already on the table (any attack or defence card). The defender must beat it, or Take, before anyone adds again.
4. Only the defender's **neighbours** may add attack cards: the nearest player still in the game on each side of the defender. One of them is always the attacker. Nobody else joins the bout. With 2 players left, that is just the attacker; with 3, it is both other players.
5. When every attack card is beaten, the attacker gets the first chance to add a card or **Pass**. If the attacker passes, the other neighbour gets the chance. When every neighbour has passed in a row, the defence has succeeded. (With 2 players, the attacker's pass ends it.) A newly added card resets this: once it is beaten, the attacker gets the first chance again.
6. Limits: at most 6 attack cards in one bout, and the unbeaten attack cards on the table may never outnumber the cards in the defender's hand.
7. **Take:** instead of beating an open attack card, the defender may Take. The neighbours may then add more cards of matching ranks (the attacker first, with the same limits), then tap **Done**. When every neighbour is done, the defender picks up every card on the table.
8. If the defence succeeded, all the cards on the table go face down to the discard pile. They are out of the game.

### After each bout

- Players refill their hands to 6 cards from the deck, in this order: the attacker first, then the other neighbour, then the defender last. Stop when the deck runs out.
- If the defence succeeded, the defender attacks next. If the defender has just gone out, the next player still in the game attacks instead.
- If the defender took, they are skipped: the next player still in the game after them attacks next.

### End of the game

- At the end of each bout, after refilling: once the deck is empty, any player with no cards left is out. They have escaped. Players only go out at the end of a bout, never in the middle of one.
- The last player still holding cards is the **Durak** and loses.
- If the last players all run out of cards in the same bout, the game is a draw.

## How it plays on screen

- Tap a card to play it. Dim the cards that can't be played right now.
- Show the Take, Pass and Done buttons only when they can be used. Make them big: at least 44px tall.
- One line above the player's hand always says what to do now. For example: "Your attack: play any card", "Beat the 9♠ or Take", "Add a 7 or a 10, or Pass", "CPU 2 is taking: add more or tap Done". When the neighbour rule leaves the player out, say so: "Only CPU 1 and CPU 3 may add cards".
- If the player's only possible move is Pass, Done or Take, show a short message ("Nothing to add, passing…") and make the move for them after about 0.7 seconds.
- Computer players move after about half a second, so the player can follow what happened.
- The game must never get stuck: whoever's turn it is always has a move they can make.

## How it looks

- Simple and clean, on a green table.
- Standard-looking cards: white faces, red and black suits, and a large rank and suit in the corner.
- The opponents across the top. Each shows a name, a card back with how many cards they hold, and whether they are attacking or defending.
- The deck with its card count and the trump card visible under it, the discard pile, and a label naming the trump suit.
- The player's hand along the bottom, overlapping if needed, with every rank readable.
- A short slide when a card moves is all the animation v1 needs.
- Everything fits on a phone screen without scrolling.

## Screens

- **Start:** the number of players and a Play button.
- **Game:** with a Rules button that shows a short summary of the rules above.
- **End:** the order the players escaped in, who is the Durak, and Play again.

## Computer players

One sensible level:
- Attack and add with the lowest non-trump cards, and use the lowest trump only when they hold nothing else.
- Beat with the cheapest card that works, using the same suit before a trump.
- Keep trumps while the deck is still big.
- Take rather than spend high trumps early in the game.

## How to build it

- Put the rules in their own file with no React and no screen code (for example `src/engine/durak.ts`). It should contain plain functions over a plain game-state object, including `legalMoves(state, player)` and `applyMove(state, move)`. The screen and the computer players only ever pick moves from `legalMoves`, so nothing can break the rules.
- Add a hidden test page, opened by adding `?test` to the address, that runs the rules file without the screen and shows PASS or FAIL for each check below.
- Before you finish, make every check pass, and tell me the results.

### Checks for the test page

1. **Simulation:** play 500 games with every seat played by the computer, 100 at each player count from 2 to 6, from fixed random seeds. After every move, check that:
   - the player whose turn it is has at least one move they can make;
   - all 36 cards are accounted for (deck + hands + table + discard pile);
   - a bout never has more than 6 attack cards;
   - unbeaten cards never outnumber the defender's hand.

   Every game must end within 1000 moves.
2. **Set positions:** set up each of these by hand and check the result.
   - Beating: a higher card of the same suit beats; a lower one doesn't; a card of a different non-trump suit never does, however high; any trump beats any non-trump; a higher trump beats a lower trump.
   - With 6 attack cards on the table, all beaten, nobody can add a 7th, even when the defender holds plenty of cards.
   - 4 players: the player across from the defender cannot add a card, even one with a matching rank.
   - 3 players: both other players may add cards.
   - A defender holding 2 cards who takes with 1 unbeaten card on the table can be given at most 1 more.
   - A defender who beats with their last card while the deck is empty: nobody can add, and the bout ends as a successful defence.
   - Refill order: the attacker, then the other neighbour, then the defender. With 3 cards left in the deck and everyone short, the defender gets none.
   - A successful defence makes the defender the next attacker; a Take skips them.
   - A player with no cards and an empty deck is out, checked only at the end of the bout. The last two players running out in the same bout is a draw.
   - The player holding the lowest trump attacks first, whichever seat they are in, in every new game, not just the first. The face-up trump under the deck doesn't count. If nobody holds a trump, the human attacks first.
   - With 6 players, the last card dealt sets the trump suit, stays in that player's hand, and counts when finding the lowest trump.
   - The game makes the Pass, Done or Take move by itself exactly when it is the player's only possible move.

## Done means

- Full games play to the end with 2, 3, 4, 5 and 6 players and never get stuck.
- Every check on the test page passes.
- A first-time player can follow what is happening from the line above their hand.
