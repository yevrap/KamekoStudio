# SHS-045 — Every ticket a commit names has exactly one ticket file

- **Status:** Done
- **Size:** S
- **Iteration:** 03
- **Role lead:** Tech Lead / Architect
- **Depends on:** SHS-043
- **Branch:** `shs-045-every-ticket-has-a-file`

## Motivation

Found while planning this iteration. `docs-current` describes itself as proving that
*every ticket in the iteration has a file*, but it reads only the files that exist, so a
ticket with no file is invisible to it. Three IDs — `SS-039`, `SS-041`, `SS-042` — are
named by commits on `main` and have no ticket file anywhere, and the gate reported
iteration 02 complete.

## Acceptance criteria

- [x] The ticket each non-merge studio commit names — the ID in its subject's ticket
      position — anywhere in the history, has exactly one ticket file under `docs/studio/iterations/*/tickets/`,
      whose file name starts with that ID and whose first heading names the same ID.
      A missing file, a second file, or a file whose heading names another ticket fails.
- [x] A ticket file for an ID named by a commit in this iteration's range is held to the
      same content rules as this iteration's own tickets, wherever it lives — so a file
      placed in an older iteration's directory is not a way around them.
- [x] The decision is pure and unit-tested with the inputs that defeat it: an ID with no
      file, an ID with two, a file whose heading disagrees with its name, a near-miss name
      (`SS-0411-…`), and a merge subject that mentions an ID.
- [x] `SS-039`, `SS-041` and `SS-042` have ticket files, reconstructed from their commits
      and marked as reconstructed, in iteration 02's directory where the work belongs.
- [x] `self-checks.md` describes what `docs-current` now proves, and no longer claims more.

## Evidence plan

Unit tests in `tests/studio/rules.test.mjs`. The gate stage run against the real history
before the backfill (fails, naming the three IDs) and after (passes).

## Out of scope

- Validating the content of ticket files from earlier iterations that this iteration
  neither names nor changes. They passed the rules of their own day, and re-judging them by
  today's is a different piece of work. A file this iteration *does* change is held to
  today's rules wherever it lives.
- Branch names.

---

## Result

- **What changed:** `tests/studio/lib/rules.mjs` — `TICKET_FILE_RE`, `ticketFileId` and
  `ticketFileProblems`, pure. `tests/studio/checks/docs.mjs` — `docs-current` reads every
  ticket file in every iteration with its first line, and the ticket each non-merge studio
  commit names, both across the whole history and in this iteration's range; it reports
  the existence problems, then runs the unchanged content rules over this iteration's
  tickets plus the file of every ticket named in range, wherever it lives. It now needs
  the base ref, and fails with a clear message without one. Three reconstructed ticket
  files in `iterations/02/tickets/`: `SS-039-the-verdict.md`, `SS-041-flaky-production-e2e.md`,
  `SS-042-reviewer-model-diversity.md`, each marked as reconstructed and saying which parts
  were read off the commit and which were assigned. `self-checks.md`'s `docs-current` row.
  **Fix round 1**, from the QA review and one reviewer nit: content rules now also apply to
  every ticket file the iteration's commits changed (`committedPaths`), which catches an
  edit to a reconstructed file no commit subject names; a file name must obey the ticket
  sequence (`ticketIdProblem`), so `SHS-041-…` and `SS-050-…` fail; files are read
  case-insensitively, so `X.MD` fails for its name instead of sitting unseen beside the
  real one; the merge exclusion moved into a pure, tested `ticketsNamedByLog`; the history
  read is filtered to commits containing `(studio):`. The first criterion and
  `self-checks.md` said *every ticket ID in the subject* while the rule reads the one in
  the ticket position — the words now say what the rule does, because a later mention is
  not a claim to be that ticket.

- **Tested by:** eight new tests in `tests/studio/rules.test.mjs` — a whole record; an ID
  with no file, reported with its commit; an ID named twice, reported once; two files for
  one ID, with and without a commit naming it; a heading naming another ticket; six first
  lines that are not the right heading (empty, no `#`, an H2, `SHS-0501`, `SHS-050-x`,
  `About SHS-050`); a near-miss file name `SS-0411-…` that must not satisfy `SS-041`, plus
  five malformed names; a merge subject naming nothing. 77/77 in that file; `npm test`
  693/693. Against the real repository at the gate stage: **before the backfill**, *"SS-042
  is named by commit 5416876 and has no ticket file"*, likewise SS-041 (`72afe9d`) and
  SS-039 (`ff69efb`) — exactly the three; **after**, none. Four mutations applied to the
  real tree and reverted, each failing with its own message: SS-041's reconstructed file
  set back to `Ready` in iteration 02's directory (*"iterations/02/tickets/SS-041-…: still
  "Ready" at the gate"* — the in-range content rule reaching an older directory); a copy of
  SHS-043's file in iteration 02 (*"SHS-043: 2 ticket files"*); `SS-038-mislabelled.md`
  headed `# SHS-099` (*"first line should be "# SS-038 — …""*); `ss-044-lowercase.md`
  (*"not named <ID>-<slug>.md"*). SS-040's file, in range and in iteration 02, passes the
  content rules unchanged. Fix round 1: four more tests (82/82) — the two out-of-sequence
  names, an upper-case extension beside the real file, a merge with a conforming subject,
  a second ID mentioned in a description. On the real tree, reverted afterwards: SS-039's
  reconstructed file set to `Shipped ✅` → *"iterations/02/tickets/SS-039-the-verdict.md:
  unknown status"*, reached only through the changed-files rule, since no commit in range
  names SS-039; `SHS-041-collides.md`, `SS-050-retired.md` and `SHS-045-copy.MD` in
  iteration 03 → one message each.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
