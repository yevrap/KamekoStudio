// ═══════════════════════════════════════════════════════════════════════════
// CONTENT — pure text/HTML generation for questions, chips, and rules.
//           DOM-free; imported by both ui.js and its tests. Does NOT import
//           gameplay.js or ui.js, so it can't create an import cycle.
// ═══════════════════════════════════════════════════════════════════════════

import { ELEMENTS, MODS, PLANETS, SIGNS, HOUSES, oppOf, elLabel, elSpan, fmtFull, rangeShort } from './constants.js';
import { t, getLang } from './i18n.js';

export function chipLabel(phase, key) {
    const lang = getLang();
    switch (phase) {
        case 'element':
            return `${elLabel(key, lang)}<small>${ELEMENTS[key].signs}</small>`;
        case 'modality':
            return `${MODS[key].label[lang]}<small>${MODS[key].hint[lang]} — ${MODS[key].desc[lang]}</small>`;
        case 'planet':
            return PLANETS[key][lang];
        case 'compat':
            return key === 'yes'
                ? `${t('compatYes')}<small>${t('compatYesSub')}</small>`
                : `${t('compatNo')}<small>${t('compatNoSub')}</small>`;
    }
}

export function ruleText(phase, client, partner, houseN) {
    const s = client.sign;
    const lang = getLang();
    const en = lang === 'en';
    switch (phase) {
        case 'sign':
            return en
                ? `${fmtFull(lang, client.bm, client.bd)} falls in <b>${s.name.en} ${s.sym}</b> (${rangeShort(lang, s)}).`
                : `${fmtFull(lang, client.bm, client.bd)} — это <b>${s.name.ru} ${s.sym}</b> (${rangeShort(lang, s)}).`;
        case 'element':
            return en
                ? `${s.name.en} is ${elSpan(s.el, lang)} — ${elLabel(s.el, lang)} signs are ${ELEMENTS[s.el].signs}.`
                : `${s.name.ru} — знак ${ELEMENTS[s.el].gen}. Знаки ${ELEMENTS[s.el].gen}: ${ELEMENTS[s.el].signs}.`;
        case 'modality': {
            const m = MODS[s.mod];
            return en
                ? `${s.name.en} is <b>${m.label.en}</b> (${m.hint.en}): it ${m.desc.en}. ${m.pl.en} signs are ${m.signs}.`
                : `${s.name.ru} — <b>${m.label.ru.toLowerCase()}</b> знак: он ${m.desc.ru}. ${m.pl.ru}: ${m.signs}.`;
        }
        case 'planet':
            return en
                ? `${s.name.en} ${s.sym} is ruled by <b>${PLANETS[s.planet].en}</b>.`
                : `Управитель знака ${s.name.ru} ${s.sym} — <b>${PLANETS[s.planet].ru}</b>.`;
        case 'opposite': {
            const o = oppOf(s);
            return en
                ? `Opposites sit 6 signs apart: <b>${s.name.en} ${s.sym} ↔ ${o.name.en} ${o.sym}</b>.`
                : `Противоположности — через 6 знаков: <b>${s.name.ru} ${s.sym} ↔ ${o.name.ru} ${o.sym}</b>.`;
        }
        case 'compat': {
            const p = partner;
            const ok = s.el === p.el || ELEMENTS[s.el].pair === p.el;
            const A = elSpan(s.el, lang), B = elSpan(p.el, lang);
            if (en) {
                const rel = s.el === p.el ? 'share the same element' :
                    (ok ? `are a classic pair (${elLabel(s.el, lang)} ↔ ${elLabel(p.el, lang)})` :
                        `don't naturally pair (${elLabel(s.el, lang)} + ${elLabel(p.el, lang)})`);
                return `${A} and ${B} ${rel}. Rule: Fire ↔ Air, Earth ↔ Water.`;
            }
            const rel = s.el === p.el ? 'одна стихия — лёгкая пара' :
                (ok ? `классическая пара (${elLabel(s.el, lang)} ↔ ${elLabel(p.el, lang)})` :
                    `сами собой не складываются (${elLabel(s.el, lang)} + ${elLabel(p.el, lang)})`);
            return `${A} и ${B} — ${rel}. Правило: Огонь ↔ Воздух, Земля ↔ Вода.`;
        }
        case 'rising': {
            const r = SIGNS[client.rising];
            const k = client.hours / 2;
            return en
                ? `At sunrise <b>${s.name.en} ${s.sym}</b> itself is rising; the ascendant moves one sign every ~2 hours. ${client.hours} h ÷ 2 = ${k} signs clockwise → <b>${r.name.en} ${r.sym}</b>.`
                : `На рассвете восходит сам знак <b>${s.name.ru} ${s.sym}</b>; асцендент сдвигается на знак каждые ~2 часа. ${client.hours} ч ÷ 2 = ${k} знаков по часовой → <b>${r.name.ru} ${r.sym}</b>.`;
        }
        case 'house': {
            const r = SIGNS[client.rising];
            const h = HOUSES[houseN - 1];
            const a = SIGNS[(client.rising + houseN - 1) % 12];
            return en
                ? `Houses count clockwise from the rising sign: 1st is <b>${r.name.en} ${r.sym}</b>, so the ${houseN}${ordEn(houseN)} is <b>${a.name.en} ${a.sym}</b> — the house of ${h.label.en}.`
                : `Дома отсчитываются по часовой от асцендента: 1-й — <b>${r.name.ru} ${r.sym}</b>, значит ${houseN}-й — <b>${a.name.ru} ${a.sym}</b>. Это дом: ${h.label.ru}.`;
        }
    }
}

export const ordEn = n => (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');

export function hintText(phase, client, seasonHint, houseN) {
    const lang = getLang();
    if (phase === 'sign') {
        return t('hintSign')(fmtFull(lang, client.bm, client.bd), seasonHint);
    }
    if (phase === 'opposite') {
        return t('hintOpp')(client.sign.sym);
    }
    if (phase === 'rising') {
        return t('hintRising')(client.sign, client.hours);
    }
    if (phase === 'house') {
        return t('hintHouse')(SIGNS[client.rising], houseN);
    }
    return '';
}
