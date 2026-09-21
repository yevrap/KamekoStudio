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

## After the sixth review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** The headline count was false about
  the configuration it named: two of the counted mutations were game defects reproduced by
  hand with no rule behind them, and `docs-current` runs at the gate, not the ticket stage.
  `docs-current` still passed an evidence-free ticket four ways, because the fix's own
  fallback was fail-open. Four record statements stale, two in files the previous ticket
  had just rewritten.
- **QA Engineer** — *Done:* SS-033. The two behaviours that had only ever been reproduced
  by hand now have rules; `docs-current` returns null rather than the whole file and a Done
  ticket with no Result section is a failure; a shelf card may not link to the shelf's own
  page and a back link may not be `#`. *Next:* nothing outstanding.
- **Technical Writer** — *Done:* every count re-measured by re-running all eight mutation
  harnesses at this commit and stated **with the stage it fails at**. Two harness entries
  had themselves gone stale against source SS-025 rewrote and were fixed rather than
  trusted. *Reflection:* the number was arithmetically right and false about its predicate,
  which is the same defect as a check measuring in a configuration where nothing can fail.

## After the seventh review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** Six rounds hardened how evidence is
  read; the **status word** that gates every one of those checks was still matched against
  the raw file, so a hidden line forged it and skipped all of them — demonstrated on this
  iteration's own SS-033. The back-link and status-churn rules added the round before were
  each satisfied by the defect they named. Four count statements false, and round six was
  never narrated in `review.md` at all.
- **QA Engineer** — *Done:* SS-034. The status and the criteria count are now read from the
  text a reader sees, through the same stripping as the evidence; the back link is judged on
  where it **resolves**; the churn rule has a floor as well as a ceiling; the torque arc must
  tell the four states apart on its own. *Next:* nothing outstanding.
- **Technical Writer** — *Done:* rounds six and seven narrated, every count corrected, the
  `self-checks.md` rows that described superseded rules rewritten.
  *Reflection:* the missing round-six section was not a separate defect from the stale
  counts — it **was** the cause. A narrative with a hole in it keeps producing wrong numbers.

### One thing this round got right by accident

The new state-ink rule failed against the real page on its first run. The cause was a 120ms
stroke transition: a computed colour read immediately after a class change is still the
previous state's, so all four states read as loose. The rule was right and the observation
was taken at the wrong moment — the same error as measuring in a configuration where
nothing can fail, at the scale of a single frame. Caught by the check's own baseline before
it could be written up as evidence.

## After the eighth review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** All three rules the previous round
  added were satisfied by the defect they named: a back link rule that accepted
  `index.html`, a states-must-differ rule satisfied by four greys one unit apart, and an
  unticked-criteria rule that missed ordered items.
- **QA Engineer** — *Done:* SS-035. Rules about the thing rather than the spelling — pages
  compared, colours compared, declarations counted.

## After the ninth review — rejected

- **Independent Reviewer** — *Verdict:* **REJECTED.** `withoutHiddenText` fails *open*: it
  deletes text CommonMark renders, which promotes a draft Result over the real one. Five
  payloads, one invisible on the page. Two more spellings of the back link, a fourth
  spelling of an unticked criterion, and the criterion claiming `review.md` was sorted was
  itself false.
- **QA Engineer** — *Done:* SS-036. The document is scanned rather than stripped, and an
  unterminated block makes the ticket unreadable rather than half-read. *Next:* nothing
  outstanding.
- **Technical Writer** — *Done:* `review.md` sorted **by construction**, the headline split
  computed from the per-set table rather than carried forward, and every stale count
  corrected. *Reflection:* the order was wrong twice because each fix moved the section the
  author could see. Sorting is not an edit; it is a property to be produced.

## After the tenth review — rejected, and the approach changed

- **Independent Reviewer** — *Verdict:* **REJECTED.** Four more ways past `docs-current`,
  three invisible on the rendered page: a comment or a `<script>` inside a blockquote was
  never recognised as an opener, so the scanner reported hidden text as *visible*; an HTML
  block interrupting a paragraph was missed; a nested list's indent hid a visibly unticked
  criterion. `review.md` missing its ninth round and carrying four credit subsections
  stranded under the seventh in reverse order.
- **Tech Lead** — *Done:* stopped patching and ended the approach. Ten rounds had all bet
  that this checker could decide what a Markdown renderer would show; the surface is the
  whole of CommonMark. A ticket now declares each thing exactly once, counted raw. 170
  lines of parser deleted. *Blocked:* nothing.
- **QA Engineer** — *Done:* SS-037. All six payloads fail, five with the same message.
  Every one of the thirteen hiding places found across ten rounds is now a unit test, in
  both orderings.
- **Technical Writer** — *Done:* `review.md` re-filed so each round's credits sit under
  that round; rounds nine and ten narrated; the count re-measured per set.
  *Reflection:* the sort was wrong twice because both fixes moved only what their author
  could see — top-level headings the first time, one section the second. The subsections
  were never in the sort's scope and nobody checked what its scope was.
