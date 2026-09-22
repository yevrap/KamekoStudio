# docs/ — Kameko Studio Planning & Design Docs

Everything the studio plans, decides and learns lives here, in public. These are living documents — update them as decisions are made, in the same commit as the work they describe.

## Files

- **`roadmap.md`** — The working backlog. Agents read this to pick the next work item: open items only, by tier. Shipped history lives in `archive/roadmap-history.md`.
- **`playtest-log.md`** — One line per play session, newest first: `date — game — verdict — why`. The strongest steering input; agents read it before triage and every jam. Agent-verified lines are marked as such and never stand in for Yevster's own verdict.
- **`questionnaires/`** — One file per open product decision, as checkboxes with a recommendation on each. This is the director's inbox. A questionnaire whose answers are all reflected in roadmap rows moves to `archive/questionnaires/`.
- **`games/<slug>/`** — Per-game design: `README.md` (what the game is, how it plays, decisions and why, cut scope, status), `ideas.md` (idea inbox — raw ideas and deliberately cut scope, feeding the roadmap), `plans/` (build plans for larger arcs). `games/README.md` is the lineup: tiers, the Lab, killed games.
- **`planning/`** — Studio-wide direction: new-game directions, the agent game loop, arcade-wide `ideas.md`, tooling investigations.
- **`brief.md`** — The taste brief that steers jams and triage.
- **`mission.md`** — Studio philosophy, principles, constraints and long-term vision.
- **`promotion-checklist.md`** — The 6-phase checklist a `drafts/<slug>/` prototype pays to graduate into `games/`. Run it when a draft gets a **keep** verdict in `playtest-log.md`.
- **`studio/`** — Shadow Studio's handbook (process, guardrails, roles, decisions, iterations), plus `studio/steering/`: `next.md` (the step the team does next), `direction.md` (the epic and its sprint budget), `backlog.md` (ordered work), and the board, scorecard, handoff, inbox, input ledger and open questions.
- **`memory-game-design.md`** — Design spec (Draft v0.2) for a T9 memory/flashcard game. A jam-candidate design, not a commitment — the T9 input system it specifies shipped in keypad-quest. Its open questions are unresolved; don't assume answers.
- **`durak-like/`** — Numbered design docs (`NN-name-focus.md`) for the Durak family of games. Historical design context — the three shipped durak-likes are Lab-tier as of the July 2026 taste verdicts (roadmap p1-29).
- **`archive/`** — History that no longer steers current work: `roadmap-history.md` (shipped rows and session logs), consumed `questionnaires/`, shipped or superseded `plans/`, frozen `dev-logs/`, and early brainstorms.

<!-- GEMINI-OVERRIDE:notes-heading -->
## Notes for Claude
<!-- /GEMINI-OVERRIDE -->

- These docs are the source of truth for *intent* — what the studio is trying to do and why. `roadmap.md` is the source of truth for *what's next*.
- Public repo: write for a stranger. Links between docs are relative paths that resolve on GitHub; no private context, no note-vault syntax.
