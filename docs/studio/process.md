# Process

An iteration is a sprint: a small, bounded batch of tickets that ends with everything on
`main`, reviewed, documented and tagged — or with a clean stop and a report of what blocked
it. It is run **one step per session** ([ADR-0009](decisions/ADR-0009-one-step-per-session.md)):
each session does the step `steering/next.md` names, rewrites that file, and stops.

## The iteration protocol

| # | Step | Produces |
|---|---|---|
| 0 | **Preflight** | Inputs logged; clean tree; up-to-date `main`; no `STOP`; baseline suites green |
| 1 | **Refine and plan** | `iterations/NN/plan.md`, `iterations/NN/tickets/*.md` |
| 2 | **Build** | Small commits to `main`, each green; each ticket pushed and deploy-checked when it is done |
| 3 | **Fix, bounded** | At most 2 fix rounds per ticket, then the ticket is marked Blocked |
| 4 | **Independent review** | QA and Independent Reviewer findings → fixes or new tickets |
| 5 | **Document** | Tickets closed, `CHANGELOG.md`, `learning-log.md`, studio log entries |
| 6 | **Gate** | `npm run studio:check -- --stage=gate` green, or the iteration is not tagged. Each push before it needs `--stage=push` green first |
| 7 | **Publish** | The last push, tag `studio-iteration-NN`, post-deploy checks |
| 8 | **Review and retro** | `iterations/NN/review.md`, `iterations/NN/retro.md` |
| 9 | **Stop** | Handoff written; the run ends |

## Sessions

The protocol above is spread over short sessions, one step each. The prompt is always
`studio next`; a SessionStart hook loads `steering/next.md` into every new session.

| Session step | Covers protocol steps | Ends with `next.md` at |
|---|---|---|
| `plan` | 0–1: preflight, inputs logged, backlog refined, sprint goal, 2–3 tickets pulled | the first `build` |
| `build <ticket>` | 2–3 for **one** ticket: implement, test, commit, push, deploy-check | the next ticket, or `review` |
| `review` | 4: one round of QA and the Independent Reviewer | `close`, or `review round 2` |
| `close` | 5–7: document, gate, publish, tag; `review.md` with *In plain words* | `retro` |
| `retro` | 8–9: retro, learning log, backlog, budget, steering views | the next `plan` (only a hard stop waits on the executive — ADR-0011) |

A session does its one step and stops, even with capacity left. A session that runs long
stops at a green commit and leaves `next.md` saying exactly what remains.

**Runs** ([ADR-0011](decisions/ADR-0011-the-studio-runs-itself.md)). "Run the studio"
starts the `studio-sprint` workflow (`.claude/workflows/studio-sprint.js`), which runs each
step as a fresh agent, back to back, to the end of the current sprint, while the executive
watches in `/workflows`. The steps don't ask questions: a product question goes to the
questionnaire with its ⭐ and the team proceeds on the ⭐. A step that hits a hard stop
writes *waiting on you* as the `**Next:**` line, and the run stops there.

**Requests** arrive as GitHub issues labelled `studio` with a `priority:` label, opened by
the executive. `plan` triages them into the backlog; `close` closes the ones that shipped.

## Backlog and budget

- **The product backlog** is `steering/backlog.md`, ordered. The top is next. The executive
  re-orders it, writes in the inbox, or says `studio next — focus: <X>`. With no direction,
  `plan` pulls from the top. The Product Owner keeps the top five Ready.
- **The epic and its budget** are in `steering/direction.md`: a number of sprints plus one
  reserve, which the team may claim with a written reason in a retro. When the budget is
  spent, the last retro writes the epic review and proposes the next epic in
  `direction.md`, and the next `plan` adopts it unless the executive has struck or changed
  it (ADR-0011).
- **Tickets are S or M**, one in progress at a time. A ticket that outgrows its session is
  split, and the remainder goes back to the backlog. At most one planned ticket per sprint
  goes to the studio's own machinery (checks, handbook, steering views). Tests, docs and
  tech debt for the games are ordinary work.

## Ceremonies

| Ceremony | When | Artifact |
|---|---|---|
| Backlog refinement | Start | Tickets sized S/M/L with acceptance criteria; debt items pulled in |
| Iteration planning | Start | Goal, committed tickets, capacity, risks (`plan.md`) |
| Async stand-up | Between tickets | Three lines in `iterations/NN/log.md`: done / next / blocked, per role that acted |
| Build and test loop | Middle | Small commits to `main`, each ticket pushed when done, test results recorded on the ticket |
| Review / demo | End | Demo list, URLs, and the Playtester's Keep / Iterate / Kill per item, which the executive may override (`review.md`) |
| Retrospective | End | Went well / didn't / change next time; every change becomes a ticket or a doc edit (`retro.md`) |

