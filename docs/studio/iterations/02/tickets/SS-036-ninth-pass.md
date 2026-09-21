# SS-036 — Stop stripping the document and read it

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-035
- **Branch:** `ss-036-close-the-ninth-pass`

## Motivation

Opened by the ninth independent review, whose diagnosis is the one worth keeping:
`withoutHiddenText` **failed open**. Seven rounds had removed hiding places from the text
one spelling at a time, and the eighth round's harder stripping was worse than the softer —
its pattern deleted text CommonMark *renders*, and since the Result is taken from the last
heading in the processed copy and criteria are counted in it, deleting too much promoted a
draft Result over the real one and made unticked criteria vanish. Five payloads walked
through, one of them completely invisible on the rendered page.

A rule that decides from a mutilated copy of a document is the same error as one that
decides from a stack frame: the thing it reads is not the thing it is reasoning about.

The review also found two more spellings of "the page it is on" — `%69ndex.html` and
`Index.html` — and a fourth spelling of an unticked criterion, `> - [ ]`.

## Acceptance criteria

- [x] The document is **scanned**, not stripped. `tests/studio/lib/markdown.mjs` walks it
      once and reports which lines a reader sees.
- [x] A fence, comment or raw block left **unterminated** makes the ticket unreadable and
      the check fail — it is not guessed at.
- [x] A tab-indented fence, a backtick fence with a backtick in its info string, and a
      fence inside an HTML block are each handled as CommonMark handles them.
- [x] A task item inside a blockquote counts as a task item.
- [x] The back link is compared after **decoding and case-folding**, and must resolve to a
      page that is really there.
- [x] Every stale statement is corrected, and `review.md` is sorted into chronological
      order **by construction**, not by hand.

## Evidence plan

Each of the review's eight demonstrations re-applied to a clean tree and run at its stage.

## Out of scope

- The disclosed mutation surface under TD-008, which five consecutive reviewers have
  reported and declined to reject on.

---

## Result

- **What changed:**
  - `tests/studio/lib/markdown.mjs` — new. A single-pass block scanner: fenced code
    (every fence style, 0–3 spaces of indent, backtick info-string rule), indented code,
    HTML blocks (`<script>`/`<style>`/`<pre>`/`<textarea>` until their close tag, others
    until a blank line), HTML comments, and blockquote markers removed so a quoted task
    item still counts. It reports an unterminated block rather than swallowing the rest of
    the file.
  - `tests/studio/markdown.test.mjs` — new, 11 tests, one per construct that hides text
    plus the four payloads that defeated the stripper.
  - `tests/studio/checks/docs.mjs` — reads through the scanner; a ticket that cannot be
    read is a failure.
  - `tests/studio/checks/boot.mjs` — the back link's pathname decoded and case-folded
    before comparison, and checked to resolve to something that answers.
  - The record: the headline count, TD-008's tally, `self-checks.md`'s two rows, the
    retro's enumeration and counts, the changelog's misattributed bullet, and `review.md`
    sorted.

- **Tested by:** the review's eight demonstrations, replayed. All eight fail:

  | Demonstration | What the check says now | Stage |
  |---|---|---|
  | tab-indented fence | *Done with no "What changed" evidence (only "nothing")* | gate |
  | backtick in the info string | same | gate |
  | fence inside a `display:none` div | same | gate |
  | fence inside a table | same | gate |
  | three-space fence | *a backtick code fence is never closed — the ticket cannot be read* | gate |
  | back link `href="%69ndex.html"` | *goes nowhere … resolves to this page* | ticket |
  | back link `href="Index.html"` | same | ticket |
  | criteria inside a blockquote | *Done with no "What changed" evidence* | gate |

  229 studio tests green; the ticket stage green on a clean tree.

- **Why `review.md` was out of order twice.** SS-035 ticked "restored to chronological
  order" and inserted the eighth round between the fourth and the fifth — fixing the
  symptom it could see and creating the same defect one position over. It is now sorted by
  a script that reads the headings and orders them, so the document's order is a
  consequence of the rounds rather than of where an editor put the cursor.

- **The count, current and measured:** 78 mutations across eleven sets — 63 at the ticket
  stage, 15 at the gate. The split is computed from the per-set table rather than carried
  forward; carrying it forward is how it went stale twice.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
