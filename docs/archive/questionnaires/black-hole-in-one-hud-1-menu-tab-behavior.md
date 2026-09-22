# HUD-1 — Menu Tab Behavior Questionnaire

> **Answered 2026-07-19 — Yev confirmed "Keep it Play-tab-only."** That's exactly what shipped in `1a7a2b5`, so no code change follows from this — the questionnaire just closes out the one open call. Archived.
>
> One open judgment call from shipping [HUD-1](../../games/black-hole-in-one/ideas.md) (2026-07-19, `1a7a2b5`) — everything else in the item was fully specified. See [Dev Log](../dev-logs/black-hole-in-one.md) for the full ship writeup.

## Context

Before HUD-1, tapping blank space inside the `#howto` overlay (not on a button) had one job: if no run had started yet (`S.phase === 'menu'`), it launched the last-used mode as a convenience — the intro text/backdrop itself was a big "just start" target. If a run was already live, the same tap closed the overlay and resumed.

HUD-1 added Settings and Inventory tabs to that same overlay. A blank-space tap on those tabs (e.g. beside the toggle rows) isn't "intro text you're done reading" the way the Play tab's copy is — it's someone mid-way through flipping a setting.

## The call I made

Backdrop-tap-to-auto-start now only fires from the **Play** tab. On Settings/Inventory, a blank-space tap while no run has started does nothing (no accidental launch); it still closes the overlay/resumes if a run is already live, same as before.

## Question

- [x] **Keep it Play-tab-only** (as shipped) — Settings/Inventory backdrop taps never auto-start a run.
- [ ] **Revert to old behavior everywhere** — any blank-space tap in the overlay auto-starts the last mode when no run is live, regardless of which tab is showing.
- [ ] **Something else** (leave a note):

