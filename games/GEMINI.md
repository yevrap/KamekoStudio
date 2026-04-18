# games/ — Kameko Studio Games

Each game lives in its own subdirectory. Modern games are split across multiple files (see "File Convention" below). Older games use a single self-contained `index.html` and are candidates for future splitting.

## File Convention

New games and major refactors use **Native ES Modules** (`type="module"`) with logic split by concern:

| File | Purpose |
|------|---------|
| `index.html` | DOM structure, loads `<script type="module" src="main.js">` |
| `style.css` | All styles |
| `constants.js` | Static data: card/suit/face constants, RNG helpers, entity definitions |
| `state.js` | Shared mutable game state (`export const state = { run: null }`), state query helpers |
| `ui.js` | All render functions and DOM manipulation |
| `gameplay.js` | Game logic: combat phases, floor progression, rewards, shop, enemy generation |
| `main.js` | Event wiring, start/restart, settings integration, URL parsing |

Classic `<script>` tags (no `type="module"`) remain correct for `shared/settings.js` and `shared/utils.js` — they inject globals and don't need to import game code.

**`ui.js` is optional:** When rendering code is tightly coupled to game logic (e.g. DOM elements are built with inline event handlers that call gameplay functions directly), merge them into `gameplay.js` rather than creating an artificial split. `games/durak-tactics/` uses this pattern. `games/durak-dungeon/` uses a separate `ui.js` and is the reference implementation when the split is clean.

**Local testing note:** `type="module"` scripts require HTTP, not `file://`. Use `npx serve .` from the project root or VS Code Live Server. Opening via `file://` will silently fail to load ES modules — the start screen may appear styled but the game won't initialize.

Single-file older games (`game.js`) are acceptable until they grow unwieldy. `games/durak-dungeon/` is the reference implementation of the module split pattern.

## ES Module Refactor Status

| Directory | Lines (approx) | Status | Notes |
|-----------|---------------|--------|-------|
| `durak-dungeon/` | — | ✅ Done | Reference implementation: constants/state/ui/gameplay/main.js |
| `keypad-quest/` | — | ✅ Done | constants/state/fx/deck-manager/rendering/gameplay/input/main.js |
| `durak-tactics/` | — | ✅ Done | constants/state/gameplay/main.js (no ui.js; rendering merged into gameplay.js) |
| `durak/` | — | ✅ Done | constants/state/gameplay/ai/cards/ui/main.js. AI extracted to its own module supporting Easy, Normal, and Hard difficulty levels. `cards.js` provides procedural vector SVG graphics. `ui.js` uses a DOM pool and FLIP animations for hardware-accelerated movement. Includes a tiny `package.json` (`"type": "module"`) so Node can run unit tests against the modules. iOS PWA standalone mode: `html` background tracks the `body.dark-mode` class via `:has()`, PWA meta tags request a translucent status bar, and `env(safe-area-inset-*)` padding on `#app` keeps content clear of the notch/home indicator. UI: felt-green table surface containing the docked deck+trump, opponent seat tiles, field, and empty-state trump watermark; hand cards are gently fanned (±3°). Card transforms compose via CSS variables (`--flip-dx/dy`, `--fan-angle`, `--fan-lift`, `--card-scale`) so FLIP animation, fan, and press-scale don't clobber each other. Header bar shows trump value+suit and current status message (attack/defend/pile-on context); status replaces the old on-table action-prompt pill. Discard pile (`#discard-zone` + `#discard-count`) sits below the deck; renders face-down (card-backs at z-index:2 cover face cards at z-index:1); FLIP animates the top discarded card flying from field to pile — `flip-animating` raises z-index to 100 so it's visible in transit, then drops below the card-back at rest. Field is left-aligned (`justify-content: flex-start`, left padding 72px to clear the deck zone), `flex-wrap: nowrap` + `overflow-x: auto` so 5–6 pairs scroll horizontally instead of jumping to a second row; `#table-center` uses `overflow: clip` (not `hidden`) so the child scroll container can work while border-radius still clips. Deck and discard counts are red badge chips (matching seat-count style) positioned at top-right of their respective zones. |
| `hidden-object/` | ~621 | 🔜 Candidate | Emoji-finding game, single game.js |
| `materials-run/` | ~685 | 🔜 Candidate | Grid physics game, single game.js |
| `blob-zapper/` | ~512 | 🔜 Candidate | Canvas 2D game, single game.js |
| `river-run/` | — | ⏸ Lower priority | Three.js; complex event + audio setup; different architecture |
| `waterfall/` | — | ⏸ Lower priority | Three.js; not in gallery |

**When refactoring a game:** start with `durak-dungeon/` as the reference. Use `durak-tactics/` as the example for games where rendering and game logic are too tightly coupled to split into a separate `ui.js` — put both in `gameplay.js`.

**Key gotcha for Canvas games:** `resizeCanvas()` may run before CSS layout is complete on fast local servers. After calling `resizeCanvas()`, check `if (state.W === 0) requestAnimationFrame(() => resizeCanvas());` to retry on the next paint. See `games/keypad-quest/main.js` init function for the pattern.

## Games

