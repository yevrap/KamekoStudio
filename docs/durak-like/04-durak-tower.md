# Durak Tower — Design & Implementation Doc

> Minimalist vertical roguelike. Climb a tower floor by floor, each floor a Durak hand with a unique rule twist. Pick blessings between floors. Daily seeded challenge.

## Overview

**Genre:** Roguelike card game (minimalist / arcade)
**Renderer:** DOM (card elements, simple UI)
**Files:** `games/durak-tower/index.html`, `style.css`, `game.js`
**Estimated complexity:** Low-medium (simplest of the four — one tight loop, lots of content variety)

Durak Tower is the most pick-up-and-play of the four concepts. Each floor is a single Durak bout with a rule mutation. Between floors, you pick a blessing. Climb as high as you can. Die, start over. A daily seed means everyone plays the same tower once per day.

The design philosophy: **one good mechanic (Durak), infinite variety (mutations), zero bloat.**

---

## Core Concept

Every floor of the tower is a Durak bout — but each floor has a **rule mutation** that changes how the bout plays. Floor 1 might be "No Trumps." Floor 2 might be "All cards are face-down until played." Floor 5 might be "You can only defend with even-numbered cards."

The mutations are the game. The player's skill is adapting their strategy to each new constraint. Between floors, blessings provide small persistent buffs to help with the climb.

### What Makes This Different from Regular Durak

- **Rule mutations** make each floor feel different
- **Blessings** accumulate as you climb, making you more powerful
- **Score multiplier** increases with height — the higher you go, the more each action is worth
- **Permadeath** — lose one bout, the run is over
- **Daily tower** — same seed for everyone, once per day

---

## Game Flow

```
[Title Screen]
     |
     ├─[Free Climb] → random seed, climb until you die
     ├─[Daily Tower] → daily seed, one attempt per day
     |
[Floor Loop]
     |→ [Mutation Reveal] — show this floor's rule mutation (1.5s)
     |→ [Durak Bout] — play the bout under the mutation
     |→ [Win] → [Blessing Choice] — pick 1 of 3 blessings
     |→ [Lose] → [Run Over] — show stats and score
     |→ repeat
     |
[Run Over] → final score, floor reached, share button
```

---

## Rule Mutations

Each floor has exactly one mutation. Mutations are drawn from a pool without replacement during a run (so you never see the same mutation twice). The pool has 20 mutations — enough for a very long run.

### Mutation Pool

| # | Mutation | Rule Change | Strategy Tip |
|---|----------|-------------|--------------|
| 1 | **No Trumps** | Trump suit is disabled. Only same-suit-higher defenses work. | Value matters more. High cards are king. |
| 2 | **Blind Cards** | Enemy cards are face-down. You see them only when you attempt to defend (the attack card flips). | Memory and reaction. Defend conservatively. |
| 3 | **Evens Only** | You can only play even-valued cards (6, 8, 10, Q/12, A/14). Odd cards are locked. | Half your hand is useless. Plan around it. |
| 4 | **Odds Only** | You can only play odd-valued cards (7, 9, J/11, K/13). Even cards are locked. | Mirror of Evens Only. |
| 5 | **Pairs Required** | When attacking, you must play cards in pairs (same value). Single attacks are not allowed. First attack must be a pair. | Deck composition matters. Keep pairs. |
| 6 | **Trump Roulette** | Trump suit changes to a random suit after every card played. | Chaos. Adapt constantly. |
| 7 | **Heavy Hand** | Both players draw to 8 cards instead of 6. | More options, longer bouts. |
| 8 | **Light Hand** | Both players draw to 4 cards instead of 6. | Fewer options, every card counts. |
| 9 | **Low Ceiling** | Cards above 10 cannot be played by either side. Face cards are locked. | Low-value grinding. 6s and 7s matter. |
| 10 | **High Floor** | Cards below 10 cannot be played by either side. Only 10, J, Q, K, A. | Everything is powerful. Suit matters more than value. |
| 11 | **Reverse** | Lower cards beat higher cards of the same suit (6 beats 7, 7 beats 8, etc.). Trump still beats non-trump. | Your weakest cards are now your best defenders. |
| 12 | **Double Trump** | Two suits are trump instead of one. The second trump is the suit opposite the standard trump (♠↔♥, ♣↔♦). | More trumps available = more aggressive play possible. |
| 13 | **Slow Draw** | Players draw only 1 card per bout-end refill (instead of drawing up to 6). | Card conservation is critical. |
| 14 | **Mirror** | Both players share the same hand. When one player plays a card, it disappears from both hands. | Information is shared. Race to play the best cards first. |
| 15 | **Sudden Death** | First player to take cards (pick up instead of defend) immediately loses the bout. | Never take. Defend at all costs. |
| 16 | **Countdown** | Each player has only 5 turns total (5 attack-or-defend actions). After 5 turns, the player with fewer cards in hand wins. | Efficiency over completeness. |
| 17 | **Suit Lock** | Your first played card determines your suit for the bout. You can only play cards of that suit (plus trump). | Suit composition of your hand is destiny. |
| 18 | **Bounty** | Each defended pair earns +5 score. Each taken card costs -3 score. Score matters more than winning. | You can win but score poorly, or defend well and score big. |
| 19 | **Draft** | Before the bout, both players see 8 cards and draft alternately (pick 1, pass remaining). Draft replaces the normal draw. | Card selection skill. |
| 20 | **Naked** | No draw from the deck at all. Both players play with their initial 6 cards. When they're gone, they're gone. | Pure hand management. No reinforcements. |

