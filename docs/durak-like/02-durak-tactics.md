# Durak Tactics — Design & Implementation Doc

> Turn-based grid tactics game where Durak card mechanics determine combat. Place cards as units, clash with Durak beating rules, control the shifting trump advantage.

## Overview

**Genre:** Turn-based tactics / card placement
**Renderer:** DOM (CSS Grid for the battlefield, card elements for units)
**Files:** `games/durak-tactics/index.html`, `style.css`, `game.js`
**Estimated complexity:** Medium-high (grid logic + card mechanics + campaign)

Players place cards from their hand onto a grid battlefield. Cards act as units — their value is their HP, their suit determines their type. When adjacent units clash, combat resolves using Durak beating rules. The trump suit shifts periodically, creating dramatic swings in power. A roguelike campaign layer sends the player through branching encounters.

---

## Core Concept

The central insight: Durak's "same suit higher value, or trump beats anything" rule creates a natural rock-paper-scissors when applied to grid combat. A lowly 6 of trumps can defeat an Ace of any other suit — but if the trump shifts, that 6 becomes the weakest unit on the board.

### Unit Placement

- The battlefield is a **5×4 grid** (5 columns, 4 rows).
- The player controls the bottom 2 rows. The enemy controls the top 2 rows.
- Each turn, the player places 1 card from their hand onto an empty cell in their zone.
- After placement, all adjacent friendly-vs-enemy pairs resolve combat.

### Combat Resolution (Durak Rules Applied to Grid)

When a player unit is **orthogonally adjacent** (up/down/left/right, not diagonal) to an enemy unit, they clash:

1. **Same suit, player value > enemy value:** Player unit wins. Enemy unit is destroyed. Player unit takes damage equal to the enemy's value (its own value decreases by that amount). If player unit's value reaches 0 or below, it's also destroyed.
2. **Player is trump suit, enemy is not:** Player unit wins regardless of value. Player unit takes damage = enemy value.
3. **Trump vs trump:** Higher value wins. Winner takes damage = loser's value.
4. **Same suit, player value ≤ enemy value:** Player unit loses. Enemy unit takes damage = player's value.
5. **Different suits, neither is trump:** No combat. Units coexist adjacently without fighting.

**Key design note:** Units only fight if one *could beat* the other by Durak rules. Two units of different non-trump suits simply ignore each other. This creates interesting positional play — you can safely place non-trump units next to enemies of different suits.

### Damage & Persistence

Units stay on the board until destroyed. Their value represents their remaining HP. A King (13) that defeats a 9 of the same suit becomes a 4 (13 - 9 = 4). This weakened unit is still on the board and can be finished off by anything.

---

## Turn Structure

```
PLAYER TURN:
  1. Draw up to hand limit (5 cards) from your deck
  2. Place 1 card onto an empty cell in your zone (bottom 2 rows)
  3. All adjacent combats resolve simultaneously
  4. [Optional] Activate one ability card if available

ENEMY TURN:
  1. AI places 1 card onto an empty cell in their zone (top 2 rows)
  2. All adjacent combats resolve simultaneously

TRUMP CHECK (every 3 full rounds):
  Trump suit shifts to the next suit in sequence (♠→♣→♦→♥→♠)
  A visual announcement plays: "Trump shifts to ♦!"

WIN CONDITION: Destroy all enemy units AND the enemy has no cards left to place
LOSE CONDITION: All your units are destroyed AND you have no cards left to place
```

### Simultaneous Resolution

When a card is placed and multiple adjacent combats trigger, they all resolve at the same time. This means a single card might fight 2 enemies at once (one above, one to the side). Each combat is independent — the card's current value is used for all combats in that round, then damage is applied.

Example: Player places K♠ (13) adjacent to 7♠ (enemy) and 9♠ (enemy).
- K♠ beats 7♠: K takes 7 damage → becomes 6♠
- K♠ beats 9♠: K takes 9 damage → becomes 4♠
- Both damages applied simultaneously: 13 - 7 - 9 = -3 → K♠ is destroyed
- But both enemy units are also destroyed

---

## The Grid

### Visual Design

