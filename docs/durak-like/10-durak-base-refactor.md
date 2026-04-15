# Durak: Base Game Refactor & Feature Plan

The plan for turning the original Durak game (`games/durak/`) from a stable-but-limited 2-player monolith into a flagship multiplayer card game with classic rules, a polished themed-table look, variable AI opponent counts, and async link-sharing for play-by-message.

## Context

`games/durak/game.js` is currently a 606-line IIFE that mixes state, rules, AI, rendering, and event wiring. It plays well but its architecture blocks every direction we want to take it:

- Hardcoded to 2 players (top/bottom variables, not an array)
- Basic greedy AI with no difficulty tuning
- Visual: emoji suits, no card animations, no themed table
- No async/turn-based mode
- No tests (untestable without extraction)

The intent is a phased refactor where each phase lands a shippable improvement, with the architecture refactor going first so all later work has a sane home.

### Decisions confirmed
- **Async multiplayer model:** trust-based — full state encoded in the URL hash, the receiving client only renders the current player's hand. Acknowledged as a friendly-play mechanism, not an anti-cheat system.
- **Visual ambition:** themed table + custom SVG card faces (vector, no image assets, scales perfectly).
- **Refactor location:** in place at `games/durak/`. Each phase ships and is playable.
- **Multiplayer scope (initial):** 1 human vs 2–5 AI opponents (3–6 players total). Existing 2-player hot-seat PvP preserved. Async = 1v1 first; N-player async deferred to a later phase if it proves useful.

## Architecture Target

Reference: `games/durak-dungeon/` is the studio's clean ES-module exemplar. Final module layout for `games/durak/`:

| File | Responsibility |
|---|---|
| `index.html` | Minimal DOM; loads `main.js` as `type="module"` |
| `style.css` | Themed table, card surface, animations, responsive breakpoints |
| `constants.js` | `SUITS`, `RANKS`, rank values, display helpers, animation timings |
| `state.js` | `state` object: `players[]`, `deck`, `trumpSuit`, `attacker`, `defender`, `field`, `phase`. Pure query helpers (`getActivePlayers`, `nextClockwise`, `cardsRemainingOnField`) |
| `gameplay.js` | Pure rules: `canBeat`, `legalAttack`, `playAttack`, `playDefend`, `throwOn`, `defenderTakes`, `endBout`, `drawToSix`, `eliminateIfEmpty` |
| `ai.js` | `chooseAttack`, `chooseDefense`, `chooseThrowOn` — pure functions of `(state, playerIdx, difficulty)` |
| `cards.js` | SVG card face/back builders (suit pips, court figures), trump deck-bottom rendering |
| `ui.js` | `renderAll`, `renderHand`, `renderField`, `renderOpponents`, `updateStatus`, animation orchestration |
| `async.js` | URL state serialization, link generation, perspective filter (Phase 5) |
| `main.js` | Event wiring, start menu, settings injection, mode selection |

## Phases

### Phase 0 — Design doc + agent context updates
**Goal:** Land this design doc and keep AI agent context files in sync before any code changes.

- Create this file (`docs/durak-like/10-durak-base-refactor.md`)
- Update `docs/CLAUDE.md` and `docs/GEMINI.md` with a one-line entry referencing this doc and the broader `durak-like/` design-doc series (kept in sync — only footer differs)

### Phase 1 — ES module refactor (behavior-preserving)
**Goal:** Split the monolith into modules per the layout above. Game must play identically to before.

- Create the new module files; migrate logic without rule changes
- Delete `game.js` once new modules are wired
- Convert state from globals to a `state` object with `players[]` of length 2 (preserves current 2P)
- Extract AI into `ai.js` with explicit `(state, playerIdx, difficulty='normal')` signature — paves Phase 4
- Update `games/CLAUDE.md` and `games/GEMINI.md` to note durak now follows the ES-module convention
- Update root `CLAUDE.md` and `GEMINI.md` game table entry
- Add `tests/durak.test.js` with unit tests for pure rules: `canBeat`, `legalAttack`, draw order, trump precedence

**Verification:** Run game in `npx serve .`, play full game vs AI and PvP hot-seat — behavior identical to pre-refactor. `node --test tests/` passes. No regressions in mobile layout.

### Phase 2 — Multi-opponent (1 human vs 2–5 AI)
**Goal:** Support 3–6 player tables with classic multi-player Durak rules.

- State: `players[]` arbitrary length, each `{ id, name, hand, isHuman, isOut, seat }`
- Rules per classic Durak:
  - Attacker = current; defender = next clockwise active; throw-in attackers = all other active players clockwise from attacker
  - Throw-on cap = `min(defender.hand.length, 6)` and only ranks already on the field
  - Defender defends all → defender becomes next attacker; takes → defender's attack turn skipped, next-clockwise attacker plays
  - Player eliminated when hand empty AND deck empty; last player with cards = "Durak"
