# Iteration 04 — review

**Verdict:** APPROVED WITH FINDINGS by the Independent Reviewer in the second and last round, with QA rejecting in that round; shipped on the team's judgment after QA's findings were closed in a fix round no reviewer has seen.

That line is the record, so it is worth being exact about it. It is explained in full
under [The call](#the-call).

## What shipped

| # | Item | Where |
|---|---|---|
| SHS-050 | Every push is checked before and after it lands: a `push` stage, a `studio-live` that waits for the new build and refuses a stale marker, a baseline that is never the release itself, and no check that passes on a comparison of nothing | `tests/studio/checks/deploy.mjs`, `path-guard.mjs`, `commit-lint.mjs`, `index.mjs`, `check.mjs`, `lib/shell.mjs`; `self-checks.md` |
| SHS-051 | The studio may fix production under the full process; the path guard admits a production file only for the ticket that owns it, in its own iteration | `decisions/ADR-0008-production-fixes.md`, `guardrails.md`, `tests/studio/lib/rules.mjs`, `checks/path-guard.mjs`, `checks/hygiene.mjs` |
| SHS-052 | **Black Hole in One no longer throws when Explore starts with spiral particles alive** — the studio's first production fix | `games/black-hole-in-one/ui.js` (one line), `scripts/e2e.mjs` (three tests) |
| SHS-053 | This record, and ceremony records pushed as they land | `iterations/04/`, `process.md`, ADR-0007, `templates/ticket.md`, `studio/shelf-data.js` |
| SHS-054 | *Opened by review:* a production fix is reviewed before it is pushed, and pushed exactly as reviewed | `tests/studio/checks/production-review.mjs`, `rules.mjs`, `iterations/04/reviews/SHS-052.md`, ADR-0008 |

**Demo**

- The fixed game: https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/
  1. Open the start menu and wait a moment.
  2. Tap 🌌 Explore.
  3. Or: play a round of ⛳ Endless, open ☰ Menu, and tap Explore.

  Before this iteration, each of those threw for about a second before the first frame
  drew.
- The realm: https://yevrap.github.io/KamekoStudio/studio/. Its pulse line names this
  iteration.
- The permission and its limits: `docs/studio/decisions/ADR-0008-production-fixes.md`.

## The reviews

Two rounds, the cap. Each round had two passes, each with fresh context:

- the Independent Reviewer, on a different model from the author;
- QA, on the author's model.

The round-1 brief listed every claim. The round-2 brief listed only what was new, and
where each round-1 finding had gone.

### Round 1 — both rejected

The Independent Reviewer's verdict was REJECTED, and QA's was FAIL. Neither found anything
wrong with the TD-009 fix itself. QA confirmed it by real taps on all four player routes:
20 of 20 trials threw on the unfixed build, and 0 of 20 on the fixed one.

| Finding | From | Severity | Disposition |
|---|---|---|---|
| Every input the production-fix guard reads is written by the studio, so a fabricated fix passes it. Shown with a made-up SHS-999 editing `index.html`. Under trunk-based work that edit goes live before any review | Reviewer | Blocker | ADR-0008 now says what the guard proves (a write was planned and recorded) and what it cannot (that the plan was legitimate). **SHS-054 opened:** a production fix is reviewed before it is pushed |
| A change made inside a merge commit passed with no commit subject checked | Reviewer, QA | Minor / Blocker | Fixed — SHS-051 fix round 2 — incompletely; see round 2 |
| `path-guard` and `commit-lint` passed on a comparison of no commits | QA | Blocker | Fixed — SHS-050 fix round 1 |
| A commit after the iteration's tag was still admitted as a fix | QA | Blocker | Fixed — SHS-051 fix round 2 |
| `studio-live` passed with no marker, or with a marker the last release already had | QA | Major | Fixed — SHS-050 fix round 1 |
| A fix entry admitted deleting its file | QA | Major | Fixed — SHS-051 fix round 2 |
| A fix entry for a test harness admits emptying it | QA | Major | **Declined** — registered as TD-012. The pre-push review is the control; a test-name rule is its own change |
| The direct TD-009 test accepted a fix that dropped every particle | QA | Minor | Fixed — SHS-052 fix round 1 |
| The documented rollback fails `commit-lint` | QA | Minor | Fixed — the command and a conventional subject are documented |
| The stages table lost a row; two passages still said production was off-limits; the log's push count was wrong | QA | Minor | Fixed. The count said eight where there had been five: it came from another number in view, not from a command |
| An untracked directory changed the iteration; `postdeploy` exited 0 having verified nothing | QA | Minor | Fixed — SHS-050 fix round 1 |
| Two nits on the admission note, and one on a per-frame allocation | QA | Nit | Fixed |
| An entry for the current iteration takes precedence over the narrow `gameplay.js` exception | Reviewer | Part of the blocker | **Declined.** The exception's grammar exists because that edit needs no review, and a production fix gets one before it is pushed. Both round-2 passes accepted the reason |

### Round 2 — the reviewer approved with findings; QA rejected

The Independent Reviewer's verdict was APPROVED WITH FINDINGS. It re-verified every
round-1 blocker and major by running them, including QA's over-broad decoy against the
strengthened test. QA's verdict was REJECTED, on two gaps in central claims.

**Both passes approved SHS-052 on its own** at `b378402`, the commit that waited for them.
The reviewer said APPROVED and QA said APPROVED WITH FINDINGS. Their words are in
`reviews/SHS-052.md`.

| Finding | From | Severity | Disposition |
|---|---|---|---|
| **SHS-054's check could be escaped** by putting one of a fix's files back to the release after its review. QA approved `b378402` in a scratch clone, then restored iteration 03's `e2e.mjs`, deleting the three TD-009 tests, under a docs subject. The whole `push` stage passed 11 of 11 | QA | Blocker | Fixed — SHS-054 fix round 1. The check now decides from content: every file a fix owns must be, at `HEAD`, exactly what the reviewed commit holds. QA's reproduction is a regression test |
| A merge taking a fix file from its side parent is hidden by git's history simplification, so the guard admits the change as "0 commit(s)" | QA | Major | Closed at the push and the gate by the same content rule, which refuses it; a regression test holds it. `path-guard`'s own gap is **TD-013**: SHS-051 was at its fix-round cap |
| A narrow `--base` hid an unpushed fix from the review check | QA | Minor | Fixed — the need for a review is measured from the previous release |
| The stale-marker check read a git tree listing for a directory named without its trailing slash | QA | Minor | Fixed — SHS-050 fix round 2, the last |
| The direct test accepts a fix that keeps only one burst particle | QA | Nit | **Carried to the next iteration.** It is one assertion in a production file. Under SHS-054 it cannot be pushed without a review, and there are no rounds left |
| The review check called `commitsTouching` without the release tag | Reviewer | Nit | Gone with the ancestry code it belonged to |
| Two tickets owning one file: each review must cover the other's commits | Reviewer | Nit | Stated in ADR-0008: each ticket's review must have seen the file exactly as it is pushed |

### What a third round would most likely find

Both passes said nearly the same thing, from different directions.

- **The Independent Reviewer:** the gap ADR-0008 already discloses. Nothing stops the
  studio from naming a commit it wrote itself as the reviewed one. Only a signal from
  outside the repository closes that.
- **QA:** more checks that decide from the *shape* of git history rather than from
  content — rebases, cherry-picks that rewrite a reviewed hash, ancestry standing in for
  content after the tag — and more corners in how `postdeploy` maps a URL to a file.

The team agrees with both, and adds what it found before the gate:

- **One more of QA's predicted shape turned up after round 2.** The rewritten review check
  compared the release with itself when told `--previous-tag=HEAD`, and passed — TD-011's
  vacuous comparison, for the fourth time. It is fixed in SHS-054's second and last fix
  round, which no reviewer has seen either. A third round would most likely find another
  comparison of two revisions that can be pointed at the same one.

None of these is a defect a player would hit.

## The call

**The standing answer.** The gate needs the Independent Reviewer's verdict recorded, and
review stops at two rounds. When the second round still rejects, the executive handed the
call back to the team in iteration 03: decide by the team's goals and practices, write
down why, and let the next retrospective judge the call. This time the Independent
Reviewer approved, and it was QA that rejected.

**Why the team ships:**

1. **The player-facing change was approved by both passes, in both rounds, on its own.**
   SHS-052 is correct and minimal, red without the fix and green with it, and clean on
   all four player routes by real taps.
2. **QA's rejection is about the new review check, and the fix is the one QA proposed.**
   QA's own words: "each has a small content-based fix". That fix is made, and QA's
   reproductions are now regression tests: the tests put back to the release after
   review, the side-parent merge, and the narrow base. Each is held by a mutation that
   fails when the hole is put back.
3. **The gate is green**, the whole repository suite included.
4. **Holding would leave finished, approved work unshipped** over a studio-internal check.
   What a third round would find, written down above, is more of the same shape, and none
   of it is a defect a player would hit.

**What that costs.** The content-based review check, and its guard against comparing the
release with itself, have had no independent pass. If it is
wrong, the cost is a check that admits a production fix it should refuse. The fix itself
has been reviewed twice. Iteration 05's retrospective asks whether this call held, as this
one asks of iteration 03's.

## Keep / Iterate / Kill

> The executive: strike through what you disagree with. These are the team's.

- **SHS-052, the TD-009 fix — Keep.** A player-facing defect, found as a "flaky test" in
  iteration 02, diagnosed in 03, and fixed and verified here.
- **SHS-051, production fixes under the full process — Keep, with TD-013 next.** It
  catches unplanned production writes and says plainly that it cannot catch planned
  fabricated ones.
- **SHS-054, reviewed before it is pushed — Iterate.** It worked on its first real use:
  it refused SHS-052's fix round until round 2 had seen it. Its second version has had no
  review. Whether you also approve each production fix from outside the repository is Q10.
- **SHS-050, the push and post-deploy checks — Keep.** Across the iteration's pushes it
  found each new build on the wire, between the first attempt and the eighth, with no
  re-run by hand.
- **Trunk-based development — Iterate.** Its retrospective has the detail. In short: keep
  it for studio work; production fixes wait for review, which this iteration found out the
  hard way.
