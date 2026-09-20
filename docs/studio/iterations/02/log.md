# Iteration 02 — stand-up log

Three lines per entry: done / next / blocked, per role that acted. Written between tickets,
not reconstructed afterwards.

## After SS-023's first commit — the plan

- **Product Owner** — *Done:* took the three standing defaults explicitly: no portal yet,
  build the first experiment, keep the names. *Next:* SS-020, so the new game is built
  against a check that already exists. *Blocked:* nothing.
- **Scrum Master** — *Done:* two committed tickets against the cap of 2–3, plus the record
  ticket, recorded in the plan rather than quietly exceeded. *Next:* watch the fix-round
  cap on SS-022, which is the only ticket here with real unknowns. *Blocked:* nothing.

## After SS-020 — boot coverage

- **QA Engineer** — *Done:* `studio-boot`. Each of the eight mutations named in iteration
  01's QA pass was applied to a clean tree and demonstrated failing, with the message
  recorded on the ticket. *Next:* the independent pass over the whole diff at the end.
  *Blocked:* nothing.
- **Tech Lead** — *Done:* the judgement is pure and unit-tested without a browser; the
  driver only gathers. The check's one exemption — production's settings script, which
  throws in the blocked-storage configuration — matches on the throwing file from the
  stack, not on the message. The message is `SecurityError: denied` and names nobody, so
  a message test would have exempted the studio's own code for throwing the same thing,
  and mutation 8 would have passed. *Next:* SS-022. *Blocked:* nothing.
- **Data & Systems Dev** — *Done:* nothing to sign; no storage changed.
- **Technical Writer** — *Done:* `self-checks.md`, both test READMEs, TD-004 closed and
  TD-007 opened in the same edit that took the debt. *Next:* the record.

### One thing the plan got wrong

Creating `docs/studio/iterations/02/` made the realm's pulse line stale immediately — the
line is tied to the newest iteration directory, and the plan landing is what creates it.
The test caught it on the next run. It was fixed as its own SS-023 commit rather than
folded into SS-020, because `shelf-data.js` is not SS-020's file; the plan should have
listed it as a dependency and did not. Carried into the retro.
