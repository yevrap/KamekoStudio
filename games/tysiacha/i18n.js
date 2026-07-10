// ═══════════════════════════════════════════════════════════════════════════
// I18N — full string table (en/ru) + language state. DOM-free.
//        Every user-facing string routes through t(); entries are plain
//        strings or functions of the event/context. Log entries are typed
//        and formatted at render time, so switching language re-renders the
//        whole match history in the new language — nothing is stored as text.
// ═══════════════════════════════════════════════════════════════════════════

import { SUIT_CHAR, SUIT_IS_RED, MARRIAGE } from './constants.js';

const hasLS = typeof localStorage !== 'undefined';

let lang = (hasLS && localStorage.getItem('tysiacha_lang')) || 'en';

export function getLang() { return lang; }
export function setLang(l) {
    lang = l === 'ru' ? 'ru' : 'en';
    if (hasLS) localStorage.setItem('tysiacha_lang', lang);
}

// Custom player names (set in ⚙️ settings) override the localized defaults.
const customNames = [null, null, null];
if (hasLS) for (let p = 0; p < 3; p++) customNames[p] = localStorage.getItem('tysiacha_name_' + p);

export function setCustomName(p, name) {
    customNames[p] = name || null;
    if (hasLS) {
        if (name) localStorage.setItem('tysiacha_name_' + p, name);
        else localStorage.removeItem('tysiacha_name_' + p);
    }
}
export function customName(p) { return customNames[p]; }

export function playerName(p) { return customNames[p] || t('name' + p); }

// Player 0 is addressed in the second person ("You pass" / "Вы пасуете")
// only while they keep the default name; a custom name reads third-person.
const isYou = p => p === 0 && !customNames[0];

export function t(key, ...args) {
    const v = (TABLE[lang][key] !== undefined) ? TABLE[lang][key] : TABLE.en[key];
    return typeof v === 'function' ? v(...args) : v;
}

// Rank letters on cards and in text: Russian decks use Т В Д К.
const RU_RANK = { '9': '9', J: 'В', Q: 'Д', K: 'К', '10': '10', A: 'Т' };
export function rankText(r) { return lang === 'ru' ? RU_RANK[r] : r; }
export function cardText(c) { return rankText(c.r) + SUIT_CHAR[c.s]; }

export function suitText(s) {
    return lang === 'ru'
        ? { H: 'червы', D: 'бубны', C: 'трефы', S: 'пики' }[s]
        : { H: 'hearts', D: 'diamonds', C: 'clubs', S: 'spades' }[s];
}

export const suitHTML = s => `<span class="${SUIT_IS_RED[s] ? 'suit-red' : ''}">${SUIT_CHAR[s]}</span>`;

// ── English ──────────────────────────────────────────────────────────────

