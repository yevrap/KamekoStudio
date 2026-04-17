# Phase 3 — Opponent Seat Tiles

**Goal:** Opponents feel like **seated players**, not UI badges. Each opponent renders as a single full seat-sized card back with a count badge on the corner, name chip below, and role pill — all signalling "this is a player at the table".

**Prerequisite:** Phases 1 and 2 have landed. The felt table exists. The deck is docked.

---

## Files touched

- `games/durak/style.css` — new `.seat-tile` class + state modifiers; retire `.opponent-tile`, `.opp-backs`, `.mini-back`, `.opp-count`, `.opp-role` (or rename them).
- `games/durak/ui.js` — rewrite `buildOpponentTile()` at line 156 to use the new structure.

---

## Step-by-step changes

### 1. Rewrite the seat-tile CSS

In `games/durak/style.css`, replace the `.opponent-tile` block (around line 131–147) and the `.opp-backs`, `.mini-back`, `.opp-count`, `.opp-role` blocks (lines 157–207) with the following. You can leave the old selectors in place initially and delete them after Phase 6 cleanup — but do NOT rely on them in any new code.

```css
/* --- Seat tiles (opponents) --- */
.seat-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  background: transparent;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
}

.seat-tile .seat-card {
  position: relative;
  width: 50px;
  height: 70px;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background:
    repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px),
    var(--surface);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}
body:not(.dark-mode) .seat-tile .seat-card {
  background:
    repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px),
    #e8e8f0;
}

.seat-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #e53935;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 22px;
  text-align: center;
  border-radius: 11px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  font-variant-numeric: tabular-nums;
}

.seat-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.seat-role {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  border-radius: 6px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
}
body:not(.dark-mode) .seat-role { background: rgba(0, 0, 0, 0.06); }

.seat-role.role-attacker { color: #ffb347; }
.seat-role.role-defender { color: #88ccff; }
.seat-role.role-thrower  { color: #c2a0ff; }
.seat-role.role-out      { color: var(--text-muted); }

body:not(.dark-mode) .seat-role.role-attacker { color: #e07a1a; }
body:not(.dark-mode) .seat-role.role-defender { color: #1976d2; }
body:not(.dark-mode) .seat-role.role-thrower  { color: #6a3fb5; }

.seat-tile.is-priority {
  transform: translateY(-3px);
}
.seat-tile.is-priority .seat-card {
  box-shadow:
    0 0 0 2px var(--active-seat-glow),
    0 6px 24px var(--active-seat-glow),
    0 2px 6px rgba(0, 0, 0, 0.3);
}

.seat-tile.is-out {
  opacity: 0.35;
  filter: grayscale(0.6);
}
```

### 2. Responsive seat-card sizes

Find each `@media` block and add seat-card size rules matching DESIGN.md's size table.

**≤ 380 px** block:

```css
.seat-tile .seat-card { width: 44px; height: 62px; }
.seat-count { min-width: 18px; height: 18px; font-size: 0.62rem; line-height: 18px; top: -5px; right: -5px; }
.seat-name { font-size: 0.62rem; }
.seat-role { font-size: 0.54rem; padding: 1px 4px; }
```

**≥ 500 px** block:

```css
.seat-tile .seat-card { width: 56px; height: 78px; }
```

**≥ 768 px** block:

```css
.seat-tile .seat-card { width: 62px; height: 87px; }
```

### 3. Rewrite `buildOpponentTile()` in `ui.js`

Open `games/durak/ui.js`. Find `buildOpponentTile()` (starting around line 156). Replace the body with:

```js
function buildOpponentTile(seat) {
  var p = state.players[seat];
  var tile = document.createElement('div');
  tile.className = 'seat-tile';
  if (p.isOut) tile.classList.add('is-out');
  if (state.prioritySeat === seat && (state.phase === 'playing' || state.phase === 'pileOn')) {
    tile.classList.add('is-priority');
  }

  // Full-size card back with count badge
  var cardWrap = document.createElement('div');
  cardWrap.className = 'seat-card';

  var countBadge = document.createElement('span');
  countBadge.className = 'seat-count';
  countBadge.textContent = p.hand.length;
  cardWrap.appendChild(countBadge);

  tile.appendChild(cardWrap);

  // Name chip
  var nameEl = document.createElement('div');
  nameEl.className = 'seat-name';
  nameEl.textContent = p.name;
  tile.appendChild(nameEl);

  // Role pill
  var role = roleFor(seat);
  if (role) {
    var chip = document.createElement('div');
    chip.className = 'seat-role role-' + role.toLowerCase();
    chip.textContent = role;
    tile.appendChild(chip);
  }

  return tile;
}
```

### 4. Update the opponents container rules (if needed)

The existing `#opponents` CSS (around line 122–129) has `justify-content: center` and `gap: 6px` and `flex-wrap: wrap`. Update the gap for a slightly tighter rail:

```css
#opponents {
  display: flex;
  gap: 8px;
  padding: 8px 12px 4px;
  justify-content: center;
  flex-wrap: wrap;
  flex-shrink: 0;
}
```

