# Durak — Google AI Studio Remake Prompts

**Links:** [Durak](../README.md) · [Ideas](../ideas.md) · [Roadmap](../../../roadmap.md) · [Playtest log](../../../playtest-log.md)

> **What this is:** a prompt kit for building a better-looking Durak in Google AI Studio's **Build** mode (it should also work in Gemini Canvas). Written 2026-10-07 from a read of `games/durak/` and its decision history. Paste the prompts **one at a time, in order**, and play a few minutes between each.
>
> **Why it's shaped this way:** the arcade build's rules engine is its strong part. It's tested, and every rule below was settled by a playtest or a bug fix: neighbours-only throw-ins (p1-56), the pile-on cap and forced moves (p1-53), the post-transfer hang and draw bugs (July 2026). Its weak part is presentation: dark low-contrast card faces with no pips or court art, opponents as single tiles above an empty felt, the trump card a sideways sliver, no sound. So Prompt 1 pins the rules down exactly and spends its freedom on look and feel. The roadmap pegs what makes Durak good as *nostalgia/cultural connection + 5–10 min sessions*, so the art direction is a home table, not a casino.
>
> **One deliberate change from the arcade build:** the player with the lowest trump leads (the classic rule). The arcade build always lets the human lead. Delete that line in Prompt 1 if you'd rather keep it.

## How to direct it

- Pick the most capable Gemini model in the model picker, and paste **Prompt 1 alone**. A request for everything at once comes back broken.
- Build mode writes React + TypeScript by default. Let it; fighting the template costs quality. Prompt 1 keeps the rules in a framework-free module, so a port back to the vanilla-JS arcade stays possible.
- Prompt 1 forbids the Gemini API on purpose. Build mode likes to wire Gemini into apps ("AI opponent powered by Gemini"), which would need an API key, a network connection and quota. The opponents should be ordinary local code.
- After each step, play in the preview. Then run the **Phone checklist** at the bottom before moving on.
- One concern per follow-up message. Rule bugs go through the **Bug report** template, which makes it write a failing test before it fixes anything.
- If it drifts from the rules, say: *"Re-read the Rules section of my first message. The engine must match it exactly; list every difference you find and fix them."*

## Prompt 1 — the game