```
     Col1  Col2  Col3  Col4  Col5
    ┌─────┬─────┬─────┬─────┬─────┐
R1  │ 9♣  │     │ K♦  │     │ 7♠  │  ← Enemy zone
    ├─────┼─────┼─────┼─────┼─────┤
R2  │     │ J♠  │     │ A♣  │     │  ← Enemy zone
    ├─────┼─────┼─────┼─────┼─────┤
R3  │ 8♦  │     │ Q♠  │     │     │  ← Player zone
    ├─────┼─────┼─────┼─────┼─────┤
R4  │     │ 10♣ │     │ 6♦  │     │  ← Player zone
    └─────┴─────┴─────┴─────┴─────┘

Hand: [7♣] [J♦] [9♠] [A♦] [8♣]     ← 5-card hand

Trump: ♦ (shifts in 2 turns)
```

Each cell is a square. On mobile, cells are ~60px. On desktop, ~80px. Cards in cells show the value and suit emoji in a compact format. Color coding by suit (red for hearts/diamonds, dark for spades/clubs). Trump cards have the gold border glow (same as existing Durak).

Empty cells in the player's zone have a subtle dashed border — tappable to place a card.

### Placement Flow

1. Player taps a card in their hand → card highlights (selected state)
2. Valid placement cells in the player zone glow/pulse
3. Player taps a valid cell → card slides into the cell (150ms transition)
4. Combat resolves → damage animations play
5. Turn passes to enemy

Alternative: drag-and-drop. But tap-tap is more reliable on mobile, so make tap-tap primary. Drag optional for desktop.

---

## Suit Roles

Each suit has a cosmetic flavor that helps players think about their units. These are **not** mechanical differences — all suits follow the same Durak rules. The flavor just makes the board easier to read at a glance.

| Suit | Emoji | Color | Flavor |
|------|-------|-------|--------|
| ♠ Spades | ♠ | Dark (var(--card-black)) | Soldiers — reliable, balanced |
| ♣ Clubs | ♣ | Dark | Rogues — scrappy fighters |
| ♦ Diamonds | ♦ | Red (var(--card-red)) | Mages — valuable but fragile |
| ♥ Hearts | ♥ | Red | Knights — the heavy hitters |

The key mechanical relationship is **suit matching** and **trump status**, not any inherent difference between suits.

---

## Campaign Mode (Roguelike Layer)

### Campaign Map

The campaign is a **branching path** of 15 nodes, displayed as a vertical scrolling map (think Slay the Spire style, but simpler). The player progresses upward.

```
        [BOSS]           ← Node 15: Final boss
       /      \
    [Battle] [Battle]    ← Nodes 13-14
      |    \  /
    [Event] [Shop]       ← Nodes 11-12
      |      |
    [Battle] [Battle]    ← Nodes 9-10
       \    /
        [BOSS]           ← Node 8: Mid boss
       /      \
    [Battle] [Event]     ← Nodes 6-7
      |        |
    [Shop]  [Battle]     ← Nodes 4-5
       \    /
      [Battle]           ← Node 3
        |
      [Battle]           ← Node 2
        |
      [START]            ← Node 1
```

### Node Types

| Type | Icon | Description |
|------|------|-------------|
| Battle | ⚔️ | Standard grid combat encounter |
| Boss | 💀 | Hard encounter with special rules |
| Shop | 🪙 | Buy/sell/upgrade cards |
| Event | ❓ | Random choice event (risk/reward) |

At branch points, the player chooses which path to take. Paths rejoin at boss nodes.

### Between Battles

After winning a battle, the player gets to **pick 1 of 2 new cards** to add to their deck. Cards offered are random, weighted toward the current act's difficulty level.

### Events

Events present a choice between two options. Each has a clear risk/reward tradeoff.

| Event | Option A | Option B |
|-------|----------|----------|
| The Merchant | Lose 2 cards from your deck, gain 1 high-value card (J–A) | Keep your deck as-is, gain 10 gold |
| The Shrine | All your cards of one suit gain +1 value | Remove all cards below value 8 from your deck |
| The Gamble | 50% chance: gain a trump-suit Ace. 50% chance: lose your highest card | Walk away safely |
| The Forge | Pick a card to upgrade (+2 value, capped at 14) | Pick a card to duplicate (add a copy to your deck) |
| The Oracle | See the next boss's layout for 5 seconds | Gain 1 extra card draw for the next 3 battles |

### Shop

