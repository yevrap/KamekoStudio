# Decision records

One file per decision, numbered in order, named `ADR-NNNN-slug.md`. Template:
[`../templates/adr.md`](../templates/adr.md).

A decision comes here when it constrains future work: a structure, a convention, a
boundary, a thing the studio will not do. Routine choices inside a ticket stay on the
ticket.

When a decision changes, the old record's status becomes `Superseded by ADR-NNNN` and the
new record explains why. The documents that *describe* the system are edited in place —
they always show the current state — and the history lives here.

| ADR | Decision |
|---|---|
| [0001](ADR-0001-studio-lives-in-the-production-repo.md) | The studio lives in the production repo, behind a path guard |
| [0002](ADR-0002-npm-script-exception.md) | `package.json` gets one recorded exception for `studio:check` |
| [0003](ADR-0003-storage-namespace.md) | Studio storage is namespaced `studio_` and guarded separately |
| [0004](ADR-0004-checks-as-a-script.md) | The self-checks are an executable script, not a checklist |
| [0005](ADR-0005-front-wall-portal-row.md) | `shared/3d/gameplay.js` gets one recorded exception for the front-wall portal row |
| [0006](ADR-0006-ticket-prefix.md) | Tickets are numbered `SHS-NNN`; the `SS-` prefix is retired at 042 |
| [0007](ADR-0007-trunk-based-development.md) | Trunk-based development, as a trial from iteration 04 |
| [0008](ADR-0008-production-fixes.md) | The studio fixes production, under the full process, one ticket per file |
| [0009](ADR-0009-one-step-per-session.md) | One step per session, an ordered backlog, and an epic budget |
| [0010](ADR-0010-fork-portal-url.md) | `shared/3d/constants.js` gets one recorded exception: River Run's portal opens the studio fork |
