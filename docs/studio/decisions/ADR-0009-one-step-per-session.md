# ADR-0009 — One step per session, a backlog, and an epic budget

- **Status:** Accepted
- **Date:** 2026-09-22
- **Iteration:** between 04 and 05 (executive direction, carried out outside an iteration)

## Context

Iterations 00 to 04 each ran as one long session: preflight, planning, two or three tickets,
two review rounds of two subagents each, the gate, publishing, review, retro and close-out.
The scorecard shows what that cost. Planned work was between a fifth and a third of each
iteration. Iteration 02 opened fifteen tickets from review against two planned. The work
that ran away was mostly the studio policing its own paperwork.

Long sessions have two further problems. They drift as their context fills, and they spend
a usage allowance that has to be spread over many days. The executive asked for the team to
run more like a scrum team: steerable when there is direction, and able to keep going on its
own momentum when there isn't, without taking on anything too big.

## Decision

1. **A sprint is spread over sessions, one step per session.** The steps are `plan`, `build`
   (one ticket per session), `review`, `close` and `retro`. Each session does the step that
   `docs/studio/steering/next.md` names, rewrites that file, and stops. A SessionStart hook
   in `.claude/settings.json` prints `next.md` into every new Claude Code session in this
   repository, so a fresh session knows where the team is. The prompt is always the same:
   `studio next`.
2. **One ordered product backlog**, `docs/studio/steering/backlog.md`. The top is next. The
   executive steers by re-ordering it, by writing in the inbox, or with
   `studio next — focus: <X>`. With no direction, planning pulls from the top.
3. **An epic budget**, in `docs/studio/steering/direction.md`. An epic is granted a number of
   sprints plus one reserve the team may claim, with a written reason. Beyond the reserve,
   the team asks. Finishing early is a good outcome.
4. **One review round by default.** A second runs only when the first rejects on something
   a player would hit, a production file, or a save. This replaces the two-round cap.
5. **Tickets are S or M**, one in progress at a time, and a ticket that outgrows its session
   is split, never carried. At most one planned ticket per sprint goes to the studio's own
   machinery. Tests, docs and tech debt for the games themselves are welcome and not capped.

## Consequences

- A sprint takes about six short sessions instead of one long one. Each is cheaper, more
  focused, and recoverable. A failed session costs one step.
- The ceremony records stay (plan, tickets, log, review, retro, scorecard), so the trail
  from direction to shipped work remains readable. `review.md` gains a five-sentence
  **In plain words** opening.
- `next.md` is a new piece of state. If it disagrees with the repo, the repo is right, and
  the session corrects `next.md` before acting.
- Sprints that ended without a player-visible result are expected to become rarer. The
  retro watches for that and for a theme repeating three sprints in a row.
