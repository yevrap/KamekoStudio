# SHS-059 — Every `SHS-NNN` mention in the repo's Markdown links to its ticket file

- **Status:** Done
- **Size:** M
- **Iteration:** 06
- **Role lead:** Technical Writer / Learning Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

A reader who meets "[SHS-052](../../04/tickets/SHS-052-td-009-fixed.md)" in a review, retro or steering view has to search for the
file; none of the 383 mentions of the 16 ticketed numbers is a link. The executive asked at
sprint 06's plan for every mention to link to its ticket file (backlog #32).

## Acceptance criteria

- [x] A script, `tests/studio/link-tickets.mjs`, rewrites each bare mention of a ticket
      that has a file (`docs/studio/iterations/*/tickets/SHS-NNN-*.md`) as a relative
      Markdown link to that file, in every tracked `.md` file of the repo. Its pure part
      lives in `tests/studio/lib/` and is not picked up as a test file.
- [x] Left plain, each covered by a unit test: a mention inside inline code or a fenced
      block; inside frontmatter; one that is already a link or inside a link's text or url;
      part of a file path or file name (`reviews/SHS-052.md`, `SHS-052-td-009-fixed`); a
      number with no ticket file (`SHS-001`, `SHS-003`, `SHS-999`, `SHS-0501`); a ticket's
      mention of itself in its own file.
- [x] Running the script a second time changes nothing.
- [x] After the run, every mention of [SHS-043](../../03/tickets/SHS-043-ticket-prefix.md)…058 in the repo's Markdown is either a link
      or one of the cases above; the Result counts both.
- [x] Every new link resolves: `npm test` (whose docs-links test reads `docs/`) and the
      script's own check that each target exists, which also covers `studio/README.md`.
- [x] `process.md` says to write a ticket mention as a link and that the retro runs the
      script before regenerating the steering views; the ticket template says the same in
      one line.
- [x] The two arcade docs that mention SHS tickets are linked in a separate arcade
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

- **What changed:** `tests/studio/lib/ticket-links.mjs` decides which `SHS-NNN` mentions
  become links (a relative link to the ticket's file) and which stay plain, by reason;
  `tests/studio/link-tickets.mjs` applies it to every tracked `.md` file and fails on any
  ticket link whose file is missing. The run linked **378 mentions in 48 files** and left 80
  plain (code 45, title line 21, no ticket file 9, self 4, commit subject 1). Of the 390
  mentions of [SHS-043](../../03/tickets/SHS-043-ticket-prefix.md)…058 at the start, **349 are links** and 41 stay plain: 21 in code, 17
  on a file's title line, 3 a ticket's mentions of itself. The other 29 links are to
  059–062, which have files now. The **title line** case was added at build: a review
  record's first line must read `# SHS-052 — …` (`readReviewRecord`), and a ticket's must
  read `# ID — …` (`ticketFileProblems`), so a linked H1 would have failed both checks.
  The **commit subject** case was also added at build: `commit-lint`'s handbook test reads
  `type(studio): SHS-NNN` from prose. A second run: *would link 0 mention(s) in 0
  file(s)*. `process.md` (*Trunk, commits, tags*) says to write a mention as a link and
  that the retro runs the script before regenerating the steering views. The ticket
  template says it in one line, and `tests/studio/README.md` lists the three files. The two
  arcade docs went in their own `docs:` commit.
- **Tested by:** `ticket-links.test.mjs`, 15 tests: the link form and its relative path
  from six depths (a ticket, a review record, the steering views, `studio/README.md`, an
  arcade doc), prose shapes that still link, each plain case with its count (inline code
  with single and double backticks, backtick, tilde and indented four-backtick fences,
  frontmatter, an HTML comment, an existing link, link text and url, an image, a reference
  link, an autolink, five file-name shapes, a sentence-ending full stop that isn't one,
  five numbers with no file, self, title, commit subject), idempotence, and the
  link-target listing. `npm test` 815/815, including `docs-links` over every new link under
  `docs/` and the handbook's example-commit test. The script's own check found no link to
  a missing ticket file, `studio/README.md` included. `--stage=ticket` and `--stage=push`
  are in the log.
- **Deferred:** none. `SS-NNN` mentions stay backlog #34.
- **Fix rounds used:** 0 / 2
