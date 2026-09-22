---
name: studio-iteration
description: "Runs one bounded Shadow Studio iteration: preflight, plan, build ticket by ticket, independent review, gate, publish, review and retro, then stop and report. Use when Yevster says 'run a studio iteration', 'shadow studio', 'run the studio', or asks the studio company to build something."
---

# Studio Iteration

One run is **one iteration**, then a clean stop. The next run starts in a fresh session from
the handoff.

- **Handbook (authoritative for process):** `docs/studio/` — read `README.md`, `process.md`,
  `guardrails.md` and `definition-of-done.md` at the start of every run.
- **Steering (the executive's views and inputs):** `docs/studio/steering/` — `handoff.md`,
  `board.md`, `scorecard.md`, `inbox.md`, `input-ledger.md`, `questionnaire.md`, and the
  design in `design.md`. When a steering view disagrees with the handbook or the repo, the
  repo is right and this run fixes the view.

**Argument:** `$ARGUMENTS` — optional direction for this iteration. If omitted, the Product
Owner picks from the board and the inbox.

## Hard rules

- **Path guard.** Write only inside `studio/**`, `docs/studio/**`, `tests/studio/**`, plus the
  exceptions recorded in `docs/studio/guardrails.md`, plus **production fixes** under ADR-0008:
  each one a ticket that lists its production files, an entry per file in `PRODUCTION_FIXES`
  (`tests/studio/lib/rules.mjs`), a regression test shown red then green, and the full process.
  A feature, a design choice, a promotion, or anything touching releases, accounts or money is
  stop-and-ask.
- **Storage.** Every `localStorage` key starts with `studio_`. Never read or write a production
  key.
- **Public repo.** Follow `docs/studio/public-repo-hygiene.md`: no private context, no
  personal identifiers, no verbatim executive messages — record decisions in neutral technical
  language.
- **Caps.** Two fix rounds per ticket, then Blocked. One iteration per run. Ticket count per
  the size setting in `steering/questionnaire.md` (default 2–3).
- **Review rounds: two, unless Q8 in `steering/questionnaire.md` says otherwise.** After the
  second pass, close the findings, **write down what a third pass would most likely have
  found**, and stop. An unbounded adversarial search never terminates on its own; the stopping
  rule has to come from here. If the second round still rejects, decide by the team's goals and
  practices, write the reasons in `review.md`, and let the next retro judge whether the call
  held.
- **Try one way, retro, try another.** Practices are experiments. When a retro names a practice
  to try the other way, the next iteration does, and its retro judges it.
- **Stop** on a red gate, two failed fix rounds, a blocker needing Yevster, a path-guard
  violation, long context, or a `STOP` file at the repo root (`no-stop-file` checks for it).
- **Never** report a check as passed when it did not run.

## Phases

### 0. Preflight

1. Read `steering/handoff.md`, `steering/board.md`, `steering/inbox.md` and
   `steering/questionnaire.md`. Read the direction in chat.
2. **Log every input in `steering/input-ledger.md` before acting on it** — date, source, the
   input restated in neutral language, and (filled in later) what it became.
3. Run `npm run studio:check -- --stage=preflight`.
4. A red preflight ends the run with a report. Don't "fix up" a dirty tree you didn't make.

### 1. Refine and plan

- The iteration number NN is one past the last folder in `docs/studio/iterations/`. Create
  `docs/studio/iterations/NN/`.
- Write `plan.md`: the goal in one sentence, committed tickets, reserved capacity (about 20% for
  debt, docs and learning — pull real rows from `docs/studio/tech-debt.md`), risks, out of
  scope.
- One ticket file per item in `tickets/`, from `docs/studio/templates/ticket.md`. Every ticket
  passes `docs/studio/definition-of-ready.md`.
- An open product question doesn't go in a ticket. It goes into `steering/questionnaire.md`,
  and the ticket waits.

### 2. Build

**Trunk-based** (ADR-0007; `process.md` is authoritative). Per ticket: implement on `main` in
small commits → add tests → `npm run studio:check -- --stage=ticket` green before each commit
→ commit `type(studio): SHS-NNN description` → when the ticket is done,
`npm run studio:check -- --stage=push` green → `git push origin main` →
`--stage=postdeploy --marker="<a string only the new build has>"`, plus
`--marker-at=<site path>` when the change isn't on the realm's page. `studio-live` polls until
the build arrives, so run it straight after the push. Ceremony records — the plan, each
stand-up, the review, the retro — are pushed the same way as soon as they're committed. No
ticket branches, no merge commits. A page that isn't ready stays off the shelf.

**A production fix is the one exception to push-when-done** (ADR-0008). Commit it locally and
don't push it. Run the independent review (phase 3) on those commits, asking each pass for a
verdict on the fix alone at the exact commit. Record it in `iterations/NN/reviews/<TICKET>.md`
with one `- **Reviewed:** <full hash>` line and one `- **Verdict:** APPROVED…` line. Then push.
`production-fix-reviewed` refuses the push unless every file the fix owns is, at `HEAD`,
exactly what the reviewed commit holds. With only two review rounds, a production change found
late is carried to the next iteration rather than shipped unreviewed. Tickets are `SHS-NNN`;
`commit-lint` rejects the retired `SS-` prefix for anything new (ADR-0006).

Add a stand-up entry to `iterations/NN/log.md` between tickets: done / next / blocked, per role
that acted.

### 3. Independent review

Run **QA** and the **Independent Reviewer** as separate subagents with fresh context, given the
diff and the tickets, briefed from `docs/studio/team/qa-engineer.md` and
`docs/studio/team/independent-reviewer.md`.

**Spawn them on these models.** Pass `model` explicitly to the Agent tool; don't let them
inherit:

| Role | `model` | Why |
|---|---|---|
| Independent Reviewer | `fable` | A **different model from the author.** Two passes on the author's model finding the same defects reads as corroboration and is equally consistent with shared blind spots. Model diversity is the cheapest attack on correlated priors. |
| QA Engineer | `opus` | Keeps one pass on the author's model, so the two passes differ from each other as well as from the author. |

Don't drop these to a cheap model: here the subagent is the most intelligence-sensitive role in
the system.

Every finding becomes a fix, a ticket, or a recorded decline with a reason. Record the
reviewer's `**Verdict:**` line in `iterations/NN/review.md` — the gate checks for it — and
record the true verdict even when it's a rejection that shipped anyway.

**Before spawning, re-read the brief.** Say plainly which claims are *new this round*: a
reviewer that re-derives a previous round's findings burns a pass.

### 4. Document

Close the tickets with evidence, update `CHANGELOG.md`, `tech-debt.md` and `learning-log.md`,
and write `review.md` and `retro.md` from what actually happened.

### 5. Gate

```
npm run studio:check -- --stage=gate --base=<previous iteration tag>
```

Red means nothing is pushed. Fix within the caps, or stop and report.

### 6. Publish

1. `git push origin main` — the last push of the iteration.
2. `git tag -a studio-iteration-NN -m "..."` and `git push origin studio-iteration-NN`.
3. `npm run studio:check -- --stage=postdeploy --marker="<a string only the new build has>"`.

### 7. Close out

`npm run studio:check -- --stage=closeout`. Then regenerate the steering views from the repo —
`steering/board.md`, `steering/scorecard.md` (one new row), `steering/handoff.md` — resolve
every `input-ledger.md` entry to what it became, clear the inbox lines that were triaged, and
keep the iteration count in `steering/README.md` current. Commit and push them like any other
ceremony record.

Toggle `/fast` on for the mechanical phases (doc sweeps, record regeneration, close-out) and
off for planning and for reading review findings.

### 8. Report and stop

Report in chat, compact, the same content as `steering/handoff.md`:

- **Where the docs are** — exact paths added or changed
- **Summary** — 3–5 lines: shipped, cut, blocked
- **Checks** — every one, pass / fail / not run
- **Live URL**
- **Trend** — this iteration against the last three, from the scorecard
- **Efficiency changes** — what the retro changed, and whether the last change helped
- **Needs you** — only genuine decisions, one or two lines
- **Say next** — usually "run a studio iteration"

Then stop. Don't start another iteration.