## Reserved capacity

Roughly 20% of each iteration goes to tech debt, refactoring, documentation and learning.
The retro checks that it actually happened. This work is planned as tickets like any other
and is not the first thing cut when an iteration runs long — if it is cut, the retro says
so and the next plan carries it forward.

## Stop rules

A session stops early, leaves `steering/next.md` saying exactly what remains, and reports, on
any of:

- a red gate;
- two failed fix rounds on the same ticket;
- a hard stop that needs the executive (ADR-0011: promotion, accounts or money, destructive
  git) — a product question is not one: it takes its ⭐;
- a change that would fall outside the path guard;
- context exhaustion;
- a `STOP` file appearing in the working directory the run was started from.

## Trunk, commits, tags

The studio works trunk-based, as a trial from iteration 04 — see
[ADR-0007](decisions/ADR-0007-trunk-based-development.md), which also says what the trial
is testing and how its retrospective judges it.

- Commit to `main`. No ticket branches, no merge commits. A ticket is one or more small
  commits, each naming it.
- **Rebase, don't merge.** The arcade ships on the same `main`, so when the remote has moved,
  `git pull --rebase`. A merge that brings in studio and arcade commits together fails the
  path guard, and only a hash exemption gets it through (iteration 05 review).
- Every commit leaves `main` releasable: `npm run studio:check -- --stage=ticket` green
  before committing.
- When a ticket is done: `--stage=push` green — the gate's checks short of the review ones,
  the full repository suite included — then push, then `--stage=postdeploy` with a
  `--marker` only the new build has. Pages deploys every push, so every push is a release.
- **A production fix waits for review.** Its commits stay local until an independent review
  has passed them and `iterations/NN/reviews/<TICKET>.md` names the commit it saw; the
  `push` stage refuses the push otherwise, and again whenever the fix changes after its
  review ([ADR-0008](decisions/ADR-0008-production-fixes.md)).
- Ceremony records — the plan, each stand-up entry, the review, the retrospective — are
  pushed as soon as they are committed, through the same `push` stage, so work in flight is
  visible on the remote while it happens rather than all at once at the end.
- A page a player could reach but that is not ready stays off the shelf until its ticket
  is done.
- Review findings are fixed forward. A push that breaks the live site is undone with one
  revert commit, never by rewriting history: `git revert --no-commit <sha>`, then a
  conventional subject naming a ticket — `fix(studio): SHS-NNN revert <short sha>` —
  because `commit-lint` reads every subject, and git's own `Revert "…"` fails it.
- Conventional commits scoped `studio`, with the ticket ID:
  `feat(studio): SHS-043 retire the SS- prefix`. The scope is what makes a commit the
  studio's: the arcade commits to the same `main`, and the checks lint and guard only
  commits scoped `(studio)`, while refusing any other commit that touches a studio path.
  How each kind is judged, and what that does not prove, is in
  [guardrails.md](guardrails.md#studio-commits-and-arcade-commits).
- One annotated tag per iteration, `studio-iteration-NN`, on the reviewed state.
- The whole studio history filters with `git log --grep "(studio)"` or `git log -- studio/`.
- Ticket numbers are one sequence. `SS-001` to `SS-042` keep the prefix they were issued
  under; every ticket from 043 on is `SHS-NNN`. `commit-lint` enforces the split in both
  directions. See [ADR-0006](decisions/ADR-0006-ticket-prefix.md).
- **A ticket number in prose is a link to its ticket file**, relative to the document it
  sits in: `[SHS-052](iterations/04/tickets/SHS-052-td-009-fixed.md)` from here.
  `node tests/studio/link-tickets.mjs` links every bare mention in the repository's
  Markdown, and leaves plain what a check or a reader takes as text: code, commit subjects,
  file names, a file's title line, numbers with no ticket file, and a ticket's mentions of
  itself. The retro runs it before regenerating the steering views; a document it changes
  outside the studio paths goes in its own arcade `docs:` commit.

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

**One review round by default** ([ADR-0009](decisions/ADR-0009-one-step-per-session.md)).
A second round runs only when the first rejects on something a player would hit, a
production file, or a save. There is never a third: write down what it would most likely
have found, and stop. Iteration 02 ran ten rounds; the last four found paperwork defects
and drift in the record rather than anything a player would hit. An adversarial search over
an unbounded surface does not terminate on its own, so the stopping rule lives here.

Role definitions live in [`team/`](team/).