### Mutation Display

Before each bout, the mutation is shown on a full-screen overlay:

```
┌─────────────────────────────┐
│                             │
│        FLOOR 7              │
│                             │
│     ⚡ SUDDEN DEATH         │
│                             │
│  First to take cards        │
│  loses the bout.            │
│                             │
│     [Tap to begin]          │
│                             │
└─────────────────────────────┘
```

The overlay uses the mutation icon, name, and a one-line rule description. Tap anywhere to dismiss and start the bout.

### Mutation Implementation

Each mutation is an object with hooks that modify game behavior:

```js
var MUTATIONS = {
  'no-trumps': {
    name: 'No Trumps',
    icon: '🚫',
    description: 'Trump suit is disabled. Same-suit-higher only.',
    onBoutStart: function(state) {
      state.trumpDisabled = true;
    },
    modifyCanPlay: null,   // no change to card legality
    modifyDraw: null,      // no change to draw
    onBoutEnd: null
  },
  'blind-cards': {
    name: 'Blind Cards',
    icon: '🙈',
    description: 'Enemy cards are face-down until they attack.',
    onBoutStart: function(state) {
      state.enemyCardsFaceDown = true;
    },
    modifyCanPlay: null,
    modifyDraw: null,
    onBoutEnd: null
  },
  'evens-only': {
    name: 'Evens Only',
    icon: '2️⃣',
    description: 'Only even-valued cards can be played.',
    modifyCanPlay: function(card, originalResult) {
      if (card.value % 2 !== 0) return false;
      return originalResult;
    }
  },
  // ... etc for all 20
};
```

The game engine wraps key functions (`canPlayCard`, `autoDrawBoth`, `checkGameOver`) to call mutation hooks before/after the base logic.

---

## Blessings

After each won floor, the player picks 1 of 3 random blessings. Blessings are small persistent buffs that last the rest of the run.

### Blessing Pool (15 Blessings)

