# Iteration 06 — stand-up log

Done / next / blocked, per role that acted. One entry per session (ADR-0009), pushed when it
is committed.

## Session 1 — plan (2026-09-22)

- **Scrum Master** — *Done:* preflight green (tree clean, on `main` in sync, no `STOP`,
  baseline suites green in 84 s). E1 has sprints left: this is sprint 2 of 3 (+1 reserve,
  unclaimed). Three planned tickets plus the record, one of them studio machinery
  ([SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md)). *Next:* build [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md). *Blocked:* nothing.
- **Product Owner** — *Done:* logged the chat focus and Q12's blank answer in the input
  ledger; the inbox was empty. The focus became backlog #32 at the top, which took the
  process slot from #21. #22 was split: the fork's Tone fix is in the sprint, production's
  twin is #33. The `SS-NNN` mentions are #34. Q12's ⭐ stands and Q12 left the
  questionnaire. *Next:* nothing until review. *Blocked:* nothing.
- **Tech Lead** — *Done:* counted the job before sizing it: 383 mentions of the 16
  ticketed numbers in 52 Markdown files, none linked, and the examples and code spans
  that must stay plain. Ordered [SHS-061](tickets/SHS-061-river-run-tone-start-time.md) after [SHS-060](tickets/SHS-060-river-run-power-ups.md), since its exemption rests on the
  equality test [SHS-060](tickets/SHS-060-river-run-power-ups.md) retires. *Next:* build [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md). *Blocked:* nothing.

## Session 2 — build [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md) (2026-09-22)

- **Technical Writer / Learning Lead** — *Done:* [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md). `tests/studio/link-tickets.mjs`
  linked 378 ticket mentions in 48 files; a second run changes nothing. Of the 390
  mentions of [SHS-043](../03/tickets/SHS-043-ticket-prefix.md)…058, 349 are links now. The 41 left plain are code, title lines and
  self-mentions. Two cases were added at build because the checks read them: a file's
  title line (`# ID — …`, read by `ticketFileProblems` and `readReviewRecord`) and commit
  subjects (`commit-lint`'s handbook test). The arcade's two Black Hole in One docs went in
  their own `docs:` commit. `process.md` and the ticket template carry the rule, and the
  retro runs the script. `npm test` 815/815, `--stage=ticket` green. *Next:* build
  [SHS-060](tickets/SHS-060-river-run-power-ups.md). *Blocked:* nothing.

## Session 3 — build [SHS-060](tickets/SHS-060-river-run-power-ups.md) (2026-09-22)

- **Game Designer** — *Done:* [SHS-060](tickets/SHS-060-river-run-power-ups.md), both power-ups in one session, so no split. The
  shield and the spread shot float in the fork, with a HUD, sounds that respect mute, and
  Watch Mode unaffected. The equality test is retired with a note and the edit list is kept
  as the record. Four browser subtests, each shown red by a mutation. `--stage=push` 11/11,
  live at `/studio/games/river-run/`. Found the top controls covering the score on a phone
  (pre-existing, backlog #35). *Next:* build [SHS-061](tickets/SHS-061-river-run-tone-start-time.md). *Blocked:* nothing.

## Session 4 — build [SHS-061](tickets/SHS-061-river-run-tone-start-time.md) (2026-09-22)

- **Audio / Juice** — *Done:* [SHS-061](tickets/SHS-061-river-run-tone-start-time.md). Reproduced with a stack before fixing: the
  throw was `musicSequence.stop()` against a stopped Transport, not a start time, and it
  aborted `initGame` before the game loop, so a restart could freeze the river. The fork
  disposes the old sequence instead and guards the music restart. The exemption is gone,
  TD-014 closed, and a 20-restart browser test was red, then green three runs in a row.
  `--stage=push` 11/11, live at `/studio/games/river-run/`. Backlog #33 (production's twin)
  now names the freeze. *Next:* review. *Blocked:* nothing.

## Session 5 — review (2026-09-22)

- **QA** (`opus`) — *Done:* walked every criterion (17/17 met), played the fork at
  375×667 with a storage-write log, and ran 30 restarts. **Approve with findings.**
  *Next:* none. *Blocked:* nothing.
- **Independent Reviewer** (`fable`) — *Done:* read the diff in full, mutation-tested the
  restart test, and reproduced production's freeze (28 of 39 restarts). **Approve with
  findings.** *Next:* none. *Blocked:* nothing.
- **Scrum Master** — *Done:* every finding answered in `review.md`. Two fixes were made now:
  the spread shot's shot pool (`8a7a604`, player-facing) and the link lib's header
  (`c361b17`). Backlog #33 and #35 were reworded, #36 and #37 are new, and the arcade bug
  row p0-17 went in its own `docs:` commit. Two findings were declined with reasons. No
  second round. *Next:* close. *Blocked:* nothing.
