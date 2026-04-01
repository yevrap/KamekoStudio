# Kameko Studio — Claude Context

## What This Project Is

Kameko Studio is a one-person web game studio. All games are mobile-first progressive web apps built with vanilla HTML, CSS, and JavaScript — no frameworks, no backend, no build step. Everything is static files deployed on GitHub Pages at https://yevrap.github.io/KamekoStudio/.

The studio is a solo creative project with serious engineering habits: version control, clean code, documented decisions. Pace is roughly one hour per day.

See `docs/mission.md` for the full studio philosophy.

## Stack Constraints

- **Vanilla JS only** — no React, Vue, or other frameworks unless complexity demands it
- **No backend, no database** — all data lives in the browser (localStorage, IndexedDB)
- **No build step** — source files are served directly; no bundlers or transpilers
- **Three.js (CDN)** is acceptable for 3D games; currently loaded from cdnjs r128
- **No Tailwind** — `index.html` was redesigned with plain CSS custom properties; Tailwind is no longer used anywhere
- **GitHub Pages hosting** — everything must work as static files

## Project Structure

```
index.html          — Main arcade dashboard (dark arcade theme, custom CSS, no Tailwind)
3d.html             — 3D interactive landing page (Three.js), also links to all games
shared/
  settings.js       — Global settings panel + token system (included in every page)
CLAUDE.md           — This file
README.md           — GitHub Pages URL
docs/               — Design docs and studio notes (see docs/CLAUDE.md)
  mission.md        — Studio philosophy and principles
  memory-game-design.md — Full design spec for the upcoming T9 memory game
drafts/             — WIP files not yet in production (see drafts/CLAUDE.md)
  arcadeHome.html   — Alternate arcade home, not yet linked
games/              — One subdirectory per game, each with index.html (see games/CLAUDE.md)
  blob-zapper/
  hidden-object/
  materials-run/    ← active development
  memory-tower/
  river-run/
  waterfall/
```

## Games

Each game is a single self-contained `index.html` with all CSS and JS inline.

| Directory | Title | Renderer | Notes |
|-----------|-------|----------|-------|
| `games/materials-run/` | Grid Step Game — Pin Movement | DOM/CSS grid | Tap to place movement pins; physics with material types. Score and survival modes. |
| `games/hidden-object/` | Hidden Object Game | DOM | Emoji-finding challenge. Mobile-vertical layout. |
| `games/memory-tower/` | Keypad Quest | Canvas 2D | T9 tower defense: answer flashcard questions to place towers. Circular enemy path, multiple named decks, deck import/export. Saves `keypadQuestHighWave`. |
| `games/river-run/` | River Runner 3D | Three.js | 3D obstacle-dodging river runner. Has per-game settings (auto-shoot, auto-avoid, invert drag). Saves `riverRunHighScore`. |
| `games/waterfall/` | 3D Auto-Aim Endless Shooter | Three.js | 3D shooter, mobile-friendly. Not listed in gallery (intentional). |
| `games/blob-zapper/` | Blob Zapper (internally: Lava Plasma Flow) | Canvas 2D | Push blobs with electricity. |

## Shared Infrastructure: `shared/settings.js`

Every page includes this script before `</body>`:
```html
<script src="[relative-path]/shared/settings.js" data-gallery-depth="N"></script>
```
- `data-gallery-depth="0"` for root pages (`index.html`, `3d.html`)
- `data-gallery-depth="2"` for games (`games/<name>/index.html`)

**What it provides:**
- Gear button (⚙) injected fixed top-right on every page
- Settings overlay with: dark mode toggle, Back to Gallery link, token count + Get Token button
- Dispatches `window` events: `settingsOpened` / `settingsClosed` — games listen to these to pause/resume
- `window.KamekoTokens` global: `.get()`, `.add(n=1)`, `.spend()` (returns false if 0), `.toast(msg)`
- Dark mode: `localStorage` key `theme` = `'dark'` | `'light'`, applied as `body.dark-mode` class
- Token count: `localStorage` key `tokens` = integer