const EN = {
    name0: 'You', name1: 'Vera', name2: 'Boris',

    // event stream (log.js routes every entry here)
    'ev.deal-start': e => e.forced
        ? `Deal ${e.deal} — ${playerName(e.p)} open${sfx(e.p)} the bidding at 100 (forced)`
        : `Deal ${e.deal} — ${playerName(e.p)} start${sfx(e.p)} the bidding`,
    'ev.bid': e => `${playerName(e.p)} bid${sfx(e.p)} ${e.amount}`,
    'ev.pass': e => `${playerName(e.p)} pass${isYou(e.p) ? '' : 'es'}`,
    'ev.bid-won': e => `${playerName(e.p)} win${sfx(e.p)} the bidding at ${e.amount} and take${sfx(e.p)} the talon`,
    'ev.raspasy': () => 'Everyone passed! Playing Raspasy (Negative Round) 📉',
    'ev.reraise': e => `${playerName(e.p)} raise${sfx(e.p)} the bid to ${e.amount}`,
    'ev.exchange': e => isYou(e.p)
        ? `You passed a card to ${playerName(e.to1)} and one to ${playerName(e.to2)}`
        : `${playerName(e.p)} passes one card to ${playerName(e.to1)} and one to ${playerName(e.to2)}`,
    'ev.marriage': e => `💍 ${playerName(e.p)} declare${sfx(e.p)} the ${SUIT_CHAR[e.suit]} marriage — ${suitText(e.suit)} are trump! +${MARRIAGE[e.suit]}`,
    'ev.play': e => `${playerName(e.p)} play${sfx(e.p)} ${cardText(e.card)}${e.isLead ? ' (led)' : ''}`,
    'ev.trick-won': e => `${playerName(e.p)} take${sfx(e.p)} the trick (+${e.pts} — ${t('reason.' + e.reason.kind, e.reason)})`,
    'ev.hint': e => `🧭 ${e.text}`,
    'ev.deal-end': e => `Deal ${e.deal} scored — ` + e.deltas
        .map(d => `${playerName(d.p)} ${d.delta >= 0 ? '+' : ''}${d.delta}`).join(' · '),

    'reason.highest': r => `highest ${SUIT_CHAR[r.suit]}`,
    'reason.trumped': r => `trumped with ${cardText(r.card)}`,
    'reason.short.highest': r => `highest ${SUIT_CHAR[r.suit]}`,
    'reason.short.trumped': r => `trumped ${cardText(r.card)}`,

    // status bar / chip / table
    'phase.bidding': (deal, bid, name) => `Deal ${deal} · Bidding — high bid ${bid}${name ? ` (${name})` : ''}`,
    'phase.talon': deal => `Deal ${deal} · Talon revealed`,
    'phase.exchange': deal => `Deal ${deal} · Exchange`,
    'phase.play': (deal, trick) => `Deal ${deal} · Trick ${trick}/8`,
    'phase.dealEnd': deal => `Deal ${deal} · Finished`,
    'phase.matchEnd': 'Match over',
    'chip.led': 'led', 'chip.trump': 'trump', 'chip.noTrump': 'no trump',
    'slot.led': 'led',

    // bid labels under opponents
    'lbl.bid': n => `bid ${n}`, 'lbl.passed': 'passed',
    'lbl.playsFor': n => `👑 plays for ${n}`,
    'info.opp': (tricks, pts) => `tricks ${tricks} · deal pts ${pts}`,
    'info.score': 'score',
    'info.me': (tricks, pts) => `tricks ${tricks} · deal pts ${pts} · score`,

    // action buttons
    'act.bid': n => `Bid ${n}`, 'act.pass': 'Pass', 'act.give': 'Give cards',
    'act.reraise': n => `Raise bid to ${n}`,
    'give.to': name => `→ ${name}`,

    // illegal-card tips
    'illegal.follow': led => `You must follow suit — play a ${suitText(led)} card (${SUIT_CHAR[led]}).`,
    'illegal.trump': (led, trump) => `No ${SUIT_CHAR[led]} in hand — you must play a trump (${SUIT_CHAR[trump]}).`,
    'illegal.other': 'That card can\'t be played right now.',

    // coach
    'coach.passed': 'You passed — watch how high the others push the bid.',
    'coach.marriages': mar => ` + marriage${mar.length > 1 ? 's' : ''} ${mar.map(s => SUIT_CHAR[s] + MARRIAGE[s]).join(', ')}`,
    'coach.noMarriage': ', no marriage in hand',
    'coach.bidTurn': (pts, marTxt, est) => `Your hand: ~${pts} card points${marTxt}. The talon adds ~3 cards of upside. Bidding much beyond ~${est} is risky — fail the bid and you LOSE that many points.`,
    'coach.bidWait': (name, bid) => `${name} is deciding whether to outbid ${bid}…`,
    'coach.talon': 'The 3 talon cards are revealed to everyone, then join the bid winner\'s hand.',
    'coach.exchange': (n1, n2) => `Pick 2 cards to give away — 1st goes to ${n1}, 2nd to ${n2}. Coach: dump 9s and Js, never split a K+Q pair (that's a future trump!), and keep aces.`,
    'coach.exchangeWait': name => `${name} is choosing two cards to give away…`,
    'coach.thinking': name => `${name} is thinking…`,
    'coach.leadDeclare': mar => `You lead. You hold K+Q of ${mar.map(s => SUIT_CHAR[s]).join(' ')} — lead one of them (tap twice) and declare to set trump and score +${MARRIAGE[mar[0]]}!`,
    'coach.leadLocked': mar => `You lead. You hold a K+Q pair (${mar.map(s => SUIT_CHAR[s]).join(' ')}) but must WIN a trick before declaring it. An ace lead usually wins.`,
    'coach.lead': 'You lead — any card. Coach: aces almost always win their trick (11 pts); save weak cards for tricks you\'ve already lost.',
    'coach.mustTrump': led => `No ${SUIT_CHAR[led]} — you must play a trump.`,
    'coach.follow': led => `Follow ${suitText(led)} ${SUIT_CHAR[led]} if you can.`,
    'coach.wouldWin': (card, pts) => ` Your ${card} would win the trick (${pts} pts in it).`,
    'coach.cantWin': ' You can\'t win this trick — dump your most worthless card (9 or J).',
    'coach.tapTwice': ' Tap a card twice to play it.',
    'coach.endMade': 'You bid and delivered — that\'s the whole game.',
    'coach.endFailed': 'Failed bids subtract the full bid — bid closer to what your hand can actually win.',
    'coach.endDefender': 'As a defender you keep every point you grab — stealing tricks from the declarer hurts them twice.',

    // deal-end notes (scoring table)
    'note.made': bid => `<span class="made">made the ${bid} bid → +${bid}</span>`,
    'note.failed': bid => `<span class="failed">failed the ${bid} bid → −${bid}</span>`,
    'note.raspasyTook': got => `<span class="failed">Took ${got} pts → −${got}</span>`,
    'note.raspasyZero': '<span class="made">No tricks → 0</span>',
    'note.bolt': ' (Bolt)',
    'note.bolts3': ' <span class="failed">3 Bolts! −120</span>',
    'note.barrelFellOff': ' <span class="failed">Fell off barrel! −120</span>',
    'note.barrelAttempt': n => ` <span class="muted">Barrel attempt ${n}/3</span>`,
    'note.barrelOn': ' <span class="made">On the barrel!</span>',
    'note.barrelLost': ' <span class="failed">Fell off barrel!</span>',

    // summary overlay
    'sum.youWin': '🏆 You win the match!',
    'sum.winner': name => `🏆 ${name} wins the match`,
    'sum.deal': n => `Deal ${n} — result`,
    'sum.newMatch': 'New match', 'sum.nextDeal': 'Next deal →',
    'sum.headers': ['Player', 'Tricks', 'Marriage', 'Result', 'Total'],
    'sum.review': '📜 Review deal',
    'banner.highScore': n => `New high score! ${n}`,

    // marriage prompt
    'marry.title': 'Declare a marriage?',
    'marry.body': card => `<p>You hold both ${suitHTML(card.s)} K and Q. Leading the <span class="hl">${cardText(card)}</span> lets you declare the marriage:</p>
        <p>· ${suitText(card.s)} become <span class="hl">trump</span> — they beat every other suit<br>
        · you immediately score <span class="hl">+${MARRIAGE[card.s]} points</span></p>`,
    'marry.no': 'Just play the card', 'marry.yes': 'Declare!',

    // static chrome
    'title': 'Tysiacha', 'subtitle': target => `· to ${target}`,
    'btn.rules': 'Rules', 'btn.hint': 'Hint',
    'howto.title': 'Rules of Tysiacha', 'log.title': '📜 Game log',
    'log.empty': 'Nothing yet — events appear here as the deal unfolds.',
    'log.deal': n => `Deal ${n}`,
    'set.title': 'Game Settings',
    'set.lang': 'Language / Язык',
    'set.target': 'Target Score',
    'set.target500': '500 (Quick Match)', 'set.target1000': '1000 (Classic)',
    'set.rulesHdr': 'Classic Rules',
    'set.barrel': '<strong>The Barrel (880):</strong> Must win on the bid. 3 fails drops score.',
    'set.bolts': '<strong>Bolts:</strong> 0 tricks in a deal gives a bolt. 3 bolts = −120.',
    'set.rounding': '<strong>Rounding:</strong> Round scores to the nearest 5.',
    'set.reraise': '<strong>Re-raise:</strong> Declarer can raise bid after talon.',
    'set.raspasy': '<strong>Raspasy:</strong> If all pass, negative round is played.',
    'set.hidden': '<strong>Hidden Points:</strong> Hide opponent scores during deal.',
    'set.apply': 'Apply & Restart',

    // how-to overlay (title/body pairs)
    'howto': () => HOWTO_EN,
};

