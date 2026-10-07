# Add a game log to Durak

Add a game log, so a player can catch up on what happened when the computer players moved too fast, or when they didn't understand a move. Don't change any rules.

## What the player sees

- **Last-move strip:** a slim line at the top of the table always shows the most recent thing that happened, for example "CPU 2 beat your 9♠ with the J♠". Tapping it opens the log.
- **Log button:** a "Log" button next to the Rules button opens the full log for this game. The end screen has one too.
- **The game pauses while the log is open.** Computer players don't move until it's closed.
- The log opens as a panel over the game. It scrolls, opens at the newest entry, has a big Close button, and fits a phone screen.

## What the log says

Entries are in the order they happened, newest at the bottom, grouped by bout. Each bout starts with a header, for example "Bout 4: CPU 1 attacks you".

Write plain sentences, and show cards with their suit symbols in red or black. Every move gets an entry, including Passes, Dones and Takes, and moves the game made automatically say so. For example:

- **Start of the game:** "Trump is ♥. CPU 2 has the lowest trump (7♥) and attacks first."
- **Attacking and adding:** "CPU 1 attacks with 8♣." "CPU 3 adds 8♦ (there's already an 8 on the table)."
- **Beating, with the reason:** "You beat 8♣ with Q♣ (higher club)." "CPU 2 beats 10♠ with 6♥ (trump)."
- **Passing:** "CPU 1 passes." "You pass automatically (nothing to add)."
- **Taking:** "CPU 2 can't beat K♦ and takes." and, when the bout ends, "CPU 2 picks up 5 cards: K♦, 9♦, 9♣, J♦, 10♦."
- **End of the bout:** "All attacks beaten: 6 cards go to the discard pile."
- **Refilling:** "You draw 2: 7♠, J♥. CPU 1 draws 1. CPU 2 draws 0."
- **Who goes next, and why:** "CPU 2 defended, so CPU 2 attacks next." "CPU 2 took, so they're skipped: CPU 3 attacks next."
- **The deck running out:** "CPU 1 draws the last card, the face-up trump 6♥. The deck is empty."
- **Going out and the end:** "CPU 3 is out of cards and escapes (2nd)." "CPU 1 is the Durak."
- **The neighbour rule:** when it leaves the player out of a bout, say so once in that bout: "Only CPU 1 and CPU 3 (next to CPU 2) may add cards this bout."

## Rules for the log

- **Never reveal a hidden card.** Cards played on the table, cards picked up after a Take, the face-up trump, and the cards you draw yourself can be named. Cards an opponent draws from the deck are secret: show only how many they drew.
- Build the log from the moves the rules file applies, not from the animations, so nothing is ever missing.
- A new game starts a new, empty log.

## Checks to add to the ?test page

- In simulated games at every player count from 2 to 6, every move appears in the log, including automatic Passes, Dones and Takes.
- No log entry names a card an opponent drew from the deck.
- Every bout in the log has a header, and its last entry says how the bout ended: the discard pile or a Take, and how many cards.
- Starting a new game clears the log.

Before you finish, make every check pass, and tell me the results.
