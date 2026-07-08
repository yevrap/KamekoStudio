# /improve — Codebase Quality Scan

Read-only scan. Do NOT make any changes. Return a ranked list of quality and polish opportunities across the entire codebase.

## Verify before flagging

Every issue you report becomes a roadmap item another agent will later trust at face value and implement without re-checking. A false positive here doesn't just cost your tokens — it costs a full plan/implement/test cycle for whoever picks it up later, possibly months from now. Before including any finding:
- Grep the actual game files for the mechanic/pattern in question — don't infer "missing" from a title, a skim, or an assumption about what a game "probably" has.
- Read `games/CLAUDE.md`'s per-game notes row for that game. It documents shipped subsystems (animation systems, input handling, safe-area handling, etc.) in detail, and often already answers whether something exists.
- You are not time-constrained the way a human reviewer is. Take the extra tool calls to confirm a gap is real before writing it down — a slower, accurate scan beats a fast one that plants stale work items.

## What to check

### 1. Structural debt
- HTML files over 400 lines with inline JS (candidates for ES module split)
- JS files over 800 lines (candidates for split)
- Old `game.js` monoliths sitting alongside newer ES module files (dead code)
- Games missing from the CLAUDE.md and GEMINI.md game tables
- `CLAUDE.md`/`GEMINI.md`'s Project Structure tree and `## Testing` section, plus `tests/README.md`'s coverage table, out of sync with what's actually in `tests/` and each game's module list — check `ls tests/` and each game's directory against what the docs claim

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
