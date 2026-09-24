# Iteration 08 — retrospective

**Epic:** E2 · The studio's first original game worth playing · sprint 1 of 3 (+1 reserve,
unclaimed). The done-when isn't met yet, so there is no epic review.

## The executive's feedback first (direction rule 8)

Two `feedback` issues from the owner were open, both filed after sprint 07. Each became an
edit, and both are closed with what changed.

### Issue #4: cost in dollars, not output tokens

**What changed:**

1. **A cost reader, `tests/studio/sprint-cost.mjs`.** It reads Claude Code's local
   transcripts for the latest workflow run (or one named with `--run`) and prices each
   step's and each agent's cache writes and cache reads at list price. Opus 5.5 writes at
   1.25 × $4 and reads at $0.20; Sonnet 5 writes at 1.25 × $2 and reads at $0.20. Its pure part,
   `lib/sprint-cost.mjs`, has five tests (`sprint-cost.test.mjs`). It prints totals only;
   no transcript or path is committed.
2. **The scorecard has the cost in three parts** (writes / reads / output) and the
   costliest step in dollars. Row 07 is filled in from its run too, so this sprint has
   something to compare with.
3. **The `studio-iteration` skill's retro step runs the reader.** Direction rule 8 and
   `process.md` now say the scorecard keeps dollars, and that a cheaper sprint that ships a
   worse game or misses a bug isn't better.
4. **One change aimed at the costliest step** (below): the Playtester's screenshots.
5. **The shared starting context** (the root `CLAUDE.md`, 46 KB, outside the studio's
   paths) is [Q16](../../steering/questionnaire.md), with what we'd cut and what it would
   save, for the executive to decide.

**What the reader found that the output count hid.** A transcript's `output_tokens` is the
count at the start of the stream, not the final count. This run's transcripts add up to
18k output tokens where the workflow measured 237k. So the reader prices writes and reads,
which are final when the stream starts, and output comes from the workflow's per-step
count. The first version of the reader got this wrong, and so did its first price for Opus
cache reads (a tenth of input, $0.40, where the list price is $0.20). Both were caught by
checking against the executive's sprint-07 figures before any number went into the record.

### Issue #3: what the studio is for — two lanes

**Does the team pick interesting work on its own?** This sprint, yes. Nobody asked for a
particular game. The team pitched three original games, recommended one (Q14 ⭐), and
built it: *Samovar*, playable on a phone, with a Playtester verdict and a next step.
Changed lines, `studio-iteration-07..08`:

| | Sprint 07 (the executive's count) | Sprint 08 |
|---|---|---|
| Game code | about 100 | **1,020** (30%) |
| Tests | 360 | 816 |
| Process code | 100 | 26 |
| Docs and records | 1,200 (68%) | 1,539 (45%) |

The docs are still the biggest share, but the games' share went from about 6% to 30%.

**Is it clear how a request becomes a prototype or a build?** The path existed, but no
request has used it yet, so it hasn't been tested. It also wasn't written down anywhere the
executive would see it when filing. **What changed:** the `studio-request` skill's report
now gives the whole path. The next plan makes a request a backlog row, and a `priority: now`
request becomes that sprint's first ticket once it's Ready. Then a build with tests, review
with the Playtester, and `close` closes the issue with the live URL. A new game idea
starts as a core-mechanic prototype with its own verdict, the path Samovar took. To start
a request at once, stop the run and say "run the studio with focus: X now", which re-plans
the sprint around it. The first real request will show whether the path works.

**Process work that paid off.** Sprint 07's [SHS-065](../07/tickets/SHS-065-studio-edits-its-own-workflow.md) (the
studio edits its own skills) is what makes both changes above possible in this retro, without
asking. Sprint 08's [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) pays off when #49 and #50 move the
team onto pull requests.

## Went well

- **The studio's first original game is live and playable.** [SHS-068](tickets/SHS-068-samovar-core.md) built
  *Samovar* in one session, with a design note and a hypothesis written before the build.
  The Playtester saw a real skill curve once a player learned to anticipate the stop:
  5 → 24 of 30 at 390 wide, 0 → 21 at 320.
- **The fork's pickups got a Keep** ([SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md)). A pickup
  glows its colour from about 40 units up the river, and the label measured 26 px in every
  state. Both of the Playtester's sprint-07 notes it took on are closed.
- **The gate went 11 of 11 on its first run at close**, the first time in four sprints.
  Active rule 6 (*every ticket starts from the template*) held, and the close order held.
- **Review found what mattered and fixed the small things in the same step.** IR08-1 and
  IR08-2 were design findings, not code bugs: the arithmetic showed the hook didn't work
  as the design note claimed. Four smaller findings were fixed in the review step, each
  with a test shown red first. One review round, no rejection.
- **Review cost less in dollars** even though its output tokens rose (below).

## Didn't go well

- **The hook was never checked with numbers.** The design note said the cup's size was the
  cue for how long to pour. With one cup shape, the three-star stop is the same share of
  every cup's height, so the cup doesn't change the decision. Nobody worked out the
  timing windows per cup before the build; the Independent Reviewer did at review
  (IR08-1, IR08-2). **Change:** the ticket template now asks a ticket that builds or changes a
  game's core decision to state its hypothesis with the numbers behind it, per case the
  player meets, before the build.
- **The first evening scored 0 of 30.** Any overfill was a spill, even with the colour
  matched, and an ordinary release lag of 150–200 ms overfilled. The builder's browser test
  pours to exact targets, so it couldn't catch this. #51 (a forgiving brim) is Ready.
