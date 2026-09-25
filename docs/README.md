---
title: "Kameko Studio — Studio Dashboard"
type: dashboard
tags: [dashboard, map-of-content]
---

# Kameko Studio — Studio Dashboard

Kameko Studio is a one-person web arcade built in public by AI agents, with a human
engineering director setting direction and judging the results. Everything the studio plans,
decides and learns is here. This page is the map: open it first, on GitHub or as the home note
of an Obsidian vault opened on `docs/` (links out to code and `CLAUDE.md` work on GitHub, or in a
vault opened at the repo root).

| Start here | For |
|---|---|
| [Roadmap](roadmap.md) | What's next: open work by priority tier |
| Decisions waiting on the director (section below) | Questionnaires waiting on the director |
| [Playtest log](playtest-log.md) | Verdicts from real play sessions, the strongest steering signal |
| [Games lineup](games/README.md) | Tiers, the Lab, killed games, and the history behind each move |
| [Taste brief](brief.md) · [Mission](mission.md) | What the studio is trying to make, and why |
| [Shadow Studio](studio/steering/README.md) | The agent "scrum company" running an experimental realm |
| [Roadmap history](archive/roadmap-history.md) | Shipped rows and the dated session log |

## Games

Each game has a design doc (what it is, decisions and why), an idea inbox that feeds the
roadmap, and a live build. Design docs carry frontmatter (`tier`, `status`, `play_url`,
`tags`), so Obsidian can list and filter them as properties.

### In the arcade (Invest tier)

