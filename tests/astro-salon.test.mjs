import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
    SIGNS, ELEMENTS, MODS, PLANETS, HAPPY, FORTUNES, HOROSCOPE, YEAR_THEME,
    HOUSES, CHART_GUESTS, HOUSES_PER_GUEST, BIRTH_HOURS, GENERIC_SIGN,
    oppOf, compatible, daysInRange, birthdayFor, mulberry32, DAYS_IN_MONTH,
    risingFor, houseSignId, dailyReadIndices,
} from '../games/astro-salon/constants.js';
import { STR } from '../games/astro-salon/i18n.js';
import { computeScore, buildChartGuests } from '../games/astro-salon/gameplay.js';
import { chipLabel, ruleText, hintText } from '../games/astro-salon/content.js';

describe('astro-salon constants — sign data integrity', () => {
    test('12 signs with sequential ids 0-11', () => {
        assert.equal(SIGNS.length, 12);
        SIGNS.forEach((s, i) => assert.equal(s.id, i));
    });

    test('unique symbols and names in both languages', () => {
        assert.equal(new Set(SIGNS.map(s => s.sym)).size, 12);
        assert.equal(new Set(SIGNS.map(s => s.name.en)).size, 12);
        assert.equal(new Set(SIGNS.map(s => s.name.ru)).size, 12);
    });

    test('every sign has a valid element, modality, and ruling planet', () => {
        SIGNS.forEach(s => {
            assert.ok(ELEMENTS[s.el], `${s.name.en} has unknown element ${s.el}`);
            assert.ok(MODS[s.mod], `${s.name.en} has unknown modality ${s.mod}`);
            assert.ok(PLANETS[s.planet], `${s.name.en} has unknown planet ${s.planet}`);
        });
    });

    test('date ranges tile the year with no gaps or overlaps', () => {
        // sorted by wheel order (id order already is calendar order from Aries)
        for (let i = 0; i < SIGNS.length; i++) {
            const cur = SIGNS[i];
            const next = SIGNS[(i + 1) % SIGNS.length];
            let [m, d] = cur.to;
            d++;
            if (d > DAYS_IN_MONTH[m]) { d = 1; m = m === 12 ? 1 : m + 1; }
            assert.deepEqual([m, d], next.from,
                `${cur.name.en}'s day after "to" should be ${next.name.en}'s "from"`);
        }
    });

    test('elements group signs correctly, 3 per element, matching ELEMENTS.signs', () => {
        Object.keys(ELEMENTS).forEach(el => {
            const members = SIGNS.filter(s => s.el === el);
            assert.equal(members.length, 3, `expected 3 ${el} signs`);
            members.forEach(s => assert.ok(ELEMENTS[el].signs.includes(s.sym),
                `${s.sym} missing from ELEMENTS.${el}.signs listing`));
        });
    });

    test('modalities group signs correctly, 4 per modality (3 modalities x 4 = 12), matching MODS.signs', () => {
        Object.keys(MODS).forEach(mod => {
            const members = SIGNS.filter(s => s.mod === mod);
            assert.equal(members.length, 4, `expected 4 ${mod} signs`);
            members.forEach(s => assert.ok(MODS[mod].signs.includes(s.sym),
                `${s.sym} missing from MODS.${mod}.signs listing`));
        });
    });

    test('oppOf is an involution 6 signs apart', () => {
        SIGNS.forEach(s => {
            const o = oppOf(s);
            assert.equal(o.id, (s.id + 6) % 12);
            assert.equal(oppOf(o).id, s.id);
        });
    });
});

describe('astro-salon constants — compatibility rule', () => {
    test('same element is always compatible', () => {
        assert.ok(compatible(SIGNS[0], SIGNS[4])); // Aries/Leo, both fire
    });
    test('paired elements (fire<->air, earth<->water) are compatible', () => {
        assert.ok(compatible(SIGNS[0], SIGNS[2])); // Aries (fire) / Gemini (air)
        assert.ok(compatible(SIGNS[1], SIGNS[3])); // Taurus (earth) / Cancer (water)
    });
    test('non-paired distinct elements are not compatible', () => {
        assert.ok(!compatible(SIGNS[0], SIGNS[1])); // Aries (fire) / Taurus (earth)
        assert.ok(!compatible(SIGNS[2], SIGNS[3])); // Gemini (air) / Cancer (water)
    });
});

describe('astro-salon constants — birthdays', () => {
    test('daysInRange starts and ends at the sign\'s cusps', () => {
        const days = daysInRange(SIGNS[0]);
        assert.deepEqual(days[0], SIGNS[0].from);
        assert.deepEqual(days[days.length - 1], SIGNS[0].to);
    });

    test('birthdayFor never lands exactly on a cusp', () => {
        for (const s of SIGNS) {
            for (let i = 0; i < 50; i++) {
                const [m, d] = birthdayFor(s);
                assert.ok(!(m === s.from[0] && d === s.from[1]), `${s.name.en} birthday landed on the start cusp`);
                assert.ok(!(m === s.to[0] && d === s.to[1]), `${s.name.en} birthday landed on the end cusp`);
            }
        }
    });
});