| Item | Cost | Effect |
|------|------|--------|
| Buy a card | 10–25 gold (scales with value) | Add a specific card to your deck |
| Remove a card | 15 gold | Remove a card from your deck |
| Upgrade a card | 20 gold | +1 value to a chosen card (max 14) |
| Trump Scroll | 30 gold | Next battle starts with your chosen trump suit |
| Heal | Free (once per shop) | Restore battle HP to full (no persistent HP) |

Gold earned: 5 per battle won + 5 per unit surviving at battle end.

---

## Enemy AI

The AI needs to be simple but not trivially exploitable.

### AI Placement Strategy

```
Priority order:
1. If AI has a trump card and can place it adjacent to a player unit it would beat:
   → place it there
2. If AI has a same-suit card that can beat an adjacent player unit:
   → place it there
3. If AI has a high-value card (10+) and there's a safe cell (not adjacent to
   any player unit that could beat it):
   → place it there to build board presence
4. Otherwise:
   → place the lowest-value card in the safest available cell
```

The AI should never:
- Place a card where it would immediately be destroyed with no trade
- Hold cards when it has empty cells (always place if possible)

### Difficulty Scaling

| Act | Enemy Hand Size | Enemy Value Range | Notes |
|-----|----------------|-------------------|-------|
| 1 (floors 1–3) | 6 cards | 6–10 | Easy. Player learns mechanics. |
| 2 (floors 4–7) | 8 cards | 6–12 | Medium. Face cards appear. |
| 3 (floors 8+ ) | 10 cards | 6–14 | Hard. Full range. More trump cards. |

### Boss Encounters

Bosses use a **pre-built starting board** — they begin with 2–3 units already placed on the grid. The player's side starts empty as usual.

Boss special rules (one per boss):

| Boss | Name | Rule |
|------|------|------|
| Boss 1 | The Wall | Boss units in row 2 can't be attacked from row 3 (must clear row 1 first) |
| Boss 2 | The Trumpeter | Trump suit changes every turn instead of every 3 turns |

---

## Player Deck

### Starting Deck

12 cards: three cards from each suit, values 6, 8, and 10. A balanced, symmetrical starting point.

### Deck Limits

