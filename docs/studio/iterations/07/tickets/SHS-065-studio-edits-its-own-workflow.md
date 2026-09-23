# SHS-065 — A ticketed studio commit may change the studio's own skills and conductor

- **Status:** Done
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

- [x] A ticketed studio commit changing `.claude/skills/studio-sprint/SKILL.md`,
      `.claude/skills/studio-iteration/SKILL.md` or `.claude/workflows/studio-sprint.js`
      passes `path-guard`, and the report names the exception it used.
- [x] The same change in an unticketed `(studio)` commit is reported as a violation.
- [x] The same change in an arcade commit is still judged by the arcade's rules, not
      waved through by the studio exception.
- [x] A studio commit changing `.claude/skills/ship/SKILL.md`,
      `.github/workflows/checks.yml` or `docs/studio/decisions/ADR-0011-the-studio-runs-itself.md`
      is reported as a violation.
- [x] `guardrails.md`'s exception table lists the new exception with ADR-0011 §6 as its
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

- **What changed:** (`1209d09`) `tests/studio/lib/rules.mjs` gains `WORKFLOW_EXCEPTION`,
  `isWorkflowPath` (any file under `.claude/skills/studio-*/`, or
  `.claude/workflows/studio-sprint.js`; a `.`/`..`/empty segment never matches) and
  `EXECUTIVE_ONLY_PATHS` (ADR-0011 itself). `classifyPaths` sorts workflow files into their
  own `workflow` list and reports ADR-0011 as `executive-only` although it sits under
  `docs/studio/`. `sortCommitsByKind` admits a workflow file only from a studio commit whose
  subject names its ticket in the conventional position (`commitTicketId`); otherwise
  "changed by studio commit X, which names no ticket". A merge of studio work that includes
  a workflow file is a studio merge, not a mixed one (ready for #40's pull requests).
  `path-guard` reports each admitted file as `exception used: … (ADR-0011 §6)`, marking an
  uncommitted one; `production-unchanged` counts them as admitted. `hygiene` now scans the
  studio's skills and conductor. `guardrails.md` lists the exception with ADR-0011 §6 as its
  authority and says what §6 keeps executive-only, which of that the guard holds by path
  (ADR-0011, CI) and which only review can (the rules in `rules.mjs` and `guardrails.md`).
- **Tested by:** `tests/studio/path-guard.test.mjs`, eight new cases on a scratch repository
  (ticketed commit passes naming the exception, three files; uncommitted edit admitted and
  marked; unticketed `(studio)` commit and a `fix: SHS-065 …` subject both violations; arcade
  commit passes with no exception note, and the studio path beside it is still refused;
  `ship/SKILL.md`, `checks.yml` and ADR-0011 in a studio commit each named; uncommitted
  ADR-0011 edit refused; hygiene scans studio skills, not `ship`). Red first: 6 of 18 failed
  before the rule changed (the arcade case passed from the start, as a guard against
  over-reach), and the hygiene case failed with `hygiene.mjs` stashed. Four new cases in
  `rules.test.mjs`, red on the missing exports. Then 152/152 across `path-guard`, `rules`
  and `production-fix`; `--stage=ticket` 5/5.
- **Deferred:** none. The rest of what §6 keeps executive-only can't be held by a path rule;
  `guardrails.md` says so rather than filing it.
- **Fix rounds used:** 0 / 2
