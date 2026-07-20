// ═══════════════════════════════════════════════════════════════════════════
// I18N — full string table (en/ru) + language state. DOM-free.
//        Every user-facing string routes through t(); entries are plain
//        strings or functions of the event/context. Log entries are typed
//        and formatted at render time, so switching language re-renders the
//        whole match history in the new language — nothing is stored as text.
//        Mirrors games/tysiacha/i18n.js.
// ═══════════════════════════════════════════════════════════════════════════

import { FACE_MAP, suitEmoji } from './constants.js';

const hasLS = typeof localStorage !== 'undefined';

let lang = (hasLS && localStorage.getItem('durak_lang')) || 'en';

export function getLang() { return lang; }
export function setLang(l) {
  lang = l === 'ru' ? 'ru' : 'en';
  if (hasLS) localStorage.setItem('durak_lang', lang);
}

export function t(key, ...args) {
  const v = (TABLE[lang][key] !== undefined) ? TABLE[lang][key] : TABLE.en[key];
  return typeof v === 'function' ? v(...args) : v;
}

// Rank letters on cards and in text: Russian decks use Т В Д К (6–10 unchanged).
const RU_FACE_MAP = { 11: 'В', 12: 'Д', 13: 'К', 14: 'Т' };
export function rankText(v) {
  return lang === 'ru' ? (RU_FACE_MAP[v] || String(v)) : (FACE_MAP[v] || String(v));
}
export function cardText(card) { return rankText(card.value) + suitEmoji(card.suit); }

// Default player name for a seat that hasn't been given a custom name.
// mode: 'ai' | 'hotseat'.
export function defaultPlayerName(mode, seat) {
  if (mode === 'hotseat') return t('name.player', seat + 1);
  return seat === 0 ? t('name.you') : t('name.cpu', seat);
}

// Russian "игрок" declines 2–4 → игрока, 5–6 → игроков (durak's player
// count only ranges 2–6, so this simplified 2-branch form is sufficient).
const ruPlayerWord = n => (n >= 2 && n <= 4) ? 'игрока' : 'игроков';

const modeStr = mode => mode === 'hotseat' ? t('setup.mode.hotseat') : t('setup.mode.ai');

// English ordinal irregularity (1st/2nd/3rd/4th…) — Russian has none.
function ordinalEN(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return n + 'th';
}

// ── English ──────────────────────────────────────────────────────────────

