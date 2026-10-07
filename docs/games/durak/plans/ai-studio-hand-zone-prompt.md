# Make my hand the centre of the game

My cards sit too low. On a phone they're cut off at the bottom and crowd the home-gesture bar, and they're the only thing I tap. Redesign the bottom of the screen so my hand is big, fully visible, comfortably above the bottom edge, and more fun to play from. Don't change any rules or the theme.

## What's wrong today

- The hand is pushed to the very bottom edge and partly cut off, so I only see the top corner of each card.
- Most of the screen goes to things I only look at: a tall header with seven buttons, a separate "Latest" strip, large opponent panels and a lot of empty table.
- What I do is split from where I do it. The instruction and the Take button are in the middle of the screen, the cards are at the bottom edge, and "Your Hand · 6 cards" and "DEFENDING" sit on a row of their own.

## 1. Give the hand the bottom of the screen

- The bottom ~40% of the screen belongs to me: the instruction line, the action buttons and my hand, all within thumb reach.
- Every card in my hand is fully visible, never cut off by the screen edge.
- Keep the hand clear of the phone's home-gesture area. Its bottom edge sits at least 24px above the bottom safe area (use `viewport-fit=cover` and `env(safe-area-inset-bottom)`). Use `100dvh`, and the page never scrolls.
- Make the cards big: about 80px wide on a 390×844 phone, and about 120px wide on a laptop. The rank and suit in each corner can be read at a glance.
- Up to about 12 cards fit by overlapping more. Beyond that, the hand scrolls sideways with a swipe. Only a touch that moves less than 8px counts as a tap, so a swipe never plays a card.
- On a phone on its side, the hand stays along the bottom, a little smaller, with the action buttons to its right.

## 2. Make the hand more interesting to play from

- Fan the cards in a gentle arc, with a slight rotation, like a hand of cards held up.
- Sort the hand by suit, with trumps on the right and a gold edge on each trump. A menu option sorts by strength instead.
- Playable cards stand slightly raised and bright. Cards I can't play sit lower and dimmer.
- Touching a card lifts it up out of the fan and enlarges it (about 1.2×) so I can see it clearly. On a laptop, hovering does the same.
- There are two ways to play a card: tap it, or drag it up onto the table and let go. While dragging, the card follows my finger with a slight tilt, and the place it will land glows. Dropping it anywhere else, or dragging it back down, returns it to the hand.
- When it becomes my turn, the hand rises a little, with a soft glow along its edge and a short vibration where supported. While others play, it settles back down and dims slightly, but stays readable.
- When I play a card, the gap closes smoothly. Cards I draw fly in from the deck and slot into their sorted place.

## 3. One rail for everything I do

- The hand sits on a slim rail, a ledge in the table's style. The rail holds my role chip (Attacking / Defending / Adding), my card count, and the Take, Pass and Done buttons, shown only when I can use them.
- The instruction line sits right above the hand, for example "Defending: beat 6♦ or Take". It replaces the separate "Your turn to defend", "Your Hand · 6 cards" and "DEFENDING" rows.
- The action buttons are big (at least 48px tall), but never at the very bottom edge and never overlapping the cards. They sit beside the hand on wide screens, and on the rail above the hand on narrow ones.

## 4. Take space from what I only look at

- **Header:** one slim row with the game title, the bout number, the trump suit and a single Menu button. Move Rules, Log, Players and everything else into the Menu. Remove the Tests button from the screen; the test page stays at `?test`.
- **Latest move:** merge the "Latest" strip into the header row, or make it one slim line under it. Tapping it still opens the log. There should be one way to open the log, not three.
- **Opponents:** compact seats with an avatar, name, role, card count and a small fan of card backs, about half the current height.
- **Table:** the deck with a readable trump card, the cards in play, and the discard pile. The dashed "defend here" slot must not cover the attack card. Offset it, so the attack card's rank stays visible.

## Check it

Before you finish, check these screen sizes: 390×844 and 360×640 phones held upright, an 844×390 phone on its side, and 1440×900 and 1900×1160 laptops. At each size, with 6 cards and with 12 cards in my hand:

- every card in the hand is fully on screen, with its corner rank readable;
- the hand's bottom edge is at least 24px above the bottom of the screen;
- Take, Pass and Done are fully visible and don't overlap the cards;
- nothing scrolls.

Add these as a layout check on the `?test` page: render the game at each size in an iframe, and measure where the cards and buttons land. Make it pass, and tell me the results.
