# Kameko Studio — Memory Game: Design Outline (DRAFT)

**Status:** Draft v0.2
**Date:** 2026-03-30
**Platform:** HTML5 Progressive Web App (GitHub Pages)
**Target:** Mobile-first, responsive to larger screens

---

## Concept

A flashcard-style memory game where the player is quizzed on key-value pairs they've selected or created. The twist: all input happens through a T9-style keypad, bringing back the tactile, deliberate feel of old phone typing as a core mechanic. The constraint of the input method *is* the challenge — you have to actually know the answer, not just recognize it.

---

## Core Loop

1. **Select decks.** The player multi-selects one or more folders (decks) of key-value pairs to study.
2. **Get prompted.** A key is shown on screen. The player must type the corresponding value using the T9 input.
3. **Input the answer.** Using one of two T9 input modes (see below).
4. **Get feedback.** Correct/incorrect, with the right answer shown on miss.
5. **Track progress.** Stats on accuracy, streaks, and weak spots over time.

---

## Decks (Key-Value Pair System)

### Structure

Each deck is a named folder containing key-value pairs. A "key" is the prompt shown to the player; the "value" is the expected answer.

Examples of what a pair might look like:

- `"capital of France"` → `"Paris"`
- `"H2O"` → `"water"`
- `"おはよう"` → `"good morning"`

### Preloaded Decks

The app ships with a small set of starter decks to demonstrate the format and get players going immediately. These are fully deletable — nothing is sacred. The content should be broadly useful but the real value is in user-created decks.

### User-Created Decks

This is the heart of the app. Users should be able to:

- Create new decks with a name and description.
- Add, edit, and delete pairs within a deck.
- Reorder pairs if desired.

### Import / Export

**Goal:** Make it dead simple to share decks or back them up.

Format and mechanism TBD, but priorities are:

- Human-readable format (JSON, CSV, or a simple plain-text format).
- Export as a downloadable file; import via file picker or drag-and-drop.
- Copy-paste a deck as JSON for quick sharing in chat, email, etc.
- Import should handle duplicates gracefully (merge, skip, or replace).
- Consider a `.kameko` file extension for deck bundles to make them feel intentional.

Open questions:

- Should export include study progress or just the raw pairs?
- Should there be a community sharing mechanism, or keep it personal?
- Could decks be sharable via URL (encoded in a query string or hash for small decks)?

---

## T9 Input System

The input method is central to the game feel. Two modes, both built around the classic 3x4+1 phone keypad layout:

```
[ 1 ]  [ 2 ABC ]  [ 3 DEF ]
[ 4 GHI ]  [ 5 JKL ]  [ 6 MNO ]
[ 7 PQRS ] [ 8 TUV ]  [ 9 WXYZ ]
       [ 0 SPACE ]
```

### Mode 1: Scroll Select

- Tap a number key to cycle through its letters (e.g., pressing `2` cycles: A → B → C → 2 → A...).
- A short pause or a "confirm" action locks in the current character.
- Feels manual and deliberate. Good for precision, learning, and shorter answers.

Design considerations:

- Visual highlight of the current letter on the key.
- Timing for auto-confirm should feel natural (not too fast, not sluggish).
- Need a clear backspace/delete mechanism.
- On mobile, the keypad should sit in the thumb zone at the bottom of the screen.

### Mode 2: Predictive (T9 Classic)

- Each key press narrows down possible words based on the combination of keys pressed.
- The system suggests the most likely word; the player can cycle through alternatives with a dedicated "next word" button.
- Candidate list is scoped to the possible answers in the active deck(s), which keeps predictions tight and relevant.

Design considerations:

- The dictionary for prediction is the set of values in the currently loaded decks, not a general dictionary. This keeps it fair and focused.
- A "cycle" button (or swipe gesture) to move through candidate matches.
- Show the current best guess updating live as keys are pressed.
- What happens when no candidates match? Show a "no match" state and let the player backspace.

### Shared Input UX Principles