```text
Build a polished, mobile-first web version of Durak (Дурак), the classic Russian card game: one human against 1–5 computer opponents. It should feel like a premium card-game app: beautiful, readable cards, a real table with opponents seated around it, crisp animation, sound, and opponents that play sensibly.

HARD CONSTRAINTS
- Client-only. No backend, no database, no login. Do NOT use the Gemini API or any AI/LLM service: the computer opponents are ordinary local code. The app must work offline once loaded and need no API key.
- No external image, font or audio files. Draw every card face, card back, suit and court figure as inline SVG/CSS; synthesize sound with the Web Audio API; use the system font stack.
- Put the rules engine in its own framework-free module (e.g. src/engine/durak.ts): pure functions over a plain, serializable game-state object, with no React, no DOM, no timers, and randomness only through an injected RNG/shuffle. Expose legalMoves(state, seat) and applyMove(state, move). The AI lives in its own module and picks only from legalMoves; it never bends the rules or looks at hidden cards.
- Save preferences and the win/loss record in localStorage.

RULES — implement exactly; every one of these is deliberate
Deck and deal
- 36 cards: 6 through Ace in four suits, Ace high. Shuffle and deal 6 to each player.
- Turn the next card face up: its suit is trump. It sits face up and readable under the deck, and it is the last card drawn.
- A trump beats any non-trump. Same suit: higher rank wins. Trump vs trump: higher trump wins.
- The player holding the lowest trump attacks first. Announce it briefly ("CPU 2 has the lowest trump, 7♥, and leads"). If nobody holds a trump, the human leads.
- Play goes clockwise. The attacker always attacks the next active player clockwise (the defender).

A bout
1. The attacker leads with any one card.
2. The defender covers each attack card with one card that beats it.
3. Throw-ins: more attack cards may be added if their rank matches any rank already on the table (attack or defence cards). ONLY THE DEFENDER'S TWO NEIGHBOURS may throw in: the attacker and the player on the defender's other side. Players further away sit the bout out. (With 2 players that is just the attacker; with 3, both other players.)
4. Limits: at most 6 attack cards per bout, and the unbeaten cards on the table may never outnumber the cards in the defender's hand.
5. Priority: after the lead, the defender acts. While any attack is open, the defender keeps the turn. Once everything is covered, the throw-in players may add (the attacker first, then the other neighbour). When both have passed in a row, the bout is defended.
6. The defender may give up at any point and TAKE. After they declare it, the two neighbours may still "pile on" extra matching-rank cards (same limits as above), then tap Done. The defender then picks up every card on the table.
7. Defended bout: all table cards go face down to the discard pile ("Бито").

Transfer variant ("Perevodnoy"; a setup toggle, off by default)
- Before covering any card, the defender may instead play a card of the same rank as the attack card(s). That transfers the whole attack to the next active player clockwise, who becomes the defender; the transferrer becomes the attacker.
- Allowed only if no attack card has been beaten yet, every attack card is that rank, and the next player holds at least as many cards as there will be attack cards on the table.
- A transferred attack can be transferred again. The new defender may face several open attacks and may cover them in any order. The turn stays with the defender until every open attack is covered.
- The throw-in neighbours move with the transfer: they are now the new defender's neighbours.
- Sub-toggle "Allow first-turn transfer" (off by default): when off, the first attack of the game cannot be transferred.

After the bout
- Everyone refills to 6 from the deck in this order: the attacker first, then the others who played attack cards in this bout (in the order they first played, including anyone who transferred), and the defender last.
- If the defence succeeded, the defender attacks next. If the defender took, they are skipped and the player after them attacks.

Ending
- Once the deck is empty, a player with no cards is out (they escaped).
- The last player holding cards is the Durak (the fool). If the final players all run out in the same bout, it's a draw.
- The game-over screen ranks everyone: 1st out, 2nd out, …, the Durak.

TURN FLOW — learned from playtesting an earlier version; keep all of it
- One instruction line sits right above the hand and is never truncated (it may wrap): "Your attack: play any card", "Defend the 9♠, or Take", "Throw in a 7 or a 10, or Pass", "CPU 2 is taking: pile on, or tap Done". When the neighbours rule leaves the human out, say why: "Only CPU 1 and CPU 3 (next to CPU 2) may throw in".
- On the human's turn, dim the cards that can't legally be played.
- Tapping a card plays it at once whenever there's only one thing it can do. When there are two, never guess: (a) a card that could transfer or beat lifts out of the hand, and two small buttons appear above the hand, "⇄ Transfer" and "🛡 Beat"; (b) a card that could cover more than one open attack lifts, the attacks it beats glow, and the player taps one. Tapping anything else cancels.
- Forced moves play themselves: if the human's only legal move is Pass, Done or Take, show "Nothing to throw, passing…" / "Nothing beats it, taking…" for about 0.7s, then do it.
- Brisk pacing: about 0.25s for an opponent's forced move, 0.4–0.7s for a real decision, about 0.3s per card flight. A lap around a 6-player table should rarely make you wait more than about 2 seconds. Show a "thinking" pulse on an opponent's seat only while someone else is up.
- Never deadlock: whoever holds the turn always has at least one legal move. A state with none is an engine bug, never something the UI waits out.
- Take / Pass / Done are big buttons (at least 44px tall), shown only when legal.

LOOK AND FEEL
Durak is the game people grew up playing at the kitchen table, at the dacha, on overnight trains. Make it feel like that table, not a casino: warm, evening-lit, tactile and a little nostalgic. Default to a dark, warm palette.
- Table: a warm wooden or patterned oilcloth tabletop under soft lamplight with a gentle vignette.
- Cards that look like real cards: cream faces, crisp red and near-black suits, big corner indices that stay readable on a phone when the hand overlaps, proper pip layouts for 6–10, stylised SVG court cards (J, Q, K) and a decorative Ace. A distinctive ornamental card back. Trumps in the hand get a subtle gold edge.
- Opponents sit around the table edge (an arc across the top in portrait). Each has an avatar or initial, a name, a small fan of card backs showing how many cards they hold, and a role tag (Attacking / Defending / Out). The seat whose turn it is gets highlighted.
- The deck shows a count and the face-up trump beneath it. The discard pile is face down. A "Trump ♥" chip sits in the header.
- On the table, attack cards sit side by side. Each defence card lies across its attack, offset and slightly rotated, so both ranks stay readable. Pairs never overlap each other; they wrap into balanced rows and shrink only when they must. An open attack shows a faint outline where its defence will go.
- The hand is a gentle fan along the bottom: overlapping, but with every corner index visible. Optional sort: by suit, or by strength with trumps last.
- Motion: deal from the deck; cards fly from hand or seat to the table; a defence card slaps onto its attack; Take sweeps the table into the defender's seat; "Бито" sweeps the table to the discard; refills fly from the deck. Respect prefers-reduced-motion.
- Sound (synthesized, with a mute toggle): card snap, deal riffle, defence thunk, take swoosh, a small chime for a successful defence, a game-over sting. A short vibration (navigator.vibrate, where supported) when it becomes your turn.
- Opponents say short lines in speech bubbles, in Russian with a small English gloss: "Беру!" (I'll take), "Бито!" (beaten), "Пас" (pass), "Перевожу!" (transferring).

SCREENS
- Start: title, a two-sentence rules summary, player count (2–6, default 4), the Transfer toggle with its first-turn sub-toggle, difficulty (Easy / Normal / Hard), and Play. Remember the last choices.
- In game: a small menu with Rules, Sound on/off, Hand sort, and New game.
- Rules: concise and consistent with the rules above, including neighbours-only throw-ins and that a transfer moves the bout.
- Game over: placements with the Durak called out, the human's lifetime win/loss/draw record, and Play again.

LAYOUT
- Portrait phone (390×844) is the main target. It must also work on a phone in landscape (short screen: compact seats, Take/Pass/Done beside the hand), on a tablet, and on a laptop (wider table and bigger cards, content capped around 1040px wide rather than stretched).
- viewport-fit=cover with env(safe-area-inset-*) padding for iOS, 100dvh heights, pointer events, touch-action: none on the play area. Nothing scrolls during play; everything fits on screen.

OPPONENTS
- Easy: plays its lowest legal card and takes readily.
- Normal: attacks and throws in low non-trumps, defends with the cheapest card that beats (same suit before trump), saves trumps while the deck is big, and takes rather than spend several high trumps early.
- Hard: Normal, plus it remembers every card it has seen (discards, and cards a player took), presses players who are low on cards near the end, transfers when it's cheap, and keeps trumps for the endgame.

DONE MEANS
- Full games play to the end at 2, 4 and 6 players, with Transfer on and off, and never get stuck.
- All 36 cards are always accounted for (deck + hands + table + discard).
- Every rule above holds, and the instruction line always tells the human what they can do right now.
```

