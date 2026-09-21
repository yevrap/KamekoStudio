# SHS-045 — Every ticket a commit names has exactly one ticket file

- **Status:** Ready
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

- [ ] Every ticket ID named in the subject of a non-merge studio commit, anywhere in the
      history, has exactly one ticket file under `docs/studio/iterations/*/tickets/`,
      whose file name starts with that ID and whose first heading names the same ID.
      A missing file, a second file, or a file whose heading names another ticket fails.
- [ ] A ticket file for an ID named by a commit in this iteration's range is held to the
      same content rules as this iteration's own tickets, wherever it lives — so a file
      placed in an older iteration's directory is not a way around them.
- [ ] The decision is pure and unit-tested with the inputs that defeat it: an ID with no
      file, an ID with two, a file whose heading disagrees with its name, a near-miss name
      (`SS-0411-…`), and a merge subject that mentions an ID.
- [ ] `SS-039`, `SS-041` and `SS-042` have ticket files, reconstructed from their commits
      and marked as reconstructed, in iteration 02's directory where the work belongs.
- [ ] `self-checks.md` describes what `docs-current` now proves, and no longer claims more.

## Evidence plan

Unit tests in `tests/studio/rules.test.mjs`. The gate stage run against the real history
before the backfill (fails, naming the three IDs) and after (passes).

## Out of scope

- Validating the content of ticket files from earlier iterations beyond this iteration's
  range. They passed the rules of their own day, and re-judging them by today's is a
  different piece of work.
- Branch names.

---

## Result

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
