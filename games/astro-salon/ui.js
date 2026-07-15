// ═══════════════════════════════════════════════════════════════════════════
// UI — all rendering and DOM manipulation. Never imports gameplay.js (that
//      import runs the other way) — event wiring lives in main.js, which
//      reads data-* attributes off the elements this module builds.
// ═══════════════════════════════════════════════════════════════════════════

import {
    SIGNS, ELEMENT_COLOR, PLANETS, SEASONS, SEASON_HINTS, HAPPY, HOROSCOPE, FORTUNES, ELEMENTS,
    HOUSES, CHART_GUESTS, YEAR_THEME, dailyReadIndices, todayYMD,
    nameOf, fmtShort, fmtFull, rangeShort,
} from './constants.js';
import { t, getLang, setLang as i18nSetLang } from './i18n.js';
import { G, TOTAL_GUESTS, getMySign, setMySign, clearMySign, getBestStars } from './state.js';
import { chipLabel, ruleText, hintText } from './content.js';

export const $ = id => document.getElementById(id);

/* ---------------- wheel geometry ---------------- */

const CX = 200, CY = 200, R0 = 72, R1 = 196;

function polar(r, deg) {
    const rad = deg * Math.PI / 180;
    return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}
function wedgePath(a0, a1) {
    const [x0, y0] = polar(R0, a0), [x1, y1] = polar(R1, a0);
    const [x2, y2] = polar(R1, a1), [x3, y3] = polar(R0, a1);
    return `M ${x0} ${y0} L ${x1} ${y1} A ${R1} ${R1} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${R0} ${R0} 0 0 0 ${x0} ${y0} Z`;
}
function svgText(NS, x, y, cls, content, fill) {
    const el = document.createElementNS(NS, 'text');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('text-anchor', 'middle');
    if (fill) el.setAttribute('fill', fill);
    el.classList.add(cls);
    el.textContent = content;
    return el;
}

export function buildWheel() {
    const lang = getLang();
    const svg = $('wheel');
    const NS = 'http://www.w3.org/2000/svg';
    svg.innerHTML = '';
    SIGNS.forEach(sign => {
        // Aries centered at 12 o'clock (-90°), clockwise
        const mid = -90 + sign.id * 30;
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', wedgePath(mid - 15, mid + 15));
        path.setAttribute('fill', ELEMENT_COLOR[sign.el]);
        path.setAttribute('fill-opacity', '0.22');
        path.setAttribute('stroke', '#0b0a1a');
        path.setAttribute('stroke-width', '2');
        path.classList.add('wedge');
        path.dataset.sign = sign.id;
        svg.appendChild(path);

        // one anchor per wedge, symbol + name stacked vertically from it — radial
        // stacking overlaps on the 3/9-o'clock wedges and flips order in the
        // bottom hemisphere. Date ranges no longer render on the wedge at all
        // (round-3 playtest: "no need for text on each slice") — the hub shows
        // the full range big on first tap (read-then-confirm).
        const [ax, ay] = polar(140, mid);
        svg.appendChild(svgText(NS, ax, ay - 8, 'wedge-sym', sign.sym, ELEMENT_COLOR[sign.el]));
        svg.appendChild(svgText(NS, ax, ay + 14, 'wedge-name', nameOf(sign, lang)));
    });
    // season markers pinned to the corners, outside the rim
    SEASONS.forEach(se => {
        const right = se.deg === -45 || se.deg === 45;
        const y = (se.deg === -45 || se.deg === 225) ? 34 : 378;
        const label = svgText(NS, right ? 396 : 4, y, 'season-label', `${se.emoji} ${t('seasons')[se.key]}`);
        label.setAttribute('text-anchor', right ? 'end' : 'start');
        svg.appendChild(label);
    });
    // hub: three lines — big symbol/date, name, date range
    [['hub-a', -12], ['hub-b', 12], ['hub-c', 30]].forEach(([id, dy]) => {
        const el = svgText(NS, CX, CY + dy, id, '');
        el.id = id;
        svg.appendChild(el);
    });
}