// English third-person -s: "You bid" / "Vera bids".
const sfx = p => isYou(p) ? '' : 's';

// ── Russian ──────────────────────────────────────────────────────────────
// Player 0 keeps formal second person («Вы ставите») while unnamed; the
// exchange lines use the case-neutral «игроку <имя>» so custom names never
// need declension.

const RU = {
    name0: 'Вы', name1: 'Вера', name2: 'Борис',

    'ev.deal-start': e => e.forced
        ? `Раздача ${e.deal} — ${playerName(e.p)} ${vy(e.p, 'открываете', 'открывает')} торги со 100 (обязательно)`
        : `Раздача ${e.deal} — ${playerName(e.p)} ${vy(e.p, 'начинаете', 'начинает')} торги`,
    'ev.bid': e => `${playerName(e.p)} ${vy(e.p, 'ставите', 'ставит')} ${e.amount}`,
    'ev.pass': e => `${playerName(e.p)} ${vy(e.p, 'пасуете', 'пасует')}`,
    'ev.bid-won': e => `${playerName(e.p)} ${vy(e.p, 'выигрываете', 'выигрывает')} торги на ${e.amount} и ${vy(e.p, 'берёте', 'берёт')} прикуп`,
    'ev.raspasy': () => 'Все спасовали! Играем распасы 📉',
    'ev.reraise': e => `${playerName(e.p)} ${vy(e.p, 'поднимаете', 'поднимает')} ставку до ${e.amount}`,
    'ev.exchange': e => `${playerName(e.p)} ${vy(e.p, 'отдаёте', 'отдаёт')} по карте: игроку ${playerName(e.to1)} и игроку ${playerName(e.to2)}`,
    'ev.marriage': e => `💍 ${playerName(e.p)} ${vy(e.p, 'объявляете', 'объявляет')} марьяж ${SUIT_CHAR[e.suit]} — ${suitText(e.suit)} козыри! +${MARRIAGE[e.suit]}`,
    'ev.play': e => `${playerName(e.p)} ${vy(e.p, 'играете', 'играет')} ${cardText(e.card)}${e.isLead ? ' (заход)' : ''}`,
    'ev.trick-won': e => `${playerName(e.p)} ${vy(e.p, 'забираете', 'забирает')} взятку (+${e.pts} — ${t('reason.' + e.reason.kind, e.reason)})`,
    'ev.hint': e => `🧭 ${e.text}`,
    'ev.deal-end': e => `Раздача ${e.deal} сыграна — ` + e.deltas
        .map(d => `${playerName(d.p)} ${d.delta >= 0 ? '+' : ''}${d.delta}`).join(' · '),

    'reason.highest': r => `старшая ${SUIT_CHAR[r.suit]}`,
    'reason.trumped': r => `бита козырем ${cardText(r.card)}`,
    'reason.short.highest': r => `старшая ${SUIT_CHAR[r.suit]}`,
    'reason.short.trumped': r => `козырь ${cardText(r.card)}`,

    'phase.bidding': (deal, bid, name) => `Раздача ${deal} · Торги — ставка ${bid}${name ? ` (${name})` : ''}`,
    'phase.talon': deal => `Раздача ${deal} · Прикуп открыт`,
    'phase.exchange': deal => `Раздача ${deal} · Сброс`,
    'phase.play': (deal, trick) => `Раздача ${deal} · Взятка ${trick}/8`,
    'phase.dealEnd': deal => `Раздача ${deal} · Сыграна`,
    'phase.matchEnd': 'Матч окончен',
    'chip.led': 'заход', 'chip.trump': 'козырь', 'chip.noTrump': 'нет козыря',
    'slot.led': 'заход',

    'lbl.bid': n => `ставка ${n}`, 'lbl.passed': 'пас',
    'lbl.playsFor': n => `👑 играет на ${n}`,
    'info.opp': (tricks, pts) => `взятки ${tricks} · очки ${pts}`,
    'info.score': 'счёт',
    'info.me': (tricks, pts) => `взятки ${tricks} · очки ${pts} · счёт`,

    'act.bid': n => `Ставка ${n}`, 'act.pass': 'Пас', 'act.give': 'Отдать карты',
    'act.reraise': n => `Поднять до ${n}`,
    'give.to': name => `→ ${name}`,

    'illegal.follow': led => `Нужно ходить в масть — сыграйте ${suitText(led)} (${SUIT_CHAR[led]}).`,
    'illegal.trump': (led, trump) => `Нет ${SUIT_CHAR[led]} на руке — вы обязаны играть козырь (${SUIT_CHAR[trump]}).`,
    'illegal.other': 'Эту карту сейчас сыграть нельзя.',

    'coach.passed': 'Вы спасовали — смотрите, до чего доторгуются остальные.',
    'coach.marriages': mar => ` + марьяж${mar.length > 1 ? 'и' : ''} ${mar.map(s => SUIT_CHAR[s] + MARRIAGE[s]).join(', ')}`,
    'coach.noMarriage': ', марьяжа на руке нет',
    'coach.bidTurn': (pts, marTxt, est) => `Ваша рука: ~${pts} очков картами${marTxt}. Прикуп добавит ~3 карты. Торговаться сильно выше ~${est} рискованно — провалите ставку и ПОТЕРЯЕТЕ столько же очков.`,
    'coach.bidWait': (name, bid) => `${name} решает, перебивать ли ${bid}…`,
    'coach.talon': 'Три карты прикупа открываются всем, затем уходят в руку победителя торгов.',
    'coach.exchange': (n1, n2) => `Выберите 2 карты на сброс — первая уйдёт игроку ${n1}, вторая игроку ${n2}. Совет: сбрасывайте девятки и валетов, не разбивайте пару К+Д (это будущий козырь!) и держите тузов.`,
    'coach.exchangeWait': name => `${name} выбирает две карты на сброс…`,
    'coach.thinking': name => `${name} думает…`,
    'coach.leadDeclare': mar => `Ваш заход. У вас К+Д ${mar.map(s => SUIT_CHAR[s]).join(' ')} — зайдите с одной из них (двойное касание) и объявите марьяж: козырь + сразу +${MARRIAGE[mar[0]]}!`,
    'coach.leadLocked': mar => `Ваш заход. У вас пара К+Д (${mar.map(s => SUIT_CHAR[s]).join(' ')}), но марьяж объявляют только после взятой взятки. Заход с туза обычно берёт.`,
    'coach.lead': 'Ваш заход — любая карта. Совет: тузы почти всегда берут взятку (11 очков); слабые карты приберегите для чужих взяток.',
    'coach.mustTrump': led => `Нет ${SUIT_CHAR[led]} — вы обязаны играть козырь.`,
    'coach.follow': led => `Ходите в масть ${SUIT_CHAR[led]} (${suitText(led)}), если она есть.`,
    'coach.wouldWin': (card, pts) => ` Ваша ${card} возьмёт эту взятку (в ней ${pts} очков).`,
    'coach.cantWin': ' Эту взятку не взять — сбросьте самую бесполезную карту (9 или В).',
    'coach.tapTwice': ' Двойное касание — сыграть карту.',
    'coach.endMade': 'Вы заказали и выполнили — в этом вся игра.',
    'coach.endFailed': 'Проваленная ставка вычитается целиком — заказывайте ближе к тому, что рука реально возьмёт.',
    'coach.endDefender': 'Защитник оставляет себе каждое взятое очко — взятки, украденные у разыгрывающего, бьют по нему дважды.',

    'note.made': bid => `<span class="made">ставка ${bid} взята → +${bid}</span>`,
    'note.failed': bid => `<span class="failed">ставка ${bid} провалена → −${bid}</span>`,
    'note.raspasyTook': got => `<span class="failed">Взято ${got} очков → −${got}</span>`,
    'note.raspasyZero': '<span class="made">Без взяток → 0</span>',
    'note.bolt': ' (болт)',
    'note.bolts3': ' <span class="failed">3 болта! −120</span>',
    'note.barrelFellOff': ' <span class="failed">Слетел с бочки! −120</span>',
    'note.barrelAttempt': n => ` <span class="muted">Попытка на бочке ${n}/3</span>`,
    'note.barrelOn': ' <span class="made">На бочке!</span>',
    'note.barrelLost': ' <span class="failed">Слетел с бочки!</span>',

    'sum.youWin': '🏆 Вы выиграли матч!',
    'sum.winner': name => `🏆 ${name} выигрывает матч`,
    'sum.deal': n => `Раздача ${n} — результат`,
    'sum.newMatch': 'Новый матч', 'sum.nextDeal': 'Следующая раздача →',
    'sum.headers': ['Игрок', 'Взятки', 'Марьяж', 'Результат', 'Итог'],
    'sum.review': '📜 Журнал раздачи',
    'banner.highScore': n => `Новый рекорд! ${n}`,

    'marry.title': 'Объявить марьяж?',
    'marry.body': card => `<p>У вас ${suitHTML(card.s)} К и Д. Заход с <span class="hl">${cardText(card)}</span> позволяет объявить марьяж:</p>
        <p>· ${suitText(card.s)} становятся <span class="hl">козырем</span> — бьют все остальные масти<br>
        · вы сразу получаете <span class="hl">+${MARRIAGE[card.s]} очков</span></p>`,
    'marry.no': 'Просто сыграть карту', 'marry.yes': 'Объявить!',

    'title': 'Тысяча', 'subtitle': target => `· до ${target}`,
    'btn.rules': 'Правила', 'btn.hint': 'Совет',
    'howto.title': 'Правила «Тысячи»', 'log.title': '📜 Журнал игры',
    'log.empty': 'Пока пусто — события появятся по ходу раздачи.',
    'log.deal': n => `Раздача ${n}`,
    'set.title': 'Настройки игры',
    'set.lang': 'Язык / Language',
    'set.target': 'Целевой счёт',
    'set.target500': '500 (быстрый матч)', 'set.target1000': '1000 (классика)',
    'set.rulesHdr': 'Классические правила',
    'set.barrel': '<strong>Бочка (880):</strong> победа только через взятую ставку. 3 неудачи — минус 120.',
    'set.bolts': '<strong>Болты:</strong> 0 взяток за раздачу — болт. 3 болта = −120.',
    'set.rounding': '<strong>Округление:</strong> очки раздачи округляются до 5.',
    'set.reraise': '<strong>Перезаказ:</strong> разыгрывающий может поднять ставку после прикупа.',
    'set.raspasy': '<strong>Распасы:</strong> если все пасуют, играется распасовка.',
    'set.hidden': '<strong>Скрытые очки:</strong> счёт соперников скрыт во время раздачи.',
    'set.apply': 'Применить и начать заново',

    'howto': () => HOWTO_RU,
};