| # | Blessing | Effect | Stack? |
|---|----------|--------|--------|
| 1 | Thick Skin | Ignore the first mutation's negative effect each bout (skip one locked card, etc.) — effectively a "free pass" once per floor | No |
| 2 | Extra Draw | Draw 1 extra card at the start of each bout | Yes (max +3) |
| 3 | Trump Sight | See the trump suit for the next floor before choosing your blessing | No |
| 4 | Lucky Hand | Your starting hand always contains at least 1 trump card | No |
| 5 | Score Boost | +10% to all score earned (multiplicative with floor multiplier) | Yes |
| 6 | Second Wind | Once per run: when you would lose a bout, discard your hand and draw 6 new cards instead | No (one-time) |
| 7 | Card Mastery | 6s in your hand count as 8s | No |
| 8 | Suit Affinity | Pick a suit. Cards of that suit get +1 value for beating purposes | No (pick once) |
| 9 | Quick Reflex | When you successfully defend, there's a 30% chance to draw an extra card | No |
| 10 | Deck Peek | See the top 2 cards of the deck at all times | No |
| 11 | Trump Power | Your trump cards get +2 value for beating purposes | No |
| 12 | Stubborn | After taking cards, immediately play 1 card for free (doesn't count as your turn) | No |
| 13 | Minimalist | If your hand has 3 or fewer cards, all your cards get +2 value | No |
| 14 | Opener | Your first attack card each bout gets +3 value | No |
| 15 | Iron Will | You can take cards once per bout without it counting as "taking" for mutation purposes (relevant for Sudden Death, etc.) | No |

### Blessing Choice UI

```
┌─────────────────────────────┐
│     FLOOR 4 CLEARED! 🎉    │
│     Score: 145              │
│                             │
│  Choose a blessing:         │
│                             │
│  ┌────────────────────┐     │
│  │ 📦 Extra Draw      │     │
│  │ Draw 1 extra card  │     │
│  └────────────────────┘     │
│  ┌────────────────────┐     │
│  │ ⭐ Score Boost     │     │
│  │ +10% to all score  │     │
│  └────────────────────┘     │
│  ┌────────────────────┐     │
│  │ 🛡️ Thick Skin      │     │
│  │ Ignore 1 lock/turn │     │
│  └────────────────────┘     │
│                             │
└─────────────────────────────┘
```

Three tappable rows. Tap to select → blessing icon slides into the blessing bar → proceed to next floor.

---

## Scoring

Score is the primary measure of a run. It serves as the competitive element for daily towers.

### Score Calculation

```
Per-bout score:
  Base                    = 10 points
  Cards left in hand      = -2 per card (you want to empty your hand)
  Clean defense (no take) = +15 points
  Floor multiplier        = × (1 + floor × 0.1)   // floor 1 = ×1.1, floor 10 = ×2.0, floor 20 = ×3.0
  Blessing modifiers      = applied after multiplier

Run score = sum of all bout scores
```

### Score Display

During play, the running score is shown in the header. After each bout, the score breakdown appears briefly on the blessing choice screen.

---

## Daily Tower

### How It Works

- The daily seed is derived from the current date: `seed = 'DT' + YYYY + MM + DD` (e.g., `DT20260413`)
- Same seed = same mutation order, same card draws, same blessing offerings
- The player gets **one attempt per day**. After losing, they see their score and can't replay until tomorrow.
- Daily tower results are saved in localStorage with the date key.

### Daily Tower UI

On the title screen, the Daily Tower button shows:
- If not yet played today: "Daily Tower — Tap to climb"
- If already played today: "Today's Tower: Floor 12, Score 845" (grayed out, not tappable)

### Fairness

Since both players see the same mutations and draw the same cards (seeded RNG), the Daily Tower is a fair comparison of skill. Share your score via a simple text string:

```
Durak Tower Daily — Apr 13
Floor: 12 | Score: 845
🏗️🏗️🏗️🏗️🏗️🏗️🏗️🏗️🏗️🏗️🏗️🏗️
https://yevrap.github.io/KamekoStudio/games/durak-tower/
```

The share text uses tower block emojis (one per floor cleared) as a visual spoiler-free representation of progress. A "Copy Result" button generates this text.

---

## Multiplayer: WebRTC Peer-to-Peer

For real-time multiplayer without a backend, Durak Tower uses **WebRTC data channels** with PeerJS for signaling.

### How It Works

1. **Host** taps "Create Room" → generates a 4-character room code (e.g., `A7K2`)
2. **Guest** taps "Join Room" → enters the room code
3. PeerJS handles WebRTC signaling (PeerJS provides a free signaling server; the actual game data goes peer-to-peer)
4. Once connected, both players play the same tower (shared seed) simultaneously
5. Each floor, both players play their bout independently. When both finish, results sync:
   - Both see a brief "Waiting for opponent..." screen if one finishes first
   - Floor result shows both scores side by side
6. Run ends when either player loses. The surviving player sees "Opponent eliminated on Floor 7" and continues alone.

### PeerJS Integration

PeerJS is loaded from CDN (like Three.js in other games):

```html
<script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
```

### Message Protocol

Messages are small JSON objects sent over the data channel:

```js
// Player finished a floor
{ type: 'floor-done', floor: 5, score: 145, alive: true }

// Player lost
{ type: 'eliminated', floor: 7, finalScore: 520 }

// Player chose a blessing (for display)
{ type: 'blessing', floor: 5, blessingId: 'extra-draw' }

// Heartbeat (every 5s, to detect disconnection)
{ type: 'ping' }
```

### Connection UI

```
┌─────────────────────────────┐
│       MULTIPLAYER           │
│                             │
│  ┌──────────────────┐       │
│  │  Create Room     │       │
│  └──────────────────┘       │
│                             │
│  ┌──────────────────┐       │
│  │  Join Room       │       │
│  └──────────────────┘       │
│                             │
│  Room: [____]               │
│                             │
│  Status: Waiting...         │
│                             │
└─────────────────────────────┘
```

### Fallback: No PeerJS

If PeerJS CDN is unavailable or WebRTC fails, the multiplayer button is hidden. The game degrades gracefully to single-player only. Check with:

```js
var multiplayerAvailable = typeof Peer !== 'undefined';
```

### Simpler Alternative: Async Race

If WebRTC proves too complex to implement or maintain, fall back to the same async seeded-run approach used in Durak Dungeon and Durak Bazaar:
- Generate a seed, share via URL
- Both players play the same tower independently
- Compare scores afterward

This is the recommended Phase 1 multiplayer approach. WebRTC can be added later.

---

## UI Layout

### Mobile (Primary)

The tower uses a very clean, minimal UI. The vertical phone screen is the tower itself.

```
┌─────────────────────────────┐
│ 🏗️ FLOOR 7   ♦ Trump  845pts│  ← Header
│ [🛡️][📦][⭐]               │  ← Blessing bar
├─────────────────────────────┤
│                             │
│  ⚡ SUDDEN DEATH            │  ← Active mutation tag
│                             │
│  [Card backs - opponent]    │  ← Opponent hand (AI)
│                             │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 7♠ │ │ Q♦ │ │ K♠ │     │  ← Field pairs
│  │ 9♠ │ │    │ │    │     │
│  └────┘ └────┘ └────┘     │
│                             │
│  [Your hand cards]          │  ← Player hand
│                             │
│  [Take]          [Pass]     │  ← Action buttons
└─────────────────────────────┘
```

### Key Visual Elements

- **Floor counter** as a prominent number in the header
- **Mutation tag** always visible above the field — a colored pill/badge showing the current mutation icon and name
- **Blessing bar** as small icons below the header (same pattern as relic bar in Durak Dungeon)
- **Score** in the header, updating in real-time as the bout progresses

### Desktop

Same layout, `max-width: 600px`, centered. No special desktop treatment — the tower is inherently a vertical experience.

### Color Coding for Mutations

Each mutation category has a color:
- Restriction mutations (Evens Only, Odds Only, Low Ceiling, etc.): Red pill
- Chaos mutations (Trump Roulette, Blind Cards, Mirror): Purple pill
- Structural mutations (Heavy Hand, Light Hand, Naked, Draft): Blue pill
- Scoring mutations (Bounty, Countdown): Gold pill

---

## Data Structures

### Run State

```js
var run = {
  seed: 'DT20260413',
  rng: null,                 // seeded RNG
  mode: 'free',              // 'free' | 'daily' | 'multi'
  floor: 1,
  score: 0,
  blessings: [],             // array of blessing IDs
  mutationOrder: [],         // shuffled array of mutation IDs for this run
  phase: 'title',            // title | mutation-reveal | playing | blessing | gameover
  activeMutation: null,      // current mutation object
  peer: null,                // PeerJS connection (multiplayer only)
  opponent: {                // multiplayer opponent state
    floor: 0,
    score: 0,
    alive: true
  },
  stats: {
    floorsCleared: 0,
    cleanDefenses: 0,
    totalCardsTaken: 0,
    blessingsChosen: []
  }
};
```

### Mutation Object

```js
{
  id: 'sudden-death',
  name: 'Sudden Death',
  icon: '⚡',
  description: 'First to take cards loses the bout.',
  category: 'restriction',   // restriction | chaos | structural | scoring
  onBoutStart: function(state) { ... },
  modifyCanPlay: function(card, result) { ... },  // or null
  modifyDraw: function(count) { ... },             // or null
  onTake: function(who) { ... },                   // or null
  onBoutEnd: function(state) { ... },              // or null
  modifyScore: function(score) { ... }             // or null
}
```

### Blessing Object

```js
{
  id: 'extra-draw',
  name: 'Extra Draw',
  icon: '📦',
  description: 'Draw 1 extra card at the start of each bout.',
  stackable: true,
  stacks: 1,
  onBoutStart: function(state) { state.drawCount += 1; },
  onDefend: null,
  onAttack: null,
  passive: true
}
```

---

## AI Opponent

The AI for Durak Tower uses the same base logic as the existing Durak AI, but it must also respect mutations. The AI plays mutations fairly:

- If Evens Only is active, AI only plays even cards
- If Sudden Death is active, AI never takes (defends or loses trying)
- If Countdown is active, AI counts its turns

The AI does not need to be smarter per floor — the mutations provide the difficulty scaling. However, the AI's card generation scales slightly:

| Floors | AI Hand Composition |
|--------|-------------------|
| 1–5 | Standard draw from shuffled deck (same as player) |
| 6–10 | AI's dealt hand guaranteed to have at least 1 trump |
| 11–15 | AI's dealt hand guaranteed to have at least 2 trumps |
| 16+ | AI's dealt hand has 50% trump cards |

---

## Daily Tower Persistence

```js
// Check if daily tower already played
function isDailyPlayed() {
  var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  var last = localStorage.getItem('durakTower_dailyDate');
  return last === today;
}

// Save daily result
function saveDailyResult(floor, score) {
  var today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('durakTower_dailyDate', today);
  localStorage.setItem('durakTower_dailyFloor', floor);
  localStorage.setItem('durakTower_dailyScore', score);
}
```

---

## Share Text Generation

```js
function generateShareText(floor, score, isDaily) {
  var towers = '';
  for (var i = 0; i < floor; i++) towers += '🏗️';
  var date = isDaily ? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  var header = isDaily ? 'Durak Tower Daily — ' + date : 'Durak Tower — Free Climb';
  return header + '\n' +
         'Floor: ' + floor + ' | Score: ' + score + '\n' +
         towers + '\n' +
         'https://yevrap.github.io/KamekoStudio/games/durak-tower/';
}
```

Copy to clipboard via `navigator.clipboard.writeText()` with fallback to a hidden textarea + `document.execCommand('copy')`.

---

## localStorage Keys

| Key | Type | Notes |
|-----|------|-------|
| `lastPlayed_durakTower` | timestamp | Set on run start |
| `durakTower_bestFloor` | integer | Highest floor reached (free climb) |
| `durakTower_bestScore` | integer | Highest run score (free climb) |
| `durakTower_dailyDate` | YYYY-MM-DD string | Date of last daily attempt |
| `durakTower_dailyFloor` | integer | Floor reached in today's daily |
| `durakTower_dailyScore` | integer | Score in today's daily |
| `durakTower_totalRuns` | integer | Lifetime runs played |

---

## Scope Notes for Implementation

### Build Order

1. **Phase 1 — Single-bout with mutation:** Title screen, floor counter, one Durak bout, one mutation applied. Hardcode 3–4 mutations to start. Win → next floor. Lose → game over. Score calculation.
2. **Phase 2 — Mutation pool:** Implement all 20 mutations. Shuffled mutation order per run. Mutation reveal screen.
3. **Phase 3 — Blessings:** Blessing choice after each floor. Blessing bar UI. Implement 8 blessings to start, expand to 15.
4. **Phase 4 — Daily tower:** Date-based seeding. One-attempt-per-day enforcement. Share text generation.
5. **Phase 5 — Free climb polish:** Seeded free climb, score display, best score tracking.
6. **Phase 6 — Multiplayer:** Start with async seed sharing. If time permits, add WebRTC via PeerJS.

### Things to Keep Simple

- No deck building — every bout uses a fresh standard 36-card Durak deck
- No shop, no gold, no economy — the only between-floor choice is the blessing
- No persistent meta-progression — every run starts fresh
- The tower is infinite in theory — mutations repeat after floor 20 (reshuffled)
- AI is the same logic as existing Durak, just respecting mutation constraints
- WebRTC multiplayer is optional/stretch — async seed sharing works fine as v1

### Why This Game is the Easiest to Build

- The core bout is literally the existing Durak game with minimal modifications
- Mutations are implemented as hook functions that wrap existing logic
- Blessings are simple stat modifiers
- No deck management, no shop UI, no campaign map
- The complexity is in the **content** (20 mutations, 15 blessings) not the **architecture**
- Can be playable in Phase 1 with just 3–4 mutations
