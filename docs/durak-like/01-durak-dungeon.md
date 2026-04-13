# Durak Dungeon — Design & Implementation Doc

> Roguelike dungeon crawler where Durak card mechanics replace combat. Descend floors, collect relics, thin your deck, fight bosses.

## Overview

**Genre:** Roguelike deckbuilder / dungeon crawler
**Renderer:** DOM (cards, relics, UI — no canvas needed)
**Files:** `games/durak-dungeon/index.html`, `style.css`, `game.js`
**Estimated complexity:** High (most content of the four concepts, but all data-driven)

The player descends through floors of a dungeon. Each floor is a Durak-style card bout against an enemy. Between floors, the player visits shops and makes choices that modify their deck and abilities. A run ends when HP reaches 0 or the player defeats the final boss.

---

## Core Concept

Standard Durak has two sides — attacker and defender. In Durak Dungeon:

- **The enemy always attacks first.** The enemy plays attack cards; the player must defend using Durak rules (same suit higher value, or trump).
- **Undefended cards deal damage** to the player's HP equal to the card's face value (6–14, where J=11, Q=12, K=13, A=14).
- **After defending**, the player counter-attacks. The player plays cards from their hand; each card deals its face value as damage to the enemy. The enemy does not defend — counter-attack cards always land.
- **The bout ends** when both sides have no more cards to play or choose to stop.

This preserves the Durak "defend with higher same-suit or trump" mechanic while adding an HP/damage layer on top.

---

## Game Flow

```
[Title Screen]
     |
[Start Run] → generate seed, init deck, set HP, floor 1
     |
[Floor Loop]
     |→ [Enemy Encounter] — card bout
     |→ [Rewards] — choose 1 of 3 rewards
     |→ [Shop] (every 3 floors) — buy relics, remove cards, heal
     |→ [Boss] (every 5 floors) — special enemy with rule mutations
     |→ repeat until dead or boss 4 defeated (floor 20)
     |
[Run Over] → show stats, save best floor to localStorage
```

### Run Structure

| Floors | Phase | Notes |
|--------|-------|-------|
| 1–4 | Act 1 | Easy enemies, small hands. Learning the ropes. |
| 5 | Boss 1 | First rule mutation. |
| 6–9 | Act 2 | Enemies have more cards, higher values. |
| 10 | Boss 2 | Two mutations stacked. |
| 11–14 | Act 3 | Enemies start with trump cards more often. |
| 15 | Boss 3 | Three mutations. |
| 16–19 | Act 4 | Brutal. Full 36-card enemy decks. |
| 20 | Final Boss | Four mutations. Victory if defeated. |

---

## Card System

### The Player's Deck

- **Starting deck:** 18 cards — values 6–14 across two suits (not trump, not the fourth suit). A balanced but weak starting point.
- **Trump suit** is chosen randomly at the start of the run and stays fixed for the entire run.
- **Each floor**, the player draws a hand of 6 cards from their deck. Unplayed cards return to the deck. Deck reshuffles when exhausted.
- **Cards can be upgraded** (value +1, max 14) or removed from the deck at shops.
- **Special cards** can be found as rewards — these have bonus effects (see Reward Cards below).

### Enemy Decks

Enemies don't have persistent decks. Each enemy is generated with:
- A hand size (starts at 3 on floor 1, scales to 6 by floor 15+)
- A value range (floor 1: 6–9, floor 5: 6–11, floor 10: 6–13, floor 15+: 6–14)
- A trump probability (floor 1: 10%, scaling to 40% by floor 15+)
- Cards are generated randomly within these parameters each encounter

### Combat Flow (Single Floor)

```
1. Player draws 6 cards from their deck
2. Enemy hand is generated
3. DEFEND PHASE:
   a. Enemy plays one attack card at a time (lowest value first)
   b. Player taps a card from their hand to defend (must be valid Durak defense)
   c. If player has no valid defense or chooses "Take Hit", damage is dealt
   d. Repeat until enemy has no more attack cards
4. ATTACK PHASE:
   a. Player taps cards from their hand to deal damage
   b. Each card deals its face value as damage to the enemy
   c. Player can hold cards back (they return to deck)
   d. Player taps "End Attack" when done
5. Check: is enemy HP ≤ 0? → floor cleared → rewards
6. Check: is player HP ≤ 0? → run over
7. Unplayed player cards return to deck
```

### Defense Rules (Same as Classic Durak)

A card can defend against an attack card if:
- **Same suit** and **higher value** (e.g., 8♠ beats 7♠)
- **Trump suit** beats any **non-trump** card regardless of value
- **Trump vs trump**: must be higher value

