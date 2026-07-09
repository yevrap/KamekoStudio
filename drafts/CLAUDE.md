# drafts/ — The Lab (Prototypes & WIP)

Game prototypes from `/new-game` jam sessions, plus non-game experiments. Nothing here is production. Prototypes are single-file (`<slug>/index.html`, inline CSS+JS), have no tests/token hooks/settings.js integration, and graduate to `games/` only after a **keep** verdict in the vault's Kameko Playtest Log — see `docs/promotion-checklist.md` for what promotion requires.

## Files

- **`index.html`** — The Lab index: lists every prototype (name, one-liner, link, date, newest first). Linked from the arcade root header ("Lab 🧪"). Register every new prototype here.
- **`arcadeHome.html`** — An alternate, simpler arcade home page. Generates game cards dynamically from a JS array. Not currently linked from anywhere. Candidate to replace or supplement `index.html` once it's further developed.

<!-- GEMINI-OVERRIDE:notes-heading -->
## Notes for Claude
<!-- /GEMINI-OVERRIDE -->

- Nothing in `drafts/` is production. Don't treat these files as reference implementations.
- Links in `arcadeHome.html` use `../games/<game-name>/` paths (relative to this subdirectory).
