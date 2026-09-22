# Durak Questionnaire — Perevodnoy UX

> **Archived July 12, 2026 — fully answered and consumed.** Q1=B → roadmap p1-22, Q2=C → p1-23, Q3/Q4/Q5 = keep as shipped, Q6=A → classic win semantics kept (p2-13 unblocked). Successor for new decisions: [Durak Questionnaire — Open Decisions (July 2026)](durak-open-decisions-july-2026.md).

> From the July 11, 2026 sprint (transfer deadlock fix + choice popup + hand sort + placements). Judgment calls I made that you may want to revisit — check a box per question, add notes inline. Answers get picked up next durak session.
>
> **Picked up July 12, 2026:** Q1=B → roadmap **p1-22** (tap-to-target defense), Q2=C → **p1-23** (inline Transfer/Beat buttons). Q3/Q4/Q5 = keep as shipped, closed. **Q6 below is new and unanswered.**

## Q1 — Defense targeting after a transfer

After a transfer there are 2–3 open attacks. Today each card you tap automatically covers the **first open attack it can beat** — you control the pairing by tap order, but you never explicitly point at an attack.

- [ ] **A. Keep auto-assign** — tap order is enough control, no extra taps
- [x] **B. Tap-to-target** — tap a card, then tap the attack it should cover (two taps, full control)
- [ ] **C. Auto-assign, but smarter** — game pairs cards to attacks to maximize coverage (e.g. never "wastes" a high card on a low attack when order matters)

Notes:

## Q2 — The choice popup

The ⇄ Transfer / 🛡 Beat popup only appears when one card can legally do both (a trump matching the attack rank). It's a centered modal with tap-outside-to-cancel.

- [ ] **A. Keep as is** — rare enough that a modal is fine
- [ ] **B. Add a preference** — "Always ask / Always transfer / Always beat" in settings, popup only in Always-ask mode
- [x] **C. Inline instead of modal** — small Transfer/Beat buttons appear above the hand instead of covering the table

Notes:

## Q3 — Placement ties

Two players can empty their hands on the same bout. The placement list currently ranks them in seat order (1st/2nd) without saying it was simultaneous.

- [x] **A. Keep seat-order ties** — barely noticeable, not worth complexity
- [ ] **B. Mark ties explicitly** — "tied 2nd" on both rows

Notes:

## Q4 — Where Hand Sort lives

Sort (Off / Suit / Strength) is in ☰ menu → Current Match, applies instantly and persists. Getting to it mid-hand costs two taps.

- [x] **A. Keep in the drawer** — set once, forget
- [ ] **B. Button on the table** — small sort icon near the hand cycles Off → Suit → Strength

Notes:

## Q5 — Placements at 2 players

The placement list shows for every table size. At 2 players it's redundant with the winner text ("You — 1st / CPU 1 — Durak").

- [x] **A. Show always** — consistent, harmless
- [ ] **B. Hide at 2 players** — winner text already says it

Notes:

## Q6 — What counts as a "win" in the stats? *(added July 12, 2026, from your inbox note "stats lie — not a win but 2nd place")*

Today the W/L/D line counts **every game where you're not the Durak as a win** — classic semantics, only the loser loses. So finishing 2nd of 4 shows as a plain W, which is what felt like a lie. Extended stats (p2-13) will track placements either way; this decides what the headline W means.

- [x] **A. Keep classic** — not the Durak = win; the placement list already shows where you finished
- [ ] **B. Only 1st is a win** — 2nd/3rd become their own "escaped" count (W / escaped / Durak / draw)
- [ ] **C. Replace W/L/D with placements** — show 1st/2nd/3rd/Durak counts instead of win/loss

Notes:

---
Related: [Durak overview](../../games/durak/README.md) · [Improvements](../../games/durak/ideas.md) · [Dev Log](../dev-logs/arcade.md)
