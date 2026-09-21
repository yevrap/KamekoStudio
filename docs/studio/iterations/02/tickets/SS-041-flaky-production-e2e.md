# SS-041 — A flaky production end-to-end test registered as TD-009

- **Status:** Done
- **Size:** S
- **Iteration:** 02
- **Role lead:** QA Engineer
- **Depends on:** none recorded
- **Branch:** `ss-041-flaky-production-e2e`

*Reconstructed in iteration 03 by SHS-045 from commit `72afe9d`, which named this ticket
and had no ticket file. The motivation, criteria and result are read off that commit,
its merge and the files it changed; the size and role lead are this reconstruction's
assignment. Nothing is recalled. The work landed after the `studio-iteration-02` tag, during that
iteration's publish step.*

## Motivation

The publish step ran the full suite twice and the second run failed a production test the
first had passed. The studio's guardrail is that the whole repository suite is green before
anything merges, so an intermittent production failure weakens that guarantee and has to be
recorded, not shrugged at.

## Acceptance criteria

- [x] The failure is measured on an unchanged tree rather than assumed, and the rate is
      recorded.
- [x] It is shown not to be the studio's: no studio commit in the iteration touches
      production paths, and `production-unchanged` agrees.
- [x] It is registered in `tech-debt.md` with the cost of leaving it, as production-side.

## Evidence plan

Three consecutive runs of `npm run e2e` on an unchanged tree.

## Out of scope

- Diagnosing or fixing it. Production code; the studio records it. Diagnosed later, in
  iteration 03, by SHS-044.

---

## Result

- **What changed:** `docs/studio/tech-debt.md` — the TD-009 row; `docs/studio/iterations/02/review.md`
  — *One thing found on the way out*, 13 lines. Commit `72afe9d`.
- **Tested by:** one failure in three consecutive `npm run e2e` runs on an unchanged tree,
  as recorded in the row; `production-unchanged` at the iteration-02 deploy.
- **Deferred:** the diagnosis, done in iteration 03 as SHS-044.
- **Fix rounds used:** 0 / 2
