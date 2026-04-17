# Durak Redesign — Visual Design Spec

This is the north-star reference. Every implementation phase maps to decisions made here.

---

## The Big Idea

Replace "boxy widgets floating on black" with a **single unified felt-green card table** that contains everything related to the current match:

- Deck + trump card **docked** in the top-left corner of the table.
- Opponents as **seated player cards** arranged along the top rim.
- A **floating action-prompt pill** at the top-center of the table ("Your attack — play a card") — clear, large, and impossible to miss.
- The field (attack + defense pairs) in the middle of the table.
- A **faint trump-suit watermark** fills the empty-field state so the "waiting" state is intentional scenery, not a grey void.

The **header** becomes a slim two-element title bar (wordmark left, settings gear right). The **hand** at the bottom gets larger cards with a subtle **fan** — outer cards rotated ±3°, middle cards lifted slightly — and less aggressive overlap.

Both dark and light modes read as "card table, different lighting":
- Dark mode: deep emerald felt, gold-hairline border, warm inner shadow.
- Light mode: lighter sage-green felt, subtle dark-hairline border, soft shadow.

---

## Layout Zones (top → bottom)

### 1. Header (40 px tall)

```
┌─────────────────────────────────────────────┐
│  DURAK                                  ⚙  │
└─────────────────────────────────────────────┘
```

- `#game-title` (wordmark) on the left.
- Settings gear (fixed-positioned, already injected by `shared/settings.js`) on the right.
- **Status, trump, deck count are REMOVED from the header** — they move onto the table.
- No blur backdrop needed; header is flat.

### 2. Opponents Band (seat rail)

```
┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐
│🂠 ⓷│  │🂠 ⓺│  │🂠⑫│  │🂠 ④│  │🂠 ⑤│
│CPU │  │CPU │  │CPU │  │CPU │  │CPU │
│ 1  │  │ 2  │  │ 3  │  │ 4  │  │ 5  │
│DEF │  │ATK │  │THR │  │    │  │    │
└──┘  └──┘  └──┘  └──┘  └──┘
```

