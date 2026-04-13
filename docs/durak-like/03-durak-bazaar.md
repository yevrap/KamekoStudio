# Durak Bazaar — Design & Implementation Doc

> Roguelike deckbuilder where you play Durak bouts against increasingly devious AI opponents, collecting passive abilities and trimming your deck between rounds. The closest analog to Balatro.

## Overview

**Genre:** Roguelike deckbuilder (card game with meta-progression)
**Renderer:** DOM (same card rendering approach as existing Durak)
**Files:** `games/durak-bazaar/index.html`, `style.css`, `game.js`
**Estimated complexity:** Medium (builds most directly on existing Durak code)

The player plays full Durak bouts (attack and defend) against a series of AI opponents with escalating difficulty and personality. Between bouts, the player visits a bazaar where they buy passive abilities ("charms"), thin their deck, and prepare for the next opponent. The core Durak rules are unchanged — the twist is what you bring to the table.

---

## Core Concept

This is the purest Durak remix of the four concepts. The bout-to-bout gameplay is real Durak — attack, defend, take, pass, trump suit, draw from deck. The roguelike layer sits *around* the bouts:

- **Before each bout**, you see your opponent and their personality trait (a hint about their AI behavior).
- **During the bout**, your passive abilities (charms) trigger automatically and change the dynamics.
- **After a win**, you visit the bazaar to improve your deck and collect new charms.
- **A run is 10 bouts.** Beat all 10 to win. Lose one and the run ends.

The "Balatro feel" comes from charms stacking in interesting combinations. A charm that rewards you for defending with face cards, combined with a charm that makes face cards trump-proof, combined with a lean deck full of J/Q/K/A creates a powerful synergy — but only if you drafted it intentionally.

---

## Game Flow

```
[Title Screen]
     |
[Start Run] → generate seed, init standard 36-card deck, choose starting charm
     |
[Bout Loop] (repeat 10 times)
     |→ [Opponent Preview] — see opponent name, personality, difficulty
     |→ [Durak Bout] — full Durak game vs AI
     |→ [Victory] → [Bazaar] — shop, deck management, charm selection
     |→ or [Defeat] → [Run Over]
     |
[Run Complete] → show run stats, save to localStorage
```

---

## The Durak Bout

The bout plays almost identically to the existing Durak game. Key differences:

### What Stays the Same
- 36-card deck (6–A, four suits)
- Both players draw to 6 cards
- Attacker plays, defender beats or takes
- Trump suit from bottom card
- Pass when all attacks are defended
- First to empty their hand wins

### What Changes

