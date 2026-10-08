import { state, getPlayer } from './state.js';
import { t, cardText } from './i18n.js';

export function logEvent(type, data = {}) {
    const entry = { type, bout: state.boutNum, ...data };
    state.log.push(entry);
    return entry;
}

function formatCard(card) {
    if (!card) return 'a card';
    return cardText(card);
}

// Who attacks first and why (p1-57) — the log entry and the opening status
// line. `isYou` picks the second-person form for the seat reading it.
export function leadText(seat, card, isYou) {
    const p = getPlayer(seat);
    const name = p ? p.name : '';
    if (!card) return isYou ? t('lead.noTrumpYou') : t('lead.noTrump', name);
    return isYou ? t('lead.trumpYou', cardText(card)) : t('lead.trump', name, cardText(card));
}

export function eventText(e) {
    const p = e.seat !== undefined ? getPlayer(e.seat) : null;
    const name = p ? p.name : 'Unknown';
    const ctx = { name, cardText: formatCard(e.card) };

    switch (e.type) {
        case 'lead':
            return leadText(e.seat, e.card, state.mode === 'ai' && e.seat === 0);
        case 'attack':
            return t('log.attack', ctx);
        case 'defend':
            return t('log.defend', ctx);
        case 'transfer':
            return t('log.transfer', ctx);
        case 'take':
            return t('log.take', ctx);
        case 'pass':
            return t('log.pass', ctx);
        case 'bout_defended':
            return t('log.boutDefended');
        case 'bout_taken':
            return t('log.boutTaken', ctx);
        case 'coach_hint':
            return t('log.coachHint', { text: e.text });
        default:
            return '';
    }
}
