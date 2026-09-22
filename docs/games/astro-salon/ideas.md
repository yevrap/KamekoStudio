> **Idea Inbox — Astro Salon** 🔮
> Cut scope + ideas from the July 13, 2026 jam onward. Promoted to the arcade 2026-07-14; Sprint 1 (promotion) and Sprint 2 (Chart Reading room + year-of-horoscopes) both shipped. What's below is what's actually still open, plus a shipped log for reference.

## Inbox (untriaged)

- [ ] **Send horoscope via URL** — share a link to the arcade + daily horoscope for a given sign, so someone can open straight to "here's your reading" without playing a session first. Not yet triaged into a roadmap row.
- [ ] Circle free play for lookup 

## Open — gates a roadmap row

- [ ] **Expert mode / more difficulty modes → p2-35.** Gated on Q4 of [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md) — **Q4 now has Yev's answer** (write-in: build something a player who knows real astrology would find interesting — test their knowledge and teach them something), but it needs a short design pass before p2-35 can build (the write-in names the audience and goal, not the mechanic yet). Read-then-confirm stays in every mode, including expert (round-3 Q3, reconfirmed).

## Open — deferred while building Sprint 2 (agent, 2026-07-15)

- [ ] **Per-sign chart intros** — Chart Reading guests currently share one "I came back for a deeper reading" line. Give each sign a chart-flavored intro like the salon personas have (24 localized lines) — flavor only, cut to keep Sprint 2 tight.
- [ ] **Richer house-question pool** — currently one topic question per house (12 lines × EN/RU). Add 2–3 variants each so the same house reads differently across sessions.
- [ ] **Cusp / decan depth for the chart room** — rising is the beginner 2h-per-sign approximation and houses are whole-sign only; real cusps, decans, and latitude are a future "advanced chart" layer (ties into the p2-35/Q4 expert-mode decision above).
- [ ] **Chart room hint pacing** — the rising/house hints are one-liners; if playtests show the arithmetic is too hard cold, consider a first-guest walkthrough or a visible "×2 hours" tick guide on the wheel.

## Open — parked, no row yet

- [ ] Sign personas with memory / light storylines — unanswered across three verdict-questionnaire rounds; the questionnaire stopped asking. Say the word to revive.
- [ ] Per-sign trait "profile card" on reveal — rides with the personas idea above.
- [ ] Traditional vs modern rulers toggle (Scorpio: Mars vs Pluto, etc.)
- [ ] Sounds: door chime on a new guest, chime/thud on right/wrong, mute toggle — natural post-promotion polish.
- [ ] Compatibility beyond elements (modality interplay) — only if teaching stays one-rule-at-a-time.
- [ ] Guests-per-session setting (5 default, 10 "long evening") — skipped in Sprint 1 to keep scope tight; still a cheap future rider.

## Rejected / superseded (settled, not revisited)

- Expert mode via single-tap answers — round-3 Q3 rejected this and it was reconfirmed for Q4: read-then-confirm stays in every mode, including any future expert mode.
- Memorization ladder (wheel loses labels as you improve) — largely superseded by p1-39's cleaner wheel; not the direction Q4's write-in took either.
- Month tick ring around the wheel rim — runs against the round-3 Q2 "less text on the wheel" direction.
- Check-in streak for the daily horoscope — folded into p2-33's plan, then explicitly cut: questionnaire Q3 = "no streak after all — just the richer year-themed reads."

## Shipped

- [x] **Chart Reading room — second session type** — Sprint 2 (2026-07-15, `87e1a94`, v26): Salon / Chart Reading choice on the start screen; 4 returning guests × [place rising sign + 3 whole-sign house questions]; all 12 houses dealt once per session; simplified sunrise rule for rising; separate best (`astroSalon_bestStarsChart`); EN/RU; `risingFor`/`houseSignId`/`buildChartGuests` unit-tested. **p2-34**, scope upgraded to all 12 houses per Q2. Design note archived: [Astro Salon — Chart Reading Room Design](../../archive/plans/astro-salon-chart-reading-room-design.md).
- [x] **Year-of-horoscopes + fortune tie-in** — Sprint 2 (2026-07-15, `87e1a94`, v26): versioned `YEAR_THEME` (2026 · The Year of Quiet Momentum) on the daily panel and in the read seed; pools tripled (30 themes / 24 advice per language); end-screen fortune quotes the same deterministic read as the ✨ panel (`dailyReadIndices`). **p2-33.** Streak cut per Q3.
- [x] **Promotion: draft → arcade game** — v21 promotion (2026-07-14, `5abf5b4`): full ES-module split (`constants/i18n/content/state/gameplay/ui/main.js`), 24 unit tests, settings-drawer section, `lastPlayed_astroSalon` + `astroSalon_bestStars` persistence, dark/light mode (new), pointer events, registered everywhere incl. the settings quick-switcher. **p1-38.**
- [x] Wheel wedge de-clutter — v21 promotion (2026-07-14): per-wedge date text removed, symbol/name sizes bumped into the freed room. **p1-39.**
- [x] Quiz continue button reachable without scrolling — v21 promotion (2026-07-14): moved out of the scrolling feedback card to a fixed stage sibling. **p1-40.**
- [x] Daily horoscope surface — v21 (2026-07-14): ✨ header + start-screen buttons; 12-sign picker (persisted `astroSalon_mySign`); date-seeded read (theme, element-pairing rule echo, advice, sign of the day), deterministic per day+sign; EN/RU.
- [x] Read-then-confirm wheel + readability pass — v21 (2026-07-14): first tap previews the sign big in the hub (symbol/name/full range, gold wedge rim), second tap commits; wedges show start date only, which fixed side-wedge label collisions.
- [x] Russian localization — v20 (2026-07-13): full EN/RU string table, live header toggle, persisted in `astroSalon_lang`; RU astrology vocabulary, RU month grammar, gendered persona lines.
- [x] Month-name dates + readability pass — v20 (2026-07-13): month names on wheel wedges, big gold birthday line, sign names on wedges, season corner markers, "wheel is the year" cheat-sheet box.
- [x] Signs-as-characters reframe — v20 (2026-07-13): the 12 zodiac signs replace the named human clients; incognito personas with trait-flavored intros, revealed on answer.

## Questions for Yev

→ [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md) — **Q4 (expert mode) is answered but not yet acted on**; Q1–Q3 consumed by Sprint 2. See "Open — gates a roadmap row" above.
→ consumed & archived: [Astro Salon Questionnaire — Verdict & Direction](../../archive/questionnaires/astro-salon-verdict-and-direction.md) (rounds 1–3)