- The keypad should feel physical — vibration API for haptic feedback on mobile, clear visual feedback everywhere.
- The current input buffer should be visible and editable (backspace at minimum).
- Switching between modes should be effortless (a toggle, not buried in settings).
- Mobile: keypad fills the bottom half, prompt fills the top. Thumb-friendly tap targets.
- Desktop/tablet: keypad can be more compact; support keyboard number row and numpad as input.

---

## Platform and Responsiveness

### Mobile (Primary)

- This is the main experience. Design for phones in portrait orientation first.
- T9 keypad sized for comfortable thumb tapping — large touch targets, no accidental presses.
- The prompt/question area sits above the keypad with clear separation.
- Deck management should work well on a phone but doesn't need to be optimized for one-handed use.
- PWA install prompt so it feels like a native app (home screen icon, standalone display mode, no browser chrome).

### Tablet

- Same layout scales up naturally. Keypad can stay phone-sized and centered, or expand slightly.
- Landscape orientation could put the prompt on the left and keypad on the right.

### Desktop

- Fully usable with mouse clicks on the keypad buttons.
- Keyboard input mapped to the number row (1-9, 0) and numpad. This should feel fast and natural for touch-typists.
- Deck creation and management is probably most comfortable here.
- Wider layout can show more context — maybe a sidebar with deck info or session stats.

---

## Technical Direction

### Stack

- **HTML5, CSS, JavaScript** — no framework required for v1. Vanilla JS keeps the bundle tiny and the complexity low. Revisit if the app grows.
- **Progressive Web App** — service worker for offline support, web app manifest for installability.
- **GitHub Pages** — free hosting, automatic deploys from the repo, no backend.
- **No backend.** All data lives in the browser (IndexedDB for decks and progress, localStorage for settings). Import/export is the backup and sharing mechanism.

### Data Storage

- **IndexedDB** for decks, pairs, and study progress. Handles structured data well and has no practical size limits for this use case.
- **localStorage** for lightweight settings (input mode preference, theme, last session state).
- Data is per-browser/per-device. No sync. Import/export bridges the gap.

### Offline Support

- Service worker caches the app shell and all static assets.
- Once installed/cached, the game works fully offline — no network needed to study.
- Preloaded decks are bundled in the app; user decks are in IndexedDB.

### Haptics

- Use the Vibration API (`navigator.vibrate()`) for tactile feedback on mobile key presses.
- Short, subtle pulses — not annoying. Respect the "reduce motion" / accessibility preferences.
- Graceful fallback: if vibration isn't available, the app works fine without it.

### Deployment

- Single repo on GitHub. Source code, design docs, and the built site all in one place.
- GitHub Pages serves from `main` branch (or a `docs/` folder).
- No build step required for v1 — just static files. Add a build step later if needed.

---

## Progression and Feedback

- Track per-pair accuracy and surface weak pairs more often (spaced repetition lite).
- Streaks and session summaries to keep motivation up.
- No aggressive gamification — keep it clean and respectful of the player's time.
- Optional daily reminder via PWA notification (if the user opts in).

---

## Visual Direction

TBD, but initial instincts:

- Clean, minimal UI. The keypad and the prompt should dominate the screen.
- Muted, warm color palette. Nothing flashy.
- Typography-forward — the words are the content, make them look good.
- Subtle CSS animations for correct/incorrect feedback.
- Dark mode support (respect `prefers-color-scheme`).

---

## Open Questions

- Naming: what do we call this game? Working title needed.
- Should there be a "reverse mode" where the value is shown and the player types the key?
- How does scoring work? Points? Just accuracy percentage?
- Accessibility: how does T9 input interact with screen readers? ARIA roles for the keypad buttons.
- Should the predictive mode dictionary ever include a general English dictionary as a fallback, or stay strictly scoped to deck values?
- URL-based deck sharing — encode small decks in a URL hash so you can text someone a link?

---

*This is a living document. Update as decisions are made.*
