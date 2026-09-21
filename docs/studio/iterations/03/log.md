# Iteration 03 — stand-up log

Three lines per entry: done / next / blocked, per role that acted. Written between tickets,
not reconstructed afterwards.

## Before planning — preflight

- **Scrum Master** — *Done:* preflight ran red on `tree-clean`: two handbook files carried
  uncommitted edits the run had not made. They were the executive's own change of ticket
  prefix, arriving while the baseline suites ran. The run did not tidy them up; it stopped
  and asked, and was told to adopt them as SHS-043. `on-main`, `no-stop-file` and
  `baseline-suites` passed. *Next:* the plan. *Blocked:* nothing now.

## After SHS-046's first commit — the plan

- **Product Owner** — *Done:* every open question left at its recommended default:
  Overtighten stays on the shelf as a prototype that reports what it found, and the
  iteration goes back to the standing mix — maintenance and debt lead. Three committed
  tickets. *Next:* SHS-043. *Blocked:* nothing.
- **Scrum Master** — *Done:* three committed against the cap of 2–3, plus the record
  ticket. Review is capped at two rounds; if the second rejects, the run stops and asks
  rather than shipping. *Next:* watch that cap. *Blocked:* nothing.
- **Tech Lead** — *Done:* found while planning that three ticket IDs on `main` have commits
  and no file, and that `docs-current` could not see it. Taken as SHS-045 rather than
  registered and left. *Next:* SHS-043's ID grammar, which SHS-045 builds on.

## After SHS-043 — one ticket sequence

- **Tech Lead** — *Done:* `commit-lint` decides the sequence, not the spelling: an `SS-`
  number above 042 is retired, an `SHS-` number at or below it collides. ADR-0006 and a
  naming rule in `process.md`. *Next:* SHS-045, which reads IDs through `commitTicketId`.
  *Blocked:* nothing.
- **QA Engineer** — *Done:* linted every studio commit subject in the whole history under
  the new rule rather than trusting the tests' examples. All pass the prefix rule. One —
  SS-042's, 81 characters — fails the *length* rule, and was already failing: it reached
  the remote after the iteration-02 gate ran. This iteration's gate would have failed on it
  regardless. *Next:* SHS-047.

## After SHS-047 — a waiver, by hash

- **Scrum Master** — *Done:* SHS-047 opened during the build, not by a review, and not
  planned. Recorded as such. The alternative was rewriting published history for one
  character, which is a stop-and-ask this does not justify. *Next:* SHS-045.
- **Tech Lead** — *Done:* the waiver is keyed by the full hash, which git computes from the
  commit's content, so it cannot be claimed by copying a subject; every waiver applied is
  printed. *Blocked:* nothing.
