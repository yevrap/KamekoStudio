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

## After the second review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** The exemption anchored by SS-024 is
  still defeatable: a `//# sourceURL` comment mints a stack frame, so any studio file can
  claim production's identity. Seven more mutations inside `studio/**` pass the ticket
  stage, including emptying the shelf. A ticket is Done with an entirely empty Result and
  `docs-current` reads it as complete.
- **Tech Lead** — *Done:* stopped anchoring and removed the exemption. The blocked-storage
  pass serves an empty script in place of production's, so there is nothing left to forge.
  *Next:* the seven mutations. *Blocked:* nothing.
- **Scrum Master** — *Done:* three tickets rather than patches — SS-027 (the check), SS-028
  (the record), SS-029 (the turn loop). SS-027 reaches the two-round cap here.

## After the third review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** Deleting one exemption left another:
  the favicon filter read the same forgeable source, so a studio throw claiming
  `/favicon.ico` was dropped in every pass. Ten more mutations pass. `docs-current` passes
  an evidence-free ticket three further ways. One of the three numbers SS-028 was opened to
  fix is still wrong, with its criterion ticked.
- **QA Engineer** — *Done:* SS-030. The error filter is gone entirely — the driver answers
  the favicon request rather than recognising it afterwards — and all ten mutations are
  covered by observations the driver now takes. *Next:* nothing outstanding.
- **Front-end / Gameplay Dev** — *Done:* the coupling line's coordinates are rounded and
  unit-tested against the bolts they join; a transposed endpoint now fails.
- **Technical Writer** — *Done:* the wrong number on the **live page** (round-robin "four
  passes", actually three), the changelog asserting a superseded design as current, the
  learning log carrying a lesson the next review disproved, "three blind spots" over four
  bullets, and SS-024's last wrong count. *Reflection:* three of the four record defects in
  this round were in documents written by the pass that was meant to have fixed the record.

## After the fourth review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** Twelve mutations pass, the largest
  being that `studio-boot` has never used a mobile viewport while its code says it has.
  `docs-current` accepts an evidence-free ticket two further ways. Four false statements in
  the record, three of them in sentences written to correct the record — including a ticked
  criterion and an explicit "both are true now" about a verdict line that does not exist.
- **QA Engineer** — *Done:* SS-031. The driver emulates a phone, which is what makes the
  viewport meta tag load-bearing; the bolt's four states and the picker's locked treatment
  are read from fixtures and must differ; the coupling the game runs at is checked against
  the coupling the model specifies, for every plate. *Next:* nothing outstanding.
- **Technical Writer** — *Done:* the false criterion removed rather than re-explained — a
  ticket cannot tick a line the reviewer writes — and SS-028's correction corrected.
  *Reflection:* the record has now been wrong in three consecutive rounds, each time in a
  document written to fix the previous round's record. The change that follows is in the
  retro: a claim about another document is checked against that document, not remembered.
- **Tech Lead** — *Done:* TD-008 opened for what the check does not collect, because a gap
  described in prose schedules nothing.

## After the fifth review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED**, and explicitly not for the mutation
  surface, which it judged honestly disclosed. Four claims outran the truth: the
  sideways-scroll rule was killed by the previous ticket's own phone emulation and two
  documents still asserted it; `docs-current` still took evidence from a fence indented by
  one space; six statements said three reviews and 38 mutations after a fourth round; and
  the changelog recorded none of the fourth round, including the TD-008 row the iteration's
  honesty claim rests on.
- **QA Engineer** — *Done:* SS-032. One rule became three, each naming its own cause, with
  the scroll compared against `clientWidth` rather than against a number that tracks the
  overflow. *Next:* nothing outstanding.
- **Technical Writer** — *Done:* every stale count, the changelog's missing round and debt
  row, and a headroom figure that had been generalised past what was measured.
  *Reflection:* this is the fourth consecutive round with a record defect, and the second
  in which the ticket that fixed a rule broke another one in the same edit.