### Damage Calculation

- **Undefended enemy cards** deal damage = card value (6–14)
- **Player attack cards** deal damage = card value + bonuses from relics
- **Trump bonus:** Player attack cards of the trump suit deal +3 bonus damage

---

## Relics

Relics are persistent modifiers that last the entire run. The player can hold up to 5 relics at a time. Each relic has a simple, clear effect. Relics are the primary progression mechanic within a run.

### Relic List (Starter Set — 15 Relics)

| Relic | Name | Effect |
|-------|------|--------|
| 🛡️ | Iron Shield | Reduce all damage taken by 1 (min 1) |
| ⚔️ | Sharp Edge | All attack cards deal +2 damage |
| 👑 | Crown of Trumps | Trump cards in hand deal +5 damage instead of +3 |
| 🃏 | Wild Card | Once per floor: any card can defend against any attack (tap the relic to activate) |
| 💎 | Diamond Skin | Diamonds (♦) in your hand heal 1 HP when played to defend |
| 🔥 | Fire Blade | Cards with value 6 or 7 deal double damage on attack |
| 🧲 | Magnet | Draw 7 cards instead of 6 each floor |
| 💀 | Skull Ring | Deal +1 damage for each hit you've taken this floor |
| 🪙 | Gold Tooth | Earn +5 bonus gold after each floor |
| ❄️ | Frost Armor | First hit each floor deals 0 damage |
| 🎯 | Precision | Face cards (J/Q/K/A) deal +3 damage on attack |
| 🌀 | Chaos Orb | Enemy attack order is randomized (not lowest-first) |
| 🩸 | Blood Pact | Start each floor at -2 HP, but deal +4 damage with all attacks |
| 🔮 | Oracle | See all enemy cards face-up before the defend phase |
| ♻️ | Recycle | Cards used to defend are not discarded — they return to your deck |

### Relic Display

Relics appear as a horizontal row of icons below the header bar. Tapping a relic shows its name and effect in a tooltip/popover. Active relics (like Wild Card) have a visible "tap to use" state.

---

## Rewards

After each non-boss floor, the player picks 1 of 3 randomly generated rewards:

### Reward Types

1. **Card Reward** — Add a card to your deck. The card is shown face-up with its suit and value. Higher floors offer higher-value cards.
2. **Gold Reward** — Gain 10–25 gold (for use at shops).
3. **Heal Reward** — Restore 5–10 HP.
4. **Relic Reward** (rare, ~15% chance to replace one of the three options) — Gain a relic.

### Reward Cards (Special Cards)

Some card rewards are "enhanced" — they look like normal cards but have a bonus tag:

| Tag | Effect |
|-----|--------|
| **Burning** | Deals +3 damage when used to attack |
| **Armored** | Blocks +3 extra damage when used to defend |
| **Vampiric** | Heals 2 HP when played (attack or defend) |
| **Lucky** | When drawn, also draw 1 extra card |

Enhanced cards have a colored border glow to distinguish them from normal cards. The enhancement tag text appears below the card value in small text.

---

## Shop

The shop appears every 3 floors (after floors 3, 6, 9, 12, 15, 18). It offers:

| Item | Cost | Effect |
|------|------|--------|
| Remove a card | 15 gold | Pick a card from your deck to permanently remove |
| Upgrade a card | 20 gold | Pick a card; its value increases by 1 (max 14) |
| Heal 10 HP | 10 gold | Restore HP |
| Random relic | 30 gold | Add a random relic (if you have space) |

The shop UI is a simple vertical list of options. Tapping "Remove a card" or "Upgrade a card" fans out your deck for selection.

Gold earned: base 5 per floor + bonus from relics + 10 for a clean defense (no hits taken).

---

## Bosses

Bosses appear every 5 floors. They are normal enemies with higher HP and **rule mutations** — modifiers that change the rules of the bout.

### Boss Mutations

| Mutation | Effect |
|----------|--------|
| **No Trumps** | Trump suit is disabled for this bout. Cards must be defended with same-suit only. |
| **Armored** | Boss takes half damage (rounded down) from all attacks. |
| **Relentless** | Boss attacks with 2 cards at a time. Player must defend both before counter-attacking. Undefended cards stack damage. |
| **Mirror** | Boss copies the suit of whatever the player last defended with. Next attack card matches that suit. |
| **Regenerate** | Boss heals 5 HP at the end of the player's attack phase. |
| **Trump Shift** | Trump suit changes to a random suit at the start of each defend/attack cycle. |

