<!-- AUTO-GENERATED from docs/CLAUDE.md by scripts/generate-context-docs.js — DO NOT EDIT DIRECTLY. Edit docs/CLAUDE.md (and context-src/gemini-overrides.md for Gemini-specific sections) instead. -->

# docs/ — Kameko Studio Design Docs

Design documentation and studio notes. These are living documents — update them as decisions are made.

## Files

- **`mission.md`** — Studio philosophy, principles, constraints, and long-term vision. Read this to understand why decisions are made the way they are.
- **`promotion-checklist.md`** — The 6-phase checklist a `drafts/<slug>/` prototype pays to graduate into `games/`. Run it when a draft gets a **keep** verdict in the vault's Kameko Playtest Log.
- **`memory-game-design.md`** — Full design spec (Draft v0.2) for the upcoming T9 memory/flashcard game. This is the next game to build. Covers the T9 input system (scroll-select and predictive modes), deck structure, import/export, platform layout, and technical direction.
- **`durak-like/`** — Numbered design docs (`NN-name-focus.md`) for the Durak family of games: existing variants (dungeon, tactics, alchemist), unimplemented proposals (bazaar, tower, merge/chaining concepts), and major refactor plans for shipped games.
  - **`10-durak-base-refactor.md`** — Active multi-phase plan to refactor the original Durak game (`games/durak/`) from a 606-line monolith into a flagship multiplayer card game: ES module split, multi-opponent (2–6) play, themed-table SVG visuals, AI difficulty levels, and async link-sharing turn-based play.

## Notes for Gemini

- These docs are the source of truth for *intent* — what the studio is trying to do and why.
- The memory game design doc contains open questions that haven't been resolved yet. Don't assume answers to them.
- When the memory game build starts, check `memory-game-design.md` for constraints before suggesting any architecture.
