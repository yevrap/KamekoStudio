# SS-037 — Stop trying to read Markdown; count declarations

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-036
- **Branch:** `ss-037-stop-parsing`

## Motivation

Opened by the tenth independent review, which defeated `docs-current` for the tenth
consecutive round — four ways, three of them rendering to nothing a reader sees: an HTML
comment or a `<script>` **inside a blockquote** (never recognised as an opener, so the
scanner reported hidden text as visible), an HTML block interrupting a paragraph, and a
nested list's four-space indent read as a code block, hiding a visibly unticked criterion.

Every fix for ten rounds made the same bet: that this checker could work out which text a
Markdown renderer would show. First by stripping hiding places out — backticks, `~~~`,
comments, indented fences, `<script>`. Then by scanning the document as CommonMark.
Stripping deleted text that renders and promoted a draft Result over the real one; scanning
missed constructs a real parser handles. The surface is the whole of CommonMark, and this
is not a CommonMark implementation.

## The change

**It stopped competing.** A ticket declares each thing exactly once — one `## Result`, one
`Status`, one `What changed`, one `Tested by` — counted in the raw file. A second
declaration is a failure **wherever it is and however it is hidden**, and whether or not a
reader would see it.

That is the same shape as the status rule, which is the one rule here that was never
defeated. And it is not a narrowing: every payload from all ten rounds beat the old checks
by adding a second declaration, so one rule catches all of them.

`tests/studio/lib/markdown.mjs` and its tests are **deleted**. This ticket removes 170
lines of parser and replaces it with four counts.

## Acceptance criteria

- [x] A second `## Result`, `Status`, `What changed` or `Tested by` fails, hidden in any of
      the thirteen places ten rounds of review found.
- [x] Counting is permissive (any indentation, any blockquote depth); reading is strict
      (only a declaration at the margin). Each errs in the safe direction for its job.
- [x] Unticked criteria are counted in raw text, in any bullet, indent or blockquote.
- [x] The hand-written CommonMark scanner is deleted, not kept alongside.
- [x] `review.md` narrates every round and is chronological **including its subsections**.
- [x] `self-checks.md` describes the rule that exists.
- [x] The headline count is re-measured, with a per-set table in this ticket.

## Evidence plan

The tenth review's six payloads, plus all thirteen hiding places as unit tests.

## Out of scope

- The disclosed mutation surface under TD-008, which six consecutive reviewers have
  reported and declined to reject on.

---

## Result

- **What changed:** `tests/studio/checks/docs.mjs` — `resultHeadingCount`, `labelCount`,
  a permissive/strict pattern pair, and the declaration rules in `run()`.
  `tests/studio/lib/markdown.mjs` and `tests/studio/markdown.test.mjs` deleted.
  `tests/studio/docs-evidence.test.mjs` rewritten around a table of all thirteen hiding
  places. `tests/studio/checks/boot.mjs` — `headOk` renamed to `answers`, since it does
  not issue a HEAD. `review.md` re-filed so each round's credits sit under that round, and
  rounds nine and ten narrated. `self-checks.md`, `tech-debt.md`.

- **Tested by:** the tenth review's six payloads, replayed. All six fail, and five of them
  with the *same* message — which is the point:

  | Payload | What the check says now |
  |---|---|
  | blockquoted HTML comment | *2 Result sections — a ticket has one* |
  | blockquoted `<script>` | same |
  | `<script>` interrupting a paragraph | same |
  | `display:none` div, blank-separated | same |
  | fence inside a blockquote | same |
  | criteria in a nested list | *Done with no "What changed" evidence* (the criteria now count) |

  The unit tests run all thirteen hiding places against both orderings — forgery before the
  real declaration and after it — because taking the *last* match is what one earlier
  version did and taking the *first* is what another did.

- **The count, re-measured at this commit.** Every harness re-run, not carried forward:

  | Set | Fails | Ticket | Gate |
  |---|---|---|---|
  | The eight TD-004 mutations | 8 | 8 | 0 |
  | First review's bypasses | 5 | 5 | 0 |
  | The game mutations | 6 | 6 | 0 |
  | Second review's | 9 | 9 | 0 |
  | Third review's | 9 | 9 | 0 |
  | Fourth review's | 8 | 8 | 0 |
  | Fifth review's | 5 | 4 | 1 |
  | Sixth review's | 7 | 4 | 3 |
  | Seventh review's | 9 | 6 | 3 |
  | Eighth review's | 4 | 2 | 2 |
  | Ninth review's | 8 | 2 | 6 |
  | Tenth review's | 6 | 0 | 6 |
  | **Total** | **84** | **63** | **21** |

- **What is worth saying plainly.** Ten rounds is not ten patches of equal weight. Rounds
  one to three closed exemptions that could be forged; four to six closed blind spots; seven
  and eight closed rules written too narrowly; nine and ten ended an approach. The check is
  materially better for all of it. But the honest summary of this object is that a
  Markdown-reading rule written by hand loses to Markdown, and the fix was to need less
  from it — not to read it better.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