And at `≤ 380 px`:

```css
#opponents { gap: 4px; padding: 6px 6px 3px; }
```

### 5. 6-player fallback: abbreviated role pill

For hot-seat 6-player mode on a narrow viewport (< 420 px), the opponent row has 5 seats; even with 44 × 62 seat cards, the role pill can push the row to wrap. Fallback:

```css
@media (max-width: 420px) {
  .seat-tile .seat-role { font-size: 0.5rem; padding: 1px 3px; letter-spacing: 0.02em; }
}
```

If wrapping still happens, in `buildOpponentTile()` compute an abbreviated label when the player count is high:

```js
if (role) {
  var chip = document.createElement('div');
  chip.className = 'seat-role role-' + role.toLowerCase();
  var abbreviate = state.players.length >= 5 && window.innerWidth < 420;
  chip.textContent = abbreviate ? role.slice(0, 3).toUpperCase() : role;
  tile.appendChild(chip);
}
```

### 6. Clean up references

Search `games/durak/` for any remaining references to `.opponent-tile`, `.opp-backs`, `.mini-back`, `.opp-count`, `.opp-role` outside of the CSS file. If found, replace them with the new `.seat-tile`, `.seat-card`, `.seat-count`, `.seat-name`, `.seat-role` selectors.

The old CSS rules can be left in place until Phase 6 cleanup (they don't match any DOM anymore), but prefer to delete them now to keep the CSS file readable.

---

## Verification

1. Run `npx serve .`. Open `http://localhost:3000/games/durak/` on an iPhone-13-mini devtools viewport.
2. Start a 4-player vs Computer game.
3. **Confirm:** each opponent shows as one full-size card back, with a red count badge on the top-right corner of the card, a name below the card, and a colour-coded role pill below the name.
4. **Confirm:** the active player's tile has a soft radial glow and floats up ~3 px.
5. **Confirm:** when an opponent is eliminated, their tile becomes muted (grey, low opacity).
6. Start a 2-player vs Computer game. Confirm the single opponent seat renders cleanly, centered.
7. Start a 6-player hot-seat game. **Confirm:** five opponent tiles fit in a single row at 390 px viewport width. (If they wrap, the role pill abbreviation fallback should engage.)
8. Toggle light mode. **Confirm:** seat cards still look like cards against the lighter body background. Role pill colours are legible.
9. Run `node --test tests/`. Should still pass.

---

## What NOT to change in this phase

- Don't move `#status-display` or `#trump-display` (Phase 4).
- Don't change hand card sizes (Phase 5).
- Don't refactor `transform` composition yet (Phase 5).

---

## Common pitfalls

- **Count badge clipped by `overflow: hidden`:** `.seat-card` has `overflow: hidden` for the striped pattern to respect the rounded corners; but the count badge is `top: -6px; right: -6px;` so it sits outside the card. Because `.seat-count` is a child of `.seat-card`, the badge will be clipped. **Fix:** move the count badge OUT of `.seat-card` and make it a sibling inside `.seat-tile`, positioned absolute relative to `.seat-tile` (add `position: relative` to `.seat-tile`, already in the CSS above, and set the badge with `position: absolute; top: -6px; right: calc(50% - 30px);` or similar). Adjust the `.seat-card` structure:

  ```js
  var cardWrap = document.createElement('div');
  cardWrap.className = 'seat-card';
  tile.appendChild(cardWrap);

  var countBadge = document.createElement('span');
  countBadge.className = 'seat-count';
  countBadge.textContent = p.hand.length;
  tile.appendChild(countBadge);        // sibling of cardWrap, not child
  ```

  And update `.seat-count` CSS:

  ```css
  .seat-count {
    position: absolute;
    top: -6px;
    right: calc(50% - (var(--seat-card-w, 50px) / 2) - 10px);
    /* OR a simpler approach: */
    /* position: absolute; top: -6px; left: calc(50% + 14px); */
    min-width: 22px;
    /* ...etc... */
  }
  ```

  The cleanest approach is to use CSS grid on `.seat-tile` or to not clip the card (remove `overflow: hidden` from `.seat-card` — the striped pattern uses `border-radius: 6px` anyway and the background pattern doesn't need clipping if the card has `border-radius` alone).

  **Recommended approach:** remove `overflow: hidden` from `.seat-card` and keep the count badge as a child. The striped background with `border-radius: 6px` renders fine without explicit overflow clipping because the `background: repeating-linear-gradient(...)` fills only the padding box.

- **Role pill colour contrast in light mode:** the dark-mode orange/blue/purple can look too bright on the lighter body. The CSS above includes a `body:not(.dark-mode)` override with darker variants. Verify contrast.
- **Priority glow not visible:** the `--active-seat-glow` token was added in Phase 1. Confirm it exists; if not, Phase 1 wasn't applied correctly.
- **Seat card background in dark mode using `var(--surface)`:** `--surface` is `#1a1a2e` (dark blue-ish) which reads as a card back. Good. In light mode it's `#ffffff` — swap to a non-white hue like `#e8e8f0` (already in the CSS above) so it's recognisable as a card back.
