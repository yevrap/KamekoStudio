# Link-Sharing Game — Brainstorm

## The Prompt

A game that can be sent via link back and forth between players. No backend — all state lives in the URL.

## Seed Idea

Take a quiz, send a link to a friend, friend takes the same quiz, then see how you did compared to each other.

---

## Game Ideas

### 1. Battleship (async)

Each player places ships, then sends a link encoding their board. The opponent opens the link, takes shots, and sends back a link with results + their own board. State lives entirely in the URL hash or a base64 query param.

### 2. Word Chain Duel

Players take turns adding a word that starts with the last letter of the previous word (or last two letters). The link carries the chain history. A player loses if they repeat a word, break the chain rule, or take too long (honor system or timestamped links).

### 3. Sketch & Guess (Pictionary-lite)

Player A draws on a canvas, picks a word, and generates a share link (canvas data + encrypted answer in the URL). Player B opens it, sees the drawing, types a guess. Could score across rounds.

### 4. Tic-Tac-Toe / Connect Four

Classic and dead simple. The entire board state fits in a few characters of URL. Each move generates a new share link.

### 5. Chess or Checkers (correspondence style)

Board state encoded in URL (FEN notation for chess is already compact). Each player makes one move and sends the link. Works naturally as correspondence play.

### 6. Story Builder

One player writes a sentence, shares a link. Next player adds a sentence. After N rounds, the full story is revealed. Could include constraints (genre, must include a word, etc.).

### 7. Trivia Challenge

Player A picks/creates questions and shares a link. Player B answers, gets scored, and can send back their own quiz. Builds on the deck/flashcard pattern already in Keypad Quest.

### 8. Dots and Boxes

Grid of dots; players take turns drawing lines between adjacent dots. Completing a box scores a point. Board state is compact and URL-encodable.

### 9. Territory Capture (mini Go-like)

Simplified Go on a small grid (5x5 or 7x7). Place stones, capture territory. State encodes as a move list in the URL.

### 10. Cipher Duel

Player A encodes a secret message with a chosen cipher and difficulty. Sends the link. Player B tries to decode it. Score based on speed/attempts. Then B sends one back.

---

## Best Fits for Kameko Studio

Given the existing stack (vanilla JS, no backend, mobile-first) and the proven `?import=<base64>` pattern from Keypad Quest deck sharing:

- **Battleship** — compact state, clear turn structure, great on small screens
- **Tic-Tac-Toe / Connect Four** — simplest to build, natural fit for URL-encoded moves
- **Dots and Boxes** — small grid state, satisfying mobile tap targets
- **Trivia Challenge** — closest to the seed idea and reuses existing deck patterns