// Russian second-person plural for the default "Вы" seat, third person otherwise.
const vy = (p, second, third) => isYou(p) ? second : third;

const TABLE = { en: EN, ru: RU };

// ── How-to content ───────────────────────────────────────────────────────

const HOWTO_EN = [
    ['The goal', `<p>Tysiacha ("<span class="hl">a thousand</span>") is a classic 3-player card game from the Russian-speaking world. First player to <span class="hl">1000 points</span> (or 500 in Quick Match) wins.</p><p>You play against Vera and Boris. Each deal, you win points by taking <span class="hl">tricks</span> — and by declaring <span class="hl">marriages</span>.</p><p>The built-in 🧭 Hint bar explains every situation. This overlay reopens with the <span class="hl">Rules</span> button.</p>`],
    ['The cards', `<p>Only 24 cards are used: <span class="hl">9, J, Q, K, 10, A</span> in each suit.</p><p>Card strength (high → low): <span class="hl">A, 10, K, Q, J, 9</span> — yes, the 10 beats the King!</p><p>Each card is worth points:<br>A = <span class="hl">11</span> · 10 = <span class="hl">10</span> · K = <span class="hl">4</span> · Q = <span class="hl">3</span> · J = <span class="hl">2</span> · 9 = <span class="hl">0</span></p><p>There are 120 card points in every deal. (Point values are printed in the card corner.)</p>`],
    ['Bidding', `<p>Each deal starts with an <span class="hl">auction</span>: how many points do you promise to win this deal? Bidding starts at 100 (forced) and rises in tens.</p><p>The winner (the <span class="hl">declarer</span> 👑) takes the 3-card <span class="hl">talon</span>, then gives one unwanted card to each opponent.</p><p><span class="hl">Make the bid → +bid points. Fail → −bid points.</span> Defenders always keep whatever points they win. Bid boldly, but only if your hand can deliver.</p>`],
    ['Tricks', `<p>The declarer leads a card; the others each add one. You <span class="hl">must follow the led suit</span> if you can; with none, you <span class="hl">must play a trump</span> if you have one.</p><p>Highest card of the led suit wins — unless a <span class="hl">trump</span> was played; then the highest trump wins. The winner collects the points and leads next.</p><p>Illegal cards are dimmed in your hand — you can't misplay. Tap a card once to raise it, twice to play it.</p>`],
    ['Marriages 💍', `<p>Holding both <span class="hl">K + Q of one suit</span> is a "marriage". When it's your turn to <span class="hl">lead</span> (after you've won at least one trick), lead the K or Q and declare it:</p><p>· that suit becomes <span class="hl">trump</span> immediately<br>· you instantly score: <span class="suit-red">♥</span> = <span class="hl">100</span> · <span class="suit-red">♦</span> = <span class="hl">80</span> · ♣ = <span class="hl">60</span> · ♠ = <span class="hl">40</span></p><p>A new marriage overrides the old trump. Marriages are the engine of big bids — protect those K+Q pairs!</p>`],
    ['Classic Rules', `<p>Toggle advanced rules in the ⚙️ Settings menu.</p><p><span class="hl">The Barrel:</span> A player at 880 pts (or 380) sits on the barrel. They must win the bid to win the match. 3 fails drops them 120 pts.</p><p><span class="hl">Bolts ⚡:</span> Taking 0 tricks gives a bolt. 3 bolts = −120 penalty.</p><p><span class="hl">Raspasy:</span> If all pass, play a negative round where tricks lose points.</p><p><span class="hl">Re-raise:</span> Declarer can raise bid after talon.</p>`],
];