Boss 1 has 1 mutation. Boss 2 has 2. Boss 3 has 3. Final boss has 4. Mutations are chosen randomly but no duplicates.

Bosses have more HP than regular enemies:
- Boss 1: 40 HP
- Boss 2: 60 HP
- Boss 3: 80 HP
- Final Boss: 120 HP

Regular enemies have HP = 15 + (floor × 3).

---

## Player Stats

| Stat | Starting Value | Notes |
|------|---------------|-------|
| HP | 50 | Max HP starts at 50, can be increased by relics |
| Gold | 0 | Earned per floor |
| Deck | 18 cards | Grows/shrinks via rewards and shops |
| Relics | 0/5 | Collected during the run |
| Floor | 1 | Current floor (1–20) |

---

## Seeded Runs (Multiplayer)

Each run uses a **seed** — a short alphanumeric string (e.g., `DKNG42`) that determines:
- Trump suit
- Enemy generation per floor
- Reward options per floor
- Shop inventory per floor
- Boss mutations
- Relic pool order

### How It Works

- Seed is generated randomly at run start, or entered manually
- Seed is displayed in the header and can be copied with one tap
- Share the seed with a friend via text/link: `?seed=DKNG42`
- Both players experience the exact same dungeon — compare final floor / HP / gold
- **Seeded PRNG:** Use a simple mulberry32 or xoshiro128 seeded RNG. All random calls during the run go through this RNG, never `Math.random()`.

### URL Sharing

`https://yevrap.github.io/KamekoStudio/games/durak-dungeon/?seed=DKNG42`

On load, if `?seed=` is present:
1. Parse the seed
2. Pre-fill the seed input on the start screen
3. Clean the URL with `history.replaceState`

---

## UI Layout

### Mobile Layout (Primary — Vertical)

```
┌─────────────────────────────┐
│ DURAK DUNGEON  ♦ Trump  F:5 │  ← Header: title, trump, floor
│ [🛡️][⚔️][👑][  ][  ]        │  ← Relic bar (up to 5 slots)
├─────────────────────────────┤
│  HP ████████░░░░  32/50     │  ← Player HP bar
│  Gold: 45                   │
├─────────────────────────────┤
│                             │
│    ENEMY CARDS              │  ← Enemy attack cards (face up)
│    [7♠] [9♠] [Q♦]          │     shown in a row
│                             │
│    Enemy HP ██████░░  24/30 │  ← Enemy HP bar
│                             │
├─────────────────────────────┤
│                             │
│  YOUR HAND                  │
│  [8♠][J♦][6♣][K♦][9♣][A♠] │  ← Tappable cards
│                             │
│  [Take Hit]    [End Attack] │  ← Context-sensitive action buttons
│                             │
└─────────────────────────────┘
```

### Desktop Layout

Same vertical layout, `max-width: 600px`, centered. Cards scale larger via CSS breakpoints (same responsive approach as existing Durak). No fundamentally different layout — the game is designed for vertical play.

### Phase Indicators

- **Defend phase:** Enemy cards glow and animate in one at a time. The current attack card is highlighted. Player's valid defense cards are subtly highlighted (border glow). Invalid cards are dimmed.
- **Attack phase:** Enemy area shows remaining enemy HP. Player taps cards to deal damage. A running damage total animates near the enemy HP bar.
- **Transition:** Brief 0.5s animation between phases. Status text changes: "Defend!" → "Attack!" → "Floor Cleared!"

### Reward Screen

```
┌─────────────────────────────┐
│       FLOOR 5 CLEARED!      │
│                             │
│  Choose a reward:           │
│                             │
│  ┌────┐  ┌────┐  ┌────┐   │
│  │ Q♣ │  │+15 │  │ 🛡️  │   │
│  │    │  │Gold│  │Iron │   │
│  │    │  │    │  │Shld │   │
│  └────┘  └────┘  └────┘   │
│                             │
└─────────────────────────────┘
```

Three tappable cards/boxes. Tap to select → brief confirmation animation → proceed to next floor.

### Shop Screen

Simple vertical list with gold cost on the right side of each row. Items that the player can't afford are dimmed. "Continue" button at bottom.

---

## Data Structures

### Run State (Single Object)

```js
var run = {
  seed: 'DKNG42',
  rng: null,                // seeded RNG function
  floor: 1,
  hp: 50,
  maxHp: 50,
  gold: 0,
  deck: [],                 // array of Card objects
  relics: [],               // array of Relic objects, max 5
  phase: 'title',           // title | defend | attack | rewards | shop | gameover | victory
  currentEnemy: null,       // { hp, maxHp, cards: [], mutations: [] }
  hand: [],                 // current hand drawn from deck
  enemyAttackIndex: 0,      // which enemy card is currently attacking
  floorDamageDealt: 0,      // damage dealt this floor (for stats)
  floorDamageTaken: 0,      // damage taken this floor
  stats: {
    floorsCleared: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    enemiesDefeated: 0,
    goldEarned: 0,
    cardsPlayed: 0
  }
};
```