export function setHub(a, b, c, color) {
    $('hub-a').textContent = a;
    $('hub-a').style.fill = color || '';
    $('hub-b').textContent = b || '';
    $('hub-c').textContent = c || '';
}
// the hub doubles as the readable "sign card": big symbol + name + dates
function setHubSign(sign) {
    setHub(sign.sym, nameOf(sign, getLang()), rangeShort(getLang(), sign), ELEMENT_COLOR[sign.el]);
}
export function wedgeEl(signId) {
    return document.querySelector(`.wedge[data-sign="${signId}"]`);
}
function clearWedgeMarks() {
    document.querySelectorAll('.wedge').forEach(w => w.classList.remove('correct', 'wrong', 'preview'));
}
export function setWheelActive(on) {
    $('wheel').classList.toggle('dimmed', !on);
}

export function updateHud(popped) {
    const s = $('stars');
    s.textContent = `⭐ ${G ? G.stars : 0}`;
    if (popped) { s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
    const st = $('streak');
    st.textContent = G && G.streak >= 2 ? `🔥 ×${G.streak}` : '';
    st.classList.toggle('hot', G && G.streak >= 3);
}

/* ---------------- question card ---------------- */

// full re-render of the current question from state (also used on language switch)
export function renderCard() {
    if (!G) return;
    const lang = getLang();
    const c = G.client;

    $('c-emoji').textContent = c.sign.emoji;
    $('c-name').textContent = G.revealed ? `${nameOf(c.sign, lang)} ${c.sign.sym}` : t('unknown');
    $('c-sub').textContent = t('guestN')(G.idx + 1, G.mode === 'chart' ? CHART_GUESTS : TOTAL_GUESTS);

    const bday = $('bday');
    const previewSign = !G.answered && G.preview !== null ? SIGNS[G.preview] : null;
    if (G.phase === 'rising') {
        $('speech').innerHTML = t('qRising');
        bday.innerHTML = t('bornChart')(c.hours);
        bday.classList.add('show');
        $('prompt').innerHTML = previewSign ? t('promptConfirm')(previewSign) : t('promptRising');
        if (previewSign) setHubSign(previewSign);
        else if (G.answered) setHubSign(SIGNS[c.rising]);
        else setHub('🌅', c.hours === 0 ? '' : `+ ${c.hours} ${lang === 'ru' ? 'ч' : 'h'}`, t('hubRising'));
    } else if (G.phase === 'house') {
        $('speech').innerHTML = HOUSES[G.houseN - 1].q[lang];
        bday.innerHTML = t('risingAnchor')(SIGNS[c.rising]);
        bday.classList.add('show');
        $('prompt').innerHTML = previewSign ? t('promptConfirm')(previewSign) : t('promptHouse')(G.houseN);
        // idle hub anchors the rising sign — "count from here"
        if (previewSign) setHubSign(previewSign);
        else if (G.answered) setHubSign(SIGNS[G.answer]);
        else setHubSign(SIGNS[c.rising]);
    } else if (G.phase === 'sign') {
        $('speech').innerHTML = c.sign.intro[lang];
        bday.innerHTML = t('born')(fmtFull(lang, c.bm, c.bd));
        bday.classList.add('show');
        if (previewSign) {
            setHubSign(previewSign);
            $('prompt').innerHTML = t('promptConfirm')(previewSign);
        } else if (G.answered) {
            $('prompt').textContent = t('promptSign');
            setHubSign(c.sign);
        } else {
            $('prompt').textContent = t('promptSign');
            setHub(fmtShort(lang, c.bm, c.bd), t('hubFind'));
        }
    } else {
        bday.classList.remove('show');
        if (G.phase === 'opposite' && previewSign) setHubSign(previewSign);
        else setHubSign(c.sign);
        if (G.phase === 'element') {
            $('speech').innerHTML = t('qElement');
            $('prompt').textContent = t('promptElement');
        } else if (G.phase === 'modality') {
            $('speech').innerHTML = t('qModality');
            $('prompt').textContent = t('promptModality');
        } else if (G.phase === 'planet') {
            $('speech').innerHTML = t('qPlanet');
            $('prompt').textContent = t('promptPlanet');
        } else if (G.phase === 'opposite') {
            $('speech').innerHTML = t('qOpposite');
            if (previewSign) $('prompt').innerHTML = t('promptConfirm')(previewSign);
            else $('prompt').textContent = t('promptOpposite');
        } else if (G.phase === 'compat') {
            $('speech').innerHTML = t('qCompat')(nameOf(G.partner, lang), G.partner.sym);
            $('prompt').textContent = t('promptCompat');
        }
    }

    // chips
    const box = $('chips');
    box.innerHTML = '';
    box.className = 'chips' + (G.phase === 'modality' ? ' single' : '');
    if (G.chipKeys) {
        G.chipKeys.forEach(key => {
            const b = document.createElement('button');
            b.className = 'chip';
            b.innerHTML = chipLabel(G.phase, key);
            b.dataset.key = key;
            if (G.wrongKeys.includes(key)) { b.classList.add('wrong'); b.disabled = true; }
            if (G.answered) {
                b.disabled = true;
                if (key === G.answer) b.classList.add('correct');
            }
            box.appendChild(b);
        });
    }

    // wheel activity + marks
    if (['sign', 'opposite', 'rising', 'house'].includes(G.phase)) {
        setWheelActive(!G.answered);
        clearWedgeMarks();
        if (G.answered) {
            wedgeEl(G.answer).classList.add('correct');
            if (G.lastWrongWedge !== null) wedgeEl(G.lastWrongWedge).classList.add('wrong');
        } else if (G.preview !== null) {
            wedgeEl(G.preview).classList.add('preview');
        }
    } else {
        setWheelActive(false);
        clearWedgeMarks();
    }

    // feedback
    const f = $('feedback');
    if (G.answered) {
        const rule = ruleText(G.phase, c, G.partner, G.houseN);
        if (G.lastCorrect) {
            const quip = G.phase === 'sign' ? t('revealYes')(c.sign) : HAPPY[lang][G.happyIdx];
            const bonus = G.lastBonus ? ` · 🔥 +${G.lastBonus}⭐ ${t('streakBonus')}` : '';
            f.className = 'feedback good';
            f.innerHTML = `✓ ${quip} &nbsp;+${G.lastEarned}⭐${bonus}<br>${rule}`;
        } else {
            const head = G.phase === 'sign' ? t('revealNo')(c.sign) : t('wrongHead');
            f.className = 'feedback bad';
            f.innerHTML = `✗ ${head}<br>${rule}`;
        }
    } else if (G.chipHint) {
        f.className = 'feedback hint';
        f.innerHTML = t('chipHint');
    } else if (G.wheelHint) {
        f.className = 'feedback hint';
        f.innerHTML = hintText(G.phase, c, SEASON_HINTS[lang][c.sign.id], G.houseN);
    } else {
        f.className = 'feedback';
        f.innerHTML = '';
    }

    $('btn-continue').textContent = t('continueBtn');
    $('btn-continue').classList.toggle('show', !!G.answered);
}

/* ---------------- session end ---------------- */

export function renderEnd() {
    if (!G || !G.done) return;
    const lang = getLang();
    const max = G.questions * 2; // 2⭐ per question, both session types
    const pct = G.stars / max;
    $('end-title').textContent = t(G.mode === 'chart' ? 'endTitleChart' : 'endTitle');
    $('end-stars').textContent = `⭐ ${G.stars}`;
    $('end-detail').textContent = t('endDetail')(G.firstTries, G.questions, G.bestStreak);
    $('end-line').textContent =
        t('endLines')[pct >= 0.9 ? 0 : pct >= 0.7 ? 1 : pct >= 0.4 ? 2 : 3];
    // quotes today's read (deterministic, agrees with the ✨ daily panel)
    $('end-fortune').textContent =
        `${t('fortunePrefix')} “${HOROSCOPE[lang].themes[G.daily.themeIdx]} ${FORTUNES[lang][G.daily.fortuneIdx]}”`;
    $('btn-again').textContent = t('againBtn');
    $('ov-end').classList.add('show');
}

/* ---------------- daily horoscope ---------------- */

export function renderDaily() {
    const lang = getLang();
    $('daily-title').textContent = t('dailyTitle');
    $('btn-daily-close').textContent = t('dailyClose');
    const body = $('daily-body');
    const changeBtn = $('btn-daily-change');
    changeBtn.textContent = t('dailyChange');

    const mySign = getMySign();
    if (mySign === null) {
        changeBtn.style.display = 'none';
        body.innerHTML = `<p>${t('dailyPick')}</p><div class="sign-grid">` + SIGNS.map(s =>
            `<button class="chip" data-sign="${s.id}"><span class="sg-sym" style="color:${ELEMENT_COLOR[s.el]}">${s.sym}</span><b>${nameOf(s, lang)}</b><small>${rangeShort(lang, s)}</small></button>`
        ).join('') + '</div>';
        body.querySelectorAll('.chip').forEach(b => b.addEventListener('pointerdown', e => {
            e.preventDefault();
            setMySign(+b.dataset.sign);
            renderDaily();
        }));
        return;
    }

    changeBtn.style.display = '';
    const s = SIGNS[mySign];
    const now = new Date();
    const d = dailyReadIndices(todayYMD(), mySign);
    const H = HOROSCOPE[lang];
    const theme = H.themes[d.themeIdx];
    const advice = H.advice[d.adviceIdx];
    const sod = SIGNS[d.sodId];
    const pair = ELEMENTS[s.el].pair;
    const elLine = lang === 'en'
        ? `Your element is <span class="${ELEMENTS[s.el].cls}">${ELEMENTS[s.el].label.en}</span> — today pairs well with <span class="${ELEMENTS[pair].cls}">${ELEMENTS[pair].label.en}</span> company (${ELEMENTS[pair].signs}).`
        : `Ваша стихия — <span class="${ELEMENTS[s.el].cls}">${ELEMENTS[s.el].label.ru}</span>. Сегодня легко в компании <span class="${ELEMENTS[pair].cls}">${ELEMENTS[pair].gen}</span> (${ELEMENTS[pair].signs}).`;
    body.innerHTML = `
        <div class="daily-head"><span style="color:${ELEMENT_COLOR[s.el]}">${s.sym}</span> ${nameOf(s, lang)}</div>
        <div class="daily-date">${fmtFull(lang, now.getMonth() + 1, now.getDate())}</div>
        <div class="daily-year">✨ ${YEAR_THEME.year} · ${YEAR_THEME.title[lang]}<br><small>${YEAR_THEME.line[lang]}</small></div>
        <div class="daily-read">
            <p>${theme}</p>
            <p>${elLine}</p>
            <p><b>${t('dailyDo')}:</b> ${advice}</p>
            <p><b>${t('dailySignOfDay')}:</b> <span style="color:${ELEMENT_COLOR[sod.el]}">${sod.sym}</span> ${nameOf(sod, lang)}</p>
        </div>`;
}
export function changeDailySign() {
    clearMySign();
    renderDaily();
}

/* ---------------- static UI + learn overlay ---------------- */

export function buildLearnTable() {
    const lang = getLang();
    $('learn-table').innerHTML = SIGNS.map(s => `
        <tr>
            <td class="sym" style="color:${ELEMENT_COLOR[s.el]}">${s.sym}</td>
            <td><b>${nameOf(s, lang)}</b></td>
            <td class="dt">${rangeShort(lang, s)}</td>
            <td class="${ELEMENTS[s.el].cls}">${ELEMENTS[s.el].label[lang]}</td>
            <td class="dt">${PLANETS[s.planet][lang]}</td>
        </tr>`).join('');
}

export function renderStatic() {
    const lang = getLang();
    $('app-title').innerHTML = t('title');
    $('start-title').innerHTML = t('title');
    $('start-p1').innerHTML = t('startP1');
    $('start-p2').innerHTML = t('startP2');
    $('start-p3').innerHTML = t('startP3');
    $('btn-start').textContent = t('startBtn');
    $('btn-start-chart').textContent = t('chartBtn');
    $('btn-start-daily').textContent = t('dailyBtn');
    $('btn-start-lang').textContent = t('langOther');
    $('btn-lang').textContent = lang === 'en' ? 'RU' : 'EN';
    $('learn-title').textContent = t('learnTitle');
    $('rule-year').innerHTML = t('ruleYear');
    $('rule-elements').innerHTML = t('ruleElements');
    $('rule-mods').innerHTML = t('ruleMods');
    $('rule-opps').innerHTML = t('ruleOpps');
    $('btn-learn-close').textContent = t('learnClose');
    $('btn-continue').textContent = t('continueBtn');
    const bests = [];
    if (getBestStars('salon') > 0) bests.push(t('bestStars')(getBestStars('salon')));
    if (getBestStars('chart') > 0) bests.push(t('bestStarsChart')(getBestStars('chart')));
    $('best-line').textContent = bests.join(' · ');
}

export function applyLanguage(l) {
    i18nSetLang(l);
    document.documentElement.lang = l;
    renderStatic();
    buildWheel();
    buildLearnTable();
    if ($('ov-daily').classList.contains('show')) renderDaily();
    if (G && G.done) renderEnd();
    else if (G) renderCard();
    else setHub('🔮', '');
}
