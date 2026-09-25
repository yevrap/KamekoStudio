# SHS-075 — This iteration's record

- **Status:** Done
- **Size:** S
- **Iteration:** 09
- **Role lead:** Technical Writer / Learning Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The sprint's ceremony paperwork, carried as a ticket so the commits that write it have an
ID to name. Same arrangement as [SHS-071](../../08/tickets/SHS-071-iteration-record.md).

## Acceptance criteria

- [x] `plan.md`, `log.md` and `review.md` exist and describe what happened.
- [x] The realm's pulse line names iteration 09 while it runs and says what shipped once it
      does.
- [x] The inputs of this sprint are in the input ledger with what each became.
- [x] `CHANGELOG.md` is updated.

*Done at the retro* (not criteria; the gate needs this ticket Done before the retro
exists): `retro.md`, the realm's retro line, `learning-log.md`, `tech-debt.md`, the
ticket-link script's run, the scorecard's cost per step (and whether retro 08's change to
the Playtester's screenshots held), and the steering views.

## Evidence plan

`pulse-current.test.mjs`; `iteration-docs`, `changelog` and `doc-cleanliness` at close-out;
`docs-current` at the gate.

## Out of scope

Nothing beyond the record.

---

## Result

- **What changed:**
  - `iterations/09/`: `plan.md` (the goal, the three tickets and the record, the glasses'
    and the brim's numbers in the games tickets before the build), `log.md` (a stand-up per session, each pushed as it
    landed) and `review.md` (one round: the Independent Reviewer approves with findings,
    QA approves, the Playtester iterates on [SHS-072](SHS-072-samovar-cup-shapes.md) and keeps both parts of
    [SHS-073](SHS-073-samovar-forgiving-brim.md); at close, *In plain words* and the demo list). `retro.md` is written at the
    `retro` step under this ticket.
  - Review-step records under this ticket: every finding answered in `review.md`; backlog
    #57–#59 new, with Q18 in the questionnaire and Q15 folded into its answered list. The
    fixes `7ec99e6`, `cbc4383`, `d715105` and `59c701c` sit under [SHS-072](SHS-072-samovar-cup-shapes.md), [SHS-073](SHS-073-samovar-forgiving-brim.md) and
    [SHS-074](SHS-074-skill-describes-pull-requests.md).
  - `studio/shelf-data.js`: the pulse line says what shipped; Samovar's entry names
    iteration 09, its glasses, its brim and its second verdict. `CHANGELOG.md` has the
    `studio-iteration-09` section. Backlog #49, #51, #52, #53 and #54 marked done.
  - The input ledger took the plan's inputs (no issue, an empty inbox, Q14, Q15 and Q16)
    at plan, and the Playtester's verdicts and Q15's fold at close.
- **Tested by:** `pulse-current.test.mjs`; `docs-current` and `reviewer-verdict` at the
  gate; `iteration-docs`, `changelog` and `doc-cleanliness` at close-out.
- **Deferred:** to the `retro` step, under this ticket: `retro.md`, the realm's retro line,
  `learning-log.md`, `tech-debt.md`, the ticket-link script's run, the scorecard's cost per
  step (and whether retro 08's change to the Playtester's screenshots held), and the
  steering views.
- **Fix rounds used:** 0 / 2
