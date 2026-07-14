# Astro Salon — Playtest Notes (v21, iteration 3)

**Concept:** Five of the twelve zodiac signs visit your salon **as characters, in disguise** — each gives a personality-flavored line and a birthday, and you guess who they are on the zodiac wheel, then answer their question (element, modality, ruling planet, opposite, compatibility). Full **EN/RU** toggle (persisted). First try 2⭐, second try 1⭐, streak bonuses. One session ≈ 5 minutes.

**What changed since v20 (per the round-2 vault questionnaire — "still hard to see the date ranges… everything is so small"):**
- **Read-then-confirm wheel picker:** the first tap on a wedge no longer answers — it shows that sign **big in the wheel hub** (symbol, name, full date range) with a gold rim on the wedge; tapping the same wedge again commits. Browse the whole wheel freely before guessing.
- **Bigger everything:** hub radius shrunk to give wedges more room; symbols 23→30, sign names 9.5→13.5, dates 10→11.5. Wedges now carry only their **start date** ("from Mar 21" / «с 21 мар») — the next wedge's start is this one's end, and the full range appears in the hub on tap. This killed the v20 label collisions on the side wedges.
- **✨ Daily horoscope** (round-2 depth pick): header button + start-screen button. Pick your sign once (persisted, `astroSalon_mySign`), get a date-seeded daily read — theme, element-pairing note (teaches the compatibility rule), one piece of advice, sign of the day. Same read all day, changes at midnight. EN/RU.
- Not added: houses/rising ("deeper chart reading", the other Q5 pick) — filed as the next depth step, too big to ride along.

**What this playtest should evaluate:**
- **Is the wheel readable now?** Can you comfortably read every sign's name and start date, and does the tap-to-read hub card make the ranges make sense?
- **Does read-then-confirm feel right** — helpful inspection, or an annoying extra tap once you know the wheel?
- **Is the daily horoscope worth opening?** Would you actually check it tomorrow?

**Verdict line for the vault log:**
```
YYYY-MM-DD — astro-salon (draft v21) — keep|meh|kill — <why>
```
