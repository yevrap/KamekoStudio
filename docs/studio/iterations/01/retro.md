# Iteration 01 — retrospective

## Went well

- The check written for the defect reproduced it before the fix existed: `portal-capacity`
  printed *"11 games but only 9 portal slots — the last 2 would be dropped silently"*
  against the untouched repository, and passed only once the row was added. A check that
  has never failed has not been tested.
- Measuring beat reasoning, twice. The portal row was moved because bounding boxes read out
  of the running scene turned "it looks fine" into 0.01; the killed-card treatment changed
  because a composited contrast ratio came back 3.69:1 when the comment next to it claimed
  the text stayed legible.
- The empty shelf shipped as an empty shelf.

## Didn't

- **The security-relevant rule was the one place the iteration-00 lesson was not applied.**
  The retro said *test the input that defeats the rule*. The adversarial test written for
  the path exception used `fetch("http://example.com")` — which the rule caught on the
  parenthesis, not on the block's shape. Four payloads that need no parenthesis went
  straight through. The test confirmed the implementation rather than attacking the
  boundary, on the one boundary between the studio and a production file.
- **A closed hole was recorded before it was closed.** Three documents asserted the
  smuggling hole was fixed. It had been narrowed, not fixed. Writing the fix up as complete
  made it harder for the next reader to doubt it.
- **Gate-stage checks were never run during the build.** All three build tickets recorded
  `--stage=ticket` evidence, so `hygiene` — which only runs at the gate — first failed
  after the work was merged, on code the iteration itself added.
- The record drifted from the repository in small ways: two test counts overstated, three
  tickets marked Done with every criterion unticked, a clearance figure that named the
  wrong trophy.

## Change next time — each one already made

- **An adversarial test must fail against the rule it is attacking.** A test that passes
  against both the old and the new rule proves nothing about the fix. The four payloads in
  `rules.test.mjs` were each run against the old pattern first, and each bypassed it.
  (SS-016)
- **A rule that decides what may be written is a whitelist — and a whitelist is a grammar,
  not a character class.** "Anything but X" is a guess about what an attacker will use.
  The first correction was still a guess: `[-+*/\s\w.]+` reads as "arithmetic" and admits
  `delete a.b`, `new fetch` and `typeof x`, because a character class cannot forbid two
  operands sitting next to each other. Say what the thing *is*. (SS-016, SS-019, ADR-0005)
- **Write the adversarial test against the rule in force.** Every payload written for the
  whitelist had been aimed at the rule it replaced, so the suite documented the old hole and
  tested nothing. Each payload now goes at the live rule first, to watch it pass, before the
  rule changes. (SS-019)
- **Verify a criterion in the configuration where it can fail.** Three of SS-013's criteria —
  tap targets, horizontal overflow, uncaught errors — were checked against an empty shelf,
  which has no cards, no links and no data. Two defects fell straight out of putting six
  entries on it. (SS-019)
- **"Out of scope" describes what the ticket will not do, not what it cannot break.**
  SS-014 put the trophy shelf out of scope and then silenced four of its five trophies, and
  its evidence proved the portals worked without ever asking whether anything else still
  did. (SS-018)
- **Run the stage the check lives in, not the stage that is convenient.** Every ticket from
  iteration 02 records a `--stage=gate --skip-slow` run alongside its ticket-stage evidence,
  so a gate-only check fails on the ticket that caused it. (Added to
  `definition-of-done.md`.)
- **Test the check, not only the rule it calls.** The trim bug lived in the reader; the pure
  function was never wrong, so a pure-function test could never have caught it.
  `tests/studio/path-guard.test.mjs` reads the repository. (SS-016)
- **Write "closed" only after the thing that closes it exists and has been attacked.**
  Where a hole is narrowed rather than closed, the record says what remains — as
  `guardrails.md` now does for the comment lines. (SS-016)
- **Tick a criterion when its evidence is written, not at the end.** Iteration 00's
  correction — never tick before the artifact exists — had become never tick at all, which
  makes the Definition of Done unverifiable by inspection. (SS-017)

## Reserved capacity

Used, and then well past it. SS-014 was the planned debt share and closed TD-002. SS-016,
SS-017, SS-018 and SS-019 were all unplanned, added by two review passes and a QA run, and
together came to more than half the iteration — which is what a diff rejected twice costs.
The three committed tickets all landed; nothing was cut to pay for the review work, and
three new debt rows were opened rather than absorbed quietly (TD-004 restated, TD-005
restated, TD-006 new).

The honest summary of this iteration: the work it planned took about a third of it, and
finding out what was wrong with that work took the rest. Both review passes rejected the
diff, and both were right to.
