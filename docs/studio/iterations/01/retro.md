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
- **A rule that decides what may be written is a whitelist.** "Anything but X" is a
  guess about what an attacker will use. (SS-016, ADR-0005)
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

Used, and then some. SS-014 was the debt share and closed TD-002. SS-016 and SS-017 were
unplanned, added by the review, and together came to roughly a third of the iteration —
which is what a rejected diff costs. The three committed tickets all landed; nothing was cut
to pay for the review work.
