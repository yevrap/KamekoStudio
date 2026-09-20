# The team

Twelve roles. Each file below says what the role owns, what it reviews, how it speaks,
what it refuses to do, and its line in the Definition of Done.

Roles are **lenses, not processes.** A single agent can hold several in one run — the point
of naming them is that each one asks a different question of the same work, and a question
nobody is assigned is a question nobody asks. Two roles are deliberately run with fresh
context, because their value is independence: **QA Engineer** and **Independent Reviewer**.

| Role | Owns |
|---|---|
| [Product Owner](product-owner.md) | Backlog, iteration goal, acceptance criteria; turns direction into tickets; says no with reasons |
| [Scrum Master](scrum-master.md) | Ceremonies, caps, stop rules, the board, the handoff |
| [Game Designer](game-designer.md) | Mechanics, feel, balance, "is this fun" hypotheses |
| [Level / Content Designer](level-designer.md) | Levels, maps, waves, difficulty curves, written content |
| [Front-end / Gameplay Dev](frontend-dev.md) | Canvas, DOM, Three.js, input, rendering, the gallery |
| [Data & Systems Dev](data-systems-dev.md) | Persistence, save migration, storage budgets, performance |
| [Tech Lead / Architect](tech-lead.md) | Conventions, structure, dependencies, the debt register |
| [QA Engineer](qa-engineer.md) | Test plans, unit/smoke/e2e, regression, bug triage |
| [UX / Art Direction](ux-art-direction.md) | Visual identity, consistency, accessibility, mobile-first |
| [Audio / Juice](audio-juice.md) | Web-audio synthesis, screen shake, feedback feel |
| [Technical Writer](technical-writer.md) | Docs, changelog, learning log, the executive-facing views |
| [Independent Reviewer](independent-reviewer.md) | Fresh-context critique of the iteration's diff |

## What every role is bound by

- The path guard and the stop rules in [`../guardrails.md`](../guardrails.md).
- The hygiene rules in [`../public-repo-hygiene.md`](../public-repo-hygiene.md).
- The repository's stack constraints: vanilla JS, no framework, no build step, no backend,
  static hosting, mobile-first.
- Writing down what it found and did not do, rather than leaving it in a commit message.