**Developer Mode:**
The settings panel includes a "Developer Mode" toggle. When enabled, this mode does two things:
- It adds a blue glow to the settings gear icon as a visual indicator.
- It shows a "Clear All Game Data" button in the panel. This button removes all known `localStorage` keys related to game progress, settings, and tokens, which is useful for testing from a clean state.

**Per-game settings injection:** Games can append their own sections to `#settings-panel` on `settingsOpened`:
```js
window.addEventListener('settingsOpened', () => {
    if (!document.getElementById('my-game-stats')) {
        document.getElementById('settings-panel')?.appendChild(buildMyStatsSection());
    }
});
window.addEventListener('settingsClosed', () => {
    document.getElementById('my-game-stats')?.remove();
});
```
See `games/river-run/index.html` for a pill-toggle example; see `games/memory-tower/index.html` for a stats + "Back to Menu" button example.

**Settings gear positioning:** The gear is injected as `position:fixed; top:15px; right:15px`. Games with a top header bar should override this in their CSS to align it within the header and add right padding to the header so content doesn't slide under it:
```css
#settings-gear-btn {
  position: fixed !important;
  top: 6px !important; right: 8px !important;
  width: 42px !important; height: 42px !important;
  border-radius: 10px !important;
}
#header { padding-right: 58px; } /* clear the gear */
```

## Token System

