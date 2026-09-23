# Iteration 03 — a maintenance iteration: the ticket prefix, a production flake diagnosed, and a gate claim made true

**Goal:** leave the studio's record and its gate saying only what is true — new tickets
carry a prefix chosen by reading it, the production test that makes "the whole suite is
green" unreliable has a known cause and a specified fix, and the gate stops accepting a
ticket that has no file.

## Committed tickets

| ID | Title | Size | Role lead |
|---|---|---|---|
| [SHS-043](tickets/SHS-043-ticket-prefix.md) | New tickets are named `SHS-NNN`; the `SS-` series closes at 042 | S | Tech Lead |
| [SHS-044](tickets/SHS-044-td-009-diagnosed.md) | TD-009 diagnosed: root cause, a deterministic reproduction, the production fix specified | S | QA Engineer |
| [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) | Every ticket a commit names has exactly one ticket file | S | Tech Lead |

| ID | Title | Size | Role lead |
|---|---|---|---|
| [SHS-046](tickets/SHS-046-iteration-record.md) | This iteration's record | S | Technical Writer |

Three committed tickets against the standing cap of 2–3. [SHS-046](tickets/SHS-046-iteration-record.md) is the iteration's own
paperwork carried as a ticket so the commits that write it have an ID to name — the same
arrangement as SS-009, SS-015 and SS-023. Recorded here rather than quietly exceeded.

**Order.** [SHS-046](tickets/SHS-046-iteration-record.md) lands its first commit first, because creating this directory stales the
realm's pulse line (see *Files this plan invalidates*). [SHS-043](tickets/SHS-043-ticket-prefix.md) next, because the other two
tickets are named under the convention it introduces and [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) parses it. [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) then,
because it depends on [SHS-043](tickets/SHS-043-ticket-prefix.md)'s ID grammar. [SHS-044](tickets/SHS-044-td-009-diagnosed.md) is independent.

## Decisions this iteration builds on

Every open question was left at its recommended default except where noted.

| Question | Answer | What depends on it |
|---|---|---|
| What happens to *Overtighten*, whose design hypothesis was falsified | **It stays on the shelf as a prototype that says what it found.** No mechanic change. The standing work mix resumes — maintenance and debt lead — and the next new-development slot starts a different idea | No ticket touches `studio/games/overtighten/`. The difficulty-curve observation from iteration 02 is closed as *won't do*: it describes the same falsified mechanic three times, and the mechanic is not changing |
| Whether an iteration ships on a reviewer's approval or on the executive's word | **The gate keeps requiring a recorded verdict, and the executive breaks a tie.** Review is capped at two rounds (`process.md`) | If the second round rejects, the run stops before publishing and asks. It does not ship over a rejection on its own authority |
| Whether `docs-current` earns its cost | **Kept.** It rests on declaring each thing once | [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) extends it in that same spirit rather than adding a parallel check |
| Iteration size | **The cap applies to planned work;** reviews open what they open | Tickets opened by review are recorded as such |
| The realm's portal on the 3D landing page | **Not yet** | TD-001 and TD-006 unchanged; the twelfth slot stays reserved |
| The realm's name | **Kept** | Nothing changes |
| The ticket prefix | **`SHS-NNN`, numbering continuing from 043**, decided by the executive; existing `SS-` tickets keep their names | [SHS-043](tickets/SHS-043-ticket-prefix.md), ADR-0006 |

## Reserved capacity

[SHS-044](tickets/SHS-044-td-009-diagnosed.md) and [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) are the debt share — two of three committed tickets, well over a fifth.
[SHS-044](tickets/SHS-044-td-009-diagnosed.md) works an open register row (TD-009); [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) closes a gap found while planning this
iteration, before it was ever registered: ticket IDs `SS-039`, `SS-041` and `SS-042` are
named by commits on `main` and have no ticket file, while `docs-current` reported iteration
02 complete. The check's own description says *every ticket in the iteration has a file*;
it only ever read the files that exist.

## Files this plan invalidates

- `studio/shelf-data.js` — `PULSE.iteration` is tied by a test to the newest iteration
  directory, so creating `iterations/03/` stales it. Updated in [SHS-046](tickets/SHS-046-iteration-record.md)'s first commit.
- `studio/shelf-data.js` — `LEARNED.iteration` is tied to the newest iteration with a
  retro. Updated in the same commit that writes `retro.md`.

## Risks

| Risk | Response |
|---|---|
| The flaky production test fails the gate for a reason this iteration did not cause | [SHS-044](tickets/SHS-044-td-009-diagnosed.md) finds the cause, so a red `full-suites` can be read: the failure has one exact signature. A failure with that signature is re-run once and both results are recorded in the log; any other failure is red, full stop. Nothing is exempted or retried automatically |
| A diagnosis that touches production | Read-only. The reproduction drives production's page in a browser; it does not edit it. The fix is written up for the executive, not made |
| The new ticket-file rule rejects history the studio cannot change | [SHS-045](tickets/SHS-045-every-ticket-has-a-file.md) backfills the three missing ticket files from their commits, in their own iteration's directory, before the rule lands on `main` |
| A wider `docs-current` invites another round of attacks on the checker | The rule is existence and uniqueness, counted from file names and commit subjects — no Markdown is interpreted. Content validation reuses the existing reader unchanged |
| Two review rounds end in a rejection | Stop and ask, per the tie-break decision above |

## Out of scope

- **Any production file.** No path exception is used or opened. TD-009's fix is specified,
  not made.
- **Overtighten.** No change; see the first decision above. The readout that rounds across
  a band edge and the plates' framing stay on the board as candidates for a later
  iteration.
- **Renaming the `SS-` tickets.** They keep their names; rewriting history would break the
  references to them in the changelog, retros and learning log.
- **TD-001, TD-003, TD-005, TD-006, TD-007, TD-008.** Unchanged. Four are production-side or
  held by decision.
