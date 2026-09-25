# SHS-074 — The skill's build and review steps describe the branch and pull-request flow

- **Status:** Done
- **Size:** S
- **Iteration:** 09
- **Role lead:** Scrum Master (Tech Lead reviews the commands)
- **Depends on:** [SHS-070](../../08/tickets/SHS-070-checks-accept-studio-branches.md) (the checks accept a ticket branch and a squash merge)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

[ADR-0011](../../../decisions/ADR-0011-the-studio-runs-itself.md) §5 moves the studio from trunk to a branch and a pull request per
ticket. Sprint 08 made the checks ready ([SHS-070](../../08/tickets/SHS-070-checks-accept-studio-branches.md), #40's first part); this is part 2 of 3,
backlog #49: the skill and the workflow say how a ticket travels, and ADR-0007 is marked
superseded. Part 3 (#50) ships a real ticket through the flow in sprint 10.

**One gap in §5, settled at plan as [Q17](../../../steering/questionnaire.md)'s ⭐ A:** it says a pull request merges when
"the review approves", while the sprint's review runs once, after every build. The ⭐ keeps
one review per sprint: a ticket's pull request squash-merges at the end of its build, when
CI and the local `push` stage are green (which is when trunk pushes today, also before
review); the sprint's review then posts the Independent Reviewer's verdict on each of the
sprint's pull requests and fixes forward. A production fix's pull request is the
exception and stays open until its review record exists (ADR-0008).

## Acceptance criteria

- [x] The `studio-iteration` skill's `build` step names the commands in order: branch
      `studio/SHS-NNN-slug` from an up-to-date `main`; commits with `--stage=ticket` green;
      `--stage=push`; `git push -u origin` the branch; `gh pr create` with the ticket's
      criteria and evidence in the body (and `Closes #N` for a request it answers); CI
      watched to green (`gh pr checks --watch`); `gh pr merge --squash --delete-branch`;
      back on `main`, `git pull --rebase`. The "until #40 is Done, trunk" note is gone.
- [x] The skill's `review` step posts the Independent Reviewer's verdict on each of the
      sprint's pull requests (`gh pr comment`), and says a production fix's pull request
      merges only once `iterations/NN/reviews/<TICKET>.md` names its head commit and the
      `push` stage is green (ADR-0008). *Found at build:* that pull request needs backlog
      #56 first, so until then the skill keeps a production fix on trunk and says why
      (Result, below).
- [x] Ceremony records (plan, stand-ups, review, close, retro) are still committed on
      `main` and pushed as they land; the skill and `process.md` say so.
- [x] The `studio-sprint` workflow's prompts (`.claude/workflows/studio-sprint.js`) and the
      `studio-sprint` skill's `references/prompts.md` describe the same flow, and still
      match each other.
- [x] ADR-0007's status line says it is superseded by ADR-0011, with the link.
      ~~ADR-0011 §5 records when a pull request merges (Q17).~~ *Changed at build:*
      ADR-0011 is the executive's (its §6; `EXECUTIVE_ONLY_PATHS` refuses a studio edit),
      so the merge point is recorded in `process.md` and the skill, and
      [Q17](../../../steering/questionnaire.md) carries a note leaving §5 to the executive.
- [x] `process.md`'s *Trunk, commits, tags* and the ticket template's **Branch** line
      describe the new flow.
- [x] The flow starts at plan 10: this sprint's own review, close and retro run on trunk,
      and #50 rides on sprint 10's first games ticket. `--stage=push` is green on the
      ticketed commit (the skills exception in `guardrails.md`).

## Evidence plan

Read the diff: the commands in order in both steps, the two prompt files agreeing, the ADR
status line. `--stage=push` green. No check changes, so no red-first case.

## Out of scope

A real ticket through a pull request (#50, sprint 10); any change to the checks (done in
[SHS-070](../../08/tickets/SHS-070-checks-accept-studio-branches.md)); the steering-edit commit form (#21).

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:** `337b280`. The `studio-iteration` skill's `build` step is now *one
  ticket, one pull request*, with the eight commands in the criteria's order, plus: the
  pull request's title is a commit subject because the squash-merge takes it; `main`
  moving before the branch is pushed is a local `git pull --rebase origin main`, after it
  `gh pr update-branch`, never a force push; the Result links the pull request, its CI run
  and the squash-merged commit, and goes on `main` with the stand-up line. `review` posts
  the Independent Reviewer's verdict on each pull request (`gh pr comment`, the verdict,
  that ticket's findings and what became of each), and a fix made at review travels like a
  build. `close` comments on an issue a pull request's `Closes #N` already closed. *Ending
  every session* says records go on `main`, never on a ticket's branch. The workflow's step
  prompt and `references/prompts.md` both add the same sentence on the flow; the review
  step is told to post on each pull request; the reviewers name the ticket per finding (a
  `ticket` field in the workflow's findings schema). `process.md`: the protocol, session
  and ceremony rows, and *Trunk, commits, tags* rewritten as *Branches, commits, tags*
  (the template's and the learning log's references follow). ADR-0007 superseded, its
  row in `decisions/README.md` too; `self-checks.md`'s `push` row says a ticket branch.
  **Found at build, not in the plan:** a production fix can't take a pull request yet.
  `production-fix-reviewed` requires the reviewed commit to be an ancestor of `HEAD`
  (`checks/production-review.mjs`), and a squash-merge replaces the branch's commits, so
  the gate on `main` would fail every squash-merged fix; a merge commit instead mixes
  production and studio paths, which the path guard refuses. So a fix stays on trunk,
  exactly as ADR-0008 has it, until backlog #56 lets the check compare content with the
  reviewed commit (Active rule 1). ADR-0011 §5 left to the executive, as above.
- **Tested by:** read in the diff: the build commands in order (the skill's `build`, lines 129–171), the
  review's `gh pr comment` and production-fix lines, the records line under *Ending every
  session*; the workflow prompt and `references/prompts.md` carry the same sentence on the
  flow and the same review instruction. The workflow parses (wrapped in an async function
  for `node --check`, since a workflow script returns at top level; the previous version
  checked the same way). The repository's squash settings read with `gh api`
  (`COMMIT_OR_PR_TITLE`: a single commit's subject or the pull request's title, both
  written as `type(studio): SHS-NNN …`), and `gh pr update-branch` exists in the installed
  `gh` 2.90. `--stage=ticket` 5/5 and `--stage=push` 11/11 on `337b280` (path guard: the
  three workflow files as the skills exception, ticketed). No check changed, so no
  red-first case.
- **Deferred:** a production fix's pull request, backlog #56 (process, S, Ready). A real
  ticket through the flow stays #50, sprint 10.
- **Fix rounds used:** 0 / 2
