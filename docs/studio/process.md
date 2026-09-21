# Process

One run is one iteration. An iteration is a small, bounded batch of tickets that ends with
everything on `main`, reviewed, documented and tagged — or with a clean stop and a report of
what blocked it.

## The iteration protocol

| # | Step | Produces |
|---|---|---|
| 0 | **Preflight** | Inputs logged; clean tree; up-to-date `main`; no `STOP`; baseline suites green |
| 1 | **Refine and plan** | `iterations/NN/plan.md`, `iterations/NN/tickets/*.md` |
| 2 | **Build** | Small commits to `main`, each green; each ticket pushed and deploy-checked when it is done |
| 3 | **Fix, bounded** | At most 2 fix rounds per ticket, then the ticket is marked Blocked |
| 4 | **Independent review** | QA and Independent Reviewer findings → fixes or new tickets |
| 5 | **Document** | Tickets closed, `CHANGELOG.md`, `learning-log.md`, studio log entries |
| 6 | **Gate** | `npm run studio:check --stage=gate` green, or the iteration is not tagged. Each ticket's own push needs its ticket stage and the full suite green first |
| 7 | **Publish** | The last push, tag `studio-iteration-NN`, post-deploy checks |
| 8 | **Review and retro** | `iterations/NN/review.md`, `iterations/NN/retro.md` |
| 9 | **Stop** | Handoff written; the run ends |

Step 9 is a rule, not a suggestion. A run does not start a second iteration because there
is capacity left.

## Ceremonies

| Ceremony | When | Artifact |
|---|---|---|
| Backlog refinement | Start | Tickets sized S/M/L with acceptance criteria; debt items pulled in |
| Iteration planning | Start | Goal, committed tickets, capacity, risks (`plan.md`) |
| Async stand-up | Between tickets | Three lines in `iterations/NN/log.md`: done / next / blocked, per role that acted |
| Build and test loop | Middle | Branch per ticket, commits, test results recorded on the ticket |
| Review / demo | End | Demo list, URLs, and a Keep / Iterate / Kill line per item (`review.md`) |
| Retrospective | End | Went well / didn't / change next time; every change becomes a ticket or a doc edit (`retro.md`) |

## Reserved capacity

Roughly 20% of each iteration goes to tech debt, refactoring, documentation and learning.
The retro checks that it actually happened. This work is planned as tickets like any other
and is not the first thing cut when an iteration runs long — if it is cut, the retro says
so and the next plan carries it forward.

## Stop rules

A run stops early, writes the handoff and reports, on any of:

- a red gate;
- two failed fix rounds on the same ticket;
- a blocker that needs a decision from outside the team;
- a change that would fall outside the path guard;
- context exhaustion;
- a `STOP` file appearing in the working directory the run was started from.

## Trunk, commits, tags

The studio works trunk-based, as a trial from iteration 04 — see
[ADR-0007](decisions/ADR-0007-trunk-based-development.md), which also says what the trial
is testing and how its retrospective judges it.

- Commit to `main`. No ticket branches, no merge commits. A ticket is one or more small
  commits, each naming it.
- Every commit leaves `main` releasable: `npm run studio:check -- --stage=ticket` green
  before committing, and `--stage=gate --skip-slow` on any commit that changes code.
- When a ticket is done: the ticket stage and the full repository suite green, then push,
  then `--stage=postdeploy`. Pages deploys every push, so every push is a release.
- A page a player could reach but that is not ready stays off the shelf until its ticket
  is done.
- Review findings are fixed forward. A push that breaks the live site is undone with one
  `git revert` commit, never by rewriting history.
- Conventional commits scoped `studio`, with the ticket ID:
  `feat(studio): SHS-043 retire the SS- prefix`.
- One annotated tag per iteration, `studio-iteration-NN`, on the reviewed state.
- The whole studio history filters with `git log --grep "(studio)"` or `git log -- studio/`.
- Ticket numbers are one sequence. `SS-001` to `SS-042` keep the prefix they were issued
  under; every ticket from 043 on is `SHS-NNN`. `commit-lint` enforces the split in both
  directions. See [ADR-0006](decisions/ADR-0006-ticket-prefix.md).

## Naming

Names are read by strangers even when they are internal: they end up in commit messages,
URLs and a public repository. Before the studio adopts an abbreviation, a codename or a
label — a ticket prefix, a branch, a feature name, a class name someone will read:

1. **Read it as a stranger would.** Look for the meanings it was not chosen for,
   especially loaded or offensive ones.
2. **Prefer clarity to brevity.** A plain word beats a clever two-letter tag.
3. **If unsure, search it.** It takes seconds.
4. **When in doubt, spell it out.**

The rule exists because the studio's first ticket prefix broke it.

## Roles

Roles are lenses, not separate processes. One agent can hold several of them in a single
run, and each role's obligations are its section of the Definition of Done. Two roles are
deliberately run with fresh context, because independence is the whole point of them:

- **QA Engineer** — writes and runs the test plan against the diff.
- **Independent Reviewer** — critiques the iteration's diff without having written it.

**Both run on a named model, and the reviewer's is deliberately not the author's.** Fresh
context buys independence of *memory*; it does not buy independence of *priors*. Iteration
02 ran both passes on the author's model and they found the same two primary defects
independently — read at the time as corroboration, equally consistent with a shared blind
spot. See `team/independent-reviewer.md` for the pairing and the reasoning.

**Review rounds are capped at two.** Iteration 02 ran ten; the last four found paperwork
defects and drift in the record rather than anything a player would hit. An adversarial
search over an unbounded surface does not terminate on its own, so the stopping rule lives
here. After the second pass: close the findings, write down what a third pass would most
likely have found, and stop.

Role definitions live in [`team/`](team/).
