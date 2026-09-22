
> **Status: SHIPPED 2026-07-20 (commit `12d5cc9`).** Written 2026-07-20 to turn the open inbox item ("No Russian/i18n at all," triaged 2026-07-18, see [durak Improvements](../../games/durak/ideas.md)) into a concrete, agent-shippable spec. Roadmap row: **p2-36** in `docs/roadmap.md`, marked ✅. Reference implementation already live in the repo: `games/tysiacha/i18n.js` (shipped as `p1-14`, 2026-07-10) and `games/astro-salon/i18n.js` (shipped at promotion, 2026-07-14) — durak is the third of the three games Yev asked to have Russian ("Durak, 1000, and Astrology game should have Russian"), and the only one still missing it. Archived here after shipping; see [Dev Log](../dev-logs/arcade.md) for the ship write-up. Two gaps this plan missed, found and fixed during implementation: `gameplay.js`'s `winnerText` (untyped raw strings) and the in-game Take/Pass/Done action buttons — both noted in the Dev Log entry.

## Why this shape

Two siblings already solved this exact problem. Don't redesign it — port the pattern. The core lesson from tysiacha's `i18n.js` (its own header comment, verbatim): *"Every user-facing string routes through `t()`; entries are plain strings or functions of the event/context. Log entries are typed and formatted at render time, so switching language re-renders the whole match history in the new language — nothing is stored as text."*

Durak is actually in a **better** starting position than tysiacha was: `log.js` already stores events as typed `{type, ...data}` objects and formats them at render time via `eventText()` — the exact discipline tysiacha had to retrofit (`state.bidLabel` was converted from strings to `{kind, amount}` during p1-14). Durak doesn't need that migration step.

## Architecture (mirror `games/tysiacha/i18n.js` exactly)

