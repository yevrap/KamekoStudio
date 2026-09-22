---
name: improve
description: "Read-only Kameko Studio codebase quality scan: structural debt, test gaps, mobile-pattern violations, shared-infrastructure gaps and polish gaps, returned as a ranked list with effort estimates. Use for 'quality scan', 'what's rotting', 'find tech debt', 'improve', or before planning a cleanup sprint."
---

# Improve

A read-only scan. It changes nothing unless Yevster then asks for findings to become roadmap
rows, in which case follow `refine`.

## Verify before flagging

Every finding may become a roadmap row that another agent trusts at face value months from
now. A false positive costs a whole implement-and-test cycle later. Before reporting anything:

- Grep the actual files for the pattern. Never infer "missing" from a title or a skim.
- Read the game's row in `games/CLAUDE.md`. It documents shipped subsystems in detail and often
  already answers whether something exists.
- Check `docs/roadmap.md`: a gap that already has an open row is not a new finding.

## What to check

### 1. Structural debt
- HTML files over 400 lines with inline JS (candidates for the ES-module split)
- JS files over 800 lines (candidates for a split)
- Old `game.js` monoliths sitting beside newer module files (dead code)
- Games missing from the games tables in `CLAUDE.md` and `games/CLAUDE.md`
- The Project Structure tree and Testing section in `CLAUDE.md`, and the coverage table in
  `tests/README.md`, out of step with what's actually in `tests/` and each game's directory
- `GEMINI.md` files out of sync: `node scripts/generate-context-docs.js --check`

### 2. Test gaps
- Games or pure-logic modules with no unit tests
- Functions in `shared/utils.js` with no coverage
- Gallery games with no e2e core-flow coverage in `scripts/e2e.mjs`

### 3. Mobile-pattern violations
- `mouse*` / `touch*` listeners instead of `pointer*`
- Canvases or gesture areas missing `touch-action`
- Tap targets under 44px
- Missing the `100dvh` with `100vh` fallback pattern
- Full-screen layouts missing iOS safe-area insets

### 4. Shared-infrastructure gaps
- Games that don't write `lastPlayed_*` on session start
- Games missing `settingsOpened` / `settingsClosed` pause and resume
- Games registering drawer sections outside `window.KamekoSettings.registerSection`, or
  removing them on `settingsClosed`
- `localStorage` keys missing from `clearAllGameData` in `shared/settings.js`
- Hamburger button not aligned in games with a top header bar

### 5. Polish gaps
- No game-over animation or feedback
- Static high-score displays with no new-record moment
- Missing or weak sound and haptic feedback

## Output

A ranked list, one entry per issue:

```
[SEVERITY: High/Medium/Low] [GAME or SHARED] — Issue title
  What: one sentence describing the problem
  Why it matters: one sentence on the player or developer impact
  Effort: S / M / L
  Files: the relevant paths
```

High severity first; within a band, S before L. With `$ARGUMENTS`, filter to that game or
category ("durak", "mobile", "tests"). End with the count: N high, N medium, N low.
