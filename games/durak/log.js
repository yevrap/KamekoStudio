import { state, getPlayer } from './state.js';
import { displayValue } from './constants.js';

export function logEvent(type, data = {}) {
    const entry = { type, bout: state.boutNum, ...data };
    state.log.push(entry);
    return entry;
}

const suitSymbols = { '1': '♠', '2': '♣', '3': '♥', '4': '♦' };

function formatCard(card) {
    if (!card) return 'a card';
    return displayValue(card.value) + suitSymbols[card.suit];
}

export function eventText(e) {
    const p = e.seat !== undefined ? getPlayer(e.seat) : null;
    const name = p ? p.name : 'Unknown';
    
    switch (e.type) {
        case 'attack':
            return `${name} attacks with ${formatCard(e.card)}`;
        case 'defend':
            return `${name} defends with ${formatCard(e.card)}`;
        case 'transfer':
            return `${name} transfers the attack with ${formatCard(e.card)}`;
        case 'take':
            return `${name} takes the cards`;
        case 'pass':
            return `${name} passes`;
        case 'bout_defended':
            return `Bout defended, cards discarded`;
        case 'bout_taken':
            return `Bout taken by ${name}`;
        case 'coach_hint':
            return `Coach suggests: ${e.text}`;
        default:
            return '';
    }
}
