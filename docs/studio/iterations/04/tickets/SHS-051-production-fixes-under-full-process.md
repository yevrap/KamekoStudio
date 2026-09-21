# SHS-051 — The studio may fix production under the full process, and the path guard admits a production file only for the ticket that names it, in its own iteration

- **Status:** In progress
- **Size:** M
- **Iteration:** 04
- **Role lead:** Tech Lead / Architect
- **Depends on:** SHS-050 (the post-deploy stage this rule extends)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The executive gave the studio standing permission to make fixes to production files, as
long as the whole sprint process runs — plan, ticket, review, gate, retrospective — and
asked for it to be written into the handbook by a decision record before it is first used.
Today the path guard forbids every production path that is not one of two recorded
exceptions, so the permission needs a rule the guard can enforce, not only a sentence.

## Acceptance criteria

- [ ] `decisions/ADR-0008-production-fixes.md` records the permission: who gave it, what
      counts as a production fix and what does not, what still stops the run, and how the
      guard enforces it.
- [ ] `guardrails.md` has a *Production fixes* section. Every passage in the handbook that
      said production is untouchable, or that a production edit needs a one-off approval,
      now says what is true — the ticket lists each passage and the search that found it.
- [ ] `PRODUCTION_FIXES` in `tests/studio/lib/rules.mjs` lists each production path the
      studio is fixing, with the ticket and the iteration. `path-guard` admits a production
      path only when all three hold:
      - an entry for that exact path names the iteration being checked;
      - that ticket has a file in that iteration's `tickets/` directory;
      - every commit in the range that touches the path names that ticket in its subject.

      Anything else is a violation, as before.
- [ ] The check names every production fix it admits, with its ticket — never silently.
- [ ] `production-unchanged` applies the same rule, so a post-deploy run reports the fix as
      a fix and still fails on any production path no entry covers.
- [ ] `hygiene` scans every production-fix path, as it already scans exception paths.
- [ ] Unit tests cover the admitted case and each way it can fail on its own: no entry, an
      entry for another iteration, no ticket file, a commit naming another ticket, a
      commit naming no ticket.

## Evidence plan

- `rules.test.mjs` for the pure rule; `path-guard.test.mjs` for the rule against a real
  repository.
- `npm run studio:check -- --stage=ticket` on this ticket's commits (no entries yet,
  nothing admitted), and on SHS-052's (both of its files admitted, named).

## Out of scope

- Using the permission. SHS-052 is the first use.
- Promotion of a studio game into the arcade, which keeps its own process and approval
  (`promotion.md`).
- The two existing exceptions, which stay exactly as they are.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
