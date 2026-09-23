# Shadow Studio — Scorecard

One row per iteration, written at close-out. The point is the trend, not the numbers.

| # | Goal | Tickets (done/committed) | Fix rounds | Checks caught | Debt +/− | Docs | Subagents | Stops for Yev | K / I / K |
|---|---|---|---|---|---|---|---|---|---|
| 00 | Stand up the company | 11/9 | 3 | 6 built + 17 reviewed | +5 / −0 | 33 repo docs, 9 planning notes | 2 | 0 | pending |
| 01 | Identity, shelf, portals | 9/3 | 7 | 1 built + 26 reviewed | +1 / −1 | 9 repo docs, 7 planning notes | 2 (3 review passes) | 1 | pending |
| 02 | First experiment + boot coverage | 18/2 | 14 | 84 built + 10 rejections | +2 / −1 | 18 tickets, 8 repo docs, 7 planning notes | 11 (10 review passes + QA) | 1 | pending |
| 03 | Maintenance: ticket prefix, TD-009 diagnosed, one file per ticket | 7/3 | 6 | 7 built + 19 reviewed | +2 / −0 | 7 tickets + 3 reconstructed, 2 ADRs, 9 repo docs, 9 planning notes | 4 (2 rounds × QA + reviewer) | 2 | pending |
| 04 | First production fix, under a written permission; trunk-based trial | 5/3 | 7 | 4 built + 24 reviewed | +2 / −3 | 5 tickets, 1 ADR, 1 review record, 16 repo docs, 9 planning notes, 3 context files, 1 skill | 4 (2 rounds × QA + reviewer) | 0 | pending |
| 05 | E1 · 1 of 3: River Run forked, the 3D portal opens it | 4/3 | 0 | 6 built + 12 reviewed | +1 / −0 | 4 tickets, 1 ADR, the fork procedure, the ticket template, the first Active rules list, 3 arcade docs | 2 (1 round × QA + reviewer) | 0 | pending |

## Iteration 05 — what the row means