const EN = {
  'name.you': 'You',
  'name.cpu': n => `CPU ${n}`,
  'name.player': n => `Player ${n}`,

  'role.attacker': 'Attacker', 'role.defender': 'Defender', 'role.thrower': 'Thrower', 'role.out': 'Out',

  'log.attack': e => `${e.name} attacks with ${e.cardText}`,
  'log.defend': e => `${e.name} defends with ${e.cardText}`,
  'log.transfer': e => `${e.name} transfers the attack with ${e.cardText}`,
  'log.take': e => `${e.name} takes the cards`,
  'log.pass': e => `${e.name} passes`,
  'log.boutDefended': 'Bout defended, cards discarded',
  'log.boutTaken': e => `Bout taken by ${e.name}`,
  'log.coachHint': e => `Coach suggests: ${e.text}`,
  'log.bout': n => `Bout ${n}`,

  'status.paused': 'Paused',
  'status.passDevice': 'Pass device',
  'status.pileOnSelf': 'Pile on or tap Done',
  'status.pileOnOther': name => `${name} may throw on`,
  'status.defend': 'Defend — play a higher card or Take',
  'status.yourAttack': 'Your attack — play a card',
  'status.throwOrPass': 'Throw on or Pass',
  'status.defending': name => `${name} defending…`,
  'status.attacking': name => `${name} attacking…`,

  'pileBanner.text': 'Defender is taking — pile on or tap Done',

  'coach.prefix': 'Coach:',
  'coach.pass': 'Pass', 'coach.take': 'Take', 'coach.transfer': 'Transfer',
  'coach.defend': 'Defend', 'coach.play': 'Play',

  'gameover.record': (w, l, d) => `Record: ${w}W · ${l}L · ${d}D`,
  'gameover.place': n => ordinalEN(n),
  'gameover.durak': 'Durak',
  'gameover.playAgain': '▶ Play Again',
  'gameover.msg': o => o.kind === 'draw' ? 'Draw!'
    : o.kind === 'durak' ? (o.isYou ? 'You are the Durak!' : `${o.name} is the Durak!`)
    : 'Game over',

  'setup.mode.ai': 'vs Computer', 'setup.mode.hotseat': 'Hot-seat',
  'setup.perevodnoy': 'Perevodnoy (Transfers)',
  'setup.firstTransferAllow': 'Allow First-Turn Transfer',
  'setup.modeLabel': 'Mode', 'setup.playersLabel': 'Players', 'setup.rulesLabel': 'Rules',
  'setup.play': '▶ Play', 'setup.watch': '▶ Watch',
  'setup.editNames': '✎ Edit Names',
  'setup.matchTitle': (mode, n) => `Current Match: ${modeStr(mode)} (${n} players)`,

  'title': 'DURAK',
  'subtitle': 'Classic Russian card game, 2–6 players',
  'rulesBlurb': 'Attack with pairs, defend with higher cards of the same suit or trumps. The last player still holding cards is the Durak!',

  'passDevice.title': 'Pass device to',
  'passDevice.hint': 'Tap anywhere when ready.',

  'choice.transfer': '⇄ Transfer', 'choice.beat': '🛡️ Beat',
  'choice.hint': 'Tap outside to cancel',

  'names.title': 'PLAYER NAMES', 'names.done': 'Done', 'names.reset': 'Reset Defaults',
  'names.seat': n => `Seat ${n}`,
  'names.subtitle': (mode, n) => `${modeStr(mode)} — ${n} players`,

  'act.rules': '❓ Rules of Durak', 'act.log': '📜 Game Log',
  'act.coachOn': '🧭 Turn on Coach Hints', 'act.coachOff': '🧭 Turn off Coach Hints',
  'act.endRound': 'End round & back to menu',

  'set.quickActions': 'Quick Actions',
  'set.aiDifficulty': 'AI Difficulty',
  'set.diffEasy': 'Easy', 'set.diffNormal': 'Normal', 'set.diffHard': 'Hard',
  'set.handSort': 'Hand Sort',
  'set.sortOff': 'Off', 'set.sortSuit': 'Suit', 'set.sortStrength': 'Strength',

  'howto': () => HOWTO_EN,
};

// ── Russian ──────────────────────────────────────────────────────────────

