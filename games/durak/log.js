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

export function eventText(e) {
    const p = e.seat !== undefined ? getPlayer(e.seat) : null;
    const name = p ? p.name : 'Unknown';
    const ctx = { name, cardText: formatCard(e.card) };

    switch (e.type) {
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
