# Phase 7: Layout Fixes & Discard Pile

## Objective
Resolve UI layout issues on mobile (cut-off deck, hidden trump suite, small hand cards) and implement a visible discard pile with a card count and FLIP-animated routing for discarded cards.

## Key Files & Context
- `games/durak/index.html`: Needs `#discard-zone` and `#discard-count` added to `#table-center`.
- `games/durak/style.css`: Adjust `#table-center` layout to prevent clipping, tweak `#trump-slot` translation for visibility, increase mobile `.card-btn` sizes, and add styles for the discard pile mirroring the deck.
- `games/durak/ui.js`: Map new DOM elements, render the discard pile count, and handle discard card placement to leverage existing FLIP animations.
- `games/durak/state.js`: Ensure `state.discard` array tracks all discarded card objects for rendering.

## Implementation Steps

### Step 1: Fix Table Layout & Trump Visibility
- **Fix Clipping:** The `#pile-banner` currently pushes or squishes `#table-center`, causing its `overflow: hidden` to clip the absolute-positioned `#deck-zone`. Update `style.css` to position `#pile-banner` differently (e.g., `position: absolute; z-index: 10; top: 8px; left: 50%; transform: translateX(-50%);`) so it floats over the table without altering its dimensions.
- **Trump Suite Visibility:** Adjust the `#trump-slot` transform in `style.css`. Change the local Y-axis translation from `translate(0, -28px)` to a larger offset (e.g., `-36px` to `-42px`) to push the rotated trump card further right from under the deck, ensuring the top-left suit icon is fully exposed.

### Step 2: Enlarge Mobile Hand Cards
- **Scale Up Cards:** In `style.css`'s mobile viewport media queries (e.g., the default fallback), increase the base `.card-btn` size from `width: 50px; height: 70px;` to at least `width: 60px; height: 84px;`.
- **Verify Scrolling:** Because horizontal scrolling is already enabled in `ui.js` (`wireHandScroll`) with `justify-content: safe center`, larger cards will naturally overflow and scroll comfortably without requiring structural changes.

### Step 3: Add Discard Pile DOM & Styles
- **HTML Structure:** In `index.html`, add `<div id="discard-zone"></div>` and `<div id="discard-count"></div>` inside `#table-center`, structured similarly to the deck setup.
- **Styling:** In `style.css`, position `#discard-zone` at the top-right (`top: 10px; right: 10px; position: absolute;`) mirroring the deck. Position `#discard-count` directly below it (`top: 82px; right: 10px; text-align: center;`).

### Step 4: Discard Animation & Rendering Logic
- **DOM Wiring:** In `ui.js` `cacheDom()`, capture `$discardZone` and `$discardCount`.
- **Update Count:** In `ui.js` `renderAll()`, update `$discardCount.textContent = state.discard.length > 0 ? state.discard.length : '';`.
- **Animate Discards:** To enable the cards to animate off the field, update `ui.js` to render the top card(s) of `state.discard` into `$discardZone`. By appending the actual DOM nodes of discarded cards to `$discardZone` (rather than hiding them), the existing FLIP animation system (`renderAll()`) will automatically animate them flying from the `#field` to the discard pile when `endBout('defended')` updates `state.discard`.

## Verification & Testing
- **Visual Check:** Launch the game in mobile view (`npx serve .`).
- **Phase Message:** Verify the deck is not cut off when the "pile on" banner appears.
- **Trump:** Confirm the trump card suit is clearly visible under the deck.
- **Hand Cards:** Check that hand cards are larger and easily tappable.
- **Discard Flow:** Play a bout to completion and verify that defending successfully triggers cards flying to the top-right discard pile, and the discard count updates accurately.