# Iteration 03 — stand-up log

Three lines per entry: done / next / blocked, per role that acted. Written between tickets,
not reconstructed afterwards.

## Before planning — preflight

- **Scrum Master** — *Done:* preflight ran red on `tree-clean`: two handbook files carried
  uncommitted edits the run had not made. They were the executive's own change of ticket
  prefix, arriving while the baseline suites ran. The run did not tidy them up; it stopped
  and asked, and was told to adopt them as [SHS-043](tickets/SHS-043-ticket-prefix.md). `on-main`, `no-stop-file` and
  `baseline-suites` passed. *Next:* the plan. *Blocked:* nothing now.

## After [SHS-046](tickets/SHS-046-iteration-record.md)'s first commit — the plan

- **Product Owner** — *Done:* every open question left at its recommended default:
  Overtighten stays on the shelf as a prototype that reports what it found, and the
  iteration goes back to the standing mix — maintenance and debt lead. Three committed
  tickets. *Next:* [SHS-043](tickets/SHS-043-ticket-prefix.md). *Blocked:* nothing.
- **Scrum Master** — *Done:* three committed against the cap of 2–3, plus the record
  ticket. Review is capped at two rounds; if the second rejects, the run stops and asks
  rather than shipping. *Next:* watch that cap. *Blocked:* nothing.
- **Tech Lead** — *Done:* found while planning that three ticket IDs on `main` have commits
  and no file, and that `docs-current` could not see it. Taken as [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) rather than
  registered and left. *Next:* [SHS-043](tickets/SHS-043-ticket-prefix.md)'s ID grammar, which [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) builds on.

## After [SHS-043](tickets/SHS-043-ticket-prefix.md) — one ticket sequence

- **Tech Lead** — *Done:* `commit-lint` decides the sequence, not the spelling: an `SS-`
  number above 042 is retired, an `SHS-` number at or below it collides. ADR-0006 and a
  naming rule in `process.md`. *Next:* [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md), which reads IDs through `commitTicketId`.
  *Blocked:* nothing.
- **QA Engineer** — *Done:* linted every studio commit subject in the whole history under
  the new rule rather than trusting the tests' examples. All pass the prefix rule. One —
  SS-042's, 81 characters — fails the *length* rule, and was already failing: it reached
  the remote after the iteration-02 gate ran. This iteration's gate would have failed on it
  regardless. *Next:* [SHS-047](tickets/SHS-047-pushed-commit-waiver.md).

## After [SHS-047](tickets/SHS-047-pushed-commit-waiver.md) — a waiver, by hash

- **Scrum Master** — *Done:* [SHS-047](tickets/SHS-047-pushed-commit-waiver.md) opened during the build, not by a review, and not
  planned. Recorded as such. The alternative was rewriting published history for one
  character, which is a stop-and-ask this does not justify. *Next:* [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md).
- **Tech Lead** — *Done:* the waiver is keyed by the full hash, which git computes from the
  commit's content, so it cannot be claimed by copying a subject; every waiver applied is
  printed. *Blocked:* nothing.

## After [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) — one file per ticket

- **Tech Lead** — *Done:* `docs-current` now checks, across the whole history, that every
  ticket a commit names has exactly one file whose name and first line carry its ID, and
  holds any file named by a commit in range to the content rules wherever it lives. The
  existence half reads commit subjects and file names only — no Markdown. *Next:* [SHS-044](tickets/SHS-044-td-009-diagnosed.md).
- **Technical Writer** — *Done:* reconstructed SS-039, SS-041 and SS-042 from their commits
  into iteration 02's directory. The first draft of the reconstructions said everything in
  them was read off the commit; the size, role and dependencies were not, and the preamble
  now says which parts were assigned. *Blocked:* nothing.
- **QA Engineer** — *Done:* before the backfill the rule named exactly the three missing
  IDs; four mutations on the real tree each failed with their own message and were
  reverted.

## After [SHS-044](tickets/SHS-044-td-009-diagnosed.md) — TD-009 diagnosed

- **QA Engineer** — *Done:* TD-009 is not a flaky test and not a New Map defect. It is a
  player-facing defect in Black Hole in One that the test only catches when a particle
  happens to spawn in time: spirals left orbiting a black hole that Explore's reset
  removed. The first real-tap measurement read 1 in 5, then 1 in 20 — both hits on the
  first run of a batch, because the game remembered Explore as the last mode and drew it
  behind the menu from then on. A fresh profile per run gave 10/10. *Next:* the
  independent reviews. *Blocked:* nothing.
- **Tech Lead** — *Done:* the fix is one line in production's `stepParticles`, tried on a
  scratch copy only. Specified in TD-009 for the executive; not made.
- **Scrum Master** — *Done:* three committed tickets and [SHS-047](tickets/SHS-047-pushed-commit-waiver.md) merged; [SHS-046](tickets/SHS-046-iteration-record.md) carries
  the record. Review round 1 of 2 next.

## After review round 1 of 2

- **Independent Reviewer** (a different model from the author) — *Done:* **approved**, with
  one minor finding and one nit. *Blocked:* nothing.
- **QA Engineer** — *Done:* **failed** it, on one major finding: [SHS-044](tickets/SHS-044-td-009-diagnosed.md)'s reproduction
  printed "looks fixed, close the row" under a partial fix that stopped spirals on the
  menu only, while a player leaving a golf round through ☰ Menu still hit the throw every
  time — and its own crash exited with the code for "present". Also four minor findings
  (a second exposed e2e test; the handbook's example commit rejected by the new rule; a
  reconstructed ticket edited in this iteration escaping the content rules; the docs
  claiming *every ID* where the rule reads one) and four nits.
- **Tech Lead** — *Done:* one fix round each on [SHS-043](tickets/SHS-043-ticket-prefix.md), [SHS-044](tickets/SHS-044-td-009-diagnosed.md), [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) and [SHS-047](tickets/SHS-047-pushed-commit-waiver.md);
  every QA finding fixed, and the reviewer's nit. The reviewer's minor finding — the pulse
  line's `shipped` date is set before the iteration ships — is declined with a reason in
  `review.md`. *Next:* review round 2, briefed on the fix-round diff only.
- **Scrum Master** — *Done:* no ticket is at its cap; each used 1 of 2. *Next:* round 2 is
  the last; if it rejects, the run stops and asks.

## After review round 2 of 2 — the last

- **Independent Reviewer** — *Done:* **rejected**, on one blocker: the direct check added
  in round 1 ran in the start menu's state and never confirmed a spiral existed, so a fix
  keyed to the menu was reported *fixed*. It verified a one-line correction. One minor, two
  nits.
- **QA Engineer** — *Done:* **failed** it, on the same gap, found separately — with two
  routes the script did not try that still threw under that fix. Two minor findings and a
  nit.
- **Tech Lead** — *Done:* the final fix round on [SHS-044](tickets/SHS-044-td-009-diagnosed.md) (2 of 2) and on [SHS-043](tickets/SHS-043-ticket-prefix.md) (2 of 2).
  Every round-2 finding fixed or declined with a reason in `review.md`. No round reviewed
  the fixes: the cap is two.
- **Scrum Master** — *Done:* stopped reviewing, and wrote down what a third round would
  most likely find. The verdict of record is a rejection, so the run asks the executive
  before publishing. Mid-run inputs — an automated process review, a hygiene audit in the
  inbox, and answers to three open questions — were logged and triaged; the answers apply
  from the next iteration, as they say. *Blocked:* on the executive's tie-break, after the
  gate.