| Game | Design doc | Ideas | Play |
|---|---|---|---|
| Durak, the benchmark | [Durak](games/durak/README.md) | [ideas](games/durak/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/durak/) |
| Tysiacha (1000) | [Tysiacha](games/tysiacha/README.md) | [ideas](games/tysiacha/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/tysiacha/) |
| Keypad Quest | [Keypad Quest](games/keypad-quest/README.md) | [ideas](games/keypad-quest/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/keypad-quest/) |
| Materials Run | [Materials Run](games/materials-run/README.md) | [ideas](games/materials-run/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/materials-run/) |
| Astro Salon | [Astro Salon](games/astro-salon/README.md) | [ideas](games/astro-salon/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/astro-salon/) |
| Pachinko Bazaar | [Pachinko Bazaar](games/pachinko-bazaar/README.md) | [ideas](games/pachinko-bazaar/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/pachinko-bazaar/) |
| Black Hole in One | [Black Hole in One](games/black-hole-in-one/README.md) | [ideas](games/black-hole-in-one/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/) |
| Maze Warden | [Maze Warden](games/maze-warden/README.md) | [ideas](games/maze-warden/ideas.md) | [play](https://yevrap.github.io/KamekoStudio/games/maze-warden/) |
| River Run: arcade build takes bug fixes only; feature work happens in the [Shadow Studio fork](studio/steering/backlog.md) | no design doc yet | [ideas](games/river-run/ideas.md) | [arcade](https://yevrap.github.io/KamekoStudio/games/river-run/) · [fork](https://yevrap.github.io/KamekoStudio/studio/games/river-run/) |
| Hidden Object | no design doc yet | none | [play](https://yevrap.github.io/KamekoStudio/games/hidden-object/) |

### In the Lab

Off the main page, still playable from [the Lab](https://yevrap.github.io/KamekoStudio/drafts/).

| Game | Where it stands | Docs |
|---|---|---|
| Skazka Trail | Draft, a choice-driven folk-tale anthology; keep verdicts in the playtest log | [concept](games/skazka-trail/plans/concept-and-directions.md) · [backlog](games/skazka-trail/backlog.md) · [ideas](games/skazka-trail/ideas.md) |
| Durak Alchemist · Durak Dungeon · Durak Tactics | Shelved from the arcade 2026-07-12 (p1-29) | [Durak Alchemist ideas](games/durak-alchemist/ideas.md) · design history in [the durak-like docs](durak-like/new-durak-game.md) |
| Blob Zapper | Shelved 2026-07-15; a controls rework (p1-31) is the way back | none yet |
| Flow Glider | Killed 2026-07-14, kept as a curio | [Flow Glider](games/flow-glider/README.md) |

## Decisions waiting on the director

One file per open product decision, answered by checking boxes. `answered` means every
question has an answer and an agent still has to act on it; `partly-answered` means some
questions are still open. The status here matches each file's frontmatter (a test checks it).

| Questionnaire | Game | Status | Gates |
|---|---|---|---|
| [Keypad Quest: Sprint Direction](questionnaires/keypad-quest-sprint-direction.md) | Keypad Quest | partly-answered | p2-04, p2-45, p2-46, p2-47, p2-49 |
| [Materials Run: Modernization Direction](questionnaires/materials-run-modernization.md) | Materials Run | partly-answered | p2-06, p2-37, p2-38 |
| [Maze Warden: Iteration 8 Direction](questionnaires/maze-warden-iteration-8.md) | Maze Warden | partly-answered | the shooting-mechanic rework |
| [Pachinko Bazaar: Arcade Polish](questionnaires/pachinko-bazaar-arcade-polish.md) | Pachinko Bazaar | partly-answered | Q1–Q2 need a play session |
| [Astro Salon: Promotion Decisions](questionnaires/astro-salon-promotion-decisions.md) | Astro Salon | answered | p2-35 (needs a design pass) |
| [Action Physics Game](questionnaires/action-physics-game.md) | studio-wide | answered | the action physics jam |
| [Taste and Tiers](questionnaires/taste-and-tiers.md) | studio-wide | partly-answered | tier steering; Q7 free space open |
| [What to Build Next](questionnaires/what-to-build-next.md) | studio-wide | answered | new-game picks |

Answered questionnaires whose answers are all reflected in roadmap rows move to
`archive/questionnaires/`. Shadow Studio keeps its own:
[Shadow Studio questionnaire](studio/steering/questionnaire.md).

## Roadmap

[The roadmap](roadmap.md) holds open work only, by tier. Game names in its rows link to the
game's design doc; rows gated on a decision link the questionnaire.

- **P0, Foundation:** preconditions to clear before adding features.
- **P1, High-impact polish:** the biggest visible improvements to the player experience.
- **P2, Medium features:** new mechanics that add replayability.
- **P3, New games:** jams and large arcs.
- **Backlog:** tech debt, picked up when a game is getting other attention.

Arcade-wide ideas that haven't become rows yet: [arcade idea inbox](planning/ideas.md).

## Steering

- [Taste brief](brief.md): what the studio makes, and the genres it jams in.
- [Mission](mission.md): philosophy, principles, constraints.
- [Playtest log](playtest-log.md): every verdict, newest first, each linked to its game's doc.
- [Agent game loop](planning/agent-game-loop.md): jam → playtest → verdict → invest.
- [New game directions](planning/new-game-directions.md) · [Action physics directions](planning/action-physics-directions.md): the jam queue's source.
- [Promotion checklist](promotion-checklist.md): how a Lab draft graduates into the arcade.

## Shadow Studio

An agent scrum company that builds and runs an experimental realm in `studio/`, one step per
session. Live at [the studio](https://yevrap.github.io/KamekoStudio/studio/). **Tabled since
2026-09-25:** the [restart brief](studio/steering/restart.md) says where it stopped, what its
sprints taught and what a restart does; "restart the studio" brings it back.

- [Index](studio/steering/README.md) · [Next step](studio/steering/next.md) · [Direction](studio/steering/direction.md) · [Backlog](studio/steering/backlog.md) · [Board](studio/steering/board.md)
- [Handoff](studio/steering/handoff.md) · [Scorecard](studio/steering/scorecard.md) · [Inbox](studio/steering/inbox.md) · [Questionnaire](studio/steering/questionnaire.md)
- [Engineering handbook](studio/README.md) · [Guardrails](studio/guardrails.md) · [Process](studio/process.md) · [Changelog](studio/CHANGELOG.md)

## Planning and reference

- [Arcade idea inbox](planning/ideas.md) · [Dev tooling investigation](planning/dev-tooling-investigation.md) · [Arcade dev-mode dashboard](planning/arcade-dev-mode-dashboard.md)
- [Memory game design](memory-game-design.md): a T9 flashcard spec, a jam candidate only.
- [Durak-like design docs](durak-like/new-durak-game.md): the durak family's design history, numbered `durak-like/NN-*.md`.

## Archive

- [Roadmap history](archive/roadmap-history.md): shipped rows and session logs.
- Dev logs: [arcade](archive/dev-logs/arcade.md) · [Black Hole in One](archive/dev-logs/black-hole-in-one.md) · [Skazka Trail](archive/dev-logs/skazka-trail.md)
- `archive/questionnaires/` (consumed decisions) and `archive/plans/` (shipped or superseded build plans), both linked from the design docs that used them.

## How work flows

The director gives direction, verdicts and answers; agents record them here, turn them into
roadmap rows, and ship them end to end: tested, deployed to
[the live arcade](https://yevrap.github.io/KamekoStudio/), and documented in the same commit.
The agent workflows live in [`.claude/skills/`](../.claude/skills/ship/SKILL.md); the working
agreements in [`CLAUDE.md`](../CLAUDE.md). Conventions for these docs, including the
frontmatter schema and the link rules, are in [`docs/CLAUDE.md`](CLAUDE.md).