describe('astro-salon constants — mulberry32 determinism', () => {
    test('same seed produces the same sequence', () => {
        const a = mulberry32(12345);
        const b = mulberry32(12345);
        for (let i = 0; i < 5; i++) assert.equal(a(), b());
    });
    test('output stays within [0, 1)', () => {
        const rng = mulberry32(999);
        for (let i = 0; i < 20; i++) {
            const v = rng();
            assert.ok(v >= 0 && v < 1);
        }
    });
});

describe('astro-salon gameplay — scoring math', () => {
    test('first-try correct answer earns 2 stars and grows the streak', () => {
        const r = computeScore(true, 1, 0, 0);
        assert.equal(r.earned, 2);
        assert.equal(r.newStreak, 1);
        assert.equal(r.newBestStreak, 1);
        assert.equal(r.bonus, 0);
    });

    test('second-try correct answer earns 1 star and resets the streak', () => {
        const r = computeScore(true, 2, 4, 4);
        assert.equal(r.earned, 1);
        assert.equal(r.newStreak, 0);
    });

    test('incorrect answer earns 0 stars and resets the streak', () => {
        const r = computeScore(false, 2, 5, 5);
        assert.equal(r.earned, 0);
        assert.equal(r.newStreak, 0);
    });

    test('every 3rd first-try streak earns a bonus star', () => {
        const r = computeScore(true, 1, 2, 2); // streak 2 -> 3
        assert.equal(r.newStreak, 3);
        assert.equal(r.bonus, 1);
    });

    test('bestStreak only ever grows', () => {
        const r = computeScore(true, 1, 1, 5); // streak 1 -> 2, but best was already 5
        assert.equal(r.newStreak, 2);
        assert.equal(r.newBestStreak, 5);
    });
});

describe('astro-salon i18n — EN/RU key parity', () => {
    test('both languages define exactly the same string keys', () => {
        const enKeys = Object.keys(STR.en).sort();
        const ruKeys = Object.keys(STR.ru).sort();
        assert.deepEqual(ruKeys, enKeys);
    });
});

describe('astro-salon constants — parallel content arrays', () => {
    test('HAPPY, FORTUNES, HOROSCOPE have matching en/ru lengths', () => {
        assert.equal(HAPPY.en.length, HAPPY.ru.length);
        assert.equal(FORTUNES.en.length, FORTUNES.ru.length);
        assert.equal(HOROSCOPE.en.themes.length, HOROSCOPE.ru.themes.length);
        assert.equal(HOROSCOPE.en.advice.length, HOROSCOPE.ru.advice.length);
    });

    test('p2-33: pools at least tripled from the v21 baseline (10 themes / 8 advice)', () => {
        assert.ok(HOROSCOPE.en.themes.length >= 30, `themes ${HOROSCOPE.en.themes.length} < 30`);
        assert.ok(HOROSCOPE.en.advice.length >= 24, `advice ${HOROSCOPE.en.advice.length} < 24`);
    });

    test('pool lines are unique within each language (no copy-paste dupes)', () => {
        for (const lang of ['en', 'ru']) {
            for (const pool of ['themes', 'advice']) {
                const arr = HOROSCOPE[lang][pool];
                assert.equal(new Set(arr).size, arr.length, `${lang}.${pool} has duplicates`);
            }
        }
    });

    test('YEAR_THEME is versioned and localized', () => {
        assert.ok(Number.isInteger(YEAR_THEME.version) && YEAR_THEME.version >= 1);
        assert.equal(YEAR_THEME.year, 2026);
        for (const lang of ['en', 'ru']) {
            assert.ok(YEAR_THEME.title[lang].length > 0);
            assert.ok(YEAR_THEME.line[lang].length > 0);
        }
    });
});

describe('astro-salon p2-33 — deterministic daily read', () => {
    test('same day + sign always yields the same read', () => {
        for (let sign = 0; sign <= GENERIC_SIGN; sign++) {
            assert.deepEqual(dailyReadIndices(20260715, sign), dailyReadIndices(20260715, sign));
        }
    });

    test('indices stay within their pools', () => {
        for (const ymd of [20260101, 20260715, 20261231]) {
            for (let sign = 0; sign <= GENERIC_SIGN; sign++) {
                const d = dailyReadIndices(ymd, sign);
                assert.ok(d.themeIdx >= 0 && d.themeIdx < HOROSCOPE.en.themes.length);
                assert.ok(d.adviceIdx >= 0 && d.adviceIdx < HOROSCOPE.en.advice.length);
                assert.ok(d.sodId >= 0 && d.sodId < 12);
                assert.ok(d.fortuneIdx >= 0 && d.fortuneIdx < FORTUNES.en.length);
            }
        }
    });

    test('consecutive days give the sign a different-feeling read (seed actually varies)', () => {
        const reads = new Set();
        for (let day = 1; day <= 10; day++) {
            const d = dailyReadIndices(20260700 + day, 3);
            reads.add(`${d.themeIdx}-${d.adviceIdx}-${d.sodId}`);
        }
        assert.ok(reads.size >= 8, `only ${reads.size}/10 distinct reads across 10 days`);
    });
});

