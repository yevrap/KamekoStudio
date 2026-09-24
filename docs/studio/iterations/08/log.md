# Iteration 08 — stand-up log

Done / next / blocked, per role that acted. One entry per session (ADR-0009), pushed when it
is committed.

## Session 1 — plan (2026-09-24)

- **Scrum Master** — *Done:* preflight green (tree clean, on `main` one commit ahead with
  the executive's questionnaire answers, no `STOP`, baseline suites green in 180 s). E1
  closed at retro 07; E2 adopted, sprint 1 of 3 (+1 reserve, unclaimed). Three planned
  tickets plus the record; one is studio machinery ([SHS-070](tickets/SHS-070-checks-accept-studio-branches.md)). The executive's
  unticketed `docs(studio)` commit (`1b798e2`) failed `commit-lint` at `--stage=push`; it is
  now in `COMMIT_EXEMPTIONS` under [SHS-071](tickets/SHS-071-iteration-record.md), test red then green. *Next:* build
  [SHS-068](tickets/SHS-068-samovar-core.md). *Blocked:* nothing.
- **Product Owner** — *Done:* E2 moved to *Current epic* and logged. The questionnaire
  answers logged: Q1 (keep the name) folded into the design, Q13 (a production fix may bump
  `version.json`) made #43 Ready, the Q5 note already covered. Two owner `feedback` issues
  (#3, #4) logged for retro 08. #40 split into #40 / #49 / #50; #48 refined into
  [SHS-068](tickets/SHS-068-samovar-core.md) on Q14's ⭐. *Next:* nothing until review. *Blocked:* nothing.
- **Game Designer** — *Done:* three pitches in [plan.md](plan.md#three-pitches); Samovar ⭐ as
  Q14, with its hypothesis written into the ticket before the build. *Next:* review, with
  the Playtester, against that hypothesis. *Blocked:* nothing.

## Session 2 — build SHS-068 (2026-09-24)

- **Frontend Developer** — *Done:* [SHS-068](tickets/SHS-068-samovar-core.md), Samovar's core loop in `studio/games/samovar/`
  (`8a351b7`), on the shelf as `PROTOTYPE`, design note in `docs/studio/games/samovar.md`.
  `tests/studio/samovar.test.mjs` 14/14, `--stage=ticket` 5/5. *Next:* build
  [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md). *Blocked:* nothing.
- **Game Designer** — *Done:* tuning recorded in the design note; an evening draws 10 of the
  12 cup-and-strength pairs so no pour repeats. *Next:* review, against the hypothesis.
  *Blocked:* nothing.

## Session 3 — build SHS-069 (2026-09-24)

- **Frontend Developer** — *Done:* [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md), both halves (`9c00a38`): a far-off
  pickup glows its colour about 26 px across (was 8–10 px), the pickup box unchanged, and
  the power-up label is 26 px in every state (was 28 / 23). Section 6 of the fork's test,
  red then green; `--stage=ticket` 5/5, `--stage=push` green. *Next:* build
  [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md). *Blocked:* nothing.

## Session 4 — build SHS-070 (2026-09-24)

- **Tech Lead** — *Done:* [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) (`4b8dd72`): `on-main` is now `on-branch`, which
  accepts `main` or `studio/SHS-NNN-slug` and still fails behind `origin/main`, and
  `commit-lint` no longer counts a squash-merge's ` (#N)`. `branch-check.test.mjs` 18/18
  on scratch repositories, red first against the old check and a loose `studio/*` rule;
  three lint and guard cases in `rules.test.mjs`. `--stage=ticket` 5/5, `--stage=push`
  green on `main`. *Next:* review. *Blocked:* nothing.

## Session 5 — review (2026-09-24)

- **Scrum Master** — *Done:* one review round, run by the workflow: the Independent
  Reviewer (`opus`) approved with findings, QA (`sonnet`) approved, no second round.
  Verdicts and every finding are in [review.md](review.md). *Next:* close. *Blocked:*
  nothing.
- **Frontend Developer** — *Done:* the review's S fixes. `14d4db8` ([SHS-068](tickets/SHS-068-samovar-core.md)): the drawer
  holds Samovar through a hide and show, and Space pours guest after guest (IR08-3,
  IR08-4), each with a browser test red first, suite 16/16, and the README's short-cup rule
  (IR08-5). `--stage=ticket` 5/5. *Next:* nothing until plan 09. *Blocked:* nothing.
- **Tech Lead** — *Done:* `fd3cc18` ([SHS-070](tickets/SHS-070-checks-accept-studio-branches.md)): a ticket branch ahead of `main` reads *not
  merged into main yet* (IR08-6), red first, 19/19. IR08-7 declined with its reason.
  *Next:* close. *Blocked:* nothing.
- **Game Designer** — *Done:* the Playtester's **Iterate** on Samovar and **Keep** on the
  fork's pickups recorded. The design note now says what the review found (IR08-1: one cup
  shape makes the stop the same share of every cup; IR08-2: the brim isn't the lesser
  skill). Backlog #51–#54 for sprint 09, and Q15 (⭐ A, cup shapes). *Next:* plan 09 acts
  on the Iterate. *Blocked:* nothing.

## Session 6 — close (2026-09-24)

- **Scrum Master** — *Done:* the close records (`b69ce67`): the changelog's
  `studio-iteration-08` section, the pulse line, Samovar's shelf entry (its first verdict)
  and River Runner's (iteration 08), backlog #48, #42, #44 and #40 marked done, the
  Playtester's verdicts in the input ledger, [SHS-071](tickets/SHS-071-iteration-record.md) Done. `review.md` needed nothing more:
  its *In plain words*, demo and verdicts were written at review. The gate went 11 of 11 on
  its first run (base `studio-iteration-07`). Pushed, tagged `studio-iteration-08`;
  postdeploy found each marker live: `hold('drawer'` in Samovar's `main.js` and
  `PICKUP_GLOW_PX` on the fork on the first attempt, the new pulse line on the realm on
  the second. No request issue shipped this sprint; the two open `feedback` issues (#3, #4)
  are the retro's. *Next:* retro. *Blocked:* nothing.