- **#21 waited a fifth sprint.** The executive's questionnaire commit (`1b798e2`) needed a
  hash exemption again. Since ADR-0011, requests, feedback and verdicts come in as issues,
  so steering edits are rarer, but questionnaire answers still arrive as file edits. #21
  stays next in line after #49 (see Backlog).
- **The efficiency number was the wrong one** (issue #4). Output tokens are about a quarter
  of the cost, and by that count alone review looked worse this sprint.

## Feedback and efficiency (direction rule 8)

**Cost, plan to close**, at list price. Writes and reads come from `sprint-cost.mjs`. Output
is the workflow's tokens per step at Opus 5.5's $20 a million, an upper bound, since QA's
share ran on Sonnet at half that. Sprint 07's figures are the same measure, taken from its
run.

| Step | Sprint 07 | Sprint 08 | Change |
|---|---|---|---|
| plan | $3.67 | $3.27 | −11% |
| builds | $4.85 (3 tickets) | $5.56 (3 tickets, one a whole new game) | +15% |
| **review** | **$8.32** | **$7.86** | **−6%** |
| close | $1.11 | $1.64 | +48% |
| start | $0.03 | $0.05 | |
| **Plan to close** | **$17.98** | **$18.37** | **+2%** |
| writes / reads / output | $7.96 / $5.75 / $4.27 | $7.30 / $6.32 / $4.75 | |

- **Retro 07's change held for its target.** It told the Independent Reviewer not to
  repeat evidence the sprint already had. The Reviewer's writes and reads fell from $3.55
  to $1.10, and QA stayed at $0.87. The review step's output tokens still rose, from
  82,272 to 93,988, because the review agent itself made three fix commits with browser
  tests this time. Its own writes and reads went from $1.38 to $2.07. By output tokens
  alone, retro 07's change looked like a failure; in dollars the step got 6% cheaper.
- **The sprint cost about the same** (+2%) and built more: a whole new game where 07
  built a HUD pass. Close cost more, because it wrote three shelf entries and ran
  postdeploy three times.
- **Not in the table:** retro 07 cost $2.20 in writes and reads (its output tokens weren't
  measured). Sprint 07's conductor session cost $3.16, sprint 08's $0.37 so far, but the
  07 session also held the executive's own work before the run, so the two can't be
  compared (backlog #55). This retro's own cost is only partly measured at the time of
  writing.
- **The costliest step is review, 43% of the sprint.** Within it: the review agent
  $2.07, the Playtester $1.97, the Independent Reviewer $1.10 and QA $0.87, plus 94k output
  tokens that the workflow doesn't split by agent. The costliest part is cache writes. Every
  fresh agent writes its whole starting context (even the Haiku agent that only reads
  `next.md` wrote 40k tokens), and every image an agent opens is written once and then
  re-read on each later turn.
- **The one change: the Playtester keeps screenshots out of its context unless it needs
  to see them.** It saves them to disk, and measures what the DOM can tell (positions,
  sizes, text, timings). It opens an image only to judge how something looks, at
  viewport size and late in the session. Edited in the workflow's Playtester prompt, the
  `studio-sprint` skill's prompts file and `team/playtester.md`. It removes reads rather
  than adding a step, and it keeps the Playtester playing both widths with real input.
  **Next retro checks** the review step's writes ($3.43 this sprint) and the Playtester's
  writes and reads ($1.97), and whether the verdicts still carried evidence of how the game looks.
- **Candidates weighed and not taken this sprint:** close on Sonnet 5 (about $0.80 a
  sprint; its gate and postdeploy judgement matter less than the build's, but one change
  at a time); merging QA into the Independent Reviewer (about $1, but QA on a different
  model is the round's second opinion, and the executive put quality first); the shared
  `CLAUDE.md` (Q16).

## Did the last retro's changes help?

- **Change 1, reviewers don't repeat counted evidence: held**, measured above. The
  Independent Reviewer says in [review.md](review.md) that it didn't re-run the counted
  suites.
- **Change 2, E1's rules in the handbook: held.** Skills, ADRs and this retro cite
  "direction rule 8", and it reads the same in both places. It was edited in both places here.
- **Change 3, #47 (`docs-current` at push): not built.** The process slot went to #40's
  first part, as the plan said. The gate was green at close anyway, so the rule it
  replaces (Active rule 6) did its job this sprint.
- **Change 4, Active rule 6 (every ticket from the template): held**, and the gate was
  green on its first run.

## Hygiene check — GitHub, the planning notes, the skills

- **GitHub.** 15 commits from `studio-iteration-07` to `-08` (the first three are retro
  07's), no merges, all conventional and ticketed except the executive's questionnaire
  commit (exempted, above). Two `studio`
  issues were open, both feedback, both closed here.
- **The planning notes.** Board, handoff, scorecard and the index were on iteration 07, as
  expected: regenerated here. The index's realm section had stopped at iteration 06 and
  still listed Q10 and the 06 verdict as open: brought up to date.
- **The skills.** Edited here: `studio-iteration` (the retro's cost step),
  `studio-request` (the request's path), and the Playtester prompt in both the workflow and
  the `studio-sprint` prompts file, which still match each other. `studio-standup` and
  `studio-promote` weren't used.

## Budget

Sprint 08 was **1 of 3** granted in E2. The reserve is unclaimed. Plan 09 acts on the
Iterate: #51, and #52 with #53 on Q15's ⭐, as the epic's suggested shape says.

## Reserved capacity

The 20% went to the review's fixes (IR08-3 to IR08-6), the cost reader and its tests, and
this retro's edits to the skills, the template and the handbook. Debt: +0 / −0. No
shortcut was taken. The fixed brim and the uniform cup were design choices the review
caught, and their fixes are backlog items, not debt.