const RU = {
  'name.you': 'Вы',
  'name.cpu': n => `Компьютер ${n}`,
  'name.player': n => `Игрок ${n}`,

  'role.attacker': 'Нападающий',
  'role.defender': 'Защищающийся',
  'role.thrower': 'Подкидывающий',
  'role.out': 'Выбыл',

  'log.attack': e => `${e.name} атакует картой ${e.cardText}`,
  'log.defend': e => `${e.name} отбивается картой ${e.cardText}`,
  'log.transfer': e => `${e.name} переводит атаку картой ${e.cardText}`,
  'log.take': e => `${e.name} забирает карты`,
  'log.pass': e => `${e.name} пасует`,
  'log.boutDefended': 'Атака отбита — карты в отбой',
  'log.boutTaken': e => `Карты достаются ${e.name}`,
  'log.coachHint': e => `Совет: ${e.text}`,
  'log.bout': n => `Раунд ${n}`,

  'status.paused': 'Пауза',
  'status.passDevice': 'Передайте устройство',
  'status.pileOnSelf': 'Подкиньте карту или нажмите «Готово»',
  'status.pileOnOther': name => `${name} может подкинуть`,
  'status.defend': 'Защищайтесь — сыграйте карту старше или возьмите',
  'status.yourAttack': 'Ваша атака — сыграйте карту',
  'status.throwOrPass': 'Подкиньте карту или пасуйте',
  'status.defending': name => `${name} защищается…`,
  'status.attacking': name => `${name} атакует…`,

  'pileBanner.text': 'Защищающийся берёт — подкиньте карту или нажмите «Готово»',

  'coach.prefix': 'Совет:',
  'coach.pass': 'Пас', 'coach.take': 'Взять', 'coach.transfer': 'Перевести',
  'coach.defend': 'Отбить', 'coach.play': 'Сыграть',

  'gameover.record': (w, l, d) => `Побед: ${w} · Поражений: ${l} · Ничьих: ${d}`,
  'gameover.place': n => `${n}-е место`,
  'gameover.durak': 'Дурак',
  'gameover.playAgain': '▶ Играть снова',
  'gameover.msg': o => o.kind === 'draw' ? 'Ничья!'
    : o.kind === 'durak' ? (o.isYou ? 'Вы — Дурак!' : `${o.name} — Дурак!`)
    : 'Игра окончена',

  'setup.mode.ai': 'Против компьютера', 'setup.mode.hotseat': 'По очереди',
  'setup.perevodnoy': 'Перевод (переводной)',
  'setup.firstTransferAllow': 'Разрешить перевод на первом ходу',
  'setup.modeLabel': 'Режим', 'setup.playersLabel': 'Игроки', 'setup.rulesLabel': 'Правила',
  'setup.play': '▶ Играть', 'setup.watch': '▶ Смотреть',
  'setup.editNames': '✎ Изменить имена',
  'setup.matchTitle': (mode, n) => `Текущая партия: ${modeStr(mode)} (${n} ${ruPlayerWord(n)})`,

  'title': 'ДУРАК',
  'subtitle': 'Классическая русская карточная игра, 2–6 игроков',
  'rulesBlurb': 'Атакуйте парами карт, защищайтесь старшими картами той же масти или козырями. Последний игрок с картами на руках — Дурак!',

  'passDevice.title': 'Передайте устройство игроку',
  'passDevice.hint': 'Нажмите в любом месте, когда будете готовы.',

  'choice.transfer': '⇄ Перевести', 'choice.beat': '🛡️ Отбить',
  'choice.hint': 'Нажмите снаружи, чтобы отменить',

  'names.title': 'ИМЕНА ИГРОКОВ', 'names.done': 'Готово', 'names.reset': 'Сбросить',
  'names.seat': n => `Место ${n}`,
  'names.subtitle': (mode, n) => `${modeStr(mode)} — ${n} ${ruPlayerWord(n)}`,

  'act.rules': '❓ Правила Дурака', 'act.log': '📜 Журнал игры',
  'act.coachOn': '🧭 Включить подсказки', 'act.coachOff': '🧭 Выключить подсказки',
  'act.endRound': 'Завершить раунд и вернуться в меню',

  'set.quickActions': 'Быстрые действия',
  'set.aiDifficulty': 'Сила соперников',
  'set.diffEasy': 'Легко', 'set.diffNormal': 'Нормально', 'set.diffHard': 'Сложно',
  'set.handSort': 'Сортировка руки',
  'set.sortOff': 'Выкл.', 'set.sortSuit': 'Масть', 'set.sortStrength': 'Сила',

  'howto': () => HOWTO_RU,
};

const TABLE = { en: EN, ru: RU };

// Exposed only for the key-parity test — not part of the game's public API.
export const _EN = EN;
export const _RU = RU;

// ── How-to content ───────────────────────────────────────────────────────

const HOWTO_EN = [
  ['The Goal', `<p>Get rid of all your cards. The last player left holding cards is the Durak (Fool).</p><p>The bottom card of the deck sets the trump suit, which beats every other suit.</p>`],
  ['Attacking', `<p>Play a card to attack the player to your left. Other players can pile on by playing cards of the same rank as those already in the bout (up to 6 attacks total).</p>`],
  ['Defending', `<p>Beat attacks with a higher card of the same suit, or any trump card.</p>`],
  ['Transfer (Perevodnoy)', `<p>If enabled, you can transfer an attack to the next player by playing a card of the same rank — provided you haven't defended yet and they have enough cards.</p>`],
  ['Resolution', `<p>If you beat all attacks, the bout is discarded. If you can't or won't defend, you take all the cards on the table. The attacker draws first, then the others, to refill hands back to 6 cards.</p>`],
];

const HOWTO_RU = [
  ['Цель игры', `<p>Избавьтесь от всех карт. Последний игрок, у которого остались карты на руках, — Дурак.</p><p>Нижняя карта колоды задаёт козырь — он бьёт карту любой другой масти.</p>`],
  ['Атака', `<p>Сыграйте карту, чтобы атаковать игрока слева от вас. Остальные могут подкидывать карты того же достоинства, что уже лежат в раунде (не больше 6 атак всего).</p>`],
  ['Защита', `<p>Отбивайте атаки более старшей картой той же масти или любым козырем.</p>`],
  ['Перевод (переводной)', `<p>Если правило включено, вы можете перевести атаку следующему игроку картой того же достоинства — если вы ещё не отбивались и у него хватает карт.</p>`],
  ['Итог раунда', `<p>Если вы отбили все атаки, раунд уходит в отбой. Если вы не можете или не хотите защищаться, вы забираете все карты со стола. Атакующий добирает первым, затем остальные — до 6 карт в руке.</p>`],
];
