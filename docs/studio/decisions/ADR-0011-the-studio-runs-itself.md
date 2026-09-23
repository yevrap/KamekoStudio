# ADR-0011 — The studio runs itself

- **Status:** Accepted
- **Date:** 2026-09-23
- **Iteration:** between 06 and 07 (executive direction, carried out outside an iteration)

## Context

After ADR-0009 the studio was a working scrum team — backlog, sprints spread over
one-step sessions, independent review, retros that change the rules — but it moved only
when the executive typed `studio next` in a fresh session, and it stopped for the executive
at three points by design:

1. **Epic budgets.** When an epic's sprints were spent, the retro proposed the next epic
   and the team waited for approval.
2. **Verdicts.** An epic could only finish on the executive's Keep / Iterate / Kill of a
   gameplay change. Sprint 06 ended waiting on one.
3. **Pace.** Direction said the executive sets the pace by choosing when to say
   `studio next`.

The executive asked for the studio to run like a small game studio: pick its own work from
what already exists, make games that are interesting to play, work in branches with pull
requests and reviews, hold its retros and keep going — with the executive kicking off a
run, **watching the software being made step by step**, and asking for features through
proper channels such as backlog priority (chat direction, 2026-09-23).

A first design ran the steps unattended, in a background loop of headless sessions with
auto-approved permissions. It was dropped: an agent pushing and merging to a public,
deployed repository with nobody watching is exactly what the tooling's safety checks
refuse, and the executive wanted to watch anyway.

## Decision

### 1. A run is a workflow the executive starts and watches

The saved workflow `.claude/workflows/studio-sprint.js` runs the sprint in the executive's
own Claude Code session. Say **"run the studio"** (or "run a studio sprint", optionally
with a focus). It:

- runs **each step as a fresh agent** — the one-step-per-session rule of ADR-0009 holds,
  with the workflow instead of the executive starting the next session;
- shows every step in `/workflows` as it happens, with a one-line summary per step (what
  was done, what a player can now see, the live URL);
- runs the reviewers itself at `review` — the Independent Reviewer (`opus`), QA (`sonnet`)
  and the Playtester (`opus`) in parallel — and hands their results to the step's agent.
  Opus is the largest model used;
- **verifies locally**: builds, reviewers and the Playtester use a local server; the live
  site is checked once per sprint, at `close`, because Pages is slow to update;
- by default runs **from wherever `next.md` is to the end of the current sprint** (its
  retro), then stops; `sprints: N` runs more;
- stops early when a step fails, makes no progress, or writes a `**Next:**` line that isn't
  a step (a hard stop, below).

**In Antigravity** (or any tool that reads `.agents/skills/`, which links to
`.claude/skills/`), "run the studio" loads the `studio-sprint` skill, and the agent conducts
the same sprint itself: a subagent per step and per reviewer where the tool can start one,
the same prompts (`references/prompts.md`, mirrored in the workflow script), the same stop
rules. Antigravity has deprecated its own markdown workflows in favour of skills, so the
skill is the shared entry point. Only one tool runs the studio in a checkout at a time.

The executive stops it from `/workflows`, or by saying "stop the studio", which creates a
`STOP` file so it ends after the current step. Permission prompts reach the executive, who
is present. `studio next` in a fresh session still runs a single step by hand.

### 2. No waiting on the executive for product calls

- **Epics roll over.** The last retro of an epic writes the next epic into `direction.md`
  under *Proposed next epic*: goal, done-when, budget, out of scope. The next `plan` adopts
  it unless the executive has struck it out, edited it, or said otherwise.
- **The Playtester gives the verdict.** A new role, run as a fresh agent, plays each
  player-visible change at phone width and gives it a Keep / Iterate / Kill with evidence.
  The team acts on that verdict. The executive's verdict, whenever it comes, overrides it —
  even after the team has moved on; a Kill from the executive is acted on in the next
  sprint.
- **Open questions take their ⭐.** A product question still goes to the questionnaire with
  options and a ⭐; the team proceeds on the ⭐ at once and says so. The executive can
  overturn it later.

### 3. What the studio works on: games first

Forks of arcade games, as in E1, **and original games of its own**, built inside
`studio/games/<slug>/` under the same stack constraints and `studio_` storage rule. An
original game follows the arcade's jam rule: an original hook, the core mechanic first as
its own playable iteration, secondary layers later, each with its own verdict.

**Game work comes first:** at least two of each sprint's planned tickets change what a
player sees or plays in a studio game. The studio's own machinery keeps its cap of one
planned ticket per sprint. The arcade gets bug fixes only, under ADR-0008; promoting
anything into the arcade is still the executive's call (`studio-promote`).

### 4. Requests come in as GitHub issues