## Prompt 2 — prove the rules (self-test page and Watch mode)

```text
Now prove the engine is right. Add a hidden test page (open it by adding ?test to the URL) that runs the engine without the UI and shows PASS/FAIL for each check, with details for each failure.

1. Simulation: 500 games with all seats played by the Hard AI, at every player count from 2 to 6, Transfer on and off, from fixed seeds. After every move, assert: the seat holding the turn has at least one legal move; all 36 cards are accounted for; nobody holds more than 6 cards after a refill; a bout never exceeds 6 attack cards; unbeaten cards never outnumber the defender's hand. Every game ends within 1000 moves.
2. Scenario tests, each building a specific table state by hand:
   - 4 players: the player across from the defender cannot throw in, even with a matching rank.
   - A defender with 2 cards facing 1 unbeaten attack can be given at most 1 more card, including in the pile-on after Take.
   - Transfer is blocked once any attack is beaten, when the next player holds too few cards, and on the first attack of the game when first-turn transfer is off.
   - After a transfer, covering one of two open attacks keeps the turn with the defender until both are covered. (This exact bug froze an earlier version.)
   - After a transfer, the player who made the original attack still refills at the end of the bout. (An earlier version dropped them from every later refill.)
   - Refill order: attacker, then the other throw-in players in order, defender last. With 3 cards left in the deck and everyone short, the defender gets none.
   - A successful defence makes the defender the next attacker; a Take skips them.
   - Deck empty and hand empty means out. The last two players running out in the same bout is a draw.
   - The lowest trump leads.
   - The forced-move logic returns Pass/Done/Take exactly when that is the only legal move.
Fix the engine until everything passes, then show me the results.

Also add Watch mode to the in-game menu: the AI plays every seat, including mine, at Slow / Normal / Fast, with an optional "reveal all hands" switch. Tapping any card or button takes over my seat. Add an auto-restart switch so I can leave it running to watch for stuck states.
```

## Prompt 3 — feel pass

```text
Polish pass, without changing any rules:
- Timing: check the pacing targets from my first message (forced 0.25s, decisions 0.4–0.7s, flights 0.3s, a forced human move 0.7s). Card flights should ease, not jerk. Nothing should feel sluggish at 6 players.
- Readability at 390×844: check every corner index in the fanned hand, the trump card under the deck, the opponents' card counts, and table pairs when 6 attacks are down. Fix anything below about 14px or with low contrast.
- Phone in landscape (844×390) and a small phone (360×640): nothing cut off, Take/Pass/Done always visible, no scrolling.
- Sound: balance the levels; nothing harsh; mute is remembered.
- Juice, kept subtle: a little card wobble on a hard slap; the table sweep on "Бито"; a short celebration when you escape; a playful but kind send-off for the Durak.
- prefers-reduced-motion: swap the flights for quick fades.
List what you changed.
```

