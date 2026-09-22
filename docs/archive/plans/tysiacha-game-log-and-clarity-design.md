# Tysiacha — Game Log & Clarity Design

> **Archived July 12, 2026 — design fully shipped** (p1-15, p1-16, p2-20 — July 9, 2026). Kept as the design record for the 📜 log and trick-clarity layer; ship narrative in the [Dev Log](../dev-logs/arcade.md).

> **Status:** ✅ **fully shipped 2026-07-09** — slice 1 (`p1-15`) commit `9c92b1b` · slice 2 (`p1-16`) commit `3fad1c1` · slice 3 (`p2-20`) commit `f424587`, live as v7
> **Game:** [Tysiacha (1000)](../../games/tysiacha/README.md) · ideas inbox: [Improvements](../../games/tysiacha/ideas.md) · decisions: [Questionnaire](../questionnaires/tysiacha-rules-and-direction.md) §"Game log & clarity" — **filled 2026-07-09**, all four answers folded in below
> *(created 2026-07-09 from a playtest session)*

## The problem

Playtest evidence (2026-07-09): an attentive player watched a **correctly resolved** trick and suspected an engine bug, because the information that decided the trick was never on screen:

- **Everything is ephemeral.** The banner fades after 3.4s and each new message *overwrites* the last — a marriage declaration followed quickly by a trick result means the marriage announcement is gone. Tricks sweep away 1.25s after the third card. Nothing is reviewable.
- **The led suit is invisible.** The trick area renders cards in fixed seats (Vera / You / Boris), not play order, so once 2–3 cards are down you can't tell which card was led — yet "highest of the led suit" decides most tricks, and *all* of them before a marriage sets trump.
- **Trick results don't say why.** "Vera takes the trick (+14)" — was it the highest of the led suit, or a trump? The player is left to reconstruct it, and by then the cards are gone.
- **Hints vanish too.** Coach one-liners are replaced at the next render; there's no way to re-read the advice you just half-saw.

Two audiences, one constraint: **new players** need to follow the action in real time; **experienced players** want an audit trail on demand; and both — per the Q2 questionnaire answer ("if you know how to play, you just play") — need all of this to **stay out of the way by default**.

## The design — three layers on one foundation

### Foundation: a structured event stream

Every game action pushes a typed entry onto `state.log` (DOM-free, testable): deal start, bid/pass, talon reveal, exchange, card played (with leader flag and trump-at-the-time), marriage declared, trick resolved (winner, points, **reason**), raspasy, deal score. `banner()` becomes a *view* of the newest event instead of the only record; the winner's reason ("highest ♣" / "trumped with 9♠") is computed once at resolve time and reused by every layer below. Coach hints append log entries when the hint bar is on.

This is the whole trick: log and banner can never disagree, and the log UI is just a renderer.

### Layer 1 — ambient clarity (always on, no interaction)

For the player who "just plays" — four small changes that would each have prevented the playtest confusion:

1. **"Led" marker** on the leader's card slot in the trick area (leader is already in `state.leader`). Kills two ambiguities at once: which suit is led *and* who led.
2. **Extended status chip** *(Q8 decision)*: during a trick the chip reads `♣ led · no trump` — the two facts that decide the trick, side by side.
3. **Trick banner says why:** "Vera takes the trick (+14 — trumped with 9♠)".
4. **Winning-card pulse** during the existing 1.25s resolve pause, so your eye lands on the card that won before the sweep. Trick pacing otherwise unchanged *(Q11 decision: keep the 1.25s sweep)*.

### Layer 2 — the log drawer (glanceable history)

A 📜 button beside the trump chip opens a scrollable drawer (reusing the p1-11 overlay patterns: fixed header, close button, tap-outside-to-close). Chronological feed, newest at the bottom, grouped by trick. Mini card labels (`9♥` red/black), bids, marriages, trick results with reasons. Closed by default; zero footprint during normal play.

Two questionnaire decisions shape it:
- **Whole-match scope** *(Q9)*: the log spans every deal of the match, grouped by deal (collapsed except the current one), not just the deal in progress.
- **Hints always logged** *(Q10)*: coach one-liners are generated and logged at every human decision point *even when the hint bar is off* — after a confusing moment you can open the log and see what coach *would have said*. The hint-bar toggle only controls live display.

### Layer 3 — the audit view (veterans & post-mortems)

Inside the drawer, each completed trick renders as a structured row: the three cards **in play order** with the leader marked, winner highlighted, points taken, and the trump state at that moment. The deal-end scoring screen gets a "review deal" link into it. This is also the natural surface for the future post-deal analysis idea (`p2-16`) to land on.

## Considered and parked

- **Persistent ticker strip** (last 2–3 events always visible instead of the banner) — standing clutter for the "just play" audience; a reason-ful banner + drawer covers it. Revisit only if the drawer sees heavy mid-trick use.
- **Tap-to-continue trick resolution** (pause until acknowledged) — great for learning, but changes pacing for everyone. Rejected in the questionnaire (Q11: keep the current pace).
- **Full replay** (step back through tricks card by card) — overkill for a 24-card, 8-trick deal; audit rows give ~90% of the value free.

## Sprint plan (3 agent-shippable slices)

| Slice | Roadmap ID | Scope | Done when |
|---|---|---|---|
| 1. Event foundation + ambient clarity | `p1-15` | `state.log` event stream; banner derives from it; led marker; `♣ led · no trump` status chip; reason in trick banner; winner pulse; unit tests for event emission + reason strings | Every action emits a typed event; a deal's log replays the deal faithfully in tests; led marker + chip + reasons visible in play; all tests green |
| 2. Log drawer | `p1-16` | 📜 button + drawer overlay; trick-grouped feed with mini card labels; whole-match scope grouped by deal; hints always logged (hint bar controls display only) | Full match readable in the drawer; closed by default; no change to play flow when unopened |
| 3. Audit rows + deal recap | `p2-20` | Per-trick structured rows (play order, leader, winner, points, trump); "review deal" from the deal-end screen | Any finished trick reconstructable at a glance; recap reachable from scoring screen |

All four questionnaire decisions (Q8–Q11) are resolved as of 2026-07-09 — nothing blocks any slice.

*Related: [Kameko Arcade](../../games/README.md) hub · repo roadmap `docs/roadmap.md`*
