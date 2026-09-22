# Shadow Studio — Board

*Regenerated from the repo by each run. Don't hand-edit — add anything you want to say to
[Shadow Studio — Feedback Inbox](inbox.md) instead.*

**Iteration 04 · shipped.** The studio's first fix to a production game, under a written
permission its checks enforce. It was also the first trunk-based iteration: every ticket
and every ceremony record was pushed and checked as it landed. Tag `studio-iteration-04`.
Live: https://yevrap.github.io/KamekoStudio/studio/ · the fixed game:
https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/

**The second and last review round split.** The Independent Reviewer approved with
findings, and QA rejected. Both approved the Black Hole in One fix on its own. QA's
rejection was about the new review check. Its findings were closed the way QA proposed,
in a fix round no reviewer has seen. The team shipped under your standing hand-back, and
[Shadow Studio — Handoff](handoff.md) says why.

## Waiting on you

| What | Where |
|---|---|
| **Should a production fix also need your approval before it goes live?** | Q10 in [Shadow Studio — Questionnaire](questionnaire.md) |
| Keep / Iterate / Kill on what shipped | `docs/studio/iterations/04/review.md` |
| Name the realm, if "Shadow Studio" isn't it | Q1, same note |
| Anything else about how the company runs | Q5, same note (it stays open) |

## Next

The next step is in [Shadow Studio — Next step](next.md): `plan` sprint 05, the first of
epic E1 ([Direction](direction.md)). What sprint 05 pulls comes from the top of
[Shadow Studio — Backlog](backlog.md), which now holds everything this board used to list
here, in order. From here on the team runs one step per session (ADR-0009).

## Blocked

Nothing.

## Noticed, not yet ticketed

- **Overtighten's torque readout rounds, and the state does not.** 45.6 shows "46 · loose"
  while the band starts at 46.
- **Overtighten's plates** could be framed tighter, as the hinge plate already is.
- **A decision record for iteration 02's `docs-current` rewrite**, and a **claim-evidence
  rule**: a Result that says *tested* or *closed* names the artifact that proves it.
- **A test-name rule for production's test harnesses** (TD-012): the names at `HEAD`
  must include every name at the base.

## Done — iteration 04

| Ticket | What |
|---|---|
| SHS-050 | Every push checked before and after it lands: a `push` stage; `studio-live` waits for the build and refuses a stale marker; no check passes on a comparison of nothing |
| SHS-051 | Production fixes under the full process (ADR-0008); the path guard admits a production file only for the ticket that owns it, in its own iteration |
| SHS-052 | **Black Hole in One no longer throws when Explore starts with spirals alive** (TD-009) — the first production fix |
| SHS-053 | The iteration's record; ceremony records pushed as they land |
| SHS-054 | *Review-opened:* a production fix is reviewed before it is pushed, and pushed exactly as reviewed |

## Open debt

| | |
|---|---|
| TD-001 | The realm has no entrance. Q4 reframes it as the 3D zone becoming the studio's window; 05 designs it |
| TD-003 | The storage-key rule is implemented twice |
| TD-005 | With site data blocked, the arcade's `settings.js` throws and `body.dark-mode` is never applied. Now eligible as a production fix |
| TD-006 | The 3D landing page prefers a portal prompt to a trophy prompt at any range. Now eligible as a production fix |
| TD-007 | The static test server exists twice |
| TD-008 | What `studio-boot` does not collect |
| TD-012 | **New.** A production fix to a test harness could empty it with every check green before its review |
| TD-013 | **New.** A merge that takes a fix file from one parent is invisible to `path-guard`; the review check refuses it |

*Closed this iteration:* TD-009 (the Black Hole in One bug), TD-010 (`studio-live` never
waited), TD-011 (a release compared with itself).

Full register, with the cost of leaving each one: `docs/studio/tech-debt.md` in the repo.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Handoff](handoff.md) · [Shadow Studio — Scorecard](scorecard.md)*
