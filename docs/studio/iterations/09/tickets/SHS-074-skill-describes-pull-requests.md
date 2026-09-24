# SHS-074 — The skill's build and review steps describe the branch and pull-request flow

- **Status:** Ready
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

- [ ] The `studio-iteration` skill's `build` step names the commands in order: branch
      `studio/SHS-NNN-slug` from an up-to-date `main`; commits with `--stage=ticket` green;
      `--stage=push`; `git push -u origin` the branch; `gh pr create` with the ticket's
      criteria and evidence in the body (and `Closes #N` for a request it answers); CI
      watched to green (`gh pr checks --watch`); `gh pr merge --squash --delete-branch`;
      back on `main`, `git pull --rebase`. The "until #40 is Done, trunk" note is gone.
- [ ] The skill's `review` step posts the Independent Reviewer's verdict on each of the
      sprint's pull requests (`gh pr comment`), and says a production fix's pull request
      merges only once `iterations/NN/reviews/<TICKET>.md` names its head commit and the
      `push` stage is green (ADR-0008).
- [ ] Ceremony records (plan, stand-ups, review, close, retro) are still committed on
      `main` and pushed as they land; the skill and `process.md` say so.
- [ ] The `studio-sprint` workflow's prompts (`.claude/workflows/studio-sprint.js`) and the
      `studio-sprint` skill's `references/prompts.md` describe the same flow, and still
      match each other.
- [ ] ADR-0007's status line says it is superseded by ADR-0011, with the link; ADR-0011 §5
      records when a pull request merges (Q17).
- [ ] `process.md`'s *Trunk, commits, tags* and the ticket template's **Branch** line
      describe the new flow.
- [ ] The flow starts at plan 10: this sprint's own review, close and retro run on trunk,
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

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
