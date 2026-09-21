# Iteration 02 — review

## What shipped

| # | Item | Where |
|---|---|---|
| SS-020 | `studio-boot` — every page under `studio/**` opened in a real browser, three ways | `tests/studio/checks/boot.mjs`, `lib/boot-contract.mjs`, `lib/browser.mjs` |
| SS-022 | *Overtighten* — the shelf's first experiment | `studio/games/overtighten/` |
| SS-023 | The shelf's first entry and this record | `studio/shelf-data.js`, `docs/studio/iterations/02/` |
| SS-024 | The boot check's exemption anchored, its blind spots closed | opened by review |
| SS-025 | Overtighten's input, focus and live region | opened by review |
| SS-026 | The design hypothesis recorded as false | opened by review |
| SS-027 | The exemption removed rather than anchored; nine more attacks closed | opened by the **second** review |
| SS-028 | The record corrected, including about itself | opened by the second review |
| SS-029 | One hold runs one animation loop | opened by the second review |
| SS-030 | The last error filter removed; ten more attacks closed | opened by the **third** review |
| SS-031 | The record, the fence, the mobile viewport and the bolt's four states | opened by the **fourth** review |
| SS-032 | Three width rules for three causes; the fence, indented | opened by the **fifth** review |
| SS-033 | Rules for four defects that had none; `docs-current` fails closed | opened by the **sixth** review |

Live: <https://yevrap.github.io/KamekoStudio/studio/> · <https://yevrap.github.io/KamekoStudio/studio/games/overtighten/>

## The reviews

QA and the Independent Reviewer ran with fresh context and **rejected the diff**. They
worked separately and found the same two primary defects independently, which is the
strongest signal either of them produced.

### The exemption was untested and defeatable

`studio-boot` exempts one thing: production's `shared/settings.js`, which throws an uncaught
`SecurityError` when site data is blocked (TD-005) and is outside the path guard. The
exemption matched any path *ending* in `shared/settings.js`. `studio/**` is inside the guard,
so `studio/games/x/shared/settings.js` is a file the studio creates at will — and both
reviewers created it, threw uncaught from it, and watched the check print `pass`.

`firstFrame` also did not return the first frame: it matched the parenthesised form against
the whole stack before the bare form, so a named production frame beat an anonymous studio
frame above it.

None of the four error helpers had a test, while SS-020's Result claimed they were
"unit-tested both ways". **That sentence was false when it was written.** Iteration 01's
retro said: *do not write "closed" before the thing that closes it has been attacked.* One
iteration later, the same mistake, on the same kind of object.

Closed by SS-024: anchored to origin and exact path, failing closed, with ten tests built
from the bypasses the reviews demonstrated.

### The design hypothesis is false

Recorded in full in SS-026. In short: the test defending it could not fail, and the thing it
was defending is not true. 142 of the 146 orderings across the three plates clear with a
single hold per bolt; blind round-robin clears every plate in at most three passes. There is
no ordering to discover.

### Four blind spots in the check, each found by mutating `studio/**`

- Deleting the pointer release listeners makes **every tap run a bolt to its strip point and
  destroy the plate.** The whole ticket stage passed. The check sampled the readouts
  immediately after `mouse.up`, which cannot tell a bolt that stops from one that never does.
- `opacity: 0` over the plate — every bolt, every readout, the status line — passed. An
  invisible control was *excluded* from the 44px rule rather than failing it, so hiding a
  target was an escape from the rule instead of a violation of it.
- The driven game phase ran with **no error listener at all**, so "no console errors" was a
  claim about the page load and nothing else.
- Stubbing `write()` to a no-op — nothing persists, every session restarts at plate one —
  passed.

All closed by SS-024, each demonstrated failing afterwards.

### Seven input and focus defects

Closed by SS-025. The two that mattered most to a player: after any pointer use the keyboard
stopped working entirely (`preventDefault` suppressed focus and nothing restored it), and
choosing a plate from the picker scrolled every bolt off the top of a phone screen — at
320×568 there was nothing playable visible at all.

## The second review — rejected again

The three closing tickets were then reviewed with fresh context, and rejected. This is the
finding that matters:

### Anchoring the exemption was never going to work

SS-024 tightened the exemption from "any path ending in `shared/settings.js`" to "this
page's origin, and exactly that path", and tested it against every path attack the first
review had built. The second review ignored the path entirely and attacked the **frame**:

```js
new Function('throw new DOMException("denied","SecurityError")\n//# sourceURL=' +
             location.origin + '/shared/settings.js')
```

