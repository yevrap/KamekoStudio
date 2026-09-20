# Process

One run is one iteration. An iteration is a small, bounded batch of tickets that ends with
everything merged, tagged, documented and reviewed — or with a clean stop and a report of
what blocked it.

## The iteration protocol

| # | Step | Produces |
|---|---|---|
| 0 | **Preflight** | Inputs logged; clean tree; up-to-date `main`; no `STOP`; baseline suites green |
| 1 | **Refine and plan** | `iterations/NN/plan.md`, `iterations/NN/tickets/*.md` |
| 2 | **Build** | One branch per ticket; commits; tests |
| 3 | **Fix, bounded** | At most 2 fix rounds per ticket, then the ticket is marked Blocked |
| 4 | **Independent review** | QA and Independent Reviewer findings → fixes or new tickets |
| 5 | **Document** | Tickets closed, `CHANGELOG.md`, `learning-log.md`, studio log entries |
| 6 | **Gate** | `npm run studio:check --stage=gate` green, or nothing is pushed |
| 7 | **Publish** | `--no-ff` merges to `main`, tag `studio-iteration-NN`, post-deploy checks |
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

## Branches, commits, tags

- One branch per ticket, named `ss-NNN-short-slug`, cut from `main`.
- Conventional commits scoped `studio`, with the ticket ID:
  `feat(studio): SS-003 add the path-guard check`.
- Merges to `main` use `--no-ff`, so each ticket is one visible merge bubble.
- One annotated tag per iteration: `studio-iteration-NN`.
- The whole studio history filters with `git log --grep "(studio)"` or `git log -- studio/`.

## Roles

Roles are lenses, not separate processes. One agent can hold several of them in a single
run, and each role's obligations are its section of the Definition of Done. Two roles are
deliberately run with fresh context, because independence is the whole point of them:

- **QA Engineer** — writes and runs the test plan against the diff.
- **Independent Reviewer** — critiques the iteration's diff without having written it.

Role definitions live in [`team/`](team/).