### Card Object

```js
{
  value: 11,              // 6–14
  suit: 2,                // 1=spades, 2=clubs, 3=diamonds, 4=hearts
  id: '112',              // string: value + suit
  enhancement: null       // null | 'burning' | 'armored' | 'vampiric' | 'lucky'
}
```

### Relic Object

```js
{
  id: 'iron-shield',
  name: 'Iron Shield',
  icon: '🛡️',
  description: 'Reduce all damage taken by 1 (min 1)',
  usesPerFloor: -1,       // -1 = passive, 1+ = active with limited uses
  usesRemaining: -1,
  onDefend: null,          // function hook or null
  onAttack: null,          // function hook or null
  onFloorStart: null,      // function hook or null
  onDamageTaken: null      // function hook or null
}
```

### Enemy Object

```js
{
  hp: 30,
  maxHp: 30,
  cards: [],               // array of Card objects (the attack hand)
  mutations: [],           // array of mutation IDs (boss only)
  name: 'Bandit'           // display name
}
```

---

## Enemy Names (Flavor)

Each act has a themed enemy pool. Names are cosmetic only.

| Act | Enemies |
|-----|---------|
| 1 | Rat, Bandit, Thief, Stray Dog |
| 2 | Knight, Archer, Spearman, Guard |
| 3 | Sorcerer, Dark Knight, Assassin, Golem |
| 4 | Dragon, Demon, Wraith, Lich |
| Bosses | The Gatekeeper, The Warden, The Hollow King, The Durak |

---

## Seeded PRNG Implementation

```js
function mulberry32(seed) {
  var h = seed | 0;
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// Usage: run.rng = mulberry32(seedFromString(run.seed));
// All random: run.rng() instead of Math.random()
```

---

## localStorage Keys

| Key | Type | Notes |
|-----|------|-------|
| `lastPlayed_durakDungeon` | timestamp | Set on run start |
| `durakDungeon_bestFloor` | integer | Highest floor reached |
| `durakDungeon_victories` | integer | Number of complete runs (beat floor 20) |
| `durakDungeon_lastSeed` | string | Seed of the last run played |

---

## Animation & Polish

- **Card play:** Cards slide from hand to field position with a 150ms CSS transition (`transform` + `opacity`).
- **Damage numbers:** When damage is dealt, a floating number (e.g., "-8") animates upward from the HP bar and fades out over 600ms. Red for player damage, white for enemy damage.
- **HP bar:** Animated width transition (300ms ease). Color shifts: green > yellow > red as HP decreases.
- **Floor transition:** Brief screen with floor number that fades in/out (500ms total).
- **Relic acquisition:** Relic icon pops into the relic bar with a scale-up bounce animation.
- **Boss entrance:** Boss name and mutation list display on a dramatic overlay before the bout begins. Dark background, white text, mutations listed as red tags.

All animations use CSS transitions and `@keyframes` — no JS animation libraries.

---

## Settings Integration

Same pattern as existing Durak:
- Pause on `settingsOpened`, resume on `settingsClosed`
- Inject a "Current Run" section showing seed + floor + stats
- Token gate on run start

---

## Scope Notes for Implementation

### Build Order (Recommended Phases)

1. **Phase 1 — Core loop:** Title screen, draw hand, defend phase, attack phase, enemy HP, floor progression. No relics, no shop, no enhancements. Just card combat.
2. **Phase 2 — Progression:** Rewards screen (cards, gold, heal), shop (remove, upgrade, heal), gold economy. Player HP persists across floors.
3. **Phase 3 — Relics:** Relic data, relic UI bar, relic effects hooked into combat. Start with 5 relics, expand to full 15.
4. **Phase 4 — Bosses:** Boss mutations, boss HP scaling, boss entrance overlay.
5. **Phase 5 — Seeded runs:** Seeded PRNG, seed display/input, URL sharing.
6. **Phase 6 — Polish:** Animations, damage numbers, sound (optional), enhanced card effects.

### Things to Keep Simple

- No inventory management beyond relics
- No complex card combos — each card is standalone
- No branching dungeon paths — linear floor progression
- Enemy AI is trivial — they just play their cards in order
- No save/resume mid-run — runs are meant to take 15–25 minutes
