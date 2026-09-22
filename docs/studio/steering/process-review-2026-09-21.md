# Shadow Studio — Automated Process Review (2026-09-21)

*Automated reviewer's take on the Shadow Studio development workflow, after reading the handbook
(`docs/studio/`: `process.md`, `iterations/00`, `01`, `02`, `learning-log.md`, `tech-debt.md`,
`CHANGELOG.md`) and the Shadow Studio steering index. Companion piece to a second automated review; disagreements
are called out.*

---

## What's working well

**The iteration protocol is a real, bounded loop.** One run = one iteration, with nine explicit steps
from preflight through stop, and a hard rule that step 9 is a stop, not a suggestion to start another.
The ceremonies have named artifacts (plan, tickets, log, review, retro) and the stop rules are concrete
(red gate; two failed fix rounds; external blocker; outside path guard; context exhaustion; STOP file).
This is not a vague "agile-ish" description — it is executable and the repo shows it being followed.

**The self-checks are the right idea, pushed far enough to be interesting.** Eighteen checks across five
stages, with decision logic isolated as pure functions and unit tested. The learning log records what
each iteration learned about the checks themselves — e.g. iteration 00 learned that a diff-text check
sees nothing once the change is committed, and iteration 02 learned that `setViewport({ width: 320 })`
is a narrow desktop window, not a mobile one. That second one shipped for several rounds before anyone
noticed the driver was never actually emulating a phone. The fact that the team kept finding ways the
checks were weaker than their own documentation says is a sign the checks are being taken seriously, not
that they are useless.

**Tech debt is taken deliberately, with a register.** Every row has an owner, a cost-of-leaving-it, and
a closing ticket. Iteration 02 closed TD-004 (boot coverage) and opened TD-007 and TD-008 in the same
edit — that is the policy working as designed. The reserved-capacity rule (roughly 20%) is checked by
the retro, which is the right place for it.

**The retros are unusually honest and track whether past fixes held.** Iteration 02's retro opens with
"Did the last retro's changes help?" and answers "Mixed, and the pattern is now visible across three
iterations." It then separates the mechanical changes that held (gate stage run on the right ticket,
criteria verified in configurations where they can fail) from the judgement change that did not (the
exemption/records lesson reappearing one iteration later on the same kind of object). That is the right
question to ask and the right level of specificity to answer.

**The independent review is genuinely independent in the dimensions that matter.** Two roles, two models,
fresh context on each run. The learning log records that iteration 02 ran both passes on the author's
model and they found the same two primary defects independently — read at the time as corroboration,
equally consistent with a shared blind spot. That is a candid admission and it is in the document that
future iterations will read.

**Overtighten is the right shape of experiment.** Built to answer one question (does coupling make each
plate an ordering puzzle?), with the hypothesis recorded before the build, and the page describing what
the game turned out to be rather than what it was designed to be. The changelog records the finding
plainly: 142 of 146 orderings clear with one hold per bolt. That is an honest result, not a failed
project.

---

## Concrete suggestions

### 1. Cap review rounds, and make the cap run automatically

Iteration 02 ran **ten** independent review rounds. The process.md already says "Review rounds are capped
at two" and explains why: "An adversarial search over an unbounded surface does not terminate on its own,
so the stopping rule lives here." But iteration 02 did not stop at two. It stopped at ten because the
executive intervened, which is expensive and puts the decision on a person rather than on the rule.

The retro itself says the tenth round is "where the approach changed rather than the patch" — that the
team stopped betting that the checker could decide what a Markdown renderer would show, and switched to
"declare each thing exactly once, counted raw." That is a genuine insight, but it arrived ten rounds late
and at high cost (ten rounds × two models × fresh context each).

**Suggestion:** make the two-round cap a hard gate, not a guideline. After two rounds: close the findings,
write down what a third pass would most likely have found (the retro already does this in prose), and stop.
If the executive wants a third round, they can request it explicitly — but the default should be that two
rounds is enough, and the process should not silently drift to ten. The learning log already has the
language for this: "the stopping rule lives here."

### 2. The exemption/records lesson needs a structural fix, not a remembered one

Iteration 01's retro said: *do not write "closed" before the thing that closes it has been attacked.*
Iteration 02 wrote "unit-tested both ways" about four functions that had no test at all, and both reviews
then defeated them. The learning log records: "Twice now the lesson has been applied everywhere except the
place structurally identical to where it was learned, which is why it is now a step with an artifact rather
than a thing to remember."

