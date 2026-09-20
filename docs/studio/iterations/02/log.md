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

## After SS-022 — the first experiment

- **Game Designer** — *Done:* Overtighten, three plates, the hypothesis recorded before the
  build as the plan required. *Next:* the independent passes. *Blocked:* nothing.
- **UX / Art Direction** — *Done:* two defects found by looking at the thing rather than at
  its tests — the tolerance band was drawn under the fill in a wash colour and was
  effectively invisible in both themes, and the gauge radius existed in two files. *Next:*
  nothing outstanding.
- **QA Engineer** — *Done:* six mutations to the game, each demonstrated failing the new
  contract. *Next:* the independent pass.

## After the independent passes — rejected

Both ran with fresh context and neither saw the other's report.

- **Independent Reviewer** — *Verdict:* **REJECTED.** Two headline claims false: the boot
  check's exemption is untested and passes a studio-owned `shared/settings.js` throwing
  uncaught, and the plate tests do not check the design hypothesis, which every shipped
  plate fails.
- **QA Engineer** — *Done:* three of the iteration's claims falsified. Found the same
  exemption bypass independently, plus three mutations to `studio/**` that break something a
  player would notice and that the whole ticket stage survived. Cleared all three plates
  through the real interface with one hold per bolt — the plan's own falsifier, met exactly.
- **Scrum Master** — *Done:* three tickets opened rather than patched in place, per the
  iteration 01 pattern: SS-024 (the check), SS-025 (the game's input), SS-026 (the
  hypothesis). Fix-round cap not reached on any ticket. *Blocked:* nothing — the redesign
  question goes to the executive rather than into a ticket.

## After SS-024, SS-025, SS-026 — the findings closed

- **QA Engineer** — *Done:* every bypass both reviews demonstrated, replayed against the
  hardened check; all five fail, and the original eight still fail. *Next:* the gate.
- **Front-end / Gameplay Dev** — *Done:* seven input and focus defects, each verified
  against QA's own reproduction steps in a real browser.
- **Game Designer** — *Done:* the hypothesis measured rather than argued — 142 of 146
  orderings fall to one hold per bolt — and recorded in the tests, the page, the constants
  and the README. Nothing re-tuned. *Blocked:* the redesign is the executive's call.
- **Technical Writer** — *Done:* review, retro, changelog, learning log, the debt register,
  and the correction to SS-020's Result, which claimed a test that did not exist.
