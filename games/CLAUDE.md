# games/ — Kameko Studio Games

Each game lives in its own subdirectory. Modern games like `games/keypad-quest/` and `games/durak/` are split into `index.html`, `style.css`, and `game.js`. Other older games use a single self-contained `index.html`. New games should exclusively follow the three-file split convention.

## Games

| Directory | Title | Renderer | Status |
|-----------|-------|----------|--------|
| `blob-zapper/` | Blob Zapper (internally: Lava Plasma Flow) | Canvas 2D | Stable |
| `durak/` | Durak | DOM | Stable |
| `durak-dungeon/` | Durak Dungeon | DOM | Stable |
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

Include `settings.js` (and `utils.js` if the game uses shared utilities) before `</body>`:
```html
<script src="../../shared/utils.js"></script>
<script src="game.js"></script>
<script src="../../shared/settings.js" data-gallery-depth="2"></script>
```

Listen to `settingsOpened` / `settingsClosed` to pause and resume the game:
```js
window.addEventListener('settingsOpened', () => { /* pause */ });
window.addEventListener('settingsClosed', () => { /* resume */ });
```

**Per-game settings rows:** Inject custom content into `#settings-panel` using `insertBefore(section, document.getElementById('dev-mode-section'))` so it appears above the developer tools. See `games/keypad-quest/game.js` for a full example (input mode selector + stats section).

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
| `gridGameTopScoreScore` | materials-run | Score mode high score |
| `gridGameTopScoreSurvival` | materials-run | Survival mode high score |
| `riverRunHighScore` | river-run | Points high score |
| `keypadQuestHighWave` | keypad-quest | Highest wave reached |

## Three.js Obstacle Arrays

In Three.js games, obstacle arrays store objects of shape `{ mesh, boundingBox }`. Always access position as `obs.mesh.position`, **never** `obs.position` — that is undefined and will throw at runtime.

## Adding a New Game

1. Create `games/<game-name>/` with `index.html`, `style.css`, `game.js`
2. Add a card to root `index.html` with the game's `id` matching `lastPlayed_<id>` key
3. Add a portal link to root `3d.html`
4. Include `shared/utils.js` (if needed) and `shared/settings.js` with `data-gallery-depth="2"`
5. Add token gate + `localStorage.setItem('lastPlayed_<id>', Date.now())` at session start
6. Add `settingsOpened` / `settingsClosed` pause/resume listeners
7. Add the `lastPlayed_<id>` entry to the localStorage key tables in root `CLAUDE.md` and `GEMINI.md`
