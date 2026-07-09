# /new-game — Jam Workflow

Autonomous game-jam session: pitch new game concepts, build the strongest one as a cheap playable prototype in `drafts/`, deploy it, and hand it to Yevster for a phone playtest. Drafts are throwaway by design — the playtest verdict (keep / meh / kill) decides what happens next, so speed and playability beat polish and integration.

**Argument:** `$ARGUMENTS` — optional constraint or seed for the pitches (e.g. `card game`, `something for Max`, `use Web Audio`). If omitted, pitch freely within the brief.

---

## Phase 1 — Read the steering inputs

1. **Taste brief:** `docs/brief.md`. If it doesn't exist yet (p0-08 unshipped), use this fallback brief:
   > Durak is the benchmark: rules the player already knows or can learn in one round, decisions over reflexes, a real opponent that pushes back, 5–10 minute sessions. Card games and turn-based thinking games rank above reflex arcade. Mobile-first portrait play. If the game has rules the player may not know, the prototype must teach them (coach hints, legal-move highlighting) — never assume rulebook knowledge.
2. **Playtest log:** vault file `30-39 Indy App Dev/31 Kameko Arcade/Kameko Arcade/Kameko Playtest Log.md` (vault root: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Optimistic Staircase/`). Read every verdict — **kill** verdicts are hard constraints (don't re-pitch that direction), **meh** notes are iteration requests, **keep** signals taste to build more of.
3. **Existing lineup:** the Games table in `CLAUDE.md` and the folders already in `drafts/` — don't pitch something the arcade already has unless the twist is the point.

## Phase 2 — Pitch

Present exactly 3 concepts, one line each: name, core loop, why it fits the brief. State which one you'd build and why (one sentence). If Yevster is present he may redirect; in an autonomous run, proceed with your pick after stating it.

## Phase 3 — Build the prototype

Build the chosen concept at `drafts/<slug>/index.html` as a **single self-contained file** (inline CSS + JS).

**Draft bar — must have:**
- Playable core loop, start to game-over/win, on the first load
- Mobile-first portrait layout; pointer events; `touch-action: none` where gestures matter; 44px tap targets
- Restart button
- If the rules aren't universally known: teach in-game (short how-to overlay and/or coach hints + legal-move highlighting)

**Draft bar — must NOT have (this is what makes drafts cheap):**
- No ES module split, no separate `style.css` — one file
- No unit tests
- No token gate/earn hooks, no `shared/settings.js`, no `lastPlayed_*` key
- No CLAUDE.md/GEMINI.md game-table rows, no roadmap entry beyond a one-line mention if useful
- No dark-mode/theme integration

Promotion pays those costs later — see `docs/promotion-checklist.md`.

## Phase 4 — Playtest note

Write `drafts/<slug>/PLAYTEST.md`: one-line concept summary, then exactly 3 bullets of what the playtest should evaluate (the open design questions, not generic QA). End with the verdict line format for the vault log:
```
YYYY-MM-DD — <slug> (draft) — keep|meh|kill — <why>
```

## Phase 5 — Register on the drafts index

Add the prototype to `drafts/index.html` (the Lab page): name, one-liner, link (`<slug>/` with trailing slash), date. Newest first.

## Phase 6 — Verify in browser

Serve locally (`npx serve .` from repo root) and play one full loop: start → a few meaningful moves → game over → restart. Fix anything broken. Zero console errors.

## Phase 7 — Ship

1. `node scripts/bump-version.js`
2. Stage only this jam's files: `git add drafts/<slug>/ drafts/index.html version.json` (plus `drafts/CLAUDE.md`/`drafts/GEMINI.md` if updated — regenerate GEMINI via `node scripts/generate-context-docs.js`, never hand-edit)
3. Commit: `feat(drafts): add <slug> prototype` with a one-paragraph body describing the concept
4. `git push origin main`, wait for the Pages deploy (`gh run list --limit 1`, `gh run watch <id>`)
5. Confirm the live URL serves the prototype

## Phase 8 — Report

3–5 sentences: the concept, what the prototype includes/excludes, the live URL (`https://yevrap.github.io/KamekoStudio/drafts/<slug>/`), and a reminder to log the verdict in the vault's `Kameko Playtest Log.md`.

---

## Safety rules

- Never touch `games/` in a jam session — drafts only.
- Never push if `node --test tests/` fails (drafts add no tests, but the suite must stay green).
- One prototype per jam. Resist scope creep: if the concept needs a second file or a test to feel safe, the concept is too big for a draft — shrink it.