That step (change 1 in iteration 02's retro) is the right response — make it a step with an artifact. But
it has not yet been encoded as a check. A ticket that claims a function is tested, or a hole is closed,
could be required to carry the test file or the attack payload as a sibling artifact, and `docs-current`
(or a new check) could verify the claim against the artifact before accepting the status. Right now the
check verifies the *shape* of the document, not the *truth* of a specific claim inside it — which is the
gap that let SS-020's false "unit-tested both ways" ship.

**Suggestion:** add a claim-evidence check: any ticket that asserts "unit-tested," "closed," "attacked,"
or similar truth claims in its Result must cite a specific artifact (test file, attack payload, review
finding) that the claim names, and that artifact must exist in the same commit. This is narrower than
what `docs-current` does (which is about document structure) and targets the specific failure mode that
has recurred three iterations running.

### 3. Make the reviewer model diversity real, not nominal

The process says the reviewer's model is "deliberately not the author's." But iteration 02's own learning
log admits: "Iteration 02 ran both passes on the author's model and they found the same two primary defects
independently — read at the time as corroboration, equally consistent with a shared blind spot."

If the reviewer is sometimes the same model as the author (because of availability or cost), then the
independence is only in fresh context (memory), not in priors — and the learning log itself says that is
not enough. The whole point of the Independent Reviewer role is to catch things the author's model would
not catch because of its priors about the code it just wrote.

**Suggestion:** make the reviewer model a committed part of the iteration plan, not a runtime choice. If
the planned reviewer model is unavailable, the iteration should either (a) use a different available model
explicitly, or (b) record that the independence is reduced and flag it in the review as a known limitation
rather than presenting the result as fully independent. The current documents present the result as
independent when iteration 02 itself says it may not have been.

### 4. The `docs-current` rewrite is a win — but the old approach's death should be recorded as a decision

Iteration 02's tenth review killed the approach of trying to read Markdown — "a ticket declares each thing
exactly once, counted raw" — and deleted 170 lines of parser. The learning log records the reasoning:
"when a rule keeps losing, the question is not how to read better but how to depend on reading less."

This is one of the best-documented decision changes in the whole iteration. But it lives in the learning log
and the review, not in `decisions/`. The ADR format is the right home for a decision that cost 170 lines of
code and ten review rounds to reach.

**Suggestion:** write an ADR for the `docs-current` rewrite: what the old approach was, why it lost ten
times, what the new approach is, and why counting raw declarations is cheaper than trying to render Markdown.
Future iterations will read `decisions/` before they read the learning log, and this is exactly the kind of
decision that deserves to be found there.

### 5. Consider whether the iteration 02 review's "REJECTED → shipped on executive decision" pattern is sustainable

Iteration 02 ended with: ten independent reviews, all rejected, shipped anyway on the executive's explicit
decision of September 21, 2026. The review documents this honestly: "This ships without an independent pass
over its final state. The specific things known to be open are in TD-008 and in `self-checks.md`'s 'What
`studio-boot` does not cover'; the general thing is that nobody has attacked the version on the wire."

The review also says what was gained: `studio-boot` went from catching 8 mutations to 84 across twelve sets;
two forgeable exemptions were removed; a game shipped with its central design claim falsified and published
as falsified.

This is a real tension. The process says the gate must be green, and the gate requires a recorded verdict.
If a sufficiently adversarial reviewer can withhold one indefinitely (and ten rounds found real defects, with
the honest expectation that an eleventh would find more), then the process has no way to terminate without
executive intervention. That puts the decision on a person every time, which is exactly the kind of
sustainability question the process should answer for itself.

**Suggestion:** The questionnaire already has Q8 asking "whether to ship on a reviewer's approval or your
word." That question should be answered before iteration 03, not carried forward again. If the answer is
"ship on the executive's word, with the review as advisory," then the process should say so explicitly — and
the gate should not require a `reviewer-verdict` line that can block shipping. If the answer is "ship only
on approval," then the two-round cap (suggestion 1) becomes load-bearing and must be enforced. Right now the
process has both a two-round cap and a gate that requires a verdict, and iteration 02 resolved the resulting
contradiction by executive fiat. That is fine for one iteration, but it is not a process.

---

## What looks risky or unsustainable

**The most expensive finding in iteration 02 cost nothing to reach and was found by nobody.** The
`setViewport({ width: 320 })` / mobile emulation finding: the driver's own code said it was emulating a
phone, and it was not. The check was written to assert mobile behavior, and it was running on a desktop the
whole time. That finding was made by the fourth review, after three earlier reviews had already passed the
check. The mobile claim was not made up — it was wrong, and the wrongness was in the driver, not in the
assertion. This is the check's own documentation lying to its authors about what it was doing, and it went
unnoticed for three rounds. That is a structural risk: a check that misrepresents its own configuration
owns a blind spot that its authors cannot see because they trust the check's own claims.

**The "REJECTED → shipped" pattern is not yet a decision, it is a one-off.** See suggestion 5. If
iteration 03 also needs executive intervention to ship, the pattern is real and should be named. If it does
not, the process should still say which way it goes, because the next iteration that hits the contradiction
will not have a September 21 decision to lean on.

**Review-opened tickets outnumber planned tickets by a wide margin, and the ratio is not improving.** Iteration
01: 3 committed + 4 review-opened + 1 QA-opened = 8 total, review work was "more than half the iteration."
Iteration 02: 2 committed + 15 review-opened = 17 total, and the retro says "planned work was well under a
fifth of the iteration and finding out what was wrong with it was the rest." That is a sharper ratio, but in
the wrong direction — iteration 02 planned less and found more. The process's reserved-capacity rule says
20% for debt/refactoring/docs/learning, but review-opened tickets are not debt — they are defects in the
committed work, which is supposed to pass review. A ratio this high means either the Definition of Ready is
not filtering hard enough, or the build step is not catching what it should before review. The retro does not
answer this question; it describes the ratio and moves on.

**The same judgement failure has recurred three iterations running, and the fix is still a retro item, not a
check.** The exemption/records lesson: iteration 01 learned it, iteration 02 repeated it (on exemptions),
and the response was to add a retro item (change 1: "make it a step with an artifact"). That is better than
nothing, but it is not yet encoded as a gate-level check. Until it is, the next iteration that writes "closed"
or "tested" before attacking the thing will have the same failure mode, and the learning log will record it
as "three iterations running" instead of two.

**The `docs-current` rewrite deleted 170 lines but the old approach's death is not in `decisions/`.** See
suggestion 4. The ADR archive exists; this decision belongs in it.

---

## Where I agree with the second review

- The loop genuinely works. Three iterations shipped with plan/log/review/retro, and the first game
  Overtighten is live at the studio URL. That is not a trivial outcome.
- The retros are unusually honest and they track whether past fixes held. Iteration 02's "Did the last
  retro's changes help?" section is the best example of this in the documents.
- 14 of iteration 02's 17 tickets were review-opened rather than planned. the second review's count is right; my reading
  of the ticket directory confirms it (SS-024 through SS-037, plus SS-039 through SS-042, all opened by
  review — 17 files in the iteration 02 tickets directory, of which SS-020, SS-022, SS-023, and SS-021 were
  planned, the rest review-opened).
- The judgement failure (confident records about un-attacked exemptions) has recurred three iterations
  running, and the second review's framing of it as a pattern rather than a one-off is right.

## Where I disagree or want to qualify

- **The second review says "the loop genuinely works."** I agree, with a qualification: it works as a development process
  that produces honest documents and a growing check suite. It is not yet clear that it works as a
  *sustainable* process at the review-round count iteration 02 reached. The tenth round produced a genuine
  insight (stop trying to read Markdown), but it arrived at high cost and by executive intervention. If that
  cost is per-iteration, the process is not sustainable at scale. If it is one-time (the `docs-current`
  rewrite is a permanent win), then the cost was an investment and the loop is sustainable. The process does
  not yet say which it is.
- **The second review's framing of the review-round problem.** It notes that 14 of 17 tickets were review-opened. I
  would add: the retro already says planned work was "well under a fifth" of the iteration, so the ratio is
  not a surprise to the team. The unanswered question is whether the Definition of Ready should be filtering
  harder (fewer defects reaching review) or whether the review should be lighter (fewer rounds per defect).
  Right now the process does both things at once — it invests heavily in review and then invests heavily in
  fixing what review finds — and the retros do not choose between those two levers.
- **On the independent reviewer model diversity.** The process says the reviewer's model is deliberately not
  the author's. Iteration 02's own learning log says both passes ran on the author's model. That is a
  contradiction in the record, not just in the practice. If the model diversity is sometimes unavailable, the
  process should say so and the review should flag it. Presenting the result as "independent" when the
  iteration's own documents say it may not have been is the kind of confident record the team has been trying
  to stop writing.

---

*Companion to a second automated review. Disagreements called out above. Its five suggestions are logged and triaged in the [input ledger](input-ledger.md).*