| Directory | Title | Renderer | Status |
|-----------|-------|----------|--------|
| `blob-zapper/` | Blob Zapper (internally: Lava Plasma Flow) | Canvas 2D | Stable |
| `durak/` | Durak | DOM | Stable |
| `durak-dungeon/` | Durak Dungeon | DOM | Stable |
| `durak-tactics/` | Durak Tactics | DOM | Stable |
| `hidden-object/` | Hidden Object Game | DOM | Stable |
| `keypad-quest/` | Keypad Quest | Canvas 2D | Stable |
| `materials-run/` | Grid Step Game — Pin Movement | DOM/CSS grid | Stable |
| `river-run/` | River Runner 3D | Three.js r128 | Stable |
| `waterfall/` | 3D Auto-Aim Endless Shooter | Three.js r128 | Stable (not in gallery) |

## Conventions Shared Across Games

- **Pointer events** (`pointerdown`/`pointermove`/`pointerup`) rather than mouse or touch events
- **`touch-action: none`** on interactive elements to prevent scroll hijacking
- **`position: fixed`** for full-screen overlays (start, game over, win screens)
- **Light/dark theme** via `body.dark-mode` class + CSS custom properties, persisted in localStorage
- **No back-navigation** — games have internal menu screens; users use the browser back button or Settings → Back to Gallery
- **All scores** stored in localStorage; no server communication

## Token Gate (required in every game)

Each game costs 1 token to start. Always call `KamekoTokens.spend()` before starting, and write `lastPlayed_*` immediately after a successful spend:

```js
startButton.addEventListener('click', () => {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_myGame', Date.now());
    startGame();
});
```

The `lastPlayed_*` key feeds the "Recently Played" section on the arcade dashboard. The dashboard derives the key from the game's `id` in `GAMES_META` in `index.html` — keep them consistent.

## Settings Panel Integration (required in every game)

Include `settings.js` (and `utils.js` if the game uses shared utilities) before `</body>`. For ES module games use `type="module"`:
```html
<script src="../../shared/utils.js"></script>
<script type="module" src="main.js"></script>
<script src="../../shared/settings.js" data-gallery-depth="2"></script>
```

Listen to `settingsOpened` / `settingsClosed` to pause and resume the game:
```js
window.addEventListener('settingsOpened', () => { /* pause */ });
window.addEventListener('settingsClosed', () => { /* resume */ });
```

**Per-game settings rows:** Inject custom content into `#settings-panel` using `insertBefore(section, document.getElementById('dev-mode-section'))` so it appears above the developer tools. See `games/keypad-quest/main.js` for a full example (input mode selector + stats section injected on `settingsOpened`, removed on `settingsClosed`).

## localStorage Keys

| Key | Game | Notes |
|-----|------|-------|
| `lastPlayed_hiddenObject` | hidden-object | Set on session start |
| `lastPlayed_materialsRun` | materials-run | Set on session start |
| `lastPlayed_keypadQuest` | keypad-quest | Set on session start |
| `lastPlayed_riverRun` | river-run | Set on session start |
| `lastPlayed_blobZapper` | blob-zapper | Set on session start |
| `lastPlayed_durak` | durak | Set on session start |
| `lastPlayed_durakDungeon` | durak-dungeon | Set on run start |
| `durakDungeon_bestFloor` | durak-dungeon | Highest floor reached |
| `durakDungeon_victories` | durak-dungeon | Complete run count |
| `durakDungeon_lastSeed` | durak-dungeon | Seed of last run |
| `lastPlayed_durakTactics` | durak-tactics | Set on session start |
| `durakTactics_victories` | durak-tactics | Number of campaign victories |
| `gridGameTopScoreScore` | materials-run | Score mode high score |
| `gridGameTopScoreSurvival` | materials-run | Survival mode high score |
| `riverRunHighScore` | river-run | Points high score |
| `keypadQuestHighWave` | keypad-quest | Highest wave reached |

## Three.js Obstacle Arrays

In Three.js games, obstacle arrays store objects of shape `{ mesh, boundingBox }`. Always access position as `obs.mesh.position`, **never** `obs.position` — that is undefined and will throw at runtime.

## Adding a New Game

1. Create `games/<game-name>/` with `index.html`, `style.css`, and ES module files (`main.js` + supporting modules)
2. Add a card to root `index.html` with `href="games/<game-name>/"` (**trailing slash, not** `index.html`) and `id` matching `lastPlayed_<id>` key
3. Add a portal link to root `3d.html` — same trailing slash rule
4. Include `shared/utils.js` (if needed) and `shared/settings.js` with `data-gallery-depth="2"`
5. Add token gate + `localStorage.setItem('lastPlayed_<id>', Date.now())` at session start
6. Add `settingsOpened` / `settingsClosed` pause/resume listeners
7. Add the `lastPlayed_<id>` entry to the localStorage key tables in root `CLAUDE.md` and `GEMINI.md`

**Why trailing slash?** `npx serve` redirects `foo/index.html` → `foo/index` → `foo` (no trailing slash). At a URL without a trailing slash the browser treats the last segment as a filename, so relative assets (`style.css`, `main.js`) resolve from the parent directory and 404. Using `href="games/foo/"` serves directly as 200. GitHub Pages handles directory URLs the same way.
