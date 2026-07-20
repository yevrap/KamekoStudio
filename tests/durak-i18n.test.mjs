import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Card } from '../games/durak/constants.js';
import { state } from '../games/durak/state.js';

global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); }
};

// ─── i18n (Russian language toggle — p2-36) ──────────────────────────────────

test('i18n: defaults to English; t() never throws on a missing key', async () => {
  const { getLang, t } = await import('../games/durak/i18n.js');
  assert.equal(getLang(), 'en');
  assert.equal(t('name.you'), 'You');
  assert.equal(t('role.attacker'), 'Attacker');
  assert.equal(t('nonexistent.key'), undefined);
});

test('i18n: setLang(ru) localizes eventText for every log-event type, setLang(en) restores it', async () => {
  const { setLang } = await import('../games/durak/i18n.js');
  const { eventText } = await import('../games/durak/log.js');
  state.players = [{ seat: 0, name: 'Vera' }, { seat: 1, name: 'Boris' }];
  const ace = new Card(14, 1); // A♠

  setLang('ru');
  try {
    assert.equal(eventText({ type: 'attack', seat: 0, card: ace }), 'Vera атакует картой Т♠');
    assert.equal(eventText({ type: 'defend', seat: 1, card: ace }), 'Boris отбивается картой Т♠');
    assert.equal(eventText({ type: 'transfer', seat: 0, card: ace }), 'Vera переводит атаку картой Т♠');
    assert.equal(eventText({ type: 'take', seat: 1 }), 'Boris забирает карты');
    assert.equal(eventText({ type: 'pass', seat: 0 }), 'Vera пасует');
    assert.equal(eventText({ type: 'bout_defended' }), 'Атака отбита — карты в отбой');
    assert.equal(eventText({ type: 'bout_taken', seat: 1 }), 'Карты достаются Boris');
    assert.equal(eventText({ type: 'coach_hint', text: 'Пас' }), 'Совет: Пас');
  } finally {
    setLang('en');
  }

  assert.equal(eventText({ type: 'attack', seat: 0, card: ace }), 'Vera attacks with A♠');
  assert.equal(eventText({ type: 'pass', seat: 1 }), 'Boris passes');
});

test('i18n: Russian rank letters (Т В Д К) in rankText/cardText, 6–10 unchanged, English unaffected', async () => {
  const { setLang, rankText, cardText } = await import('../games/durak/i18n.js');
  assert.equal(rankText(14), 'A');
  assert.equal(cardText(new Card(14, 1)), 'A♠');
  assert.equal(cardText(new Card(6, 2)), '6♣');

  setLang('ru');
  try {
    assert.equal(rankText(11), 'В');
    assert.equal(rankText(12), 'Д');
    assert.equal(rankText(13), 'К');
    assert.equal(rankText(14), 'Т');
    assert.equal(rankText(6), '6');
    assert.equal(rankText(10), '10');
    assert.equal(cardText(new Card(14, 3)), 'Т♦');
    assert.equal(cardText(new Card(9, 4)), '9❤');
  } finally {
    setLang('en');
  }

  assert.equal(rankText(14), 'A');
});

test('i18n: defaultPlayerName matches language and mode', async () => {
  const { setLang, defaultPlayerName } = await import('../games/durak/i18n.js');
  assert.equal(defaultPlayerName('ai', 0), 'You');
  assert.equal(defaultPlayerName('ai', 2), 'CPU 2');
  assert.equal(defaultPlayerName('hotseat', 2), 'Player 3');

  setLang('ru');
  try {
    assert.equal(defaultPlayerName('ai', 0), 'Вы');
    assert.equal(defaultPlayerName('ai', 2), 'Компьютер 2');
    assert.equal(defaultPlayerName('hotseat', 2), 'Игрок 3');
  } finally {
    setLang('en');
  }
});

test('i18n: EN and RU string tables have identical key coverage', async () => {
  const { _EN, _RU } = await import('../games/durak/i18n.js');
  const enKeys = Object.keys(_EN).sort();
  const ruKeys = Object.keys(_RU).sort();
  const missingInRu = enKeys.filter(k => !ruKeys.includes(k));
  const missingInEn = ruKeys.filter(k => !enKeys.includes(k));
  assert.deepEqual(missingInRu, [], `Keys missing from RU: ${missingInRu.join(', ')}`);
  assert.deepEqual(missingInEn, [], `Keys missing from EN: ${missingInEn.join(', ')}`);
});
