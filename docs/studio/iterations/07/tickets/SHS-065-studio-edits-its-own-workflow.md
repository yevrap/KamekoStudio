# SHS-065 — A ticketed studio commit may change the studio's own skills and conductor

- **Status:** Ready
- **Size:** S
- **Iteration:** 07
- **Role lead:** Tech Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Direction rule 8 has each retro change how the team works, but the path guard refuses a
studio commit to the files that run the work. [ADR-0011](../../../decisions/ADR-0011-the-studio-runs-itself.md) §6 makes
`.claude/skills/studio-*/**` and `.claude/workflows/studio-sprint.js` a recorded exception
(backlog #41, the executive, 2026-09-23); this is the sprint's one process ticket.

## Acceptance criteria

- [ ] A ticketed studio commit changing `.claude/skills/studio-sprint/SKILL.md`,
      `.claude/skills/studio-iteration/SKILL.md` or `.claude/workflows/studio-sprint.js`
      passes `path-guard`, and the report names the exception it used.
- [ ] The same change in an unticketed `(studio)` commit is reported as a violation.
- [ ] The same change in an arcade commit is still judged by the arcade's rules, not
      waved through by the studio exception.
- [ ] A studio commit changing `.claude/skills/ship/SKILL.md`,
      `.github/workflows/checks.yml` or `docs/studio/decisions/ADR-0011-the-studio-runs-itself.md`
      is reported as a violation.
- [ ] `guardrails.md`'s exception table lists the new exception with ADR-0011 §6 as its
      authority, and what §6 keeps executive-only.

## Evidence plan

`tests/studio/path-guard.test.mjs` (or `rules.test.mjs`): one case per criterion on a
scratch repository (`tests/studio/lib/scratch-repo.mjs`), each shown red before the rule
changes. `npm run studio:check -- --stage=ticket`, then `--stage=push`.

## Out of scope

- Editing any skill or the conductor in this ticket: the retro uses the exception.
- Branches and pull requests (#40), the steering-edit commit form (#21).
- Any change to what ADR-0011 §6 keeps executive-only.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
