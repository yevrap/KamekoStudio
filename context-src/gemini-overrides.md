Replacement text for sections of CLAUDE.md that must read differently in the
generated GEMINI.md. Each `<!-- OVERRIDE:pair:key -->` marker corresponds to a
`<!-- GEMINI-OVERRIDE:key -->` marker in `<pair>/CLAUDE.md` (`root` = the
top-level `CLAUDE.md`). See `scripts/generate-context-docs.js`.

<!-- OVERRIDE:root:title -->
# Kameko Studio — Gemini Context

<!-- OVERRIDE:root:structure-self-ref -->
GEMINI.md           — This file

<!-- OVERRIDE:root:ai-workflow-tool-section -->
### Workflow

When starting a session:
1. Read `docs/roadmap.md` to understand current priorities.
2. Read relevant game files before proposing any changes.
3. Present a plan (max 7 bullet points) and wait for Yevster's explicit approval before writing code.
4. After implementation, run `node --test tests/` and confirm all tests pass.
5. Commit with a clear message (`feat:`, `fix:`, `refactor:`, `chore:`, etc.) and push to main.
6. Mark the roadmap item complete and note the date.

### Claude Code Skills

Claude Code users have three additional slash commands in `.claude/commands/`:
- **`/triage`** — presents a prioritized menu from `docs/roadmap.md` for Yevster to choose from
- **`/improve`** — read-only quality scan across the codebase
- **`/ship [item-id]`** — fully autonomous: pick item → plan → implement → test → commit → push → mark complete

<!-- OVERRIDE:root:games-file-ref -->
`games/GEMINI.md`

<!-- OVERRIDE:docs:notes-heading -->
## Notes for Gemini

<!-- OVERRIDE:drafts:notes-heading -->
## Notes for Gemini
