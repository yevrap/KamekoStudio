# SHS-059 — Every `SHS-NNN` mention in the repo's Markdown links to its ticket file

- **Status:** Ready
- **Size:** M
- **Iteration:** 06
- **Role lead:** Technical Writer / Learning Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

A reader who meets "SHS-052" in a review, retro or steering view has to search for the
file; none of the 383 mentions of the 16 ticketed numbers is a link. The executive asked at
sprint 06's plan for every mention to link to its ticket file (backlog #32).

## Acceptance criteria

- [ ] A script, `tests/studio/link-tickets.mjs`, rewrites each bare mention of a ticket
      that has a file (`docs/studio/iterations/*/tickets/SHS-NNN-*.md`) as a relative
      Markdown link to that file, in every tracked `.md` file of the repo. Its pure part
      lives in `tests/studio/lib/` and is not picked up as a test file.
- [ ] Left plain, each covered by a unit test: a mention inside inline code or a fenced
      block; inside frontmatter; one that is already a link or inside a link's text or url;
      part of a file path or file name (`reviews/SHS-052.md`, `SHS-052-td-009-fixed`); a
      number with no ticket file (`SHS-001`, `SHS-003`, `SHS-999`, `SHS-0501`); a ticket's
      mention of itself in its own file.
- [ ] Running the script a second time changes nothing.
- [ ] After the run, every mention of SHS-043…058 in the repo's Markdown is either a link
      or one of the cases above; the Result counts both.
- [ ] Every new link resolves: `npm test` (whose docs-links test reads `docs/`) and the
      script's own check that each target exists, which also covers `studio/README.md`.
- [ ] `process.md` says to write a ticket mention as a link and that the retro runs the
      script before regenerating the steering views; the ticket template says the same in
      one line.
- [ ] The two arcade docs that mention SHS tickets are linked in a separate arcade
      `docs:` commit, not a `(studio)` one.

## Evidence plan

- `tests/studio/ticket-links.test.mjs`: each skip case, the link form and its relative
  path from a few depths, idempotence.
- The script's summary line (files changed, mentions linked, mentions left plain by
  reason), pasted into the Result, and a second run reporting zero changes.
- `npm test`, then `--stage=ticket` and `--stage=push`; the handbook's example commits still
  pass `commit-lint`'s tests, and `reviews/SHS-052.md`'s `**Reviewed:**` line still reads.

## Out of scope

- `SS-NNN` mentions (backlog #34), commit subjects, and mentions in code or test files.
- A check stage that fails on a bare mention (direction rule 2: a new check needs a live
  defect or a recurring lesson).
- Editing the `studio-iteration` skill, which is outside the path guard. The handbook
  carries the retro instruction.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
