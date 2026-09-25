# docs/ — Kameko Studio Planning & Design Docs

Everything the studio plans, decides and learns lives here, in public. These are living documents — update them as decisions are made, in the same commit as the work they describe.

## Files

- **`README.md`** — The Studio Dashboard: the map of `docs/` (games by tier, open questionnaires, roadmap tiers, steering, Shadow Studio). It is the home note when `docs/` is opened as an Obsidian vault. Adding a game doc or a questionnaire means adding its row here; `tests/docs-links.test.mjs` fails until you do.
- **`roadmap.md`** — The working backlog. Agents read this to pick the next work item: open items only, by tier. Shipped history lives in `archive/roadmap-history.md`.
- **`playtest-log.md`** — One line per play session, newest first: `date — game — verdict — why`. The strongest steering input; agents read it before triage and every jam. Agent-verified lines are marked as such and never stand in for Yevster's own verdict.
- **`questionnaires/`** — One file per open product decision, as checkboxes with a recommendation on each. This is the director's inbox. A questionnaire whose answers are all reflected in roadmap rows moves to `archive/questionnaires/`.
- **`games/<slug>/`** — Per-game design: `README.md` (what the game is, how it plays, decisions and why, cut scope, status), `ideas.md` (idea inbox — raw ideas and deliberately cut scope, feeding the roadmap), `plans/` (build plans for larger arcs). `games/README.md` is the lineup: tiers, the Lab, killed games.
- **`planning/`** — Studio-wide direction: new-game directions, the agent game loop, arcade-wide `ideas.md`, tooling investigations.
- **`brief.md`** — The taste brief that steers jams and triage.
- **`mission.md`** — Studio philosophy, principles, constraints and long-term vision.
- **`promotion-checklist.md`** — The 6-phase checklist a `drafts/<slug>/` prototype pays to graduate into `games/`. Run it when a draft gets a **keep** verdict in `playtest-log.md`.
- **`studio/`** — Shadow Studio's handbook (process, guardrails, roles, decisions, iterations), plus `studio/steering/`: `next.md` (the step the team does next), `restart.md` (the restart brief while the studio is tabled), `direction.md` (the epic and its sprint budget), `backlog.md` (ordered work), and the board, scorecard, handoff, inbox, input ledger and open questions.
- **`memory-game-design.md`** — Design spec (Draft v0.2) for a T9 memory/flashcard game. A jam-candidate design, not a commitment — the T9 input system it specifies shipped in keypad-quest. Its open questions are unresolved; don't assume answers.
- **`durak-like/`** — Numbered design docs (`NN-name-focus.md`) for the Durak family of games. Historical design context — the three shipped durak-likes are Lab-tier as of the July 2026 taste verdicts (roadmap p1-29).
- **`archive/`** — History that no longer steers current work: `roadmap-history.md` (shipped rows and session logs), consumed `questionnaires/`, shipped or superseded `plans/`, frozen `dev-logs/`, and early brainstorms.

<!-- GEMINI-OVERRIDE:notes-heading -->
## Notes for Claude
<!-- /GEMINI-OVERRIDE -->

- These docs are the source of truth for *intent* — what the studio is trying to do and why. `roadmap.md` is the source of truth for *what's next*.
- Public repo: write for a stranger. Links between docs are relative paths that resolve on GitHub; no private context, no note-vault syntax.

## Conventions: frontmatter and links

`docs/` reads the same on GitHub, to agents, and in Obsidian. Two rules keep it that way, and `tests/docs-links.test.mjs` enforces both.

**Links** are standard relative Markdown links, `[label](path/to/file.md)`, never wikilinks (the hygiene test rejects them). Link files, not folders or heading anchors: GitHub and Obsidian build anchors differently, and Obsidian can't open a folder link. Every relative link must resolve. Links that leave `docs/` (to code, skills or `CLAUDE.md`) work on GitHub and in a vault opened at the repo root, not in one opened on `docs/`; keep them rare. Cross-link as you write: a game name in a roadmap row links its design doc, a row gated on a decision links the questionnaire, a playtest-log entry links its game's doc, and a questionnaire's `**Related:**` line links its game doc, the roadmap and the playtest log.

**Frontmatter** is a small YAML subset — `key: value`, double-quoted strings, flow lists `[a, b]` — at the very top of the file, before the `# Title`.

Game design docs (`games/<slug>/README.md`), followed by a `**Links:**` line under the title:
```yaml
---
title: "Maze Warden"
type: game
slug: maze-warden
tier: invest
status: arcade
play_url: https://yevrap.github.io/KamekoStudio/games/maze-warden/
code: games/maze-warden/
tags: [game, tower-defense, roguelike]
---
```
`slug` is the folder name. `tier` is the director's call: `invest`, `maintain`, `park`, `lab` or `killed`. `status` is where the build lives: `arcade`, `lab` or `draft`. `play_url` is the Pages URL plus `code`. `tags` starts with `game`, then genres.


Open questionnaires (`questionnaires/*.md`):
```yaml
---
title: "Materials Run Questionnaire — Modernization Direction"
type: questionnaire
status: partly-answered
game: materials-run
created: 2026-07-22
gates: [p2-06, p2-37, p2-38]
tags: [questionnaire, materials-run]
---
```
`status` is `open` (nothing answered), `partly-answered`, or `answered` (every question answered, an agent still has to act on it). `game` is omitted for a studio-wide questionnaire, whose second tag is `studio-wide`. `gates` lists the open roadmap rows waiting on it, `[]` when none. No inline comments; the test's parser takes plain values only.
When a questionnaire's status changes, update its row in the dashboard in the same commit. Archived files keep whatever frontmatter they had and aren't checked.
