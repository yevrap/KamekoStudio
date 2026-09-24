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
