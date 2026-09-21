# Iteration 04 — the first production fix, under a written permission, with deploy checks every push can trust

**Goal:** fix the first production defect the studio has diagnosed, under a permission that
is written down and enforced by the path guard, with every push verified by checks that
cannot pass on a stale build or a vacuous baseline.

## Committed tickets

| ID | Title | Size | Role lead |
|---|---|---|---|
| SHS-050 | Every push is checked by one stage before it and one after, and the after-stage cannot pass on a stale build or a vacuous baseline | M | QA Engineer |
| SHS-051 | The studio may fix production under the full process, and the path guard admits a production file only for the ticket that names it, in its own iteration | M | Tech Lead / Architect |
| SHS-052 | Black Hole in One no longer throws when Explore starts with spiral particles alive (TD-009) | S | Front-end / Gameplay Dev |

| ID | Title | Size | Role lead |
|---|---|---|---|
| SHS-053 | This iteration's record | S | Technical Writer / Learning Lead |

Three committed tickets against the standing cap of 2–3. SHS-053 is the iteration's own
paperwork, carried as a ticket so the commits that write it have an ID to name — the same
arrangement as SHS-046 in iteration 03.

**Order.** SHS-053 lands its first commit first: creating this directory stales the realm's
pulse line. SHS-050 next, because this iteration pushes every finished ticket and every
push runs its post-deploy stage — with TD-010 open, each of those would report a correct
deploy as a failure until someone waited and ran it again. SHS-051 before SHS-052, because
SHS-052 edits production files and the guard must admit them by the rule SHS-051 writes,
not by a one-off exception. SHS-052 last.

ADR-0007 suggested landing TD-009's fix first, because TD-009 makes the full suite fail
some of the time for a reason the studio did not cause. It goes last here for the reason
above, and the risk it names is handled by the rule below.

## How this iteration works

- **Trunk-based, as a trial** ([ADR-0007](../../decisions/ADR-0007-trunk-based-development.md)).
  Small commits to `main`, each green; a ticket is pushed and deploy-checked when it is
  done.
- **Work in flight is visible.** The executive asked that progress be saved and on the
  remote while it happens, ceremony records included, not in one push at the end. So the
  plan, each stand-up entry, the review and the retrospective are pushed as soon as they
  are committed, like a finished ticket. SHS-053 writes that into `process.md`.
- **Review:** QA and the Independent Reviewer, each with fresh context, on different
  models from each other; at most two rounds.

## Decisions this iteration builds on

| Question | Answer | What depends on it |
|---|---|---|
| May the studio change production files? | **Yes, as fixes, under the full sprint process** — plan, ticket, two-round review, gate, retrospective. A standing permission from the executive, to be written into the handbook by a decision record before it is first used | SHS-051 writes it down and makes the guard enforce it; SHS-052 is the first use |
| The 3D landing page's zone for the studio | **The studio's window** — it points at the work the studio is doing, its workflow and results, not at production fixes. Its shape is still to be designed | Not this iteration; see *Out of scope* |
| The quality bar | Professional practice on every surface the work lands on, with a hygiene check of each in every retrospective | The retrospective |
| Branch per ticket or trunk | **Trunk, as a trial.** This iteration's retrospective judges it | Every ticket |
| A rejected second review round | The team decides, writes down why, and the next retrospective judges the call | The review |
| Iteration size | 2–3 planned tickets; the cap is on planned work only | Three, plus the record |
| The realm's name | Kept | Nothing changes |

## Reserved capacity

All three committed tickets are debt or process work: SHS-050 closes TD-010 and TD-011,
SHS-052 closes TD-009, and SHS-051 writes down the rule the next production fix depends
on. Well over a fifth. The retrospective checks whether documentation and learning got
their share too, not only debt.

## Files this plan invalidates

- `studio/shelf-data.js` — `PULSE.iteration` is tied by a test to the newest iteration
  directory, so creating `iterations/04/` stales it. Updated in this commit. Under
  trunk-based work the line is live while the iteration runs, so it says the iteration is
  in progress, and it is rewritten when the iteration ships.
- `studio/shelf-data.js` — `LEARNED.iteration` is tied to the newest iteration with a
  retrospective. Updated in the same commit that writes `retro.md`.

## Risks

| Risk | Response |
|---|---|
| TD-009 fails the full suite before SHS-052 lands | Iteration 03's rule stands: a failure with TD-009's exact signature — `Cannot read properties of null (reading 'x')`, uncaught, in a Black Hole in One test that enters Explore — is run again once and both results go in `log.md`. Any other failure is red, full stop. Nothing is exempted or retried automatically. It happened at this iteration's preflight |
| The first production edit breaks a game players use | The regression tests are shown failing without the fix and passing with it; the whole repository suite runs before the push; the post-deploy stage proves the fixed file is what is being served. A push that breaks the live site is undone with one `git revert` commit |
| The permission rule becomes the next thing a review defeats ten times | It decides from facts git records — which commits touched the path and which ticket each names — and from file names. It reads no Markdown |
| A post-deploy check that waits is a check that can hang | A fixed number of attempts with a fixed wait, and the report says how many it used |
| Review sees work that is already live | Findings are fixed forward. For a realm with no player saves at stake, and one production fix with tests on both sides of it, the team judges that acceptable; the retrospective checks |

## Out of scope

- **The repository's root `README.md`.** It is one line, and the hygiene audit is right
  about it. It is production documentation, so it goes through SHS-051's rule — first in
  the next iteration's queue.
- **The design of the studio's window on the 3D landing page.** Next iteration.
- **TD-001, TD-003, TD-005, TD-006, TD-007, TD-008.** Unchanged. TD-005 and TD-006 become
  eligible as production fixes once SHS-051 lands; neither is taken here.
- **Overtighten.** No change. The readout that rounds across a band edge and the plates'
  framing stay on the board.
- **A decision record for iteration 02's `docs-current` rewrite, and a claim-evidence
  rule.** Still on the board.
- **The production roadmap.** A studio production fix is recorded on its ticket and in
  this handbook; `docs/roadmap.md` belongs to the arcade's own planning and is not edited.
