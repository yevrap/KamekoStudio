# Durak Table Layout Redesign — Discard Right, Field Centered

## Problem

On laptop/desktop the deck (top-left) and discard pile (directly below deck, still top-left)
overlap with played cards when the field has 2–3 pairs. On mobile the discard pile sits too
close to the deck, wasting vertical space on the left and cramping the field.

Screenshot reference: `docs/Screenshot 2026-04-18 at 1.09.38 PM.png`

---

## Proposed Layout

```
┌──────────────────────────────┐
│ [deck+trump]   [field …]   [discard] │
└──────────────────────────────┘
```

- **Deck zone** stays top-left (no change).
- **Discard zone** moves to top-**right** corner (mirrors the deck).
- **Field** is horizontally centered between the two zones, with symmetric left+right
  padding that clears both. This gives the field substantially more room on narrow
  mobile screens and eliminates the overlap on wide screens.

This layout reads naturally (draw from left → play in middle → discard to right) and
works identically on portrait phone, landscape phone, and desktop.

---

## Files Changed

Only `style.css` needs editing. No JS changes required — the FLIP animation already uses
`getBoundingClientRect()` deltas, so it will animate correctly from the new discard position
automatically.

---

## Step-by-Step CSS Changes

### 1. `#discard-zone` — move from left to right

**Before (all breakpoints use `left`):**
```css
#discard-zone {
  position: absolute;
  top: 100px;
  left: 10px;
  width: 50px;
  height: 70px;
  …
}
```

**After (base):**
```css
#discard-zone {
  position: absolute;
  top: 10px;       /* align with deck vertically */
  right: 10px;     /* right side instead of left */
  left: auto;      /* clear any inherited left */
  width: 50px;
  height: 70px;
  …
}
```

### 2. `#discard-count` badge direction

The badge (`#discard-count`) uses `right: -6px; top: -6px` on the zone — this still works
on the right side. No change needed, but verify visually that the count badge doesn't clip
the table border.

### 3. `#field` — add symmetric padding

The field currently uses `padding: 6px 6px 6px 72px` (72px left clears the deck).
With the discard on the right we need matching right padding:

**After:**
```css
#field {
  padding: 6px 72px 6px 72px;   /* clear deck on left, discard on right */
}
```

The horizontal padding values should match the deck/discard zone widths +10px gap at each
breakpoint (see table below).

### 4. Responsive breakpoints — `#discard-zone` + `#field`

Update every `@media` block that overrides these two selectors. The `top` and `right` values
for `#discard-zone` should match the `top` and `left` values used for `#deck-zone` at the
same breakpoint, keeping the mirrored appearance.

| Breakpoint | Deck/discard zone size | Deck/discard offset | Field left/right padding |
|---|---|---|---|
| base (default) | 50×70 px | top:10, left/right:10 | 72 px each side |
| `≤380px` | 44×62 px | top:8, left/right:8 | 66 px each side |
| `≥500px` | 56×78 px | top:12, left/right:12 | 78 px each side |
| `≥768px` | 62×87 px | top:14, left/right:14 | 84 px each side |

**For each responsive block, change:**
```css
/* OLD */
#discard-zone { top: <N>px; left: <M>px; width: <W>px; height: <H>px; }
#field { padding: 6px 6px 6px <left>px; }

/* NEW */
#discard-zone { top: <N>px; right: <M>px; left: auto; width: <W>px; height: <H>px; }
#field { padding: 6px <right>px 6px <left>px; }
```

The `<right>` padding equals `<M> + <W> + 2` (zone offset + zone width + small gap).

### 5. `#discard-count` badge — check stacking at right edge

`#discard-count` is `position: absolute; top: -6px; right: -6px` on `#discard-zone`. When
the zone is at the right edge of `#table-center`, the badge overflows the table border.
Two options:
- **Option A (preferred):** Move badge to `left: -6px; right: auto` so it overflows inward
  (toward the center), matching how the deck-count badge faces right but the discard-count
  badge now faces left — visually symmetric.
- **Option B:** Add `overflow: visible` to `#table-center` — but `#table-center` currently
  uses `overflow: clip` for the border-radius, so this would break the field scroll clipping.

Use **Option A**.

---

## Discard Card Stagger Direction

In `ui.js`, `renderDiscard()` staggers face-down cards with:
```js
el.style.left = '-' + (offset * 1.5) + 'px';
```
This creates a leftward fan. When the pile is in the **right** corner, a leftward stagger fans
toward the center — which is correct and looks natural. **No JS change needed.**

---

## Verification Checklist

- [ ] Deck (top-left) and discard (top-right) don't overlap the field at any card count (1–6 pairs)
- [ ] On a 375px-wide portrait phone: field cards are visible without horizontal scroll starting at pair 1
- [ ] On a 700px-wide landscape / desktop: field has room for 5–6 pairs before scrolling kicks in
- [ ] Discard count badge doesn't clip the table's rounded border
- [ ] FLIP animation: cards fly from field position to top-right discard zone correctly
- [ ] Trump card sticks out to the right of the deck (existing transform) — doesn't collide with field cards
- [ ] Light mode: layout looks correct (same structure, different colors)
- [ ] iOS PWA safe area: `env(safe-area-inset-right)` is not present on `#discard-zone`; if right-edge clipping occurs on iPhone with Dynamic Island, add `right: calc(10px + env(safe-area-inset-right))`