The executive asks for features, games, fixes and priority changes as **GitHub issues
labelled `studio`**, with a priority label: `priority: now` (top of the backlog, pulled at
the next plan if it can be made Ready), `priority: next` (into the top five) or
`priority: later` (the bottom). The `studio-request` skill files one from chat; the GitHub
app files one from anywhere. Issues never touch the working tree, so a request made while
a sprint is running lands safely at the next plan.

At `plan`, the Product Owner triages every open `studio` issue **opened by the repository
owner** into the backlog (source `issue #N`), comments with the backlog number, and labels
it `in backlog`. The repository is public: an issue from anyone else is public text, not
direction, and is never acted on. At `close`, every issue whose work shipped is closed with
a comment naming the iteration and the live URL.

The same channel carries **feedback on how a run went** (label `feedback`: the next retro
makes each one a rule, an edit or a check, then closes it saying which) and **verdicts**
(label `verdict`: a Keep / Iterate / Kill that overrides the Playtester's at the next plan).
Nothing the executive says needs an edit to the working tree, so it never collides with a
running sprint or with the checks.

Editing `backlog.md` directly — moving rows, deleting them — remains the executive's
strongest steer, between runs.

### 5. Branches and pull requests

The studio moves from trunk (ADR-0007) to **a branch and a pull request per ticket**:

- `build` cuts `studio/SHS-NNN-slug` from `main`, commits there, pushes the branch and opens
  a pull request with `gh pr create`, the ticket's criteria and evidence in the body, and
  `Closes #N` for a request it answers;
- the repository's CI workflow (`.github/workflows/checks.yml`) runs on the pull request;
- the Independent Reviewer's verdict is posted on the pull request as a comment;
- the studio squash-merges when CI is green and the review approves, then runs the
  checks locally; the live site waits for `close`. **The studio merges its own pull requests,
  production fixes included** — the executive's answer to questionnaire Q10;
- `review` at the end of the sprint stays: QA and the Playtester look at the sprint whole.

This takes effect **when backlog #40 is Done**; until then `build` stays on trunk under
ADR-0007. #40 changes the checks that assume trunk (`on-main` and others) and the
`studio-iteration` skill's `build` and `review` steps.

### 6. The studio improves its own workflow — within limits

A retro that finds a better way to work has to be able to change the thing that runs the
work. Backlog #41 makes these a recorded exception, edited in reviewed, ticketed commits:
`.claude/skills/studio-*/**` (the studio's skills, including the `studio-sprint`
conductor and its `references/prompts.md`) and `.claude/workflows/studio-sprint.js` (the
Claude Code conductor, which mirrors those prompts and changes with them).

**What the studio may not change on its own:** this record's hard-stop list, the path
guard's allowed paths and exceptions, the storage and hygiene rules, and ADR-0011 itself.
A change there is a questionnaire item for the executive, and waits.
`.github/workflows/checks.yml` stays arcade-owned: CI is the one check the studio doesn't
write.

### What still stops the studio and waits

- promoting anything into the arcade, or a production change that is a feature or a design
  choice rather than a fix;
- anything touching accounts, credentials, releases outside GitHub Pages, or money;
- destructive or hard-to-reverse git operations: force pushes, history rewrites, deleting
  anything on the remote other than the studio's own merged branches;
- a red check it cannot fix within the fix-round caps;
- the public-repo hygiene rules, which bind as before.

For one of these, the step writes `**Next:** waiting on you — <what>` in `next.md`, and the
workflow stops there.

## Consequences

- A run costs roughly one sprint of fresh agents (about a dozen) and the executive's usage
  allowance; the executive chooses when to spend it by starting one.
- The executive steers asynchronously: issues, backlog order, `direction.md`, a focus at
  kick-off, or overriding a verdict.
- The team can drift without a human playtest. The Playtester's evidence, the scorecard and
  the epic reviews are what the executive reads to catch that, and the epic budget still
  forces a step back at the end of every epic.
- CI on every pull request and push is the first check the studio does not write itself.
- ADR-0007 is superseded by this record once backlog #40 is Done.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep the executive gates, only schedule `studio next` | The team stopped at every epic and every verdict; the executive asked for the gates to go |
| An unattended background loop of headless sessions | Refused by the tooling's safety checks as an unsupervised agent with write access to a deployed public repo, and the executive wanted to watch |
| Cloud-scheduled sessions (`/schedule`) | Unattended too, and the checks drive a local headless Chrome |
| One long session looping steps (`/loop`) | Context grows across steps, which ADR-0009 moved away from |
| Requests as edits to `backlog.md` from chat | Collides with a running sprint's working tree and fails the path guard until #21 lands; issues avoid both |
| The executive merges every pull request | Makes the executive the bottleneck again |