- Horizontal flex row, centered, wraps only on extreme edge cases.
- Each opponent is a `.seat-tile`: one full seat-sized card back + count badge (circle on card's top-right corner) + name chip below + role pill below.
- Priority player: soft radial glow + `translateY(-3px)`.
- Eliminated player: `opacity: 0.35; filter: grayscale(0.6)`.

### 3. Table Surface (`.table-surface`) — the hero element

```
┌─────────────────────────────────────────────┐
│ ╔═══╗               ┌─Your attack─┐           │
│ ║ ▞ ║                                        │
│ ║ ▞ ║   ·  (faint trump watermark)  ·        │
│ ╚═══╝                                        │
│  9                                           │
│                                              │
│           ┌────┐      ┌────┐                 │
│           │ A♠ │      │ K♥ │                 │
│           └────┘      └────┘                 │
└─────────────────────────────────────────────┘
```

- Rounded (16 px) panel with radial felt gradient.
- Hairline border + inner shadow for depth.
- Contains, via absolute positioning or flex layout:
  - **Deck + trump** in the top-left corner (Phase 2).
  - **Deck count label** under the deck stack.
  - **Action-prompt pill** at top-center (Phase 4).
  - **Pile-on banner overlay** (shows instead of prompt when pile-on is active).
  - **Field** (flex wrap, centered, 6 px gap, reserves left padding for the docked deck).
  - **Field watermark** (trump-suit SVG, faint, centered, visible only when field is empty).

### 4. Hand Zone

```
┌─────────────────────────────────────────────┐
│  ╱─╲  ╱─╲  ┌─┐  ┌─┐  ┌─┐  ╲─╱  ╲─╱           │
│ │ 10│ │ 8 │ │ 8│ │ J│ │ J│ │10│ │10│          │
│ │ ♣ │ │ ♣ │ │ ♠│ │ ♠│ │ ♥│ │♦ │ │♥ │          │
│  ╲─╱  ╲─╱  └─┘  └─┘  └─┘  ╱─╲  ╱─╲           │
│                                              │
│        [ Take ] [ Pass ] [ Done ]            │
└─────────────────────────────────────────────┘
```

- Drag-scrollable row (existing `wireHandScroll` preserved).
- Cards are larger (see breakpoint table) with subtle fan (outer ±3°, middle flat and lifted).
- Action buttons row below.

---

## New CSS Custom Properties

Add to both theme blocks in `games/durak/style.css`:

| Property | Dark | Light |
|----------|------|-------|
| `--felt` | `radial-gradient(ellipse at center, #1f5740 0%, #0f2e22 70%, #081812 100%)` | `radial-gradient(ellipse at center, #4a7a5c 0%, #355a44 70%, #264030 100%)` |
| `--table-border` | `rgba(255, 215, 100, 0.12)` | `rgba(0, 0, 0, 0.15)` |
| `--table-inner-shadow` | `inset 0 2px 20px rgba(0, 0, 0, 0.4)` | `inset 0 2px 20px rgba(0, 0, 0, 0.2)` |
| `--seat-bg` | `rgba(16, 36, 28, 0.85)` | `rgba(245, 245, 240, 0.9)` |
| `--seat-border` | `rgba(255, 255, 255, 0.08)` | `rgba(0, 0, 0, 0.08)` |
| `--active-seat-glow` | `rgba(255, 215, 100, 0.45)` | `rgba(40, 100, 60, 0.4)` |
| `--prompt-bg` | `rgba(20, 40, 30, 0.85)` | `rgba(255, 255, 255, 0.9)` |
| `--prompt-text` | `#f0f4f0` | `#1a2a20` |
| `--watermark-color` | `rgba(255, 255, 255, 0.06)` | `rgba(255, 255, 255, 0.18)` |

The existing `--bg`, `--text`, `--card-bg`, `--card-border`, `--card-red`, `--card-black`, `--btn-*` properties stay. The `--field-bg` and `--opp-bg` properties become unused after Phase 1 and Phase 3 but can be kept for backwards compatibility (or deleted in Phase 6).

---

## Card Sizes Per Breakpoint

| Breakpoint | Hand card | Field card | Seat card | Deck card |
|------------|-----------|------------|-----------|-----------|
| ≤ 380 px | **58 × 82** | **56 × 78** | **44 × 62** | **44 × 62** |
| 381–499 px | **68 × 95** | **64 × 90** | **50 × 70** | **50 × 70** |
| 500–767 px | **78 × 109** | **72 × 101** | **56 × 78** | **56 × 78** |
| ≥ 768 px | **88 × 123** | **82 × 115** | **62 × 87** | **62 × 87** |

- Hand card is 15–20 % larger than current at every breakpoint. More readable on small screens.
- Field card stays slightly smaller than hand card so "cards on the table" feel a half-step farther away than "my cards in my hand".
- Seat card = deck card so the docked deck visually rhymes with the opponent seats.

All sizes keep the existing 10 : 14 card aspect ratio (same as SVG viewBox `0 0 100 140`).

---

## Hand Overlap + Fan

### Overlap

- Base: `margin-left: calc(var(--hand-card-w) * -0.55)`. With 68 px card width at the 381–499 breakpoint, this is −37 px of overlap. Compared to the current −24 px on 60 px cards, the **visible edge** per card is larger (~31 px vs ~36 px), so counterintuitively bigger cards with more overlap still improve readability because each visible strip is wider.
- At ≤ 380 px, use `-0.60` overlap because screen real estate is tight.
- Set `--hand-card-w` as a CSS custom property on `.hand-row` at each breakpoint.

### Fan formula

Applied ONLY to cards in the human hand (not field cards, not deck cards).

For `N` cards in the hand, at index `i`:

```
offset = i - (N - 1) / 2
angle  = offset * (6 / max(N, 1))   degrees
lift   = -|offset| * (6 / max(N, 1)) px
```

- Card at center index has angle 0 and lift 0 (or very close to it).
- Cards at the edges tilt outward by up to ±3° and drop down slightly.
- Middle cards appear to lift out of the fan subtly — like a real player's hand.

Set via inline style at the end of `renderHumanHand()`:

```js
var cards = $humanHand.querySelectorAll('.card-btn');
var N = cards.length;
for (var i = 0; i < N; i++) {
  var offset = i - (N - 1) / 2;
  var angle = offset * (6 / Math.max(N, 1));
  var lift = -Math.abs(offset) * (6 / Math.max(N, 1));
  cards[i].style.setProperty('--fan-angle', angle.toFixed(2) + 'deg');
  cards[i].style.setProperty('--fan-lift', lift.toFixed(2) + 'px');
}
```

### Critical: transform composition

The existing `.card-btn:active { transform: scale(0.95) }` rule will **clobber** any rotation — CSS transforms don't stack from multiple rules; the last-applied rule replaces the whole `transform` property.

**Fix:** change the base `.card-btn` rule so `transform` composes from CSS variables:

```css
.card-btn {
  /* ... existing rules ... */
  transform: rotate(var(--fan-angle, 0deg))
             translateY(var(--fan-lift, 0px))
             scale(var(--card-scale, 1));
}
.card-btn:active {
  --card-scale: 0.95;
  /* no transform override here! */
}
```

Field and deck cards never get `--fan-angle` or `--fan-lift` set, so they default to 0 — they behave exactly as before.

---

## Opponent Seat-Tile Anatomy (`.seat-tile`)

Replaces `.opponent-tile`. Flex column, gap 4 px, align-items center.

```
    ┌─────┐
    │ 🂠 ⓺│    ← full seat-sized card back with count badge (top-right)
    │ 🂠  │
    └─────┘
    CPU 1    ← name chip (uppercase, 0.72 rem)
    [DEF]    ← role pill (colour-coded)
```

- **Card back**: reuse `createCardBackEl` from `cards.js`. Same procedural back style as deck cards.
- **Count badge** (`.seat-count`): position absolute on the card's top-right corner. Red background, white bold text, rounded. Displays integer card count.
- **Name chip** (`.seat-name`): uppercase 0.72 rem, letter-spacing 0.04em.
- **Role pill** (`.seat-role`): colour-coded:
  - `.role-attacker` → orange (#ffb347 on dark, #e07a1a on light)
  - `.role-defender` → blue (#88ccff on dark, #1976d2 on light)
  - `.role-thrower` → purple (#c2a0ff on dark, #6a3fb5 on light)
  - `.role-out` → muted (text-muted)

### States

- `.is-priority` (active player): `box-shadow: 0 0 0 2px var(--active-seat-glow), 0 6px 24px var(--active-seat-glow); transform: translateY(-3px);` with a 0.2 s transition.
- `.is-out` (eliminated): `opacity: 0.35; filter: grayscale(0.6);`.

### Responsive behaviour

- ≤ 380 px with 4+ opponents: tighten gap (4 px → 3 px), use the smallest seat-card size, compress role pill to 3-letter abbreviation (DEF / ATK / THR / OUT).
- 2-player mode: single opponent seat, centered.
- 6-player mode: 5 opponents spread with `justify-content: space-between`. Stay on one line at ≥ 420 px viewport. At smaller viewports, apply the abbreviated-role fallback to keep everything on one line.

---

## Empty-State Field Watermark

`.field-watermark` sits inside `.table-surface`, behind `#field`.

- Absolutely positioned, centered in `.table-surface`.
- SVG of the current trump suit (pull path data from the `PIPS` dict in `cards.js`).
- Width: 40 % of table width. Height: auto (maintain aspect ratio).
- `fill: var(--watermark-color)` (faint).
- `pointer-events: none`, `z-index: 0`.
- Visible only when the field is empty. Control via `.table-surface.field-empty` class — toggled in `renderField()` when `state.field.attacks.length === 0`.

---

## Action Prompt (`.action-prompt`)

The `#status-display` element gets relocated from `#header` into `.table-surface` and re-styled as an action-prompt pill.

- Absolute-positioned at top-center of `.table-surface`.
- Pill shape: rounded (999 px), padding `6px 14px`.
- `backdrop-filter: blur(6px)` for a frosted-glass feel over the felt.
- Background: `var(--prompt-bg)`. Colour: `var(--prompt-text)`.
- Font: 1 rem on small screens, 1.15 rem at ≥ 500 px, bold weight.
- Subtle colour accent via state modifier classes (applied in `updateHeader()` based on the current status context):
  - `.is-attack` → left border in attacker orange
  - `.is-defend` → left border in defender blue
  - `.is-pile-on` → left border in thrower purple
  - `.is-waiting` → no accent (neutral)

The pile-on banner (`#pile-banner`) also relocates inside `.table-surface` and shares the action-prompt slot — when phase is `pileOn`, the banner shows instead of the prompt.

---

## What's Unchanged

The redesign is strictly visual. These ui.js contracts stay the same:

- `renderAll()` signature and FLIP sequence.
- `wireHandScroll()` behaviour (mouse drag-to-scroll, touch falls through).
- Tap-vs-drag disambiguation in `main.js` (pointer event handlers, 8 px threshold).
- `getStatusText()` return values and all phase strings.
- The render sub-functions — `updateHeader`, `renderOpponents`, `renderDeckZone`, `renderField`, `renderHumanHand`, `updateActionButtons`, `updatePileBanner` — same names, same call order.
- The card pool and `_flipRect` caching.
- Settings panel injection at `main.js` lines 240–343.

Card DOM structure (`.card-btn` with suit classes, nested SVG from `cards.js`) is unchanged.

---

## Visual Benchmark

When done, a first-time Durak player should be able to:

1. Identify the trump suit in under 2 seconds (because the trump card is visibly docked on the table, not buried in a header emoji).
2. Understand whose turn it is in under 2 seconds (because the active player has a clear glow, and the action prompt is big and specific).
3. Read any card in their hand without squinting (because cards are 15–20 % larger).
4. See that the felt table is "one thing" — not four floating widgets.

And an experienced player should find:

- All the same actions in the same places (Take / Pass / Done buttons below the hand).
- Drag-to-scroll hand still works.
- Tapping a card still plays it.
- Light and dark modes are both polished.
