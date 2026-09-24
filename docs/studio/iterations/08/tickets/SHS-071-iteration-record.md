# SHS-071 — This iteration's record

- **Status:** In progress
- **Size:** S
- **Iteration:** 08
- **Role lead:** Technical Writer / Learning Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The sprint's ceremony paperwork, carried as a ticket so the commits that write it have an
ID to name. Same arrangement as [SHS-067](../../07/tickets/SHS-067-iteration-record.md).
At plan it also records the executive's 2026-09-24 questionnaire commit in
`COMMIT_EXEMPTIONS`, since that commit has no ticket and would otherwise fail every
`commit-lint` of the sprint (as [SHS-063](../../06/tickets/SHS-063-exempt-adr-0011-commits.md) did for 2026-09-23's).

## Acceptance criteria

- [ ] `plan.md`, `log.md` and `review.md` exist and describe what happened.
- [ ] The realm's pulse line names iteration 08 while it runs and says what shipped once it
      does.
- [ ] The inputs of this sprint are in the input ledger with what each became.
- [ ] `CHANGELOG.md` is updated.

*Done at the retro* (not criteria; the gate needs this ticket Done before the retro
exists): `retro.md`, the realm's retro line, `learning-log.md`, `tech-debt.md`, the
ticket-link script's run, the scorecard's cost per step, the steering views, and the two
`feedback` issues (#3, #4) closed with what changed.

## Evidence plan

`pulse-current.test.mjs`; `iteration-docs`, `changelog` and `doc-cleanliness` at close-out;
`docs-current` at the gate. The exemption: a `rules.test.mjs` case, red before the entry
and green after.

## Out of scope

Nothing beyond the record.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
