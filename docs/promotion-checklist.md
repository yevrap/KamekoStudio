# Promotion Checklist — Draft → Arcade Game

What a prototype in `drafts/<slug>/` pays to graduate into `games/<slug>/`. Run this when a draft gets a **keep** verdict in the vault's Kameko Playtest Log (`30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Kameko Playtest Log.md`). Written so `/ship promote <slug>` can execute it without follow-up questions.

Work through the phases in order — each builds on the previous.

## Phase 1 — Move & split

- [ ] Create `games/<slug>/` and port the draft out of its single file into the ES-module convention (`games/CLAUDE.md` has the file table; `games/durak-dungeon/` is the reference implementation):
  - `index.html` — markup only, scripts via `<script type="module" src="main.js">`
  - `style.css` — all CSS extracted from the inline `<style>` block
  - `constants.js`, `state.js`, `gameplay.js`, `main.js` — plus `ui.js`/`ai.js` where rendering or opponent logic is separable. If rendering is tightly coupled to state updates (canvas games), merging ui into `gameplay.js` is the accepted pattern (durak-tactics precedent).
- [ ] Keep pure logic (rules, scoring, grid/card math) DOM-free in its own modules — that's what Phase 2 tests.
- [ ] Add `games/<slug>/package.json` with `{"type": "module"}` if tests will import the game's modules (durak precedent).
- [ ] Delete `drafts/<slug>/` and remove its card from `drafts/index.html` (git history preserves the draft). Update `drafts/CLAUDE.md`.

## Phase 2 — Tests

- [ ] `tests/<slug>.test.mjs` covering the pure-logic modules: rules/legality, scoring, win/lose conditions, any RNG helpers (seeded). Aim for the durak-alchemist bar (~25+ assertions over the core rules).
- [ ] `node --test tests/` fully green.

## Phase 3 — Shared infrastructure

- [ ] Include `<script src="../../shared/settings.js" data-gallery-depth="2"></script>` before `</body>`.

- [ ] `localStorage.setItem('lastPlayed_<camelSlug>', Date.now())` on session start.
- [ ] Persist the game's high score / best result under a `<camelSlug>`-prefixed key.
- [ ] Pause/resume on `settingsOpened` / `settingsClosed` window events.
- [ ] Settings gear positioning override if the game has a top header bar (CSS pattern in root `CLAUDE.md`).
- [ ] Dark/light mode support via `body.dark-mode` + CSS custom properties.

## Phase 4 — Mobile & platform patterns

- [ ] Pointer events only (no mouse/touch pairs); `touch-action: none` on game surfaces; 44px minimum tap targets.
- [ ] `100dvh` after `100vh` fallback on full-height containers; safe-area insets per the iOS PWA patterns in root `CLAUDE.md` if the game has fixed top/bottom UI.
- [ ] Canvas games: zero-size guard + `requestAnimationFrame` retry in `init()` (pattern in root `CLAUDE.md`).

## Phase 5 — Register everywhere

- [ ] Game card on root `index.html` (games grid, `--card-accent` color, `href="games/<slug>/"` — trailing slash, never `/index.html`) + entry in the `GAMES_META` array (id, name, emoji, href).
- [ ] Score entry in `SCORES_META` on root `index.html` if the game persists a best.
- [ ] Portal link in `3d.html`.
- [ ] Rows in `games/CLAUDE.md`: Games table, ES Module Refactor Status table, localStorage Keys table.
- [ ] Rows in root `CLAUDE.md`: Games table, localStorage Keys table, project-structure tree.
- [ ] Regenerate Gemini context files: `node scripts/generate-context-docs.js` (never hand-edit a `GEMINI.md`).
- [ ] Add the game to `docs/roadmap.md` (a ✅ promotion row referencing the draft, plus any follow-up items the playtest verdict asked for).

## Phase 6 — Verify & ship

- [ ] Full manual pass in browser via `npx serve .`: start → play → game over → restart; settings open/close pauses; token spend/earn visible; zero console errors.
- [ ] `node --test tests/` green, `node scripts/generate-context-docs.js --check` clean.
- [ ] `node scripts/bump-version.js`, commit (`feat: promote <slug> from drafts to arcade`), push, watch the Pages deploy, confirm the live URL serves the game.
- [ ] Vault close-loop: Dev Log entry; move/annotate the playtest-log line that triggered the promotion.
