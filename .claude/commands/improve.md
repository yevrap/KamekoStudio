# /improve — Codebase Quality Scan

Read-only scan. Do NOT make any changes. Return a ranked list of quality and polish opportunities across the entire codebase.

## What to check

### 1. Structural debt
- HTML files over 400 lines with inline JS (candidates for ES module split)
- JS files over 800 lines (candidates for split)
- Old `game.js` monoliths sitting alongside newer ES module files (dead code)
- Games missing from the CLAUDE.md and GEMINI.md game tables

### 2. Test gaps
- Games or modules with no unit tests
- Functions in `shared/utils.js` with no test coverage

### 3. Mobile pattern violations
- Event listeners using `mousedown`/`mousemove`/`mouseup`/`touchstart`/`touchend` instead of `pointerdown`/`pointermove`/`pointerup`
- Canvas or scrollable areas missing `touch-action` CSS
- Tap targets under 44px
- Missing `height: 100dvh` / `height: 100vh` fallback pattern
- iOS safe area insets missing on full-screen layouts

### 4. Consistency gaps
- Games that don't gate on tokens (`window.KamekoTokens.spend()`)
- Games that don't write `lastPlayed_*` to localStorage on session start
- Games missing `settingsOpened` / `settingsClosed` pause/resume listeners
- Settings gear not overridden for games with a top header bar

### 5. Polish gaps
- Games with no game-over animation or feedback
- Static high-score displays with no animation on new record
- Missing or weak sound/haptic feedback hooks

## Output format

Return a ranked list. For each issue:
```
[SEVERITY: High/Medium/Low] [GAME or SHARED] — Issue title
  What: one sentence describing the problem
  Why it matters: one sentence on player/developer impact
  Effort: S / M / L
  Files: list of relevant file paths
```

Sort by: High severity first, then by effort (S before L within each severity band).

If `$ARGUMENTS` is provided, filter to that game or category (e.g. "durak", "mobile", "tests").

End with a summary count: N high, N medium, N low issues found.
