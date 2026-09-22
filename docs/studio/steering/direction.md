# Shadow Studio — Direction

The executive's standing direction: what the studio is working toward, how many sprints
it has to get there, and the rules it works under while it does. **Every session reads this
right after `next.md`**, and plans against it. It changes rarely. It changes when the
executive edits it, or when chat direction is recorded here (and logged in the
[Input Ledger](input-ledger.md) like any other input).

Day-to-day notes go in the [Feedback Inbox](inbox.md), not here.

## Product goal

**The 3D landing page becomes the Studio Wing.** The arcade (the gallery at `index.html`
and the games under `games/`) stays as it is: it is the finished, stable collection. The
3D page becomes the studio's window. Its portals lead to **studio forks** of arcade games,
copies the team is actively evolving. A player walking the 3D page is walking through
what the studio is working on right now, and can play it.

A fork that turns out better than its original can go back to the arcade only through
`studio-promote`, with the executive's approval.

## Current epic — E1: The Studio Wing opens

**Goal:** the first forked game is live behind its 3D portal, and has had at least one
real gameplay experiment the executive can play and judge.

**Budget:** 3 sprints (05, 06, 07) + 1 reserve. See [the budget](#the-budget). What each
sprint pulls comes from the ordered [Backlog](backlog.md).

**Done when:**
- a 3D portal leads to a studio fork, and every portal without a fork still leads to its
  production game;
- the fork never reads or writes a production save;
- the fork has shipped at least one gameplay change the executive has given a
  Keep / Iterate / Kill verdict on;
- the rules below are in the handbook, not only in this file;
- an epic retro has proposed E2, with the budget it asks for.

**First fork:** Q11 in the [Questionnaire](questionnaire.md). ⭐ Maze Warden, whose open
design question (the shooting mechanic feels flat; the board shouldn't turn into visual
noise) is exactly the kind of experiment a fork exists for.

**Out of scope for E1:** new games, feature work on production games, renaming the realm.

### Suggested shape (the team owns the plan and may change it)

| Sprint | Goal | What you can see afterwards |
|---|---|---|
| 05 | Unblock and open the wing: the studio checks tell studio commits from arcade commits (the blocker in the inbox); a fork mechanism; the first fork live behind its portal | The first fork's portal on the 3D page opens the studio copy |
| 06 | The first experiment in the fork | A changed game to play and judge |
| 07 | Iterate on the verdict, or a second experiment; epic review and retro | The better version, and the proposal for E2 |

## Rules for this epic

These apply from sprint 05 on. The process parts are in the handbook (`process.md`,
[ADR-0009](../decisions/ADR-0009-one-step-per-session.md)) and the `studio-iteration` skill.

1. **Every sprint has a goal you can see.** The goal names what the executive will be able
   to see, play or read afterwards: a game change, a test suite that now exists, a doc.
   `review.md` links it.
2. **Tests, docs and tech debt are real work.** Work on the games (their tests, docs and
   debt) is welcome and not capped. What is capped is work on the studio's **own**
   machinery (its checks, handbook and steering views): at most one planned ticket per
   sprint. A new studio check is built only for a defect that reached the live site, or
   for a retro lesson that has recurred.
3. **One review round by default.** QA and the Independent Reviewer each make one pass. A
   second round runs only when the first one rejects on something a player would hit, a
   production file, or a save. Production fixes still follow ADR-0008.
4. **One step per session.** A sprint is `plan` → `build` (one ticket per session) →
   `review` → `close` → `retro`. Each session does the step
   [Next step](next.md) names and stops. Tickets are S or M; a ticket that outgrows its
   session is split, never carried.
5. **Fork on first change.** A game is copied to `studio/games/<slug>/` the first time the
   studio works on it, and not before. Every storage key in the copy is renamed under
   `studio_`. After a game is forked, feature work on it happens in the fork; production
   gets bug fixes only.
6. **Every ticket traces to its source.** Each ticket names the direction line, inbox line
   or retro item it came from. `review.md` opens with **In plain words**: five sentences a
   stranger could follow — what changed, why, and what the executive is being asked.
7. **Lessons become rules or retire.** `learning-log.md` starts with an **Active rules**
   list of ten at most. Each retro promotes a lesson into it, turns a rule that has
   recurred into a check or a skill edit, or retires a rule that no longer earns its
   place.

## The budget

- **Granted:** 3 sprints. **Reserve:** 1, which the team may claim. To claim it, the
  retro writes why: what the extra sprint buys, and what happens if it isn't spent.
  The claim then shows on the board. Anything beyond the reserve is a questionnaire item.
- **Finishing early is a good outcome.** If the done-when is met, the retro says so and
  proposes the next epic rather than filling the remaining sprints.
- **The count shows** in [Next step](next.md), the board, the handoff and the scorecard —
  for example *E1 · sprint 2 of 3 (+1 reserve)*.
- **When the budget is spent, the team stops and asks.** The last retro proposes the next
  epic and its budget as a questionnaire item, and `plan` won't start a sprint until this
  file names an epic with sprints left.
- **The executive sets the pace** by choosing when to say `studio next`. A sprint is about
  six short sessions.

## How to steer

| To | Do this |
|---|---|
| Keep it going | `studio next`, in a new session each time |
| Point the next sprint at something | `studio next — focus: <X>`, or move rows in the [Backlog](backlog.md) |
| Change the goal, the budget or a rule | Edit this file, or say it in chat |
| Say anything else: an idea, a complaint, a verdict | One line in the [Feedback Inbox](inbox.md) |
| Judge what shipped | The Keep / Iterate / Kill lines at the end of the iteration's `review.md`, or a line in the inbox |
| Decide an open question | The [Questionnaire](questionnaire.md). A blank answer takes the ⭐ |
| See where things stand | "studio status", or the [Board](board.md) |
| Halt | "stop", or a `STOP` file at the repo root |

## Reading it later

The trail from direction to shipped work runs through these files:
this file (what was asked) → the [Input Ledger](input-ledger.md) (every input and what it
became) → `docs/studio/iterations/NN/plan.md` and `tickets/` (what was attempted) → the
commits (`git log --grep "(studio)"`) → `review.md` (what shipped, in plain words) →
`retro.md` (what the team changed about itself) → the [Scorecard](scorecard.md) (the
trend). `git log -p -- docs/studio/steering/direction.md` shows how the direction itself
changed.

---

*Related: [Shadow Studio Index](README.md) · [Board](board.md) · [Questionnaire](questionnaire.md) · [Feedback Inbox](inbox.md)*
