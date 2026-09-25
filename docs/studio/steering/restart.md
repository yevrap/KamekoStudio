# Shadow Studio — Restart brief

The studio is **tabled**: nothing runs until the executive says "restart the studio". This is
the one page a restart reads first. It says where the studio stopped, what its sprints
taught, the executive's feedback for the next season, and the baseline of AI models and
tools that a restart compares against what exists by then. The `restart` step
([`studio-iteration`](../../../.claude/skills/studio-iteration/SKILL.md)) acts on it and
appends to the *Restart log* at the bottom.

## Where it stopped (2026-09-25)

- **Tabled by the executive** after sprint 09's retro, before plan 10
  ([SHS-076](../iterations/09/tickets/SHS-076-table-the-studio.md)). Nothing is in flight: no
  open pull request, no studio branch on the remote, no unpushed production fix, no open
  `studio` issue.
- **Live, and staying live:** the [realm](https://yevrap.github.io/KamekoStudio/studio/),
  [Samovar](https://yevrap.github.io/KamekoStudio/studio/games/samovar/),
  [Overtighten](https://yevrap.github.io/KamekoStudio/studio/games/overtighten/) and the
  [River Run fork](https://yevrap.github.io/KamekoStudio/studio/games/river-run/), which the
  3D page's River Run portal still opens.
- **The epic:** E2 (the studio's first original game worth playing) is paused at sprint 2
  of 3, the reserve unclaimed, and its budget clock is stopped. Samovar's latest verdicts
  (the Playtester's): the forgiving brim and the best evening on the first screen are
  Keep, and the glasses of three shapes are Iterate, because counting the hold beats
  watching the glass ([09's review](../iterations/09/review.md)).
- **Sprint 10 as it would have been planned:** #57 (a flow per guest, Q18 ⭐), #58 (the
  glasses drawn true), #50 (the first real pull request), #47 (`docs-current` at push). The
  feedback below may reorder or drop them; P2 questions #47.
- **Open questions:** Q16 (trim the root `CLAUDE.md`), Q17 (when a pull request merges;
  its ⭐ is in the skill), Q18 (a flow per guest). See the [questionnaire](questionnaire.md).
- **While tabled:** the arcade still treats River Run as forked. The arcade build gets bug
  fixes only, and feature work waits for the restart unless the executive says otherwise.
  `studio request`, `feedback` and `verdict` issues can still be filed, and the restart
  reads them first. The next backlog item is #61, and the next ticket is SHS-077.

## What sprints 00–09 taught

Ten sprints ran from 2026-09-19 to 2026-09-24: 241 commits from plan 00 to the
`studio-iteration-09` tag. They came in three phases:

1. **00–04:** building the studio itself (the checks, the review roles, the first
   production fix).
2. **05–07:** E1, the River Run fork behind its 3D portal, with power-ups the Playtester
   kept.
3. **08–09:** E2, Samovar.

The row-by-row numbers are in the [scorecard](scorecard.md). The history is in the
iteration records, and this page is their summary. Open a record only to check a claim.

| Sprint | Tickets done / committed | Fix rounds | Tickets opened by review | Cost, writes + reads |
|---|---|---|---|---|
| 02 | 18 / 2 | 14 | 15 | not measured |
| 03, 04 | 7 / 3, 5 / 3 | 6, 7 | 0, 1 | not measured |
| 05–09 | 4 / 3 every sprint | 0, 1, 1, 2, 3 | 0 | 07 $13.71 · 08 $13.63 · 09 $24.63 |

### What worked: keep it

1. **One step per fresh agent, with `next.md` as the handoff** (ADR-0009, ADR-0011). A
   failure costs one step, not a sprint. When a usage limit stopped sprint 09, only the
   retro's first attempt was lost.
2. **Caps that bind:** 2–3 planned tickets, one review round by default, at most one
   process ticket per sprint. Once they bound (sprint 05), every sprint shipped something a
   player can see, with 0–3 fix rounds, against sprint 02's 18 tickets from 2 planned and
   ten rejected review rounds.
3. **Numbers before the build** for a game's core decision (retro 08), and no known bypass
   shipped (retro 09). SHS-073's table moved the drip band from 5 % to 8 % before any code,
   and plan 09 predicted the counting problem the Playtester then measured. It is the best
   thing the process learned about games.
4. **Review with fresh context finds real defects.** Examples: a rename that deleted a
   production file (00); forged exemptions (02); a layout test that couldn't see its clip
   path (IR09-3). Separately, the fork turned up a freeze in the arcade's River Run that
   nobody had reported (06–07).
5. **Retros that check whether the last change worked, with a number.** Keeping
   screenshots out of the Playtester's context cut its cost 38 %. The Independent Reviewer
   went from $3.55 to $1.10 a sprint.
6. **A Playtester that measures.** It measured a 150–200 ms release lag, and showed that a
   scripted player who counts scores 23–26 of 30. Arithmetic like that caught Samovar's
   weak hook twice.

### What didn't: change it

1. **The records outgrew the work.** `docs/studio/` is 175 files, about 16,800 lines.
   Against that there are about 3,100 lines of original studio code (Samovar about 1,240,
   Overtighten about 1,200, the realm about 680); the River Run fork is a 1,250-line copy.
   In sprints 05–09, about three lines of studio docs changed for every line under
   `studio/`. In sprint 09, records were 58 % of changed lines and game code 16 % (retro
   09).
2. **The paperwork's own checks failed most often.**
   - `docs-current` was red at the gate in sprints 05, 06, 07 and 09. It was also behind
     most of sprint 02's ten rejected review rounds.
   - The executive's own steering edits fail `commit-lint`: nine commits carry hash
     exemptions, and the fix (#21) has waited five sprints.
3. **The learning went into the machinery.** Nine of the ten Active rules in the
   [learning log](../learning-log.md) are about checks, tests and records; one, a game's
   clock, is about games. Of 74 tickets, 56 were led by QA, the Tech Lead, the Technical
   Writer or the Scrum Master. UX / Art led 2 and Audio / Juice led 1.
4. **The backlog is mostly about the studio itself.** Of 39 rows, 14 are features or fixes
   and 25 are process, tests, debt or docs; 21 rows say *Needs refinement*.
5. **No human verdict.** Since ADR-0011 every Keep / Iterate / Kill has been the
   Playtester's. The arcade's [playtest log](../../playtest-log.md) ends on 2026-07-22, and
   no studio skill reads it. ADR-0011 foresaw this ("the team can drift without a human
   playtest").
6. **Depth on one idea, not breadth.** E2 spent two sprints tuning one hook that
   arithmetic had already shown was weak. In July, the arcade's jam loop took Maze Warden
   from a jam through seven verdict-driven iterations to promotion in one day, with the
   executive's verdicts in the loop.
7. **Look and feel came last.** Samovar has no sound, no samovar on screen and a flat grey
   glass. The [taste brief](../../brief.md) asks that a game "look cool", with particles,
   gradients and trails even in 2D.
8. **Cost rose.** Writes and reads went up 81 % from sprint 08 to 09 (327 turns to 427).
   That was mostly a red gate, a hung suite and longer reviews.
9. **A usage limit stopped sprint 09 mid-retro.** The resumed workflow replayed the steps
   that had finished and reported them as 0 output tokens, so the sprint's output cost was
   lost.

## Feedback for the next season (the executive, 2026-09-25)

Written at the executive's request, from a review of sprints 00–09. The executive doesn't
mind spending cycles, and cares about the games and the process equally. What should
shrink is the share spent on records about records, not the share spent on games, review
or play.

The restart turns each item below into one of three things:

- a change made now;
- a trial in the first sprint;
- a written "not now, because …".

A change that ADR-0011 §6 keeps the executive's becomes a questionnaire item with its ⭐.

### The games

- **G1. Put the executive's verdict back in the loop, at a minute's cost.** Every review
  ends with a play card: the live link, what changed, what to try, and the one question
  the Playtester couldn't answer. The Playtester's verdicts keep steering the iterations.
  A Keep that ends an epic or calls a game fun is the executive's.
  - This changes ADR-0011, so the restart asks it in the questionnaire with a ⭐; it
    doesn't make the change itself.
  - The capability baseline below lists ways to make the card cheap to answer.
- **G2. Build more than one idea before going deep on one.** An epic that makes a new game
  starts with two or three core-mechanic prototypes, built in parallel, each small.
  - The Playtester and the executive pick one to deepen, and the rest go on the shelf as
    killed.
  - Cycles are fine; two sprints of tuning one weak hook weren't.
- **G3. Look, sound and feel are part of the core, not polish.** Each player-visible
  ticket gets a UX / Art and an Audio / Juice pass, against the taste brief: resonance,
  5–10 minute sessions, and a game that looks cool.
- **G4. The game roles get their own agents and their own reading.** Today the agent that
  designs the game also writes the records, and its reading is the handbook. A Game
  Designer that reads the taste brief, the arcade's playtest log (what the executive kept,
  killed and overrode, and why) and the game's design note, and nothing of the process,
  pitches and shapes the game.
- **G5. Keep lessons about fun.** Put the game-design lessons next to the Active rules,
  held to the same standard. For example: a cue a player can replace with a count isn't a
  cue.
- **G6. Keep numbers before the build, and give it teeth.** The plan's numbers include a
  scripted player who ignores the cue (a count, a rhythm, mashing), and the design has to
  beat it on paper before anything is built.

### The process

- **P1. Keep the records a fresh agent acts on, and stop writing the ones that retell.**
  - **Keep:** `next.md`, `direction.md`, `backlog.md`, the tickets, each game's design
    note, `retro.md` with its "did the last change help?", `tech-debt.md`, the ADRs, and
    the scorecard's table.
  - **Retire, or generate from the files above:** the board, the handoff, the input ledger
    (git and the issues hold it), `CHANGELOG.md` (the tags and reviews hold it), the
    scorecard's prose, the iteration `log.md`, and the learning log's history below the
    Active rules.
  - **Check at every retro:** a sprint changes fewer lines of studio docs than of game
    code.
- **P2. Before building a check on a record, ask whether the record should exist.** #47
  would copy `docs-current` into the push stage. With fewer records, most of what it
  guards can go instead. Direction rule 8 already says a change that removes beats one
  that adds.
- **P3. Let the executive steer without tripping the checks.** Land #21 first, or drop the
  rule that makes a steering edit by the executive a violation.
- **P4. Prune the backlog.** A row untouched for three sprints closes with a line, or moves
  to an ideas list. The top five stay Ready.
- **P5. Cycles are fine, waste isn't** (direction rule 8, as the executive restated it on
  this date).
  - "Cheaper" means less spent writing and re-reading records. Cache writes were $12.97 of
    sprint 09's $24.63, and they grow with what each fresh agent reads.
  - It never means less spent on the games, the reviewers or the playtesting.
  - Track the cost and the share of each sprint that went to games.
- **P6. Measure as you go.** Write each step's cost down when the step finishes, so a
  usage-limit stop or a resume can't erase it. Size a run to the usage window: sprint 07
  took 2 h 50 min and 1.4 M tokens, and sprint 09 hit the limit.
- **P7. Use what's new.** The restart's scan (below) looks first for what would serve
  G1–G4. Capabilities that already exist and aren't used are in the baseline.

**For the executive, at the restart:**

- Play Samovar on a phone and file a `studio verdict`.
- File one real `studio request`. The request lane has never been used.

## Capability baseline (2026-09-25)

What the AI tooling looked like when the studio was tabled. A restart compares what exists
then against this list, notes what's new, changed or gone, and rewrites the list with the
new date.

| Capability | At tabling | What it could do here |
|---|---|---|
| **Models** | Opus 5.5 is the largest the studio uses: the steps, the Independent Reviewer and the Playtester. Sonnet 5 runs QA, and Haiku 4.5 reads `next.md`. Fable 5.1 exists, but wasn't available to the executive on 2026-09-23 | Check again whether a bigger or newer model is available, and which step it would pay for (the Game Designer, G4; the Playtester) |
| **Claude Code: skills, a SessionStart hook, the Workflow tool** | Used. `studio-sprint.js` runs one fresh agent per step, parallel reviewers and structured results, and can resume after a stop | Resume without losing the cost figures (P6) |
| **Agents in isolated worktrees** | Available, not used | Parallel prototypes (G2), or two tickets at once without sharing a working tree |
| **Cloud agents and scheduled routines** | Available. ADR-0011 turned them down, because runs would be unattended and the checks need a local Chrome | A cadence without a keyboard, if cloud sessions can run the browser suites and the executive wants it |
| **Claude in Chrome (a real, visible browser)** | Available, not used. The Playtester drives headless Chrome through puppeteer | Real rendering, including WebGL for River Run, and a playtest the executive can watch |
| **Published Artifacts with a shared database** | Available, not used | A play card (G1) with the links, what to try, and Keep / Iterate / Kill buttons. The plan step reads the answers and copies them into the repository, which keeps Antigravity able to run the same flow |
| **Push notifications** | Available, not used | Tell the executive's phone that a build is ready to play (G1) |
| **Background tasks with a monitor and time limits** | Available, not used | A hung suite fails by name instead of holding the gate (TD-015) |
| **`/code-review ultra`** | Available, and only the executive can start it | A deep review of a season's branch before an epic review |
| **Antigravity (Gemini)** | Runs the same sprint through the `studio-sprint` skill. Not used since ADR-0011 | Check again what its agents can do, and whether a second model family should review or playtest |

## How a restart works

"Restart the studio" (or "run the studio" while it is tabled) runs the `restart` step in
its own run (the steps are in the `studio-iteration` skill):

1. Two scouts, one on tools and one on practice, look for what is new since the baseline's
   date.
2. The restart reads this page, `direction.md`, the last retro, the owner's open `studio`
   issues, the questionnaire, the arcade's playtest log since the tabling, and what
   changed in the arcade since then.
3. It decides every feedback item and every finding: adopt now, try in the first sprint, or
   not now.
4. It picks the epic.
5. It appends to the *Restart log* and rewrites the baseline with the new date.
6. It sets `next.md` to the next `plan`, and stops, so the executive can read what changed
   before the first sprint of the new season runs.

## Restart log

Each tabling and each restart adds a line: the date, what the scan found, what changed, and
what waits on the executive.

- **2026-09-25, tabled** after sprint 09's retro, before plan 10
  ([SHS-076](../iterations/09/tickets/SHS-076-table-the-studio.md)). This brief, the
  feedback (G1–G6, P1–P7) and the first capability baseline were written. Nothing waits on
  the executive until the restart.