Each game costs 1 token to play. Pattern for gating game start:
```js
startButton.addEventListener('click', () => {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_myGame', Date.now()); // for dashboard
    startGame();
});
```
Tokens are free to add via the settings panel (no real economy — it's a casual mechanic).

## localStorage Keys Reference

| Key | Owner | Type | Notes |
|-----|-------|------|-------|
| `theme` | settings.js | `'dark'`\|`'light'` | Default `'dark'` |
| `tokens` | settings.js | integer string | Token balance |
| `devMode` | settings.js | `'true'`\|`'false'` | Enables developer tools in settings panel |
| `lastPlayed_hiddenObject` | hidden-object | timestamp (ms) | Set on session start |
| `lastPlayed_materialsRun` | materials-run | timestamp (ms) | Set on session start |
| `lastPlayed_memoryTower` | memory-tower | timestamp (ms) | Set on session start |
| `lastPlayed_riverRun` | river-run | timestamp (ms) | Set on session start |
| `lastPlayed_blobZapper` | blob-zapper | timestamp (ms) | Set on session start |
| `gridGameTopScoreScore` | materials-run | integer string | Score mode high score |
| `gridGameTopScoreSurvival` | materials-run | integer string | Survival mode high score |
| `riverRunHighScore` | river-run | integer string | Points high score |
| `keypadQuestHighWave` | memory-tower | integer string | Highest wave reached |
| `keypadQuestBestTime_N` | memory-tower | integer string | Best clear time in ms for wave N |
| `keypadQuestCheckpoint` | memory-tower | JSON string | Wave/tower state at last 5-wave checkpoint |
| `keypadQuest_decks` | memory-tower | JSON string | Array of user custom decks `[{id,name,pairs}]` |
| `keypadQuest_activeDeckIds` | memory-tower | JSON string | Array of selected deck IDs (built-in + custom) |
| `keypadQuest_inputMode` | memory-tower | `'scroll'`\|`'predict'`\|`'keyboard'` | Last used T9 input mode |
| `riverRun_autoShoot` | river-run | `'true'`\|`'false'` | Per-game option |
| `riverRun_autoAvoid` | river-run | `'true'`\|`'false'` | Per-game option |
| `riverRun_invertControls` | river-run | `'true'`\|`'false'` | Per-game option |
| `muted` | river-run | `'true'`\|`'false'` | Audio mute state |

## Mobile-First Patterns

All games must work on phone, tablet, and desktop. Key patterns used across the codebase:

- **Pointer events** (`pointerdown`, `pointermove`, `pointerup`) not mouse/touch events — handles both input types uniformly
- **`touch-action: none`** on game canvases/grids to prevent scroll hijacking
- **CSS custom properties** with `@media` breakpoints for responsive sizing
- **`position: fixed`** for full-screen overlays (game over, start screen) so they stay anchored on mobile scroll
- **44px minimum tap targets** for buttons
- **Dark mode** via `body.dark-mode` class + CSS custom properties; `settings.js` owns the toggle and the localStorage key
- **iOS Safari viewport fix** — use `height: 100dvh` (dynamic viewport) with `height: 100vh` as fallback; add `viewport-fit=cover` to the meta viewport tag to enable `env(safe-area-inset-bottom)`; subtract the safe area from heights that need to stay above the home indicator
- **iOS PWA bfcache** — when users navigate back on iOS (browser or home-screen app), `DOMContentLoaded` does not re-fire; listen to `pageshow` with `event.persisted === true` to refresh dynamic content
- **Canvas size zero bug** — on mobile, `canvas.clientWidth/Height` can be 0 during the first few frames before layout completes; always guard dimension updates with `if (cw > 0 && ch > 0)` and skip rendering if dimensions are still 0

## Keypad Quest — Architecture Notes

Keypad Quest (`games/memory-tower/`) is the most complex game in the studio. Key patterns to know:

- **Three input modes:** Tap to Spell (T9 scroll-select, 820ms auto-confirm), T9 Smart (predictive, scoped to deck values), Keyboard. Mode persisted in `keypadQuest_inputMode`.
- **Numeric mode:** When the current answer is all digits, T9 keypresses build a digit string directly (key `1` = digit `1`, not cycle). `numericMode` is set in `showNextPrompt()`.
- **Typewriter display:** In T9 Smart, the matched candidate is revealed one character at a time as keys are pressed (`_` placeholders for untyped letters). Key `1` cycles through multiple candidates.
- **Circular enemy path:** Enemies travel an ellipse (`pathCX/CY/RX/RY`) using `e.angle` in radians/sec. World position is `e.ex/e.ey`, computed each frame. Slots are arranged in two rings around the ellipse. `pathRX/RY` derived from outer ring scale + margin so slots never clip on any screen size.
- **Built-in decks:** Defined as `BUILTIN_DECKS` array with ids `b-capitals`, `b-math`, `b-elements`. Not stored in localStorage.
- **User decks:** `keypadQuest_decks` — array of `{id, name, pairs:[{k,v}]}`. IDs prefixed `u-`. Old `keypadQuest_customDeck` key is migrated on first load.
- **Active deck selection:** `keypadQuest_activeDeckIds` — array of IDs from both built-in and user decks.
- **Deck share/import:** Plain text format (`# Name\nkey: value`) for copy/paste. Share links use `?import=<base64-json>` — parsed on `init()`, URL cleaned with `history.replaceState`, import prompt shown over menu.
- **Wave flow:** Continuous — `endWave()` calls `startWave(wave+1)` immediately with a floating toast. No summary screen.
- **Stats in settings:** On `settingsOpened` during a run, a "Current Run" section is injected into the settings panel with wave, score, accuracy, and a "Back to Game Menu" button. Removed on `settingsClosed`.

## Development Notes

- Each game is self-contained in its own directory — editing one never affects others
- When adding a new game: create `games/<name>/index.html`, add a card to `index.html`, add a portal link to `3d.html`, include `settings.js`, add token gate + `lastPlayed` write, and add `settingsOpened`/`settingsClosed` pause/resume listeners
- Inline `//` comments inside single-line JS functions comment out everything after them including closing braces — avoid this pattern; it causes silent syntax errors
- Game state in materials-run uses a `gameState` string: `'menu'`, `'playing'`, `'gameover'`, `'won'`
- All scores stored in localStorage; no server-side persistence anywhere
- `obstacles` arrays in Three.js games store `{ mesh, boundingBox }` objects — access position as `obs.mesh.position`, not `obs.position`