- **Tickets, 4 against 3.** SHS-055, 056 and 057 were committed; SHS-058 is the record.
  None was opened by review: under the one-round rule, the findings went to the backlog
  (#26–#31) or were fixed in the review step as S fixes under the record ticket.
- **The one that matters to a player shipped.** The River Run portal on the 3D page opens
  the studio's fork, and the fork keeps its own saves.
- **Fix rounds, 0.** The first sprint with none, against 7 in 04. The refusal cases were
  in SHS-055's criteria from plan, its tests went red first, and there was one review
  round, not two.
- **Checks caught, 6 + 12.**
  - Built:
    - `tree-clean` on an untracked editor folder;
    - `studio-boot` on four places production River Run fails the studio page contract;
    - `full-suites` twice in the push stage: once unexplained, once a browser test
      waiting on chance;
    - `commit-lint` on a SHS-056 subject;
    - `docs-current` on the record ticket's criteria.
  - Reviewed: 12 distinct findings from the two passes, 3 fixed in the step.
- **Debt +1 / −0.** TD-014 opened: the fork test's named Tone.js exemption.
- **Stops for you, 0.** Your chat direction at review, to do the arcade docs rather than
  hand them back, came unasked and is now a guardrail.
- **The honest summary.** The smallest sprint in cost so far, and the first one with a
  goal a player can walk to. What it made is plumbing: a faithful copy and a door. The
  gameplay change the epic is for is sprint 06's.

## Iteration 04 — what the row means

- **Tickets, 5 against 3.** SHS-050, 051 and 052 were committed; SHS-053 is the record.
  SHS-054 was **opened by review**: a production fix is reviewed before it is pushed. That
  is one review-opened ticket, against 0 in 03 and 15 in 02.
- **The one that matters to a player shipped.** Black Hole in One no longer throws when
  you enter Explore (TD-009). It is the studio's first fix to a production game. Both
  review rounds approved it on its own, and QA measured it with real taps: 0 of 20
  trials threw on the fixed build, 20 of 20 on the unfixed one.
- **Fix rounds, 7.** Two each on SHS-050, SHS-051 and SHS-054, all three at the cap, and
  one on SHS-052. SHS-051 ended with a gap it may not fix, TD-013.
- **Checks caught, 4 + 24.**
  - Built:
    - TD-010, live on the first push;
    - a deploy check whose output contradicted itself;
    - the operator's own wrong marker;
    - a mutation that survived because its test couldn't reach the rule.
  - Reviewed: 17 findings in round 1 and 7 in round 2.
- **Debt +2 / −3.** TD-009, TD-010 and TD-011 closed. TD-012 (an emptied test harness) and
  TD-013 (a merge the guard can't see) opened. The review check refuses TD-013's case.
- **Stops for you, 0.** You were asked nothing. Your "keep going" came after a pause the
  run didn't ask for, and your question about the repo and the planning notes was answered in chat.
  The round-2 split went to the team under your standing hand-back, and the team shipped.
  Iteration 05's retro judges that call.
- **Trunk-based, the trial.**
  - 12 pushes, every one checked before and after, and none broke the live site.
  - The first commit was live within about three minutes.
  - It also put the first production fix live before review. That is how the "review
    before push" rule was found.
- **The honest summary.** The fix was small, and making it safe to make was not. Most of
  the iteration went on the rules that let the studio touch production at all. Review
  showed the first version of those rules proved less than it claimed, so ADR-0008 now
  says exactly what they prove. The most repeated fault was the one from 03 in a new place:
  **checks that passed on a comparison of nothing**, found four more times.

## Iteration 03 — what the row means

- **Tickets, 7 against 3.** SHS-043, 044 and 045 were committed; SHS-046 is the record.
  SHS-047 was opened by the build, SHS-048 by your direction after review (trunk-based
  development, written down), and SHS-049 by the publish step. **None was opened by a
  review** — every finding went into a fix round on its own ticket. Iteration 02 had
  fifteen review-opened tickets.
- **Fix rounds, 6.** Two each on SHS-043 and SHS-044 — both at the cap, neither over it —
  one on SHS-045, one on SHS-047's record.
- **Checks caught, 7 + 19.** Built: `docs-current` found three shipped tickets with no file
  on its first run over the history; the full-history lint found a pushed commit the last
  gate never saw; the example test found the handbook contradicting its own rule; the
  publish step found two post-deploy gaps. Reviewed: 11 findings in round 1, 8 in round 2,
  17 fixed and 2 declined with reasons.
- **Debt +2 / −0.** TD-010 and TD-011, both post-deploy gaps, both found on the way out.
  TD-009 was diagnosed rather than closed — it's production code, and your Q9 answer lets
  the next iteration fix it.
- **Two review rounds, the cap, and it held.** The first iteration where the cap was
  binding. Round 1: the reviewer approved, QA failed. Round 2: both rejected, on the same
  gap, found independently — one on a different model from the author, one on the same.
  That agreement is stronger evidence than iteration 02's, where both were on the author's
  model.
- **Stops for you, 2.** Preflight went red on your prefix edits landing mid-run; you said
  adopt them. Then the round-2 rejection's tie-break — which you handed back to the team.
  The team shipped, and iteration 04's retro judges that call.
- **The honest summary.** Planned work was small and stayed small. The most-repeated fault
  moved: in 02 it was claims about the work, and here it was **checks that trusted their
  own setup** — the TD-009 check was fooled twice by partial fixes, each time because it
  tested in the state the fix keyed off. Same lesson as 02's #12, missed on the next
  structurally identical thing.

## Iteration 02 — what the row means

- **Tickets, 18 against 2.** SS-020 and SS-022 were committed and SS-023 was the record.
  **Every one of the other fifteen was opened by a review.** The cap held on what was
  *planned* and means very little else.
- **Ten independent passes, ten rejections.** Not one approved. Each found real defects and
  the character changed as it went: rounds 1–3 closed exemptions that could be *forged*;
  4–6 closed blind spots; 7–8 closed rules written so narrowly they were satisfied by the
  defect they named; 9–10 ended an approach rather than patching it again.
- **Checks caught, 84.** `studio-boot` went from the 8 mutations it was written for to 84
  across twelve sets — every one re-run at the shipping commit rather than carried forward.
- **Debt +2 / −1.** TD-004 closed. TD-007 (a duplicated static server) and TD-008 (what the
  boot check does not collect, written down so something schedules it) opened.
- **Stops for Yev, 1.** The run stopped and asked whether to keep reviewing or ship. That is
  the column working.
- **The honest summary, and it is not flattering.** Planned work took under a fifth of the
  iteration; the rest went on finding out what was wrong with it. The most repeated fault
  sat in **claims about the work rather than in the work**. Nine consecutive rounds found
  the record false or stale, every time in the document written to correct the previous
  round's record.
- **The one that cost the most.** `docs-current`, which polices the studio's own paperwork
  and not the arcade, was defeated ten times. Nine of those fixes made the same bet — that
  a checker could decide what a Markdown renderer would show. The tenth stopped betting: a
  ticket declares each thing once, counted raw, and 170 lines of parser were deleted.
- **The result worth keeping:** the first experiment returned a clear "no" with a
  measurement, confirmed three ways by methods sharing no code, and it is on the shelf
  saying so rather than quietly re-tuned.

## Iteration 01 — what the row means

- **Tickets, 9 against 3.** The three committed tickets all landed. Six more were opened by
  the reviews: SS-015 (the record), SS-016, SS-017, SS-018, SS-019, SS-021. The cap held
  where it is meant to — on what the iteration *planned* — and the overrun is entirely the
  cost of being wrong twice.
- **Fix rounds, 7.** None hit the cap of 2 per ticket. Every one was found by a test or a
  measurement rather than by rereading the code.
- **Checks caught, 1 + 26.** `portal-capacity` caught the production defect it was written
  for, before the fix existed. The two reviewers found twenty-six between them across three
  passes, and **rejected the diff twice**.
- **Debt +1 / −1.** TD-002 closed. TD-006 opened. TD-004 and TD-005 restated with their
  real cost measured rather than asserted.
- **Stops for Yev, 1.** The run stopped before it started, to ask whether Q3 really
  authorised a production change on silence. That is the column working.
- **The honest summary:** the planned work took about a third of the iteration. Finding out
  what was wrong with it took the rest.

## Column notes

- **Tickets** — 11 done against 9 committed: SS-010 and SS-011 were added mid-iteration by
  the review. Eleven is far over the standing cap of 2–3, which applies from iteration 01.
- **Fix rounds** — three, across SS-003, SS-004/008 and SS-009. Cap is 2 per ticket; none
  hit it.
- **Checks caught** — six found by the checks while they were being built (the `git` spawn
  failure, a porcelain off-by-one, JSON comma churn, an unverifiable indirect storage key,
  self-referential hygiene hits, a missing iteration-docs set), plus seventeen found by the
  two independent reviewers, four of which were serious enough to reject the diff.
- **Debt** — rows opened and closed in `docs/studio/tech-debt.md`. Five opened, none closed;
  three of the five are production-side.
- **Subagents** — two, QA and the Independent Reviewer, each with fresh context. They are
  the expensive part of a run and they were worth it: they found the two defects that
  mattered most, neither of which was visible from inside the work.
- **Stops for Yev** — times the run had to halt for a decision. Zero is not automatically
  good; it can mean the run decided something it should have asked about. Here it is
  accurate: the two real decisions were written into a questionnaire rather than blocking.
- **K / I / K** — your Keep / Iterate / Kill tally from the review.
