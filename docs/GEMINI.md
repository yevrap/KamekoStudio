<!-- AUTO-GENERATED from docs/CLAUDE.md by scripts/generate-context-docs.js — DO NOT EDIT DIRECTLY. Edit docs/CLAUDE.md (and context-src/gemini-overrides.md for Gemini-specific sections) instead. -->

# docs/ — Kameko Studio Design Docs

Design documentation and studio notes. These are living documents — update them as decisions are made.

## Files

- **`roadmap.md`** — The working backlog. Agents read this to pick the next work item; open items only in the priority tables, shipped history at the bottom. Keep it updated as things ship.
- **`mission.md`** — Studio philosophy, principles, constraints, and long-term vision. Read this to understand why decisions are made the way they are.
- **`promotion-checklist.md`** — The 6-phase checklist a `drafts/<slug>/` prototype pays to graduate into `games/`. Run it when a draft gets a **keep** verdict in the vault's Kameko Playtest Log.
- **`memory-game-design.md`** — Design spec (Draft v0.2) for a T9 memory/flashcard game. A jam-candidate design, not a commitment — the T9 input system it specifies shipped in keypad-quest, and new games now come from the `/new-game` jam loop steered by `brief.md` (roadmap p0-08). Its open questions are unresolved; don't assume answers.
- **`durak-like/`** — Numbered design docs (`NN-name-focus.md`) for the Durak family of games: existing variants (dungeon, tactics, alchemist), unimplemented proposals (bazaar, tower, merge/chaining concepts), and refactor plans for shipped games. Historical design context — the three shipped durak-likes are Lab-tier as of the July 2026 taste verdicts (roadmap p1-29).
- **`archive/`** — Superseded brainstorms kept for history (pre-loop new-game ideas, sharing-game notes). Nothing in here steers current work.

## Notes for Gemini

- These docs are the source of truth for *intent* — what the studio is trying to do and why.
- `roadmap.md` is the source of truth for *what's next*; the vault's Kameko notes hold playtest verdicts and product decisions that feed it.