describe('astro-salon p2-34 — rising sign & whole-sign houses', () => {
    test('at sunrise the sun sign itself rises', () => {
        SIGNS.forEach(s => assert.equal(risingFor(s.id, 0), s.id));
    });

    test('the ascendant advances one sign per 2 hours, wrapping the wheel', () => {
        assert.equal(risingFor(0, 2), 1);
        assert.equal(risingFor(0, 22), 11);
        assert.equal(risingFor(11, 4), 1);  // Pisces + 2 signs wraps to Taurus
    });

    test('BIRTH_HOURS sweep every offset exactly once', () => {
        const offsets = BIRTH_HOURS.map(h => risingFor(0, h)).sort((a, b) => a - b);
        assert.deepEqual(offsets, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    test('house 1 is the rising sign; houses walk clockwise; house 10 sits 9 signs on', () => {
        for (let rising = 0; rising < 12; rising++) {
            assert.equal(houseSignId(rising, 1), rising);
            assert.equal(houseSignId(rising, 10), (rising + 9) % 12);
            const all = HOUSES.map(h => houseSignId(rising, h.n));
            assert.equal(new Set(all).size, 12, 'each house maps to a distinct sign');
        }
    });

    test('HOUSES: 12 entries numbered 1-12 with localized labels and questions', () => {
        assert.equal(HOUSES.length, 12);
        HOUSES.forEach((h, i) => {
            assert.equal(h.n, i + 1);
            for (const lang of ['en', 'ru']) {
                assert.ok(h.label[lang].length > 0, `house ${h.n} missing ${lang} label`);
                assert.ok(h.q[lang].length > 0, `house ${h.n} missing ${lang} question`);
            }
        });
    });

    test('buildChartGuests deals all 12 houses exactly once across 4 guests', () => {
        for (let i = 0; i < 25; i++) {
            const guests = buildChartGuests();
            assert.equal(guests.length, CHART_GUESTS);
            const dealt = guests.flatMap(g => g.houses).sort((a, b) => a - b);
            assert.deepEqual(dealt, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            guests.forEach(g => {
                assert.equal(g.houses.length, HOUSES_PER_GUEST);
                assert.ok(BIRTH_HOURS.includes(g.hours), `odd birth hour ${g.hours}`);
                assert.equal(g.rising, risingFor(g.sign.id, g.hours), 'rising matches the rule');
            });
            // 4 distinct sun signs per session
            assert.equal(new Set(guests.map(g => g.sign.id)).size, CHART_GUESTS);
        }
    });
});

describe('astro-salon content — text generation smoke tests', () => {
    test('chipLabel renders for every question type without throwing', () => {
        assert.ok(chipLabel('element', 'fire').includes('Fire'));
        assert.ok(chipLabel('modality', 'cardinal').length > 0);
        assert.ok(chipLabel('planet', 'mars').length > 0);
        assert.ok(chipLabel('compat', 'yes').length > 0);
        assert.ok(chipLabel('compat', 'no').length > 0);
    });

    test('ruleText covers every phase without throwing', () => {
        const client = { sign: SIGNS[0], bm: 3, bd: 25 };
        ['sign', 'element', 'modality', 'planet', 'opposite'].forEach(phase => {
            assert.ok(ruleText(phase, client, null).length > 0, `ruleText threw/empty for ${phase}`);
        });
        assert.ok(ruleText('compat', client, SIGNS[2]).length > 0);
    });

    test('ruleText teaches the chart phases with the actual arithmetic', () => {
        const client = { sign: SIGNS[0], hours: 6, rising: risingFor(0, 6) }; // Aries + 3 → Cancer
        const rising = ruleText('rising', client, null);
        assert.ok(rising.includes('Cancer'), `rising rule missing the answer: ${rising}`);
        assert.ok(rising.includes('6'), 'rising rule should quote the birth hours');
        const house = ruleText('house', client, null, 10); // Cancer + 9 → Aries
        assert.ok(house.includes('Aries'), `house rule missing the answer: ${house}`);
        assert.ok(house.includes(HOUSES[9].label.en), 'house rule should name the house meaning');
    });

    test('hintText only produces content for wheel phases', () => {
        const client = { sign: SIGNS[0], bm: 3, bd: 25, hours: 4, rising: 2 };
        assert.ok(hintText('sign', client, 'the very start of spring').length > 0);
        assert.ok(hintText('opposite', client, '').length > 0);
        assert.ok(hintText('rising', client, '').length > 0);
        assert.ok(hintText('house', client, '', 7).length > 0);
        assert.equal(hintText('element', client, ''), '');
    });
});