- Minimum deck size: 8 cards (can't remove below this)
- Maximum deck size: 20 cards
- Hand limit: 5 cards drawn at start of each turn (or fewer if deck is nearly empty)

### Deck Thinning

Removing low-value cards is a powerful strategy — it makes your draws more consistent and high-impact. The shop's "Remove a card" option is intentionally cheap to encourage this. However, the minimum deck size of 8 prevents over-thinning (you need enough cards to fill turns in a long battle).

---

## Multiplayer: Pass-and-Play

Two players share one device. Same grid, but both sides are player-controlled.

### How It Works

1. Start screen has a "vs AI" / "vs Player" toggle (same pattern as existing Durak)
2. In PvP mode, a **"Pass the Phone"** screen appears between turns:
   - Screen shows only "Player 1's Turn — Tap to Start" or "Player 2's Turn — Tap to Start"
   - Tapping reveals that player's hand and the board
   - This prevents the other player from seeing your hand
3. Each player places 1 card per turn, alternating
4. Trump shift still happens every 3 full rounds

### PvP Layout

Player 1 controls bottom 2 rows, Player 2 controls top 2 rows. When it's Player 2's turn, the board display does **not** flip — Player 2 still places in the top 2 rows. Both players see the same orientation.

---

## UI Layout

### Mobile (Primary)

```
┌─────────────────────────────┐
│ DURAK TACTICS    ♦ Trump  2 │  ← Header: title, trump, turns until shift
├─────────────────────────────┤
│                             │
│  ┌───┬───┬───┬───┬───┐     │
│  │   │9♣ │   │K♦ │   │ R1  │  ← Enemy zone
│  ├───┼───┼───┼───┼───┤     │
│  │J♠ │   │   │   │7♠ │ R2  │  ← Enemy zone
│  ├───┼───┼───┼───┼───┤     │
│  │   │   │Q♠ │   │   │ R3  │  ← Player zone
│  ├───┼───┼───┼───┼───┤     │
│  │   │10♣│   │6♦ │   │ R4  │  ← Player zone
│  └───┴───┴───┴───┴───┘     │
│                             │
│  Gold: 30    Deck: 8        │  ← Info bar
│                             │
│  [7♣] [J♦] [9♠] [A♦] [8♣] │  ← Hand (scrollable if needed)
│                             │
│         [End Turn]          │  ← Action button
└─────────────────────────────┘
```

### Desktop

Same layout, centered at `max-width: 600px`. Grid cells are larger (80px vs 60px). Cards in hand are bigger. Otherwise identical.

### Cell Display

Each occupied cell shows:
- Card value (large, centered) — e.g., "K" or "9"
- Suit emoji (smaller, below value)
- Background tint: red-ish for hearts/diamonds, cool/neutral for spades/clubs
- Gold border for trump suit units
- Damage flash: when a unit takes damage, the cell flashes red briefly (200ms)

Empty player-zone cells: dashed border, subtle background. Tappable when a hand card is selected.
Empty enemy-zone cells: no visual, not interactive.

### Combat Animations

When combat resolves:
1. Attacking and defending cells flash simultaneously (200ms)
2. A small damage number floats above each unit (e.g., "-7")
3. Destroyed units fade out (300ms) and the cell empties
4. Surviving units update their displayed value

### Trump Shift Animation

When trump shifts:
1. A banner slides in from the top: "Trump shifts to ♥!"
2. All trump-suit units on the board gain a gold pulse animation
3. All units that just lost trump status lose their gold border
4. Banner fades after 1.5 seconds

---

## Data Structures

### Game State

```js
var game = {
  phase: 'title',          // title | map | battle | shop | event | rewards | gameover | victory
  campaign: {
    nodes: [],             // array of node objects defining the map
    currentNode: 0,        // index into nodes array
    gold: 0,
    deck: [],              // player's full deck (Card objects)
    path: []               // indices of visited nodes
  },
  battle: {
    grid: [],              // 4×5 2D array, each cell is null or a Unit object
    playerHand: [],        // cards available to place this battle
    enemyHand: [],         // cards the enemy will place
    turn: 'player',        // 'player' | 'enemy'
    roundCount: 0,         // increments each full round (both players take a turn)
    trumpSuit: 1,          // current trump suit (shifts every 3 rounds)
    trumpShiftIn: 3,       // turns until next trump shift
  }
};
```

### Unit Object

```js
{
  value: 11,               // current HP/value (decreases with damage)
  originalValue: 13,       // value when placed (for display/stats)
  suit: 1,                 // 1–4
  owner: 'player',         // 'player' | 'enemy'
  row: 2,
  col: 3,
  id: 'u_131_2_3'          // unique ID for DOM tracking
}
```

### Card Object

```js
{
  value: 13,
  suit: 1,
  id: '131'                // value + suit string
}
```

### Campaign Node

```js
{
  type: 'battle',          // 'battle' | 'boss' | 'shop' | 'event'
  row: 3,                  // vertical position on map
  col: 1,                  // horizontal position (0 or 1 for branching)
  connections: [5, 6],     // indices of nodes this connects to
  completed: false,
  data: {}                 // type-specific data (enemy deck for battle, items for shop, etc.)
}
```

---

## localStorage Keys

| Key | Type | Notes |
|-----|------|-------|
| `lastPlayed_durakTactics` | timestamp | Set on run start |
| `durakTactics_bestNode` | integer | Furthest campaign node reached |
| `durakTactics_victories` | integer | Campaign completions |
| `durakTactics_totalBattles` | integer | Lifetime battles won |

---

## Scope Notes for Implementation

### Build Order

1. **Phase 1 — Grid combat:** 5×4 grid, place cards, resolve adjacent combat with Durak rules, alternating turns with basic AI. No campaign — just a single battle sandbox.
2. **Phase 2 — Trump shifting:** Trump suit shifts every 3 rounds. Visual indicators for trump units. Shift announcement.
3. **Phase 3 — Campaign map:** Linear sequence of battles (no branching yet). Player deck persists. Card rewards between battles.
4. **Phase 4 — Full campaign:** Branching map, events, shops, gold economy.
5. **Phase 5 — Bosses:** Pre-placed units, special rules.
6. **Phase 6 — PvP:** Pass-and-play mode, turn handoff screen.

### Things to Keep Simple

- Grid is always 5×4 — no different map sizes per encounter
- No unit movement — once placed, units stay in their cell until destroyed
- No abilities, spells, or card effects beyond the core Durak beating rules
- Combat is deterministic — no randomness in resolution (all randomness is in card draws and trump shifts)
- Campaign map is generated once at run start (from a fixed template with randomized node types)
- No save/resume mid-campaign — campaigns take 15–20 minutes