## Prompt 4 — opponents with personalities

From roadmap [p2-07](../../../roadmap.md): *"named opponents with distinct styles makes the table feel alive."*

```text
Give the computer opponents personalities on top of the difficulty setting. Each seat gets a named character with a distinct, learnable style and honest "tells". For example:
- Бабушка Вера (Granny Vera): cautious; hoards trumps; takes early rather than spend a trump; hums when she's holding two or more trumps.
- Дядя Боря (Uncle Borya): reckless; throws in everything he legally can and transfers whenever possible; drums his fingers before a Take.
- Лёша (Lyosha): a quiet card counter; fast and even-paced, with almost no tells; sharpest in the endgame.
- Two more of your own, different from these.
Rules: the tells must be truthful signals a player can learn to read, never random noise, and personalities change only choices among legal moves. Show each opponent's portrait (SVG, no image files), name and a one-line style blurb on hover or long-press. Deal 1–5 of them to seats at random, with no duplicates. Add a scenario test showing that Vera and Borya make different choices from the same position.
```

## Prompt 5 — extras (pick any, one per message)

```text
Add a coach: an optional "Hints" switch that shows the Hard AI's recommended move for my turn in a small line under the instruction ("Coach: beat with 8♠ and save your trumps").
```
```text
Add a game log in the menu: every attack, defence, transfer, pass, take and refill this game, in plain language, newest at the bottom. Coach hints, if on, appear in a distinct style with a switch to hide them.
```
```text
Add Hot-seat mode: 2–6 humans share one device. Between turns, when the next human is a different person, show a "Pass the device to <name>" cover that hides the hands until tapped. A forced move (only Pass/Done/Take possible) plays itself without the cover. Names are editable on the start screen.
```
```text
Add a full English / Русский switch that applies live, mid-game: every string, the card ranks (В Д К Т for J Q K A in Russian), the rules screen and the game log.
```
```text
Add stats: wins/losses/draws, placements (1st, 2nd, …, Durak), take rate, average game length, current and best streak. Reachable from the game-over screen and the menu.
```
```text
Add a free picker for card backs (at least 3) and table styles (at least 3, e.g. kitchen oilcloth, dacha wood, night-train compartment), drawn in SVG/CSS only, applied live and remembered.
```
```text
Add seeded deals: a "Share this deal" button that copies a link encoding the seed and settings, so a friend gets the exact same deal and opponents.
```

## Bug report — for any rule problem

```text
Bug: <what happened>.
Setup: <players, Transfer on/off, difficulty>.
Table at the moment: <attack and defence cards on the table, whose turn, how many cards each player held, deck count>.
Expected: <what the rules in my first message say should happen>.
First add a scenario test that reproduces this on the ?test page and show it failing. Then fix the engine, and show the full test page passing. Don't change any other behaviour.
```

## Phone checklist — after each prompt

- [ ] Play one full game at 4 players with Transfer on. Does it end without ever stalling?
- [ ] Can you read every card in your hand without lifting it? The trump under the deck? Each opponent's card count?
- [ ] Do a transfer, then a transfer back. Does the instruction line always say what you can do?
- [ ] Be the player across from the defender at 4+ players. Does it say why you can't throw in?
- [ ] Take with cards still in the deck. Do the neighbours get to pile on, and are you skipped next bout?
- [ ] Turn the phone sideways. Are Take/Pass/Done still on screen?
- [ ] Leave Watch mode running on Fast with auto-restart for a few minutes. Any freeze?
- [ ] Does it feel like the kitchen table, or like a casino app?

## Bringing it home

The arcade is vanilla JS with no build step, so a React app can't be dropped into `games/durak/` as it is. If you like the result, push it to GitHub from AI Studio, then hand a Claude session this prompt:

```text
Gemini built a Durak remake in Google AI Studio: <GitHub repo URL>. Compare it with games/durak/ and docs/games/durak/README.md. Play both in headless Chrome at phone and laptop sizes, and write a questionnaire in docs/questionnaires/ on what to bring into the arcade build: its card art, table, sound, personalities, engine, and anything else that's clearly better, each with a recommendation. Keep the arcade's vanilla-JS, no-build constraints and its tested engine unless the remake's engine passes everything in tests/durak.test.mjs. Don't change any code until I've answered.
```
