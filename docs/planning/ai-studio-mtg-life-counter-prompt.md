# Build a Magic: The Gathering life counter

Build a life counter for Magic: The Gathering as a web app for phones and tablets. It should have the features of a modern life counter app, but its first job is to be very easy to use: huge touch areas, readable from across the table, and nothing fiddly. One phone lies flat in the middle of the table and everyone uses it at once.

## What to build

- It runs entirely in the browser. No backend, no login, no database.
- Do **not** use the Gemini API or any AI service.
- It works offline once loaded, and can be added to the home screen (a web app manifest and icon).
- Don't bundle official Magic logos, mana-symbol artwork or card images. Call the app something plain, like "Life Counter". Use simple coloured shapes for player colours.
- Save the game in progress on the device, so reloading the page or reopening the app picks up exactly where it was.
- Keep the screen awake during a game (the Screen Wake Lock API, where supported).

## The main screen

- The screen is split into one panel per player. Each panel is turned to face its player around a phone lying flat on the table: 2 players face each other, and 3–6 players sit around the edges. The life total, name and every control on a panel read the right way up for that player.
- The life total is huge: it fills the middle of the panel and is readable from across the table.
- **Each panel is two giant buttons.** Tap anywhere on the half nearer the "+" to gain 1 life, and anywhere on the other half to lose 1. Each half has a faint "+" or "−" so it's obvious which is which. There are no small life buttons.
- **Press and hold** a half to change life by 10 at once, and by 10 again every half second while held.
- **Change bubble:** quick taps add up into a bubble next to the total, like "−7", which fades about 2 seconds after the last tap. That way everyone can see what just changed.
- Players can tap their own panels at the same time. Every touch counts, on every panel, even simultaneous ones.
- A short vibration on each change, where the device supports it, with a setting to turn it off.
- **One big centre button**, where the panels meet, opens the game menu. It's at least 64px across.
- Each panel has one menu button for that player (shown as "⋯" with the player's name), at least 56px.

## Player menu (opened from a player's panel)

The menu opens facing that player, over their own panel, with big rows at least 56px tall. In it:

- **Commander damage:** one large tile for each opponent, in that opponent's colour, with its own count. Tap the tile to add 1 and hold it to remove 1. A second tile per opponent appears if that opponent has partner commanders. Commander damage also lowers life by the same amount; a setting can turn that off.
- **Counters:** add any of these to the panel, and remove them again: Poison, Energy, Experience, Rad, Speed (0–4), Commander tax, or a custom counter with its own name. An added counter shows as a big tile on the panel, with tap for +1 and hold for −1.
- **Commander tax:** tap each time the player casts their commander from the command zone. It shows the extra cost (+2, +4, …), and a second commander gets a second count.
- **Name and colour:** type a name and pick from about 10 colours.
- **Revive:** brings back a player who was marked as lost.

## Game menu (opened from the centre button)

Use big, labelled buttons, with no icon-only controls:

- **Undo:** steps back through the last changes, one at a time, for any player, including counters and commander damage.
- **New game:** the same players and settings, with everything reset. It asks once to confirm.
- **Setup:** the number of players (1–6) and the starting life: 20 (most formats), 40 (Commander), 25, 30, or any number. Choosing 40 turns commander damage on; it can also be turned on or off directly.
- **Who goes first:** a random pick that lights the panels up in turn, then settles on one player.
- **Dice:** a coin flip, a d6, a d20, or any number of sides. The result is big, and faces whoever asked for it.
- **Monarch and Initiative:** give either one to a player with one tap. Only one player can hold each at a time. The holder's panel shows a clear badge.
- **Day / Night:** a game-wide switch shown in the centre.
- **City's Blessing:** a badge a player can be given once.
- **Turn tracker** (off by default): highlights the active player, has a big "Next turn" button, counts turns, and has an optional game timer.
- **History:** every change in order, with the player, the amount and the time. A burst of quick taps shows as one entry ("Sam −7").
- **Settings:** commander damage lowers life (on/off), vibration (on/off), the change-bubble timing, and keeping the screen awake.

## When a player loses

- A player is marked as lost when their life is 0 or less, when they have 10 or more poison counters, or when they have taken 21 or more commander damage from a single commander.
- A lost player's panel dims and says why ("21 commander damage from Alex"). Nothing is locked: Undo or Revive brings them back.

## Optional: card art backgrounds

A player may search a card name and use its art as their panel background, through the public Scryfall API (the card's "art_crop" image), with the text kept readable over it. This is the only feature that uses the network, and the app works fully without it.

## Easy to use on a busy table

- No setup is needed to start: the app opens on a 2-player game at 20 life, or resumes the game in progress.
- Nothing on the main screen is smaller than a thumb. Menu rows are at least 56px tall, and every icon has a word next to it.
- No accidental zooming, scrolling, text selection, pull-to-refresh or long-press pop-ups. Use touch-action: none, user-select: none and overscroll-behavior: none, and turn off the iOS long-press callout.
- Undo is never more than two taps away. Use it instead of "are you sure?" questions, except for New game.
- It is dark by default, with strong contrast, and every player colour keeps the numbers easy to read.
- It must work on a 390×844 phone and on a tablet, in both orientations, with 1, 2, 3, 4, 5 and 6 players, with panels that never overlap and text that never gets cut off.

## How to build it

- Put all the game logic in its own file with no React and no screen code (for example `src/engine/counter.ts`): plain functions over a plain game-state object, where every change is an action applied by one function. The screen only sends actions. That keeps Undo and saving simple and reliable.
- Add a hidden test page, opened by adding `?test` to the address, that runs that file without the screen and shows PASS or FAIL for each check below.
- Before you finish, make every check pass, and tell me the results.

### Checks for the test page

- A tap changes life by 1, and a hold by 10, then by 10 again per repeat.
- Changes to two different players in the same moment are both applied.
- Commander damage from one opponent's commander lowers life by the same amount, or doesn't when that setting is off. Partner commanders are counted separately.
- A player is marked as lost at 0 life, at 10 poison, and at 21 commander damage from one commander, but not at 21 commander damage spread across two commanders.
- Undo, repeated, steps back through every kind of change (life, counters, commander damage, Monarch, Initiative, losing) and lands exactly on the earlier state.
- Only one player holds the Monarch at a time; giving it to another player takes it from the first. The same goes for Initiative.
- Commander tax shows +2 for each earlier cast.
- New game resets every player to the starting life and clears every counter, badge and the history.
- The saved state reloads exactly: after a reload, every number, counter, badge and the Undo history are the same.
- The burst of quick taps in the history: 7 taps within 2 seconds make one "−7" entry.

## Done means

- Every check on the test page passes.
- On a phone lying flat, each of up to 6 players can read their own panel the right way up and change their life with one big tap, all at the same time.
- Every feature above is reachable in two taps or fewer from the main screen.
