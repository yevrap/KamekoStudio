# Tysiacha Questionnaire — Language, Difficulty & Sound

> **Archived July 12, 2026 — fully answered and consumed.** Q6 → roadmap p1-27 (more sounds); Q8=D → p2-30 (relaxed bidding); Q9=A → p1-28 (free match-end restart); the rest = keep as shipped. Successor for new decisions: [Tysiacha Questionnaire — Open Decisions (July 2026)](tysiacha-open-decisions-july-2026.md).

> From the 2026-07-10 "Language & Opponents" sprint (p1-14 Russian toggle, p2-18 AI difficulty, p2-21 player names, p1-13 sound — all live at https://yevrap.github.io/KamekoStudio/games/tysiacha/). Play a few deals in Russian on Hard, then fill this in. Defaults marked *(shipped)* are what the game does now; leaving a question blank keeps it. Overview: [Tysiacha (1000)](../../games/tysiacha/README.md) · ship details: [Dev Log](../dev-logs/arcade.md).
>
> **Picked up July 12, 2026:** Q6 (more sounds) → roadmap **p1-27**. Q1/Q2/Q4/Q5/Q7 = keep as shipped, closed; Q2 and Q4 also closed the «Хвалюсь!» and auto-detect-language inbox ideas as won't-do. **Q8/Q9 below are new and unanswered.**

## Q1 — Russian address form

The game currently addresses you formally: «Вы пасуете», «Ваш заход».

- [x] «Вы» is right *(shipped)*
- [ ] Switch to «ты» («ты пасуешь», «твой заход») — a more casual register
- [ ] Other:

## Q2 — Marriage wording

Your original questionnaire mentioned «хвалюсь» — the traditional table-talk for declaring. The game currently says «объявляет марьяж».

- [x] Keep «марьяж» / «объявляет марьяж» *(shipped)*
- [ ] Use «Хвалюсь!» for the declaration banner (and keep «марьяж» elsewhere)
- [ ] Other authentic terms to add or fix (list any — прикуп, распасы, бочка, болты are already in):

## Q3 — Russian translation quality

After a few deals in Russian: any line that reads wrong, stilted, or mistranslated? (The full table is `games/tysiacha/i18n.js` — every string routes through it, so fixes are one-liners.)

-

## Q4 — Default language

The game defaults to English; Russian is a manual switch.

- [x] Keep English default *(shipped)*
- [ ] Auto-detect: browser set to Russian → start in Russian (already in the Improvements inbox)
- [ ] Default to Russian outright

## Q5 — Difficulty feel

Play a deal or two on each. Easy blunders on purpose; Hard bids to the edge and protects its marriages.

- [x] Normal default is right *(shipped)*
- [ ] Easy isn't easy enough / still confusing for a learner (say what happened):
- [ ] Hard isn't scary enough — I want it meaner (e.g. card counting, defender coordination):
- [ ] Gap between levels feels wrong (too big / too small):

## Q6 — Sound

Three synthesized sounds shipped: card snap, marriage chime, bid gavel. Toggle in ⚙️.

- [ ] Good as is *(shipped)*
- [x] Add more (trick-sweep whoosh, match-win fanfare, your-turn nudge — all cheap now)
- [ ] Too loud / too quiet / wrong character on the phone speaker (say which sound):
- [ ] Default should be muted

## Q7 — Names

- [x] Renaming in ⚙️ is enough *(shipped)*
- [ ] I want the bots' names to change their table-talk too (ties into AI personalities, in the inbox)
- [ ] Other:

## Q8 — Opening bid level *(added July 12, 2026, from your inbox note "should the bet be different? start lower?")*

Bidding opens at a **forced 100** today (the classic rule — dealer's left must bid 100, others raise or pass).

- [ ] **A. Keep forced 100** — it's the classic auction
- [ ] **B. Lower forced opener** — gentler auctions for learning; what number: ______
- [ ] **C. No forced opener** — anyone may pass; an all-pass deal needs a rule (redeal, or raspasy-style everyone-plays-alone)
- [x] **D. Make it a setting** — classic 100 default, with a "relaxed bidding" toggle in New Match as well as not forced

Notes:

## Q9 — Match-end "New match" token charge *(added July 12, 2026, from the settings-sprint finding)*

The match-end **"New match"** button charges 1 🪙, but restarting via the New Match setup screen mid-session is free — so the fee is easy to dodge and inconsistent.

- [x] **A. Free everywhere** — match-end button routes through the New Match setup screen like any restart
- [ ] **B. Keep the charge** — starting a fresh match after finishing one is "continuing play," the setup-screen path staying free is fine

Notes:

---
*When done, leave it here — the next Kameko session reads it together with [Tysiacha Questionnaire — Rules and Direction](tysiacha-rules-and-direction.md) and the [Kameko Playtest Log](../../playtest-log.md).*
