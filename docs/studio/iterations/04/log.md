# Iteration 04 — stand-up log

Three lines per entry: done / next / blocked, per role that acted. Written between tickets,
not reconstructed afterwards. Under trunk-based work each entry is pushed when it is
committed.

## Before planning — preflight

- **Scrum Master** — *Done:* preflight ran red once and green once, on a clean `main` level
  with the remote and no `STOP` file. The first run's `baseline-suites` failed on one test,
  `running out of fuel mid-flight while aiming does not permanently freeze the comet
  (FUEL-3)`, with uncaught `Cannot read properties of null (reading 'x')` — TD-009's exact
  signature, in a Black Hole in One test that enters Explore. Under iteration 03's rule it
  was run once more: all four checks passed, the baseline suites in 93 s. Both results are
  recorded here and nothing was exempted. *Next:* the plan. *Blocked:* nothing.

## After SHS-053's first commit — the plan

- **Product Owner** — *Done:* three committed tickets, all from the carried queue: the
  post-deploy gaps and the `push` stage (SHS-050), the production-fix permission
  (SHS-051), and TD-009's fix (SHS-052). The root README and the design of the studio's
  window on the 3D landing page are carried to the next iteration rather than squeezed in
  over the cap. *Next:* SHS-050. *Blocked:* nothing.
- **Scrum Master** — *Done:* three committed against the cap of 2–3, plus the record
  ticket. First trunk-based iteration: small commits to `main`, each finished ticket and
  each ceremony record pushed as it lands. Review capped at two rounds. *Next:* keep the
  pushes small and checked. *Blocked:* nothing.
- **Tech Lead** — *Done:* ordered SHS-050 first, against ADR-0007's suggestion of TD-009
  first: every push this iteration runs the post-deploy stage, and TD-010 would make each
  of those report a correct deploy as a failure. The plan says so. *Next:* SHS-050's
  polling and baseline default. *Blocked:* nothing.