New file `games/durak/i18n.js`:
- `getLang()` / `setLang(l)` — persists `durak_lang` in localStorage, defaults `'en'`.
- `t(key, ...args)` — table lookup, function-valued entries called with args, always falls back to `TABLE.en[key]` if the current language is missing a key (never throws on a missing translation).
- `rankText(rank)` — `6,7,8,9,10` unchanged; `J→В, Q→Д, K→К, A→Т` in Russian (identical mapping to tysiacha's `RU_RANK`, since both games use the same face-card letters — durak just also uses `6–10` which tysiacha doesn't).
- `cardText(card)` — `rankText(card.value) + SUIT_EMOJI[card.suit]`. Suit *symbols* (♠♣♦♥) are already language-neutral — no suit-word translation needed anywhere in durak (unlike tysiacha, which needed `suitText()` for prose like "hearts are trump"; durak's coach/status text never spells out a suit name, only shows the symbol).
- `defaultPlayerName(mode, seat)` — returns `t('name.you')` / `t('name.cpu', seat)` / `t('name.player', seat+1)` depending on `mode` (`'ai'`/`'hotseat'`) and seat index. Both `state.js` (actual default-name assignment) and `main.js`'s `populateNamesModal()` (placeholder text) currently duplicate this exact `if/else` — replace both call sites with this one function so they can't drift.
- `TABLE = { en: EN, ru: RU }` plus the `HOWTO_EN` / `HOWTO_RU` rules-overlay arrays (same shape as tysiacha's, 5 sections instead of 6 — see key inventory below).

**Do not** touch `constants.js`'s `displayValue()` / `SUIT_NAME` / `suitEmoji()` — `suitName()` is only ever used to build CSS class names (`'suit-' + suitName(card.suit)`), not user-facing text, so it stays English-only as an internal identifier. `displayValue()` stays as the English-only low-level helper; every *user-facing* call site (see inventory) switches to the new `rankText`/`cardText` instead.

## Full surface inventory (every file that needs a change)

### `games/durak/i18n.js` — new file
As above. Budget ~120 keys total (durak's user-facing string count is comparable to tysiacha's ~110).

### `games/durak/cards.js` — card face rendering
`FACE_LABELS` (line 39, `{11:'J',12:'Q',13:'K',14:'A'}`) is a **second, duplicate** copy of the rank-letter map, used to literally draw the letter onto every J/Q/K/A card's SVG face (3 call sites: ~L66, ~L78, ~L90/98 in `buildCardFaceSvg`/related). This is the highest-visibility touch point in the whole sprint — it's the letter printed on the card in the player's hand. Import `rankText` from `i18n.js` and replace `FACE_LABELS[rank] || String(rank)` with `rankText(rank)` at all three sites. No import cycle risk: `i18n.js` only imports from `constants.js`, and `cards.js` doesn't currently import `i18n.js`, so this is a clean one-directional addition.

### `games/durak/log.js` — event log text
Mirror tysiacha's `ev.*` key family. Replace the `eventText()` switch and `formatCard()`:
- `formatCard(card)` → use `cardText()` from i18n.js instead of `displayValue(card.value) + suitSymbols[card.suit]`.
- Each `case` becomes a `t('log.<name>', e)` call: `attack`, `defend`, `transfer`, `take`, `pass`, `boutDefended`, `boutTaken`, `coachHint`.
- The `'Bout ${e.bout}'` grouping header built inline in `main.js`'s log-drawer renderer (see below) is a separate key, `log.bout`.

### `games/durak/state.js` — default names
Lines ~103–108: the `if (i===0) name = ... else name = ...` block computing `'You'`/`'CPU '+i`/`'Player '+(i+1)` becomes one call to `defaultPlayerName(mode, i)` from `i18n.js`. The custom-name override logic (reading `durak_name_<mode>_<i>` from localStorage) stays exactly as-is — only the *default* is now localized.

### `games/durak/main.js` — setup screens, drawer, names modal
- `populateNamesModal()` (~L130–147): `modeStr` ('Hot-seat'/'vs Computer') → `t('setup.mode.hotseat')`/`t('setup.mode.ai')`; the `namesSubtitle` string needs a **pluralized player count** — Russian "игрок" declines as 2–4 → игрок**а**, 5–6 → игрок**ов** (durak's player count only ever ranges 2–6, so a 2-branch helper is sufficient, no need for the full Russian plural-forms machinery). `defName` computation → `defaultPlayerName()`. The `'Seat ' + (i+1)` input label → `t('names.seat', i+1)`.
- `injectDurakSettings()` → `'durak-quick-actions'` section (~L436): this section has no `when()` gate, so it's the one always-visible drawer section — **this is where the language `<select>` goes**, same placement logic as tysiacha's `set-lang` (a persistent preference, not match-scoped). Rules/Log/Coach button labels → `t('act.rules')`/`t('act.log')`/`coachLabel()` reads `t('act.coachOn'/'act.coachOff')`.
- `'durak'` match-scoped section (~L493+): title string (`'Current Match: ' + mode + ' (' + N + ' players)'`), `'AI Difficulty'` label + `['Easy','Normal','Hard']` button names, `'Hand Sort'` label + `['Off','Suit','Strength']` button names, `'End round & back to menu'` button. This section rebuilds its DOM via `createElement`/`textContent` fresh each time it's opened (no static HTML template) — **verify** whether `window.KamekoSettings` exposes a way to force-refresh an already-open section on language change, or whether closing/reopening the drawer is the simplest correct behavior for this section specifically (tysiacha's language switch calls `render()` again directly since its drawer section is injected via `innerHTML` template each open — durak's imperative `createElement` version should follow the same "call this section's `render(container)` again" approach, just re-invoked instead of template-reset).
- The log-drawer HTML builder inside the Quick Actions section (`'Bout ' + e.bout` string, ~L459) → `t('log.bout', e.bout)`.
- Coach-move label building for the coach banner text actually lives in `ui.js` (see below), not `main.js` — `main.js` only owns the on/off toggle label.

### `games/durak/ui.js` — the largest surface: status text, roles, coach banner, gameover
- **Role labels** (~L166–168): `'Attacker'`/`'Defender'`/`'Thrower'` → `t('role.attacker')` etc. The `abbreviate ? role.slice(0,3).toUpperCase() : role` logic downstream is language-agnostic (works fine on Cyrillic — Нападающий→НАП, Защищающийся→ЗАЩ, Подкидывающий→ПОД) — no change needed there.
- **`getStatusText()`** (~L432–453): every branch is a full sentence — `'Paused'`, `'Pass device'`, `'Pile on or tap Done'`, `pName + ' may throw on'`, `'Defend — play a higher card or Take'`, `'Your attack — play a card'`, `'Throw on or Pass'`, `pName + ' defending…'`, `pName + ' attacking…'` → all become `t('status.*', ...)` keys, functions where a name is interpolated.
- **Coach banner** (~L394–424): builds `'Coach: ' + actName + ' ' + card`, where `actName` is `'Transfer'|'Defend'|'Play'`, plus separate `'Pass'`/`'Take'` branches, plus a parallel plain-text `logText` version (fed to `coach_hint` log events — **must produce the same localized text as the visible banner**, or the log will disagree with what the coach bubble said at the time). Route both through `t('coach.*')` keys and `cardText()`/`rankText()` for the card portion (replacing the direct `displayValue`/`suitEmoji` calls at ~L410).
- **`showGameOver()`** (~L?): `'Record: ' + wins + 'W · ' + losses + 'L · ' + draws + 'D'` → don't try to compress into single Cyrillic letters (П for both "Побед" and "Поражений" collide) — use full words: `t('gameover.record', wins, losses, draws)` → `"Побед: {w} · Поражений: {l} · Ничьих: {d}"`.
- **`ordinal(n)`** + **`renderPlacements()`**: Russian ordinal places are actually *simpler* than English (no 1st/2nd/3rd irregularity) — `"{n}-е место"` works uniformly for every n. `isDurak ? 'Durak' : ordinal(...)` → `isDurak ? t('gameover.durak') : t('gameover.place', i+1)`. ("Дурак" is the Russian word already — this is the one label where the English UI is literally showing the Russian term untranslated; RU output should still read `t('gameover.durak')` for consistency even though the visible string barely changes.)
- **`showPassDevice(name)`**: the name itself is already dynamic (routes through `defaultPlayerName`/custom name), no change there — but the *static* "Pass device to" / "Tap anywhere when ready." text lives in `index.html`, not here (see below).
- **`localizeStatic()` / `localizeDrawer()` split — new functions to add**, mirroring tysiacha's `ui.js` pattern exactly (same comment block, same null-safe `setText`/`setHTML` helpers, same "must never abort on a missing element" discipline — tysiacha's own dev log records a real boot crash from skipping this). `localizeStatic()` covers everything that lives in static `index.html` markup (see next section); call it once at boot before the first render, and again on every language change.

### `games/durak/index.html` — static markup needing `id`s + a `localizeStatic()` pass
Every one of these currently has hardcoded English text baked into the markup with no `id` to hang a translation on — add `id`s (matching tysiacha's convention: `set-lang`-style ids for inputs, descriptive ids for text nodes) and let `localizeStatic()` overwrite them at boot:
- `#game-title` ("DURAK"), start-overlay `.g-title`/`.g-sub`/`.g-rules` (title, "Classic Russian card game, 2–6 players" subtitle, the one-paragraph rules blurb).
- Mode toggle buttons ("vs Computer" / "Hot-seat"), "Players" label, count-toggle buttons (numerals only — language-neutral, skip), "✎ Edit Names" button.
- "Rules" section label, "Perevodnoy (Transfers)" / "Allow First-Turn Transfer" toggle row labels.
- Play / Watch buttons.
- Pass-device overlay: "Pass device to" / "Tap anywhere when ready."
- Choice-overlay (perevodnoy tap-to-transfer-or-beat): "⇄ Transfer" / "🛡️ Beat" buttons, "Tap outside to cancel" hint.
- Game-over overlay: "▶ Play Again" button.
- Names-overlay: "PLAYER NAMES" title, "Done" / "Reset Defaults" buttons.
- Log-overlay title ("📜 Game Log"), Rules-overlay title ("❓ Rules of Durak") **and its 5-paragraph body** — this is durak's equivalent of tysiacha's `HOWTO_EN`/`HOWTO_RU` arrays; move the body out of static HTML into `i18n.js`'s `t('howto')` (array of `[title, html]` pairs, same shape as tysiacha) so it renders from the string table like everything else instead of living as inert HTML that only ever shows English.
- `#pile-banner`'s hardcoded default text ("Defender is taking — pile on or tap Done") — same treatment.
- `<html lang="en">` — leave as `en` (matches tysiacha/astro-salon precedent; the attribute isn't wired to the language toggle in either sibling, not worth introducing new scope here).

### `shared/settings.js` — reset-all-data registry
Add `'durak_lang'` to the `keysToRemove` array in the "Durak" section (alongside `durak_mode`, `durak_difficulty`, etc. — ~L203–206), so a full data reset also clears the language choice. This is a one-line, easy-to-forget addition — tysiacha's own dev log shows this exact class of omission causing a real bug (b-15/b-19 hygiene drift) on other games; don't repeat it here.

### `games/durak/style.css` — verify only, don't pre-emptively change
Cyrillic strings run longer than their English equivalents in a few spots (settings button labels, the coach banner, the mode-toggle buttons). Check in-browser after the string table lands; only touch CSS if something visibly overflows or wraps badly. Don't guess at fixes ahead of seeing it render.

## Key inventory (representative — extend this pattern for the rest)

Namespacing mirrors tysiacha (`log.*`, `status.*`, `role.*`, `coach.*`, `setup.*`, `names.*`, `gameover.*`, `act.*`, `set.*`, `howto`). Below are worked English→Russian examples at the quality bar to match — extend the same pattern (and the same `vy()`-style second/third-person helper tysiacha uses for the "you" seat) for every remaining key in the inventory above, verifying against `games/tysiacha/i18n.js` for tone/register.

| Key | English | Russian |
|---|---|---|
| `name.you` | You | Вы |
| `name.cpu` (fn n) | CPU {n} | Компьютер {n} |
| `name.player` (fn n) | Player {n} | Игрок {n} |
| `role.attacker` | Attacker | Нападающий |
| `role.defender` | Defender | Защищающийся |
| `role.thrower` | Thrower | Подкидывающий |
| `log.attack` (fn e) | {name} attacks with {card} | {name} атакует картой {card} |
| `log.defend` (fn e) | {name} defends with {card} | {name} отбивается картой {card} |
| `log.transfer` (fn e) | {name} transfers the attack with {card} | {name} переводит атаку картой {card} |
| `log.take` (fn e) | {name} takes the cards | {name} забирает карты |
| `log.pass` (fn e) | {name} passes | {name} пасует |
| `log.boutDefended` | Bout defended, cards discarded | Атака отбита — карты в отбой |
| `log.boutTaken` (fn e) | Bout taken by {name} | Карты достаются {name} |
| `log.coachHint` (fn e) | Coach suggests: {text} | Совет: {text} |
| `log.bout` (fn n) | Bout {n} | Раунд {n} |
| `status.paused` | Paused | Пауза |
| `status.passDevice` | Pass device | Передайте устройство |
| `status.pileOnSelf` | Pile on or tap Done | Подкиньте карту или нажмите «Готово» |
| `status.pileOnOther` (fn name) | {name} may throw on | {name} может подкинуть |
| `status.defend` | Defend — play a higher card or Take | Защищайтесь — сыграйте карту старше или возьмите |
| `status.yourAttack` | Your attack — play a card | Ваша атака — сыграйте карту |
| `status.throwOrPass` | Throw on or Pass | Подкиньте карту или пасуйте |
| `status.defending` (fn name) | {name} defending… | {name} защищается… |
| `status.attacking` (fn name) | {name} attacking… | {name} атакует… |
| `coach.prefix` | Coach: | Совет: |
| `coach.pass` | Pass | Пас |
| `coach.take` | Take | Взять |
| `coach.transfer` | Transfer | Перевести |
| `coach.defend` | Defend | Отбить |
| `coach.play` | Play | Сыграть |
| `gameover.record` (fn w,l,d) | Record: {w}W · {l}L · {d}D | Побед: {w} · Поражений: {l} · Ничьих: {d} |
| `gameover.place` (fn n) | {n}th | {n}-е место |
| `gameover.durak` | Durak | Дурак |
| `gameover.playAgain` | ▶ Play Again | ▶ Играть снова |
| `setup.mode.ai` | vs Computer | Против компьютера |
| `setup.mode.hotseat` | Hot-seat | По очереди |
| `setup.perevodnoy` | Perevodnoy (Transfers) | Перевод (переводной) |
| `setup.firstTransferAllow` | Allow First-Turn Transfer | Разрешить перевод на первом ходу |
| `passDevice.title` | Pass device to | Передайте устройство игроку |
| `passDevice.hint` | Tap anywhere when ready. | Нажмите в любом месте, когда будете готовы. |
| `choice.transfer` | ⇄ Transfer | ⇄ Перевести |
| `choice.beat` | 🛡️ Beat | 🛡️ Отбить |
| `choice.hint` | Tap outside to cancel | Нажмите снаружи, чтобы отменить |
| `names.title` | PLAYER NAMES | ИМЕНА ИГРОКОВ |
| `names.done` | Done | Готово |
| `names.reset` | Reset Defaults | Сбросить |
| `names.seat` (fn n) | Seat {n} | Место {n} |

`title` ("DURAK" → "ДУРАК"), `subtitle` (rules blurb), `howto` (5-section rules array), the `main.js` drawer strings (Rules/Log/Coach button labels, diff/sort labels + button sets, "End round & back to menu"), and the plural player-count helper for `names.subtitle` are all still open — write them following the same register (durak's tone in tysiacha is plain and instructional, not folksy) and verify each against the live game, not just the string table in isolation.

## Testing (mirror `tests/tysiacha.test.mjs`'s i18n block)

Add a `tests/durak-i18n.test.mjs` (or an i18n section appended to the existing `tests/durak.test.mjs`) with, at minimum:
1. Defaults to English; `t()` falls back to English for a key present only in `EN`.
2. `setLang('ru')` changes `eventText()` output for at least one case per log-event type; `setLang('en')` restores it.
3. `rankText`/`cardText` produce `Т/В/Д/К` for `A/J/Q/K` in Russian and pass through `6–10` unchanged; English unaffected.
4. `defaultPlayerName()` matches the language and mode (`'You'`/`'CPU 2'`/`'Player 3'` ↔ `'Вы'`/`'Компьютер 2'`/`'Игрок 3'`).
5. A key-parity smoke test: every key in `EN` has a corresponding entry (or an intentional, documented fallback) in `RU`, and vice versa — catches a key added to one language and forgotten in the other before it ships.

## Implementation order for the agent

1. `i18n.js` (the string table + helpers) — get this right first, everything else just calls into it.
2. `cards.js` (card-face glyphs) — highest visual impact, easiest to verify in isolation (render a J/Q/K/A in RU and look at it).
3. `log.js` + `state.js` (typed data → localized text; default names) — small, mechanical, already-typed data.
4. `ui.js` (`localizeStatic`/`localizeDrawer`, status text, coach banner, gameover, roles).
5. `main.js` (drawer sections incl. the new language `<select>`, names modal).
6. `index.html` (add `id`s for everything `localizeStatic()` needs to touch).
7. `shared/settings.js` (`durak_lang` in the reset registry).
8. Tests, then a full in-browser pass in both languages: fresh boot, a full round (attack/defend/transfer/take/pass), pile-on, game over + placements, the names modal, the rules overlay, the log, the coach banner, hot-seat pass-device screen, and the language switching *mid-match* without a restart (tysiacha's bar — confirm durak clears it too).

## Done when

- Every string inventoried above (plus anything found in-browser that this inventory missed) renders correctly in both `en` and `ru`, switchable live from the always-visible Quick Actions drawer section, no restart required.
- Card faces show Cyrillic rank letters (Т/В/Д/К) in Russian, matching tysiacha's precedent.
- The game log, coach hints, and gameover placements all agree with the language active at render time (log re-renders correctly if you switch language mid-review, same guarantee tysiacha gives).
- `durak_lang` persists across reload and is cleared by "reset all data."
- New tests green; full suite still green; verified in-browser in both languages (light/dark if applicable, desktop + mobile viewport for the longer Cyrillic labels).
- Roadmap `p2-36` marked ✅ with a one-line ship summary; this note moves to `docs/archive/` per the usual archive-on-ship convention; `Improvements.md` (both the top-level arcade one and durak's own) checkbox updated.