Origin matched, path matched, kind matched, check passed. **A stack frame's URL is minted
by the script that throws**, so no amount of anchoring turns a self-reported frame into
evidence. Two passes had been spent making a fundamentally untrustworthy input more
precise.

The fix was to delete the exemption. The blocked-storage pass now serves an empty script in
place of production's, so nothing in that pass is production's and there is nothing left to
forge — at the cost of proving something narrower, and true: *studio code* survives blocked
storage. The general rule is now in `self-checks.md`: **decide only from what the driver
observed, never from what the page said about itself.** A requested URL, a measured box, a
computed style and a screenshot are observations. A stack frame is a claim.

### Seven more mutations passed, and one of them was the empty shelf again

Three dead control listeners, two blanked labels, a gauge stroked in `transparent`, and —
worst — dropping the shelf card's url or emptying `SHELF`, either of which closes the only
route to the game. That last one lands exactly where iteration 01's lesson did: the
three-card fixture proved the *component* and this document had already claimed it closed
the empty-shelf configuration. It closed it for `shelf.js`. The realm's own shelf was still
asserted by nothing.

### A ticket shipped Done with an empty Result, and the check agreed

`docs-current` matched evidence with `\s*(.*)`, and `\s` matches a newline — so each label
was answered by the label below it and an entirely unfilled template read as complete.
SS-023 shipped that way with all six criteria ticked.

## The third review — rejected again

Reviewed once more with fresh context, and rejected. Two of the three headline claims were
false.

### Deleting one exemption had left another

`pageErrors` still filtered the browser's own `/favicon.ico` 404 — and that filter read
`error.source` too. A studio file throwing

```js
new Function('throw new DOMException("studio defect","SecurityError")\n//# sourceURL=' +
             location.origin + '/favicon.ico')
```

had its error dropped **in every pass**, and the new test suite asserted the hole as
intended. Three successive exemptions, each defeated by the same forgery pointed somewhere
new. The comment above the filter claimed it was "safe to decide from, unlike a stack
frame"; it was being fed a stack frame.

The fix stopped being a filter at all. The driver now **answers** the favicon request, so
there is no 404 to explain, and there is no error filter left in the check.

### Ten more mutations passed

A click no longer focusing the bolt — the SS-025 defect, restorable in one line, and
invisible because the check focused bolts for itself and only then used the pointer. Focus
loss no longer releasing a hold, so tabbing away mid-hold ran a bolt to its strip point
with no way to stop it. A dead mute toggle, which had never been pressed while the comment
above said every control was. State classes never cleared. A transposed coupling line. The
band at `stroke-width: 0` with its colour untouched — walking straight through the rule
written the round before to stop exactly that defect. Coupling lines and torque readouts in
`transparent`. And choosing a plate leaving nothing playable on a 320px screen.

### And `docs-current` still passed an evidence-free ticket, three ways

An unvalidated status word, a label inside a fenced example elsewhere in the file, and an
earlier draft Result answering for the final one.

## The fourth review — rejected

Rejected on three things, one of which is the iteration's own pattern in its purest form.

### The mobile claim had never been tested on a mobile

`page.setViewport({ width: 320 })` is a narrow *desktop* window, and desktop Chrome ignores
`<meta name="viewport">` entirely. Deleting that tag from both pages — which renders the
whole realm zoomed out at ~980px on a real phone, with the bolts under a thumb — passed
everything. Every mobile assertion the check makes was being measured in the one
configuration where the tag cannot matter, while a comment in the driver claimed the
opposite. Fixed by emulating a phone, and by asserting that the page adopts the device's
width rather than only that nothing overflows.

### Three of the bolt's four states were drawn by nobody's rule

`gaugeInk` read a bolt on a fresh plate, where every bolt is loose. Deleting the seated,
over and stripped treatments left the gauge one colour in every state and passed — the
third review's `stroke-width: 0` finding with the selector moved. Both the states and the
picker's locked treatment are now read from fixtures and must differ from one another.

### The record was wrong again, in the sentences written to correct it

SS-023 ticked a criterion saying `review.md` records the reviewer's verdict line, and
SS-028 — the ticket whose subject was record truth — wrote "**Both are true now**" about
it. The line did not exist. The criterion has been removed rather than re-explained: a
ticket cannot tick a line the reviewer writes.

## The fifth review — rejected, and on what

Rejected, and the reviewer was explicit that it was **not** for the existence of further
mutations: it found six more and declined to reject on them, because `self-checks.md` and
TD-008 disclose that surface as unbounded. It rejected on four claims that outran the truth.

