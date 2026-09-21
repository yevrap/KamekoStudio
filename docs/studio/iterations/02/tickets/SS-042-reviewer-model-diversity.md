# SS-042 — The reviewer runs on a different model, and review rounds are capped at two

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** Scrum Master
- **Depends on:** none recorded
- **Branch:** `ss-042-reviewer-model-diversity`

*Reconstructed in iteration 03 by SHS-045 from commit `5416876`, which named this ticket
and had no ticket file. The motivation, criteria and result are read off that commit,
its merge and the files it changed; the size and role lead are this reconstruction's
assignment. Nothing is recalled. The work landed after the `studio-iteration-02` tag, as a process
change from that iteration's retrospective. Its subject line is 81 characters, one over
the lint's limit; see SHS-047.*

## Motivation

Iteration 02 ran both independent passes on the author's model, and they found the same two
primary defects independently. That was read as corroboration; it is equally consistent
with a shared blind spot. Separately, ten review rounds ran and the last four found
paperwork rather than anything a player would hit, because nothing said when to stop.

## Acceptance criteria

- [x] `team/independent-reviewer.md` says the reviewer runs on a different model from the
      author, and why: fresh context buys independence of memory, not of priors.
- [x] The same file records what ten rounds taught the role about itself, including its
      two failure modes.
- [x] `process.md` caps review at two rounds, and says what happens after the second.

## Evidence plan

Reading the two files.

## Out of scope

- Choosing the models themselves, which is configuration outside this repository.

---

## Result

- **What changed:** `docs/studio/team/independent-reviewer.md`, 32 lines changed;
  `docs/studio/process.md`, 12 lines added under *Roles*. Commit `5416876`.
- **Tested by:** the documents as committed: both files contain the rules above at
  `5416876`. No behaviour changed, so there was nothing to execute.
- **Deferred:** nothing.
- **Fix rounds used:** 0 / 2
