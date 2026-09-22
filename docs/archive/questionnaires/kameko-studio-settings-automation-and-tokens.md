# Kameko Studio Questionnaire — Settings, Automation & Tokens

> **Archived July 12, 2026 — fully answered and consumed.** Q1=A · Q2=B · Q3=A · **Q4=E (write-in: remove the token system entirely, everything free)** · Q5=B · Q6=A · Q7=B. All answers translated into the sprint sequence in [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md) and roadmap items p1-32…p1-35 (+ rescoped p1-06, p2-32, p2-02; p2-28 merged into p1-32). Kept as the record of the decisions.

*Check one box per question (or add a line of your own). Feeds the Phase 3 items (p1-32, p1-33, p1-34) of [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md). The Phase 0 hygiene items (b-19, b-20) do not wait on these answers.*

## Q1 — What ARE the auto modes to you? (This decides their entire UI.)

Today they're 2–4 persistent settings per game with three different names ("Auto Play Visualizer", "Simulated Tournament", "Virtual Typist").

- [x] **A. Attract mode / visualizer (recommended):** something cool to leave running. Becomes a single "▶ Watch" entry point on each game's start screen (like materials-run's Spectate button); speed/reveal live *inside* the watch mode, not in the drawer. The drawer's Automation sections disappear.
- [ ] **B. Tutorial:** a way to learn by watching, especially the card games. Becomes "Watch a demo game" paired with coach commentary on and hands revealed by default; drawer sections disappear.
- [ ] **C. Both A and B**, varying by game (card games teach, arcade games entertain) — one "▶ Watch" entry point everywhere, coach on by default only in durak/tysiacha.
- [ ] **D. They're settings and should stay settings** — just unify the naming and controls in place.

*(River-run's Auto-Shoot / Auto-Avoid are genuine player assists, not this mode — they stay as settings toggles regardless.)*

## Q2 — Where should automation controls live? (Durak currently has them in BOTH the setup screen and the drawer, duplicated and kept in sync.)

- [ ] **A. Start/setup screen only (recommended if Q1 = A/B/C):** watching is a way to *start* the game, so it lives where games start. Drawer loses the section.
- [x] **B. Drawer only:** it's a mode you flip mid-session; remove durak's setup-screen duplicates.
- [ ] **C. Both, everywhere** — make all games match durak's duplication.

## Q3 — One control idiom for booleans everywhere?

The same on/off concept is currently a label-flipping button in durak/blob-zapper ("🤖 Turn on Auto Play"), a switch row in tysiacha/materials-run/river-run, and a segmented button in keypad-quest.

- [x] **A. Yes (recommended):** switch rows for on/off, segmented pickers for multi-choice (speed, difficulty), quick-action buttons ONLY for actions (show rules, open log). Retire label-flipping toggle-buttons — coach hints (a Q5=B decision from the last questionnaire) stays a quick action since it's an action-style flip.
- [ ] **B. No — per-game character is fine**, only fix the worst offenders.

## Q4 — Tokens: the economy is circular (pay 1 to start, earn 1 for finishing, free faucet in every drawer) and no real sink has shipped. What direction?

- [ ] **A. Make them real (recommended):** ship the sinks — hidden-object hints (p1-06), durak card backs/table themes (p2-32) — and move the free faucet behind Developer Mode. Earning stays as is.
- [ ] **B. Keep as-is** until more sinks exist; live with the dead UI a while longer.
- [ ] **C. Pause the gate:** games become free to start; earning keeps logging quietly (like a score); the token row moves out of the drawer to the gallery page only. Revisit when a real economy design exists.
- [ ] **D. Hide it all:** token row, faucet, and cost labels visible only in Developer Mode; data stays intact underneath.
- [ ] E. Remove it all. i want it all to be free and a future sprint to remove the functionality and documentation. i don't want it

## Q5 — App-update UX: the banner can pop mid-game (any tab-return triggers a check), and the drawer has a second manual Check button with its own result box.

- [ ] **A. Quiet mode (recommended):** auto-check stays but the banner never interrupts play — it defers to game-over/menu/gallery. Drop the manual Check button; ⚙️ App keeps just the version line. Add the missing "Simulate Update" dev button so the flow is testable.
- [x] **B. Keep the manual Check button** but defer the banner as in A.
- [ ] **C. Status quo is fine** — it's already folded into the collapsed ⚙️ App section.

## Q6 — Your inbox item: "Game settings separated from arcade-wide settings?" How separate?

- [x] **A. One drawer, clearer grouping (recommended):** game sections on top (as now), then ONE visually distinct compact "Arcade" cluster (switcher · tokens · theme/gallery · ⚙️ App). Cheapest, keeps everything one tap away.
- [ ] **B. Two-level:** the game's drawer shows only game sections + a single "Arcade settings →" row that slides to a second panel holding switcher/tokens/theme/app.
- [ ] **C. Split by location:** game drawers keep only game sections + a Gallery link; all arcade-wide chrome lives solely in the gallery page's drawer.

## Q7 — Lab games (durak-alchemist, dungeon, tactics after p1-29): what settings convention?

- [ ] **A. Strip to chrome only (recommended):** hamburger still works (switcher, theme, gallery) but no per-game sections — Lab games are experiments, not maintained surfaces.
- [x] **B. Keep their current sections** — they're still playable, leave them whole.
- [ ] **C. Decide per game later.**

## Notes / anything else about settings, automation, tokens, or updates

- 
