# SHS-071 — This iteration's record

- **Status:** Done
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

- [x] `plan.md`, `log.md` and `review.md` exist and describe what happened.
- [x] The realm's pulse line names iteration 08 while it runs and says what shipped once it
      does.
- [x] The inputs of this sprint are in the input ledger with what each became.
- [x] `CHANGELOG.md` is updated.

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

- **What changed:**
  - `iterations/08/`: `plan.md` (three pitches, Q14's ⭐ Samovar), `log.md` (a stand-up
    per session, each pushed as it landed) and `review.md` (one round: the Independent
    Reviewer approves with findings, QA approves, the Playtester iterates on
    [SHS-068](SHS-068-samovar-core.md) and keeps [SHS-069](SHS-069-river-run-power-ups-read-at-a-glance.md); *In plain words*, the demo list and Keep / Iterate /
    Kill). `retro.md` is written at the `retro` step under this ticket.
  - At plan: the executive's commit `1b798e2` recorded in `COMMIT_EXEMPTIONS`.
  - Review-step records under this ticket: every finding answered in `review.md`; backlog
    #51–#54 new, with Q15 in the questionnaire; the design note corrected (IR08-1, IR08-2).
    The fixes `14d4db8` and `fd3cc18` sit under [SHS-068](SHS-068-samovar-core.md) and [SHS-070](SHS-070-checks-accept-studio-branches.md).
  - `studio/shelf-data.js`: the pulse line says what shipped; Samovar's entry notes its
    first verdict, and River Runner's names iteration 08. `CHANGELOG.md` has the
    `studio-iteration-08` section. Backlog #48, #42, #44 and #40 marked done.
  - The input ledger took the epic's adoption, the questionnaire answers, the two
    `feedback` issues and the exemption at plan, and the Playtester's verdicts at close.
- **Tested by:** `pulse-current.test.mjs`; `docs-current` and `reviewer-verdict` at the
  gate; `iteration-docs`, `changelog` and `doc-cleanliness` at close-out.
- **Deferred:** to the `retro` step, under this ticket: `retro.md`, the realm's retro line,
  `learning-log.md`, `tech-debt.md`, the ticket-link script's run, the scorecard's cost per
  step, the steering views, and the two `feedback` issues (#3, #4) closed with what changed.
  **All done at the retro**, plus the cost reader (`tests/studio/sprint-cost.mjs`, its lib
  and tests) and the skill, workflow and template edits in [retro.md](../retro.md).
  `tech-debt.md` needed no change: no row opened or closed.
- **Fix rounds used:** 0 / 2