### The ticket that ended the signature failure committed it

SS-031 made the driver emulate a phone. Under `isMobile`, Chrome grows the *layout*
viewport to fit overflowing content — so `window.innerWidth` tracks `scrollWidth`, and the
sideways-scroll rule became a comparison of a number against itself. It could no longer
fail. Two documents went on asserting "no sideways scroll at 320px", and the rule that
replaced it blamed a missing viewport meta tag on a page whose tag was present and correct.

A correct rule fed input that cannot falsify it, introduced by the ticket written to end
exactly that, and not noticed. There are now three measurements and three rules: does the
page *ask* for the device width, did content *force* the layout viewport wider, and does it
*scroll* sideways inside its own layout — the last against `clientWidth`, which does not
move with the overflow.

### The fence, a fourth time

Backticks were closed in round three, `~~~` and HTML comments in round four, and a fence
indented by one to three spaces — still a code block in CommonMark — passed a ticket with
an empty Result in round five.

### The record, a fourth consecutive time

Six statements still said three reviews and 38 mutations. The changelog recorded none of
the fourth round at all, including TD-008 — the row that is the basis of the iteration's
own claim to be honest about its gaps.

### What the fifth review credited

The viewport claim itself is real and was verified on both pages. Emulation weakened
nothing else: the 44px floor, the invisible-control rule and the focus ring were each
re-demonstrated failing under it. Every plate claim exact, re-derived independently for the
third time by a third reviewer. No error filter remaining, the favicon answered by exact
path, the blocked-storage pass proving its own configuration. The declined focus-ring
finding judged honest. Public-repo hygiene clean across 119 files.

### What the fourth review credited

Every plate claim exact, re-derived from `constants.js` without the studio's helpers. No
error filter remaining. The gap disclosure in `self-checks.md` judged as "honest and
correctly shaped". Public-repo hygiene clean across the whole diff.

### What the third review credited

The `turnId` and `causes` hold logic, attacked with dispatched multi-pointer events and CDP
touch: no stuck state, no unstoppable hold, no concurrent loops. Every plate claim exact,
re-derived from a model it wrote itself. The fail-closed shape of the new judges. Public-repo
hygiene across the whole diff.

### What the second review credited

The input fixes, verified by driving real multi-pointer events. Every measured claim about
the plates, re-derived from a model it wrote itself: 146 orderings, 142 falling, the four
exceptions missing by 0.219–2.750, round-robin worst case 3 passes. Public-repo hygiene
across 113 files. It called the new tests genuinely adversarial.

### What the reviews credited

The pure/driver split is real rather than cosmetic. The unit tests are adversarial where it
counts: inclusive band boundaries tested *at* the boundary, stripping outranking solving,
`"1e999"` granting nothing rather than unlocking everything. `judgeKilledTreatment`
asserting a *difference* is the right shape — and QA then defeated it with a card that was
visually identical and numerically different, so it now asserts the named treatment too.

## Keep / Iterate / Kill

> Yev: strike through what you disagree with and write your own verdict. These are the
> team's, and the team is not the judge of them.

- **`studio-boot` — Keep.** It closed TD-004 and then earned its place repeatedly. Six
  rounds of review attacked it, and it is a far stronger thing than the version that
  shipped: **57 mutations across eight sets now fail — 53 at the ticket stage and 4 at the
  gate**, against the 8 it was written for. The stages are named because the sixth review
  caught this same sentence claiming the ticket stage for things that fail at the gate, and
  for two behaviours that had no rule behind them at all. It is a count of what has been
  tried, not a claim that nothing is left — every round found mutations the previous one
  survived, and `self-checks.md` states plainly what the check does not cover. It also caught a real accident
  rather than a planted one — a parameter in SS-029 that shadowed an imported function and
  silently killed every hold — within an hour of the error-collection rule being added.
- **Overtighten — Iterate, not Keep.** It is a well-built, pleasant, tactile thing, and it is
  not the game it was designed to be. The experiment succeeded: it returned a clear "no" on a
  specific question, with a measurement. What it needs is a mechanic change, not tuning.
- **The hypothesis-as-a-check practice — Keep, and fix how it is written.** Stating a design
  hypothesis as a test was right. Writing one that could not fail was the error, and the
  retro carries the rule that came out of it.

## The open decision this leaves

Overtighten needs an irreversible state to become a puzzle, and each candidate is a
different game. This is a product question with materially different outcomes, so by the
Definition of Ready it goes to the executive rather than into a ticket. Q7 in the studio
questionnaire, with the three candidates and what each costs.
