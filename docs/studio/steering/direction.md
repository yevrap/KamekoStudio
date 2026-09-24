# Shadow Studio — Direction

The executive's standing direction: what the studio is working toward, how many sprints
it has to get there, and the rules it works under while it does. **Every session reads this
right after `next.md`**, and plans against it. It changes rarely. It changes when the
executive edits it, or when chat direction is recorded here (and logged in the
[Input Ledger](input-ledger.md) like any other input).

Day-to-day notes go in the [Feedback Inbox](inbox.md), not here.

## Standing charter — the studio runs itself

Since 2026-09-23 ([ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md)) the executive
kicks off a run — "run the studio" — and watches it: the `studio-sprint` workflow runs one
step per fresh agent, to the end of the current sprint, visible step by step in
`/workflows`. Nothing in the normal flow waits for the executive:

- **Epics roll over.** An epic's last retro writes the next one under
  [Proposed next epic](#proposed-next-epic); the next `plan` adopts it unless the
  executive has struck or changed it.
- **The Playtester's verdict counts.** Keep / Iterate / Kill comes from the
  [Playtester](../team/playtester.md) at `review`; the executive's verdict overrides it
  whenever it arrives.
- **Open questions take their ⭐** at once; the executive can overturn one later.
- **Games first.** The studio makes games worth playing: forks of arcade games, and
  original games of its own inside `studio/games/`. At least two of every sprint's planned
  tickets change what a player sees or plays. The arcade gets bug fixes only; promotion is
  the executive's call.
- **Requests come in as issues.** A GitHub issue labelled `studio` and `priority: now`,
  `next` or `later`, opened by the executive, becomes a backlog row at the next plan
  (`studio-request` files one from chat).
- **Hard stops** (promotion, accounts or money, destructive git, a red check past the caps)
  still write *waiting on you* into `next.md`, and the run stops there.

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

**Status:** done at sprint 07's retro, inside its 3 sprints, reserve unclaimed; the epic
review is in [07's retro](../iterations/07/retro.md). The next `plan` adopts E2 below.

**Budget:** 3 sprints (05, 06, 07) + 1 reserve. See [the budget](#the-budget). What each
sprint pulls comes from the ordered [Backlog](backlog.md).

**Done when:**
- a 3D portal leads to a studio fork, and every portal without a fork still leads to its
  production game;
- the fork never reads or writes a production save;
- the fork has shipped at least one gameplay change with a Keep / Iterate / Kill verdict
  (the Playtester's, or the executive's, which overrides it — ADR-0011);
- the rules below are in the handbook, not only in this file;
- an epic retro has proposed E2, with the budget it asks for.

**First fork:** River Run, the executive's choice in chat on 2026-09-22 (Q11, option C).
It is on the arcade's Invest list and its modernization questionnaire is answered but not
built, so the fork starts with a queue of experiments; Q12 picks the first. Maze Warden,
the earlier ⭐, stays in the arcade.

**Out of scope for E1:** new games, feature work on production games, renaming the realm.
(Later epics may take on original studio games; see the charter above.)

### Suggested shape (the team owns the plan and may change it)

| Sprint | Goal | What you can see afterwards |
|---|---|---|
| 05 | Unblock and open the wing: the studio checks tell studio commits from arcade commits (the blocker in the inbox); a fork mechanism; the first fork live behind its portal | The first fork's portal on the 3D page opens the studio copy |
| 06 | The first experiment in the fork | A changed game to play and judge |
| 07 | Iterate on the verdict, or a second experiment; epic review and retro | The better version, and the proposal for E2 |

## Proposed next epic

*Written by E1's last retro (sprint 07). The next `plan` adopts it unless the executive
strikes or edits it first.*

### E2 — The studio's first original game worth playing

**Why:** the executive's wish for E2 (2026-09-23) is games that are interesting to play. E1
was a fork, and the charter asks epics to vary, so E2 is an original studio game with a
hook of its own.

**Goal:** an original game, made by the studio, is on the realm's shelf, playable on a phone,
and the Playtester calls it fun.

**Budget:** 3 sprints (08, 09, 10) + 1 reserve.

**Done when:**
- a new game with an original hook (a game named as a reference is a genre, never a
  blueprint) lives in `studio/games/<slug>/`, is on the realm's shelf, plays at 320 and 390
  wide, and keeps its saves under `studio_<slug>_*`;
- its core mechanic shipped on its own first, with a Keep / Iterate / Kill, and at least
  one later sprint acted on that verdict;
- the Playtester's latest verdict on it is Keep, or it was killed with a written reason and
  stays on the shelf as killed;
- it has browser tests for its core loop and a design note in `docs/studio/` (what it is,
  the hook, what was cut);
- an epic retro proposes E3.

**Suggested shape (the team owns the plan):** 08: three pitches in the plan, the pick as a
questionnaire item with its ⭐, and the core mechanic built as a playable prototype. 09: act
on the Playtester's verdict. 10: the second layer (progression, a mode) only if the core
was kept; otherwise a second pass on the core; then the epic review.

**Out of scope:** promotion to the arcade; a 3D portal for the new game (that touches
`shared/3d/`, production, and needs the executive's exception); new River Run experiments
(#6, #7, #23). The River Run fork's Ready fixes (#42, #44) may take a sprint's second games
slot, and #40 keeps the process slot.

## Rules for this epic

These apply from sprint 05 on, to every epic until this file changes them. Since sprint
07's retro they are also the handbook's *Standing rules*, under the same numbers, in
[process.md](../process.md#standing-rules), so "direction rule 8" means the same thing in
both; the process parts are in [ADR-0009](../decisions/ADR-0009-one-step-per-session.md)
and the `studio-iteration` skill.

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
8. **Every sprint runs a little better and cheaper than the last** (executive,
   2026-09-23). The executive's feedback on how a run went is the retro's first input, and
   each piece becomes a rule, a skill or workflow edit, or a check — never only a note. The
   `studio-sprint` workflow measures each step's output tokens; the scorecard keeps the
   trend, and each retro names the costliest step and makes one change aimed at it, then
   checks next retro whether it worked. **Prefer removing:** a change that deletes a step,
   a read or a rule beats one that adds; a new check names the defect that reached the
   live site or the rule it replaces; the Active rules cap of ten holds. Better means
   leaner, not more ceremony.

## The budget

- **Granted:** 3 sprints. **Reserve:** 1, which the team may claim. To claim it, the
  retro writes why: what the extra sprint buys, and what happens if it isn't spent.
  The claim then shows on the board. Anything beyond the reserve is a questionnaire item.
- **Finishing early is a good outcome.** If the done-when is met, the retro says so and
  proposes the next epic rather than filling the remaining sprints.
- **The count shows** in [Next step](next.md), the board, the handoff and the scorecard —
  for example *E1 · sprint 2 of 3 (+1 reserve)*.
- **When the budget is spent, the epic ends and the next one starts.** The last retro writes
  the epic review and puts the next epic under [Proposed next epic](#proposed-next-epic);
  the next `plan` adopts it (ADR-0011). The executive can strike or reshape it any time
  before that plan runs.
- **The executive sets the pace** by starting runs; a run goes to the end of the current
  sprint. A sprint is about six to eight fresh agents, plus the reviewers.

## How to steer

| To | Do this |
|---|---|
| Run it and watch | "run the studio", in Claude Code (the `studio-sprint` workflow, to the end of the sprint; watch in `/workflows`) or Antigravity (the `studio-sprint` skill, step by step in the chat), optionally "… with focus: <X>" or "… for 2 sprints"; or `studio next` for a single step in a new session |
| Stop it | Stop the workflow in `/workflows`, or "stop the studio" (a `STOP` file: it ends after the current step) |
| Ask for a feature, a game, a fix | "studio request: <X>" (files a `studio` issue), or open one on GitHub with a `priority:` label; it becomes a backlog row at the next plan |
| Say how a run went | "studio feedback: <X>" (a `studio` + `feedback` issue); the next retro turns it into a rule, an edit or a check |
| Give a verdict | "studio verdict: Keep / Iterate / Kill <item>" (a `studio` + `verdict` issue); it overrides the Playtester's at the next plan |
| Point the next sprint at something | `studio next — focus: <X>`, or move rows in the [Backlog](backlog.md) |
| Change the goal, the budget or a rule | Edit this file, or say it in chat |
| Say anything else: an idea, a complaint, a verdict | One line in the [Feedback Inbox](inbox.md) |
| Judge what shipped | Strike or rewrite the Playtester's Keep / Iterate / Kill in the iteration's `review.md`, or a line in the inbox; yours overrides |
| Decide an open question | The [Questionnaire](questionnaire.md). A blank answer takes the ⭐ |
| See where things stand | "studio status", or the [Board](board.md) |
| Halt | "stop the studio", or a `STOP` file at the repo root |

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
