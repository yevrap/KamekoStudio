# Iteration 09 — retrospective

**Epic:** E2 · The studio's first original game worth playing · sprint 2 of 3 (+1 reserve,
unclaimed). The done-when isn't met yet (the core's latest verdict is Iterate), so there is
no epic review.

## The executive's feedback first (direction rule 8)

No `feedback` issue from the owner is open, the inbox is empty, and the Input Ledger has no
feedback line since retro 08. So no rule, edit or check comes from feedback this time.

One thing from outside the team shaped this retro's numbers: the run stopped at a usage
limit during this step and was resumed. The first retro attempt had written nothing to the
repository, so this one started over. What that did to the measurements is under
*Efficiency* below.

## Went well

- **Two of the three changes to Samovar got a Keep.** The forgiving brim
  ([SHS-073](tickets/SHS-073-samovar-forgiving-brim.md)): letting go at the dashed line never spilled in about 80 cups, and a
  first evening scored 8 to 25 of 30 where sprint 08's scored 0. The best evening on the
  first screen gives a second evening a target.
- **Working out the numbers before the build paid off** (retro 08's template change). Plan 09
  worked out each glass's stops and time windows before the build. That moved the drip band
  from 5 % to 8 %, because at 5 % a player letting go at the brim would still spill. It
  also predicted the problem the Playtester then measured (below).
- **Review worked in one round.** All three reviewers returned. The Independent Reviewer
  measured what the tickets only asserted, and three of its findings came from those runs
  (IR09-2, IR09-3, IR09-7). Four fix commits landed in the review step, the two code fixes
  with a test shown red first.
- **The pull-request flow is written down and ready** ([SHS-074](tickets/SHS-074-skill-describes-pull-requests.md)), with IR09-1's title
  lint added before the first real pull request, in sprint 10.
- **The Playtester got cheaper and still judged the look** (retro 08's change, below).

## Didn't go well

- **The glasses got an Iterate for a reason the plan had already named.** Plan 09 wrote
  that with every glass filling in the same time, a player who counts seconds could ignore
  the shape, and asked the Playtester to check. The Playtester found exactly that: counting
  the hold scored 23 to 26 of 30 on a first evening, better than watching the glass. The
  plan shipped a known way around the hook as a risk, so sprint 10, the epic's last granted
  sprint, is another pass on the core rather than its second layer. **Change:** the ticket
  template now says that when the numbers show a way to score while ignoring the cue, the
  plan changes the design or asks it with a ⭐ before the build.
- **`docs-current` was red at the gate for the fourth time** (05, 06, 07, 09). This time
  [SHS-072](tickets/SHS-072-samovar-cup-shapes.md) and [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md) put their commit between *What changed* and its colon. Active rule 6
  (every ticket from the template) didn't catch a label in the wrong form. The rule has
  recurred, so it becomes the check it was waiting for. **Change:** backlog #47
  (`docs-current` at push) takes sprint 10's process slot, ahead of #21.
- **A gate rerun hung for over nine minutes** in two browser suites with no Chrome running,
  and nothing limits how long a suite runs. **Change:** TD-015 and backlog #60.
- **The sprint cost 81 % more in writes and reads** (below), and the output part couldn't be
  measured.
- **Game code's share of changed lines fell.** Counted the same way for both sprints
  (`studio/` as game code, `tests/studio/*.test.mjs` as tests, other studio scripts and
  `.claude/` as process, everything else as docs):

  | | Sprint 08 | Sprint 09 |
  |---|---|---|
  | Game code | 1,076 (32 %) | 467 (16 %) |
  | Tests | 752 (22 %) | 482 (16 %) |
  | Process code | 71 (2 %) | 302 (10 %), mostly retro 08's cost reader |
  | Docs and records | 1,502 (44 %) | 1,727 (58 %) |

  A second pass is smaller than a first build, but the records grew while the game code
  shrank. This retro adds no new record and removes one duplicated review (QA's claims
  pass, below).

## Efficiency (direction rule 8)

**Cost, plan to close**, at list price, from `node tests/studio/sprint-cost.mjs`, one
workflow run per sprint. Writes and reads only: see *Output* below.

| Step | Sprint 08 | Sprint 09 | Change |
|---|---|---|---|
| plan | $2.52 | $2.57 | +2 % |
| builds | $3.69 (3 tickets) | $7.80 (3 tickets) | +111 % |
| **review** | **$5.98** | **$9.37** | **+57 %** |
| close | $1.39 | $4.82 | +247 % |
| start | $0.05 | $0.07 | |
| **Plan to close, writes + reads** | **$13.63** | **$24.63** | **+81 %** |
| writes / reads / output | $7.30 / $6.32 / $4.75 | $12.97 / $11.66 / not measured | |

Sprint 08's writes and reads come out of the reader the same as retro 08 recorded them
($7.30 / $6.32), so the two columns are the same measure.

- **Output: not measured.** The run was resumed after the usage limit. A resumed workflow
  replays the steps that had already finished, so it reported 0 output tokens for every
  one of them. The transcripts don't hold final output counts (retro 08). So sprint 09 has
  no output figure, and the comparison above leaves output out for both sprints.
- **Not in the table:** the first retro attempt, stopped by the usage limit after 8 turns
  with nothing written, cost $0.51. The conductor session cost $0.91 (counted whole,
  backlog #55). This retro's own cost is only partly measured at the time of writing.
- **Why the rise.** Two causes, measured from the local transcripts:
  1. **Every agent started bigger.** An agent's first turn grew from about 50k tokens in
     sprint 08's run to about 64k in sprint 09's. That includes the Haiku agent that only
     reads `next.md`, which went from 36k to 47k. Nothing the repository loads at the start
     changed: not the root `CLAUDE.md`, not the SessionStart hook. The growth comes from
     outside the repository, most likely the session's own tools and their descriptions
     (not confirmed). Over the
     sprint's turns that is roughly $2 of the rise. It's a note for the executive in the
     handoff, not something the team can change.
  2. **More, longer turns:** 327 turns from plan to close in sprint 08, 427 in sprint 09,
     each bigger on average.
     - Close went from 26 turns to 66: the red `docs-current`, its fix, the hung rerun and
       a second rerun. #47 and #60 are aimed at this.
     - The Independent Reviewer went from 25 to 50 turns, and its extra runs found
       IR09-2, -3 and -7.
     - QA went from 31 to 55 turns and found nothing.
     - Both games tickets were M. [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md)'s first push failed on `hygiene`'s wikilink
       pattern (IR09-4, #59).
- **The costliest step is review again: $9.37, 38 % of the sprint.** Within it: the
  review agent $3.56 (54 turns, four fix commits with tests), the Independent
  Reviewer $2.66, QA $1.93 and the Playtester $1.22.

### The one change: QA tests the tests

QA's $1.93 bought the least. Its transcript shows it read what the Independent Reviewer
read: the plan, the log, the three tickets, the same diffs and the same skill and workflow
changes. It also re-ran the Samovar suite, which the checks had already run, and wrote its
own profile arithmetic. It approved with no finding, as it did in sprint 08. It also missed
the one test-strength gap of the sprint: the layout test read the tea's bounding box and
couldn't see the clip path its criterion was about (IR09-3).

**What changed:** QA no longer checks the claims. It reads only each ticket's acceptance
criteria and the diff of code and tests (`git diff <tag>..HEAD -- studio tests`). For each
criterion that has a test, it breaks the code in a copy outside the repository
(`git archive HEAD | tar -x -C <temp dir>`, with `node_modules` linked in) and runs only
that test, which must go red for the reason its criterion names. Then it walks the paths
the author didn't (second run, empty state, stale save, narrow viewport, double tap),
measuring from the DOM without screenshots in its context.

This removes a duplicated read rather than adding a step, and it points the round's
different-model pass at a kind of defect nobody else looks for. The Independent Reviewer's
prompt is unchanged.

Where it was edited: the `studio-sprint` workflow's reviewer prompts and
`references/prompts.md` (both, as the prompts file requires), and
[team/qa-engineer.md](../../team/qa-engineer.md). The copy method was tried before writing
it down: a Samovar browser test run from an archive in a temporary directory passed in 7 s.

**Next retro checks** QA's writes and reads ($1.93, 55 turns this sprint), and whether QA
found anything the Independent Reviewer didn't.

**Weighed and not taken:**
- **Close on Sonnet 5.** Close's extra cost came from a red gate and a hang, which a
  cheaper model wouldn't prevent; #47 and #60 would.
- **Reviewers reading a diff without the last retro's records.** The Independent Reviewer
  already read the diff in pieces, so the saving is unclear, and the retro's own code (the
  cost reader, this time) would go unreviewed.
- **The bigger starting context.** It sits outside the repository.

## Did the last retro's changes help?

- **The Playtester keeps screenshots out of its context: held.** The Playtester's writes
  and reads fell from $1.97 to $1.22 (−38 %). It opened 6 images where it had opened 11, and
  took 30 turns where it had taken 48. Its verdicts still judged how the game looks: the
  tulip reads as a vase, the drip runs thin down the glass's right side, a spill heaps tea
  over the rim. The review step's writes still rose, from $3.43 to $4.18, but the rise came
  from the Independent Reviewer and QA, not the Playtester.
- **A game ticket states its numbers before the build: held, and not far enough.** The
  numbers changed the drip band before the build and predicted the counting problem. The
  plan then shipped the problem anyway, which is this retro's template change.
- **The request path in `studio-request`: not tested.** Nobody filed a request in sprint 09.
- **Active rule 6: slipped.** `docs-current` was red at the gate again, so #47 is next.
- **Rule 4, a number checked against a second source: held.** The reader's figures for
  sprint 08 match retro 08's before any sprint 09 figure went into this record.

## Hygiene check: GitHub, the planning notes, the skills

- **GitHub.** 17 commits from `studio-iteration-08` to `-09`; the first three are sprint
  08's close and retro. No merges, and every commit is conventional and ticketed. No
  executive commit needed an exemption. No `studio` issue is open. No pull request was
  opened, since this was the last sprint on trunk.
- **The planning notes.** The board, handoff, scorecard and index were all on iteration 08,
  as expected. All four are regenerated here.
- **The skills.** `studio-iteration` was edited in the sprint ([SHS-074](tickets/SHS-074-skill-describes-pull-requests.md), `d715105`). This
  retro edits the workflow's reviewer prompts and `references/prompts.md` together, and
  the two still say the same thing. `studio-standup` and `studio-promote` weren't used.

## Budget

Sprint 09 was **2 of 3** granted in E2. The reserve is unclaimed. Sprint 10 is the last
granted sprint. Following the epic's suggested shape, it makes a second pass on the core:
#57 (a flow per guest, on Q18's ⭐) and #58 (the glasses drawn true). Retro 10 then writes
the epic review:

- **If the core gets a Keep,** retro 10 writes E3.
- **If it gets Iterate again,** retro 10 decides between two options, with its reasons
  written down:
  - claim the reserve, sprint 11, to reach a Keep on the core;
  - end E2 with Samovar on the shelf as it stands.

## Reserved capacity

The 20 % went to:

- review's fixes (IR09-1, -3, -5, -6 and the rounding flake);
- the design note's corrected hook;
- this retro's prompt, role-file and template edits;
- TD-015.

Debt: +1 / −0 (TD-015 opened). No shortcut was taken.
