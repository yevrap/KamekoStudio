# SS-033 — Rules for four defects that had none, and a count that names its stage

- **Status:** Done
- **Size:** M
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** SS-032
- **Branch:** `ss-033-close-the-sixth-pass`

## Motivation

Opened by the sixth independent review, which rejected the iteration on three things. The
first is the sharpest finding of the whole iteration: **the headline count was false about
the configuration it named.** "51 mutations across seven attack sets now fail the ticket
stage" reconciled arithmetically, but two of the things counted were *game defects
reproduced by hand in a browser* with no rule behind them at all, and a third fails
`docs-current`, which runs at the **gate**, not the ticket stage. A claim asserted about a
configuration it was not measured in — this iteration's signature failure — in the one
sentence SS-032 was written to make true.

Second: `docs-current` still passed an evidence-free Done ticket four ways, because
`resultSection(text) || text` **fails open** — when the heading pattern missed, evidence
came from the raw file with nothing stripped. Third: four record statements were stale, two
of them in files SS-032 had just rewritten.

## Acceptance criteria

- [x] The two SS-025 behaviours that were only ever reproduced by hand now have rules: a
      turn must survive one of two inputs letting go, and the status line must not be
      rewritten on every frame.
- [x] `resultSection` returns **null** rather than the whole file, a Done ticket with no
      Result section is a failure, the heading match is case-insensitive and tolerates a
      suffix, and an unclosed fence or comment hides everything after it.
- [x] A shelf card must link to a page that is **not** the shelf's own page.
- [x] A back link must go somewhere; `href="#"` is not a destination.
- [x] Every count in the record is restated with the stage it was measured at.
- [x] Every stale statement the review named is corrected.

## Evidence plan

Each of the review's seven demonstrations re-applied to a clean tree and run at the stage
it belongs to.

## Out of scope

- The `display: none` family and the other gaps under TD-008, which the review reported and
  explicitly declined to reject on.

---

## Result

- **What changed:**
  - `tests/studio/checks/docs.mjs` — `withoutHiddenText` handles unclosed fences and
    comments; `resultSection` returns null and matches `## Result (final)` and `## result`;
    `hasResultSection` exported and required of a Done ticket.
  - `tests/studio/checks/boot.mjs` — `proveSecondReleaseKeepsTurning`, `measureStatusChurn`,
    and a shelf-card reachability rule that excludes the realm home itself.
  - `tests/studio/lib/boot-contract.mjs` — rules for all of the above, plus a back link that
    must go somewhere.
  - The record: SS-031's quoted message, the retro's round counts and ticket list, the
    shipped table, the live page's "two independent reviews", the changelog's
    double-counted `docs-current` routes, and "five classifiers" where there were four.

- **Tested by:** the review's seven demonstrations, replayed. All seven fail:

  | Demonstration | What the check says now | Stage |
  |---|---|---|
  | causes-set guard deleted | *releasing one of two inputs ended a turn the other was still making* | ticket |
  | status line assigned every frame | *the status line was rewritten 60 times during a one-second hold* | ticket |
  | shelf card pointed at the realm home | *"Overtighten" links to …/studio/, which is not a page that boots* | ticket |
  | back link `href="#"` | *the back link goes nowhere (href="#"): leaving the page is still a hunt* | ticket |
  | `## Result (final)` + evidence in a comment | *Done with no "What changed" evidence* | gate |
  | no Result heading, evidence in a fence | *Done with no Result section* | gate |
  | unclosed fence swallowing the file | *Done with no "What changed" evidence* | gate |

- **The count, restated with its stage.** Eight mutation sets have been run against this
  iteration, and the numbers below are from a regression run of all eight at this commit,
  not from memory:

  | Set | Fails | At |
  |---|---|---|
  | The eight TD-004 mutations | 8 | ticket (`studio-boot`) |
  | First review's bypasses | 5 | ticket |
  | The game mutations | 6 | ticket |
  | Second review's | 9 | ticket |
  | Third review's | 9 of 10 | ticket — 8 via `studio-boot`, 1 via `studio-tests`. The tenth (`scrollIntoView` at `block: 'end'`) turned out not to be a defect at all: the bench still fits, so there is nothing to catch |
  | Fourth review's | 8 of 9 | ticket; the ninth is declined with a measurement |
  | Fifth review's | 5 | 4 at ticket, 1 at gate (`docs-current`) |
  | Sixth review's | 7 | 4 at ticket, 3 at gate |

  **57 mutations across eight sets**: 53 fail the ticket stage and 4 fail at the gate.
  Two entries in the earlier harnesses had gone stale against source SS-025 rewrote; they
  were corrected and re-run rather than counted on trust, which is what took that regression
  run from 4 and 5 back to 5 and 6.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2