1. **The shared deck is built from the player's trimmed deck + filler cards.** The player's deck (which they've been modifying) forms the core. If the player's deck is fewer than 36 cards, random cards fill the remainder. If greater than 36 (unlikely but possible), the deck is shuffled and only 36 are used.

2. **Charms trigger during play.** Charms are passive abilities with conditions. When the condition is met, the effect fires automatically with a brief visual indicator.

3. **Winning condition has a score.** Beyond just winning or losing, the player earns a **bout score** based on:
   - Cards remaining in their hand when the bout ends: 0 (ideal) to 6
   - Whether they took cards during the bout: -5 per take
   - Whether they defended cleanly (never took): +10 bonus
   - Charm triggers: +1 per trigger

   Score determines gold earned for the bazaar.

4. **The opponent's personality** affects their AI (see Opponents section).

---

## Charms (Passive Abilities)

Charms are the heart of the game. The player can hold up to 4 charms at a time. Each charm has a **trigger condition** and an **effect**.

### Starter Charms (Pick 1 at Run Start)

| Charm | Trigger | Effect |
|-------|---------|--------|
| Lucky 7 | You play a 7 (attack or defend) | Draw 1 extra card from the deck |
| Face Fighter | You defend with a face card (J/Q/K/A) | Next attack card you play gets +2 value for beating purposes |
| Trump Miser | You win a bout without playing any trump cards | Gain +15 bonus gold |

### Full Charm Pool (18 Charms)

| # | Charm | Icon | Trigger | Effect |
|---|-------|------|---------|--------|
| 1 | Lucky 7 | 🎰 | Play a 7 | Draw 1 extra card |
| 2 | Face Fighter | 👑 | Defend with face card | Next attack gets +2 |
| 3 | Trump Miser | 💰 | Win without playing trump | +15 gold |
| 4 | Pair Power | 👯 | Play two cards of the same value in one bout | Draw 2 extra cards |
| 5 | Low Roller | 🎲 | Defend with a 6 | Opponent discards 1 random card |
| 6 | Suit Streak | 📈 | Play 3 cards of the same suit in a row | Next card you play counts as trump |
| 7 | Take That | 💢 | Opponent takes cards | You draw 1 extra card |
| 8 | Empty Hand | 🫗 | Your hand is empty (even temporarily) | Immediately draw 3 cards |
| 9 | Trump Shield | 🛡️ | You defend with a trump card | That trump card returns to your hand after the bout |
| 10 | Quick Finish | ⚡ | Win a bout in under 5 rounds | +20 bonus gold |
| 11 | Heavy Hitter | 🔨 | Attack with a card value 12+ | Opponent must defend with trump or take |
| 12 | Card Counter | 🧮 | Win a bout with 0 cards in hand | Charm triggers +3 each (multiplicative with other scoring) |
| 13 | Scavenger | 🔍 | Opponent passes (all defended) | Peek at the top card of the deck |
| 14 | Iron Defense | 🏰 | Defend 3 attacks in a row without taking | +5 gold, opponent skips their next throw-on |
| 15 | Wild Card | 🃏 | Once per bout (activated by tapping) | Any card in your hand becomes trump suit |
| 16 | Gold Rush | 🪙 | Win a bout | +3 gold per card remaining in the shared deck |
| 17 | Last Stand | 🔥 | You have 1 card in hand | That card counts as trump and gets +3 value |
| 18 | Mirror Match | 🪞 | Opponent attacks with a face card | You may defend with any card of the same value (ignoring suit) |

### Charm Interactions

Charms are designed to combo:
- **Face Fighter + Heavy Hitter:** Defending with face cards powers up your attacks, and your high attacks force trump defenses — creating a face-card-centric strategy.
- **Trump Miser + Suit Streak:** Avoiding trump cards is rewarded, and playing same-suit streaks lets you temporarily access trump power without "using" trump cards.
- **Empty Hand + Card Counter:** Aggressively emptying your hand triggers bonus draws AND bonus scoring.
- **Low Roller + deck thinning:** If you remove all high cards and keep 6s, Low Roller triggers constantly.

### Charm Display

Charms appear as a horizontal row of icon buttons below the header. During a bout, when a charm triggers, the icon pulses and a brief tooltip shows: "Lucky 7 → Drew 1 card". Active charms (Wild Card) show a "tap" indicator.

---

## Opponents

Each bout features a named opponent with a **personality** — a visible modifier to their AI behavior. The player sees the opponent's name and personality before the bout starts, allowing them to plan.

### Opponent Roster (10 Opponents)

| Bout | Name | Personality | AI Behavior |
|------|------|-------------|-------------|
| 1 | The Rookie | Timid | Never throws on after initial attack. Passes quickly. |
| 2 | The Brawler | Aggressive | Always throws on if possible. Never holds cards back. |
| 3 | The Collector | Hoarder | Prefers to take rather than waste high cards defending. Builds huge hand. |
| 4 | The Tactician | Calculated | Prioritizes attacking with pairs. Saves trump for defense only. |
| 5 | The Trader | Tricky | Throws on with matching values even if it means using trump. Tries to empty hand fast. |
| 6 | The Wall | Stubborn | Never takes cards. Always defends, even with trump aces. |
| 7 | The Miser | Trump Hoarder | Never plays trump cards unless forced. Stockpiles them. |
| 8 | The Blitzer | Relentless | Attacks with as many cards as possible each round. |
| 9 | The Snake | Deceptive | Attacks with low cards to bait defenses, then throws on with high cards. |
| 10 | The Durak | Perfect | Optimal play — uses existing AI logic from current Durak + saves trump + throws on strategically. |

### AI Personality Implementation

Each personality modifies the existing AI's decision-making at specific points:

```
AI Decision Points:
1. What card to attack with? (aiAttack)
   - Aggressive: always the highest playable
   - Timid: always the lowest
   - Calculated: pairs first, then lowest

2. Whether to throw on? (aiAttack when field is defended)
   - Aggressive: always if possible
   - Timid: never
   - Calculated: only non-trump
   - Trump Hoarder: only non-trump

3. Whether to take or defend? (aiDefend)
   - Hoarder: take if defense costs a card > 10
   - Stubborn: always defend
   - Normal: take if no non-trump defense available

4. What to defend with? (aiDefend)
   - Normal: cheapest valid card
   - Trump Hoarder: never trump unless only option
   - All: cheapest same-suit first, then cheapest trump
```

---

## The Bazaar (Between Bouts)

After winning a bout, the player enters the bazaar. The bazaar has 3 sections, displayed as a vertically scrollable panel:

### 1. Charm Shop

Offers 3 random charms from the pool (excluding ones the player already has). Each costs gold. If the player has 4 charms already, they must swap one out.

| Charm Rarity | Frequency | Cost |
|-------------|-----------|------|
| Common (charms 1–6) | 60% | 10–15 gold |
| Uncommon (charms 7–12) | 30% | 20–25 gold |
| Rare (charms 13–18) | 10% | 30–40 gold |

### 2. Deck Workshop

The player's current deck is fanned out. Two operations:

- **Remove a card** (10 gold): Tap a card to remove it from the deck permanently. Minimum deck size: 20 cards.
- **Upgrade a card** (15 gold): Tap a card to increase its value by 1 (max 14). Visual: the card flips, shows new value, flips back.

### 3. Refresh Stall

- **Heal** (free, once per bazaar): Reset your "bout bonus" — not HP (there's no HP in this game; you either win or lose each bout). This is flavor; the mechanical effect is: restock the deck with cards that were removed due to charm effects during the previous bout.
- **Reroll charms** (5 gold): Refresh the 3 offered charms with a new random selection.

### Gold Economy

| Source | Amount |
|--------|--------|
| Base bout win | 10 gold |
| Clean defense (never took) | +10 gold |
| Quick finish (< 5 rounds) | +5 gold |
| Cards left in shared deck | +1 per card |
| Charm-specific bonuses | Varies |

Average gold per bout: ~20–30. A typical 10-bout run earns ~200–300 gold total.

### Bazaar UI

```
┌─────────────────────────────┐
│         THE BAZAAR          │
│        Gold: 45             │
├─────────────────────────────┤
│  CHARMS (pick up to 1)     │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 🎰 │ │ 🛡️ │ │ 🃏 │     │
│  │15g │ │20g │ │35g │     │
│  └────┘ └────┘ └────┘     │
│  [Reroll 5g]               │
├─────────────────────────────┤
│  YOUR DECK (32 cards)      │
│  [6♠][7♠][8♠]...[A♥]      │  ← horizontally scrollable
│  [Remove 10g] [Upgrade 15g]│
├─────────────────────────────┤
│                             │
│       [Continue →]          │
│                             │
└─────────────────────────────┘
```

---

## Deck Building Strategy

The meta-game revolves around shaping your deck across 10 bouts:

### Thinning
Removing weak cards (6s, 7s) means you draw stronger cards more often. But a smaller deck means the shared bout deck has more random filler cards that might end up in your hand. There's a sweet spot.

### Suit Focus
If you remove cards of 2 suits and keep 2 suits, your hand will have more same-suit cards — making defense easier (you'll more often have the right suit to beat an attack). Combine with Suit Streak charm for trump access.

### Trump Loading
Upgrading your trump-suit cards and keeping all of them makes your defenses near-impenetrable. But the opponent draws from the same deck, and filler cards include trumps too.

### Value Stacking
Keeping many cards of the same value (e.g., four 10s) makes throwing on very easy — once any 10 appears in the bout, you can throw on with all others. Combine with Pair Power charm.

---

## Seeded Runs (Multiplayer)

Same approach as Durak Dungeon:

- Each run has a **seed** (short string, e.g., `BAZAR7`)
- Seed determines: trump suit per bout, opponent order, charm shop offerings, deck filler cards
- Seed displayed in header, copyable
- URL parameter: `?seed=BAZAR7`
- Two players with the same seed face the same opponents and charm offerings — compare who gets further

### Seeded PRNG

Same `mulberry32` implementation as Durak Dungeon (see that doc for code). All randomness flows through the seeded RNG.

---

## UI Layout

### Title Screen

```
┌─────────────────────────────┐
│                             │
│       DURAK BAZAAR          │
│                             │
│  Outsmart 10 opponents.     │
│  Build your deck.           │
│  Master the bazaar.         │
│                             │
│  Seed: [______] (optional)  │
│                             │
│       [▶ Start Run]         │
│                             │
└─────────────────────────────┘
```

### Opponent Preview

```
┌─────────────────────────────┐
│       BOUT 4 OF 10          │
│                             │
│     The Tactician           │
│     "Calculated"            │
│                             │
│  Plays in pairs.            │
│  Saves trump for defense.   │
│                             │
│  Your charms:               │
│  [🎰][👑][🔨][  ]           │
│                             │
│  Trump: ♦   Deck: 28 cards  │
│                             │
│       [▶ Begin Bout]        │
└─────────────────────────────┘
```

### During Bout

Identical layout to existing Durak game, with these additions:
- **Charm bar** below the header (row of icons)
- **Charm trigger popups:** When a charm fires, a small toast appears above the charm bar for 1.5s: "🎰 Lucky 7 — Drew 1 card"
- **Bout counter** in header: "Bout 4/10"
- **Score preview** in corner showing running bout score

### Run Over Screen

```
┌─────────────────────────────┐
│       RUN COMPLETE!         │  (or "DEFEATED — Bout 7")
│                             │
│  Bouts won: 10/10           │
│  Total gold earned: 285     │
│  Charms triggered: 47       │
│  Cards removed: 8           │
│  Clean defenses: 6          │
│                             │
│  Seed: BAZAR7               │
│  [Copy Seed]                │
│                             │
│       [▶ New Run]           │
└─────────────────────────────┘
```

---

## Data Structures

### Run State

```js
var run = {
  seed: 'BAZAR7',
  rng: null,                // seeded RNG function
  bout: 1,                  // current bout (1–10)
  gold: 0,
  deck: [],                 // player's persistent deck (Card objects)
  charms: [],               // array of Charm objects, max 4
  opponents: [],            // pre-generated array of 10 opponent configs
  phase: 'title',           // title | preview | playing | bazaar | gameover | victory
  currentBout: null,        // active bout state (mirrors existing Durak game state)
  stats: {
    boutsWon: 0,
    totalGold: 0,
    charmTriggers: 0,
    cleanDefenses: 0,
    cardsTaken: 0,
    cardsRemoved: 0,
    cardsUpgraded: 0
  }
};
```

### Charm Object

```js
{
  id: 'lucky-7',
  name: 'Lucky 7',
  icon: '🎰',
  description: 'Play a 7 → Draw 1 extra card',
  rarity: 'common',         // common | uncommon | rare
  cost: 12,                 // gold cost in bazaar
  trigger: 'onCardPlayed',  // hook name
  condition: function(card, context) { return card.value === 7; },
  effect: function(context) { /* draw 1 card */ },
  activatedThisBout: false, // for once-per-bout charms
  triggerCount: 0           // lifetime trigger count (for stats)
}
```

### Opponent Config

```js
{
  name: 'The Tactician',
  personality: 'calculated',
  description: 'Plays in pairs. Saves trump for defense.',
  bout: 4,                  // which bout this opponent appears at
  aiOverrides: {
    attackPreference: 'pairs-first',   // 'lowest' | 'highest' | 'pairs-first'
    throwOnPolicy: 'non-trump-only',   // 'always' | 'never' | 'non-trump-only'
    takeThreshold: null,                // null (normal) | value above which AI takes instead of defending
    defendPreference: 'cheapest'        // 'cheapest' | 'no-trump' | 'any'
  }
}
```

### Card Object

Same as existing Durak, with one addition:

```js
{
  value: 11,
  suit: 2,
  id: '112',
  upgraded: false           // true if this card has been upgraded at the bazaar
}
```

Upgraded cards have a subtle visual indicator — a small "+" next to the value.

---

## Charm Hook System

Charms fire at specific game events. The game engine checks all charms at each hook point:

```js
function fireCharmHook(hookName, data) {
  for (var i = 0; i < run.charms.length; i++) {
    var charm = run.charms[i];
    if (charm.trigger === hookName && charm.condition(data.card, data)) {
      charm.effect(data);
      charm.triggerCount++;
      run.stats.charmTriggers++;
      showCharmTriggerToast(charm);
    }
  }
}
```

### Hook Points

| Hook | When | Data Available |
|------|------|---------------|
| `onCardPlayed` | After any card is played (attack or defend) by the player | `{ card, action: 'attack'|'defend' }` |
| `onDefendSuccess` | After player successfully defends one attack | `{ card, attackCard }` |
| `onOpponentTakes` | When opponent picks up cards | `{ cardCount }` |
| `onOpponentPasses` | When opponent passes (all defended) | `{ pairsDefended }` |
| `onBoutEnd` | When the bout is over (win or lose) | `{ won, roundCount, cardsInHand, cardsInDeck }` |
| `onTurnStart` | At the start of each player turn | `{ handSize, deckSize }` |
| `onActivate` | When player taps an active charm | `{}` |

---

## localStorage Keys

| Key | Type | Notes |
|-----|------|-------|
| `lastPlayed_durakBazaar` | timestamp | Set on run start |
| `durakBazaar_bestBout` | integer | Highest bout reached (1–10) |
| `durakBazaar_victories` | integer | Full run completions |
| `durakBazaar_totalBouts` | integer | Lifetime bouts won |
| `durakBazaar_lastSeed` | string | Seed of most recent run |

---

## Scope Notes for Implementation

### Build Order

1. **Phase 1 — Bout with personality AI:** Fork existing Durak game.js. Add opponent preview screen. Implement personality-driven AI overrides for all 10 opponents. Sequence of 10 bouts with no meta-game. Win = advance, lose = run over.
2. **Phase 2 — Bazaar (deck management):** Between bouts, show the bazaar. Implement remove card and upgrade card. Gold economy (base rewards).
3. **Phase 3 — Charms (core 6):** Implement charm data, charm bar UI, charm hook system. Start with 6 common charms. Charm shop in bazaar.
4. **Phase 4 — Full charm pool:** Add remaining 12 charms. Rarity tiers. Reroll option.
5. **Phase 5 — Seeded runs:** Seeded PRNG, seed input, URL sharing.
6. **Phase 6 — Polish:** Charm trigger animations, bout scoring, run stats screen, visual polish.

### Things to Keep Simple

- The bout itself is standard Durak — don't modify the core card rules
- Charms are passive triggers, not complex activated abilities (except Wild Card)
- No persistent meta-progression between runs (each run is standalone)
- Opponent personalities are just AI parameter tweaks, not new mechanics
- The deck/bazaar system is the only between-bout interaction — no map, no routing
- No timer pressure — it's turn-based, think as long as you want

### Code Reuse from Existing Durak

The following can be directly reused or lightly adapted from `games/durak/game.js`:

- `Card` constructor, `SUIT_EMOJI`, `SUIT_NAME`, `FACE_MAP`, helper functions
- `buildDeck()` (modified to use player's trimmed deck + filler)
- `canPlayCard()` (unchanged)
- `playCard()`, `takeCards()`, `passRound()` (add charm hooks)
- `aiAttack()`, `aiDefend()` (add personality overrides)
- Card rendering (`createCardEl`) and field rendering
- Settings integration pattern
- All CSS card styles and responsive breakpoints
