# SHS-076 — The studio can be tabled, and a restart learns from its past runs and from what's new

- **Status:** Done
- **Size:** M
- **Iteration:** between 09 and the restart (built by the executive's session that tabled the studio; filed under 09, as [SHS-063](../../06/tickets/SHS-063-exempt-adr-0011-commits.md) was under 06)
- **Role lead:** Scrum Master
- **Depends on:** none
- **Branch:** none — the executive's session commits to `main`, as for [SHS-063](../../06/tickets/SHS-063-exempt-adr-0011-commits.md)

## Motivation

The executive asked (chat, 2026-09-25) to table the studio after sprint 09. Before tabling,
the executive wanted feedback written down on making this kind of development more
efficient, for both the games and the process. When the studio restarts, it should learn
from its past runs and from new AI models, tools and practice.

## Acceptance criteria

- [x] [`steering/restart.md`](../../../steering/restart.md) holds:
  - where the studio stopped;
  - what sprints 00–09 taught, with their numbers;
  - the executive's feedback for the next season as numbered items (the games G1–G6, the
    process P1–P7);
  - a capability baseline dated 2026-09-25;
  - a restart log.
- [x] `next.md` is in the tabled form. Its **Next:** line names `restart`, so the
      `studio-sprint` workflow runs the restart instead of plan 10.
- [x] The skills and the workflow know how to table and restart:
  - the `studio-iteration` skill has a *Tabling* section and a `restart` step;
  - the `studio-sprint` workflow runs two scouts (tools and practice) before `restart`
    and stops after it;
  - `references/prompts.md` and the `studio-sprint` skill mirror the workflow.
- [x] The handbook and steering docs say the studio is tabled:
  - `direction.md` and `process.md` say so, and how it comes back;
  - direction rule 8 records the executive's restatement (cycles are fine, waste isn't),
    in both files under the same number;
  - the steering README's *Say this* lists "table the studio" and "restart the studio".
- [x] The realm's pulse line says the studio is on hold.
- [x] The executive's direction is in the Input Ledger.

## Evidence plan

- `npm test`, since the pulse and docs-link tests read these files.
- `npm run studio:check -- --stage=push`.
- The workflow script parses.
- The SessionStart hook prints the short tabled form from the new `next.md`.

## Out of scope

- **Acting on the feedback.** That is the restart's job.
- **Changing ADR-0011.** G1 becomes a questionnaire item at the restart.
- **The arcade files:** the SessionStart hook's wording (`.claude/settings.json`), the
  root `CLAUDE.md` skills table and the Studio Dashboard. They sit outside the studio's
  paths, so they go in a separate arcade commit.

---

## Result

- **What changed:**
  - `docs/studio/steering/restart.md` (new);
  - `next.md` in its tabled form;
  - `direction.md` (the tabled status, rule 8, *How to steer*);
  - `process.md` (*Tabling and restarting*, rule 8);
  - the steering README, the Input Ledger and the backlog's header;
  - `studio/shelf-data.js` (the pulse line);
  - the `studio-iteration` and `studio-sprint` skills;
  - `references/prompts.md`;
  - `.claude/workflows/studio-sprint.js` (`restart` is runnable, two scouts, a stop after
    it).
- **Tested by:**
  - `npm test` green;
  - `npm run studio:check -- --stage=push` green;
  - the workflow's body compiled as an async function;
  - the hook run against the new `next.md` printed its four-line tabled form.
- **Deferred:** everything under *Feedback for the next season*, to the restart.
- **Fix rounds used:** 0 / 2