const HOWTO_RU = [
    ['Цель игры', `<p>«<span class="hl">Тысяча</span>» — классическая карточная игра на троих из русскоязычного мира. Побеждает первый, кто наберёт <span class="hl">1000 очков</span> (или 500 в быстром матче).</p><p>Вы играете против Веры и Бориса. В каждой раздаче очки приносят <span class="hl">взятки</span> — и объявленные <span class="hl">марьяжи</span>.</p><p>Встроенная панель 🧭 Совет объясняет каждую ситуацию. Это окно открывается кнопкой <span class="hl">Правила</span>.</p>`],
    ['Карты', `<p>В игре только 24 карты: <span class="hl">9, В, Д, К, 10, Т</span> каждой масти.</p><p>Старшинство (от сильной к слабой): <span class="hl">Т, 10, К, Д, В, 9</span> — да, десятка бьёт короля!</p><p>Каждая карта стоит очков:<br>Т = <span class="hl">11</span> · 10 = <span class="hl">10</span> · К = <span class="hl">4</span> · Д = <span class="hl">3</span> · В = <span class="hl">2</span> · 9 = <span class="hl">0</span></p><p>В каждой раздаче ровно 120 очков картами. (Стоимость напечатана в углу карты.)</p>`],
    ['Торги', `<p>Каждая раздача начинается с <span class="hl">торгов</span>: сколько очков вы обещаете взять? Торги начинаются со 100 (обязательная ставка) и растут по десять.</p><p>Победитель (<span class="hl">разыгрывающий</span> 👑) забирает три карты <span class="hl">прикупа</span> и отдаёт по одной ненужной карте каждому сопернику.</p><p><span class="hl">Взяли ставку → +ставка. Провалили → −ставка.</span> Защитники всегда оставляют себе всё, что взяли. Торгуйтесь смело — но только если рука потянет.</p>`],
    ['Взятки', `<p>Разыгрывающий заходит картой; остальные кладут по одной. Вы <span class="hl">обязаны ходить в масть</span>, если она есть; без масти — <span class="hl">обязаны класть козырь</span>, если он есть.</p><p>Взятку берёт старшая карта масти захода — если не было козыря; тогда берёт старший козырь. Взявший забирает очки и заходит следующим.</p><p>Недопустимые карты затемнены — ошибиться нельзя. Одно касание поднимает карту, второе — играет.</p>`],
    ['Марьяжи 💍', `<p>Пара <span class="hl">К + Д одной масти</span> — «марьяж». Когда ваш <span class="hl">заход</span> (после хотя бы одной взятой взятки), зайдите с К или Д и объявите его:</p><p>· эта масть немедленно становится <span class="hl">козырем</span><br>· вы сразу получаете: <span class="suit-red">♥</span> = <span class="hl">100</span> · <span class="suit-red">♦</span> = <span class="hl">80</span> · ♣ = <span class="hl">60</span> · ♠ = <span class="hl">40</span></p><p>Новый марьяж отменяет старый козырь. Марьяжи — двигатель больших ставок; берегите пары К+Д!</p>`],
    ['Классические правила', `<p>Дополнительные правила включаются в меню ⚙️ Настройки.</p><p><span class="hl">Бочка:</span> игрок с 880 очками (или 380) садится на бочку. Выиграть можно только взяв и выполнив ставку. 3 неудачи — минус 120.</p><p><span class="hl">Болты ⚡:</span> 0 взяток за раздачу — болт. 3 болта = штраф −120.</p><p><span class="hl">Распасы:</span> если все спасовали, играется распасовка — взятые очки вычитаются.</p><p><span class="hl">Перезаказ:</span> разыгрывающий может поднять ставку после прикупа.</p>`],
];