- Player-count selector on start screen (2–6); persisted to `durak_playerCount` localStorage key
- UI: opponents fanned across top with name + card-back count; human's hand at bottom; turn indicator highlights current attacker/defender
- AI plays sequentially with a small delay between bot decisions for readability

**Verification:** Play 3, 4, and 6-player games to completion; verify rotation, throw-ins from non-attackers, eliminations, last-player-loses logic. Mobile layout with 5 opponents stays readable.

### Phase 3 — Themed table + SVG cards
**Goal:** "Looks great" — first impression should be delightful.

- `cards.js` builds SVG card faces: proper pip layouts (6–10), stylized court figures (J/Q/K), ace centerpiece
- Card back: themed pattern (suggested: ornate Russian-folk-art-inspired motif, single accent color)
- Table: felt-textured background gradient, soft vignette, deck stack with trump card peeking from underneath
- Animations: deal at start, card flying from hand to field, defender-takes sweep, victory/defeat overlay
- Refactor `renderAll` to support targeted updates (avoid full DOM rebuild for animations); cards become persistent elements with transform-based motion
- All vector — scales crisp on every device

**Verification:** Visual review on phone (real device or DevTools mobile), tablet, and desktop. Animations run at 60fps. Trump suit instantly readable.

### Phase 4 — AI difficulty levels
**Goal:** Easy / Normal / Hard difficulty selectable in settings panel.

- **Easy:** random legal move
- **Normal:** current greedy logic (cheapest valid card, conserves trumps when full field)
- **Hard:** tracks played cards (computes remaining unseen), estimates threat per opponent, holds trumps for high-rank attacks, prefers throw-ons that strain defender's hand size, recognizes endgame (deck empty + small hands) and switches to a maximize-discards strategy
- Settings: difficulty pill toggle injected into panel like river-run options; persisted as `durak_difficulty`
- Tests in `tests/durak.test.js` for AI decision determinism on fixed states (Easy = legal, Hard = expected choice on contrived boards)

**Verification:** Play 5 games at each difficulty — Easy beatable trivially, Hard wins meaningfully more. AI never makes illegal moves.

### Phase 5 — Async turn-based link sharing (1v1)
**Goal:** Send a Durak game by message; opponent plays their turn and sends a link back.

- `async.js`: serialize full state → compressed JSON → base64url → `#play=...` fragment (hash, not query — survives static hosting and isn't sent to GitHub Pages logs)
- New start-menu mode: "Async game" → enter your name + opponent name → opening attack → "Copy link" button (uses `navigator.share` on mobile when available)
- Receiving end: open link → game restores → only your-perspective hand rendered (other hands present in state but rendered as card-back stacks); make your move(s) → "Send to {opponent}" generates next link
- Acknowledge trust model in a small info tooltip on the async start screen
- Active async games saved to `durak_asyncGames` localStorage (keyed by gameId) for in-progress tracking and easy resume from start screen
- Phase ships only 1v1 async; N-player async is a possible later phase if requested

**Verification:** Generate link in one browser, paste into another (or same browser incognito), play turn, verify only correct hand visible, send back, complete a full game across the link round-trip.

## Files Changed (cumulative across phases)

**New:**
- `games/durak/constants.js`, `state.js`, `gameplay.js`, `ai.js`, `cards.js`, `ui.js`, `main.js`, `async.js`
- `docs/durak-like/10-durak-base-refactor.md` (this file)
- `tests/durak.test.js`

**Modified:**
- `games/durak/index.html` (load `main.js` as module)
- `games/durak/style.css` (table theme, card SVG styles, animations, multi-opponent layout)
- `CLAUDE.md`, `GEMINI.md` (game table — kept in sync)
- `docs/CLAUDE.md`, `docs/GEMINI.md` (reference this doc — kept in sync)
- `games/CLAUDE.md`, `games/GEMINI.md` (note durak now ES-module per convention — kept in sync)

**Deleted:**
- `games/durak/game.js` (replaced by modules in Phase 1)

**New localStorage keys:**
- `durak_playerCount` (Phase 2) — integer 2–6
- `durak_difficulty` (Phase 4) — `'easy'` | `'normal'` | `'hard'`
- `durak_asyncGames` (Phase 5) — JSON `{ [gameId]: { state, opponentName, lastUpdated } }`

All new keys added to the localStorage table in root `CLAUDE.md` / `GEMINI.md` as they're introduced.

## Open-Ended Later (not in this plan)
- N-player async (Phase 5 extension)
- Hot-seat 3+ humans (deferred — needs hand-hide-pass-device flow)
- Custom rule variants (Translation Durak, "Perevodnoy")
- Sound effects
