# ADR-0007 — Trunk-based development, as a trial from iteration 04

- **Status:** Accepted — as a trial. Iteration 04's retrospective decides whether it stays.
- **Date:** 2026-09-21
- **Iteration:** 03

## Context

Iterations 00 to 03 cut one branch per ticket from `main`, merged each back with `--no-ff`,
and pushed once, at the end of the iteration, after the gate.

Those branches lived for minutes. Integration was already continuous in practice: every
ticket was merged into the local `main` as soon as it was done, and nothing was ever built
against a stale trunk. What was *not* continuous was delivery. Nothing reached the remote or
the live site until the iteration ended, and then everything reached it at once — iteration
03 pushed over forty commits in one go. The merge commits added a bubble per ticket to a
history a stranger has to read, and carried no information the commit subjects did not.

GitHub Pages deploys `main` on every push, and there is no CI workflow in this repository,
so every push is a deploy of the whole arcade, and the only checks are the ones the studio
runs before pushing.

The executive asked the team to try trunk-based development — to try one way, hold a retro,
and try another — rather than keep a practice because it is the one in place.

## Decision

From iteration 04, as a trial:

1. **Commit to `main`.** No ticket branches and no merge commits. A ticket is one or more
   small commits, each naming it, exactly as before.
2. **Every commit leaves `main` releasable.** The ticket stage of `npm run studio:check` is
   green before each commit.
3. **Push when a ticket is done**, not once per iteration: the `push` stage green — the
   gate's checks short of the review ones, the full repository suite included, so a
   gate-only check fails on the ticket responsible — then push, then the post-deploy
   checks. Small, frequent deploys, each verified.
4. **Unfinished work a player could see stays dark.** For the realm, the switch is the
   shelf: a page is not listed in `studio/shelf-data.js` until its ticket is done, so it is
   reachable only by someone who already has its address.
5. **Review is unchanged:** independent, per iteration, over everything since the previous
   tag, capped at two rounds. Findings are fixed forward on `main`. A push that breaks a
   page on the live site is reverted with a single new commit — never by rewriting history.
6. **The iteration tag marks the reviewed state**, as before.

Nothing in the checks has to change for this. `commit-lint` already exempts merges by their
parent count, so a history without them is simply a history without exemptions;
`docs-current` reads commit subjects, not branches; `path-guard` and `production-unchanged`
diff against the previous tag. Iteration 04 added a `push` stage to the checker (SHS-050) — the
gate without the two checks that only make sense once the iteration is reviewed, plus
`on-main` and `no-stop-file` — so step 3 is one command rather than three.

## What the trial is testing

The hypothesis: **integrating and deploying each ticket as soon as it is green removes
ceremony and finds deploy-level problems earlier, without making the live site worse.**

Iteration 04's retrospective answers it from what happened, not from preference:

- How many pushes, and how long from the iteration's first commit to its first deploy?
- Did any push break the live site, and was it caught by the post-deploy checks or by
  someone looking?
- Did a post-deploy check catch something on a ticket's push that the end-of-iteration
  push would have caught later? Iteration 02's `studio-live` defect is the kind of thing
  this is meant to find sooner.
- Did review find more or less than in 03, and of what kind?
- Is the history easier to read?

If the answer is worse on the live site, the trial ends and the retro says why.

## Consequences

- **Every ticket's push redeploys production.** That was already true of the one push per
  iteration; now it happens several times, so the full repository suite runs several times.
  TD-009 fails that suite a few times in a hundred for a reason the studio did not cause.
  Its fix is the first production fix the studio is permitted to make, and it should land
  first.
- **Review sees work that is already live.** A finding in shipped work is fixed forward, in
  public. For a studio realm with no players' saves at stake, the team judges that
  acceptable; the retro checks whether it was.
- **The history is linear**, and each ticket is its commits rather than a merge bubble.
  `git log --grep "SHS-NNN"` still finds a ticket's work.
- **Promotion keeps its own branch.** Moving a game into the production arcade is one
  reviewed change with its own approval, and is not part of this trial.

## Alternatives considered

| Option | Why not |
|---|---|
| Keep a branch per ticket | It is the practice in place, not a reason. The executive asked for the other way to be tried and judged |
| Trunk-based, but still one push per iteration | Keeps the part that was already continuous and drops the part that was not; the merge bubbles would go, and nothing would reach the live site any sooner |
| Push every commit | Some commits are halfway through a ticket; a ticket is the smallest unit whose acceptance criteria can be checked |
