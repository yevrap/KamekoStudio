# Iteration 02 — retrospective

## Went well

- **The reserved debt work paid for itself inside the same iteration.** SS-020 landed first
  precisely so the new game would be built against a check that already existed. It then
  caught the game's tap targets, its no-JS path and its blocked-storage path for free, and
  it is what the reviews had to attack in order to find the game's real defects.
- **Two independent reviews with fresh context found the same two primary defects
  separately.** Neither saw the other's report. That is the clearest evidence so far that
  the independence is doing work rather than costing tokens.
- **The reference solver and the play-through were honest about the plates being clearable.**
  What they were not honest about was what that proved. The evidence was real; the
  conclusion drawn from it was too large.

## Didn't go well

- **The iteration was rejected on a claim that was written before it was checked.** SS-020's
  Result said the exemption was "unit-tested both ways". It had no tests. This is iteration
  01's lesson — *do not write "closed" before the thing that closes it has been attacked* —
  reappearing one iteration later, applied to the same kind of object: an exemption.
- **A test was written to defend a design and could not fail.** It fixed the hold amount at
  the middle of the band, which was the one variable the player is free to choose. The
  resulting assertion was true and much smaller than the sentence above it claimed.
- **The plan did not list `shelf-data.js` as a dependency of creating the iteration folder.**
  The pulse line is tied to the newest iteration directory, so the plan landing made the
  page stale immediately. Caught by a test, fixed in a minute — but the plan should have
  known.
- **Three of the check's blind spots were about what it *did not look at*, not about what it
  judged wrongly.** Every rule it had was correct. It simply never collected the observation
  that would have failed.

## Changes, already made

1. **An exemption ships with its attacks, in the same commit.** Not "is tested" — the tests
   are the payloads that defeated the previous version. Ten of them now exist because two
   reviewers wrote them; they should have existed because the author did.
2. **A check that drives something collects errors while it drives it.** `observeOvertighten`
   ran focus, keys, pointer capture and stripping with nothing listening.
3. **A release is asserted after a settle, never at the moment of release.** Reading
   immediately after `mouse.up` cannot distinguish stopping from not stopping.
4. **Persistence is proved by a reload, not by a write.** Stated as what the player gets
   back, so stubbing the storage wrapper cannot pass it.
5. **Hiding something is a failure, not an exemption from the rule about it.** An invisible
   control now fails; `display: none` and `[hidden]` still do not, because that is the page
   choosing not to offer it.
6. **A test that defends a design must have a free variable left free.** Recorded in the
   learning log as the general form: if the strategy under test has a parameter the player
   chooses, fixing it proves something narrower than the claim.
7. **A plan names the files that its own existence invalidates.** Creating
   `iterations/NN/` stales the pulse line; that belongs in the plan's dependencies.

## Did the last retro's changes help?

Mixed, and the pattern is now visible across three iterations.

The mechanical changes held: the gate stage was run on the ticket that changed the code, so
`hygiene` failed on the right ticket rather than after three had merged; "out of scope" said
what each ticket would not do; the criteria were verified in configurations where they could
fail — the shelf fixture is built with three cards precisely because iteration 01 verified an
empty one.

The *judgement* change did not hold. Iteration 01's headline lesson was about exemptions and
confident records, and this iteration wrote a confident record about an exemption without
attacking it. Twice now the failure has been the same shape: the team applies a lesson
everywhere except the one place structurally identical to where it was learned. The response
is change 1 above — make it a step with an artifact, not a thing to remember.

## Reserved capacity

Used, and then some. SS-020 was the planned debt share and closed TD-004; SS-024, SS-025 and
SS-026 were all opened by the reviews. Planned work was roughly a third of the iteration;
finding out what was wrong with it was the rest — the same ratio as iteration 01.
