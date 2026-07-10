// ═══════════════════════════════════════════════════════════════════════════
// LOG — structured game-event stream + text formatting. DOM-free.
//       Every game action appends a typed entry to state.log; the banner and
//       (later) the log drawer are views of the same entries, so the live
//       announcement and the reviewable history can never disagree.
//       The log spans the whole match (reset in newMatch), grouped by deal.
// ═══════════════════════════════════════════════════════════════════════════

import { NAMES, SUIT_CHAR, MARRIAGE, cardLabel, suitName } from './constants.js';
import { state } from './state.js';

export function logEvent(type, data = {}) {
    const entry = { type, deal: state.dealNum, trick: state.trickNum, ...data };
    state.log.push(entry);
    return entry;
}

// Why a trick was won: highest of the led suit, or trumped in.
export function trickReason(trick, slot) {
    const win = trick[slot].card;
    const led = trick[0].card.s;
    return win.s === led ? { kind: 'highest', suit: led } : { kind: 'trumped', card: win };
}

export function reasonText(reason) {
    return reason.kind === 'highest'
        ? `highest ${SUIT_CHAR[reason.suit]}`
        : `trumped with ${cardLabel(reason.card)}`;
}

// One human-readable line per entry. p === 0 is "You" (verb without -s).
export function eventText(e) {
    const name = p => NAMES[p];
    const s = p => (p === 0 ? '' : 's');
    switch (e.type) {
        case 'deal-start':
            return e.forced
                ? `Deal ${e.deal} — ${name(e.p)} open${s(e.p)} the bidding at 100 (forced)`
                : `Deal ${e.deal} — ${name(e.p)} starts the bidding`;
        case 'bid':
            return `${name(e.p)} bid${s(e.p)} ${e.amount}`;
        case 'pass':
            return `${name(e.p)} pass${e.p === 0 ? '' : 'es'}`;
        case 'bid-won':
            return `${name(e.p)} win${s(e.p)} the bidding at ${e.amount} and take${s(e.p)} the talon`;
        case 'raspasy':
            return 'Everyone passed! Playing Raspasy (Negative Round) 📉';
        case 'reraise':
            return `${name(e.p)} raises the bid to ${e.amount}`;
        case 'exchange':
            return e.p === 0
                ? `You passed a card to ${name(e.to1)} and one to ${name(e.to2)}`
                : `${name(e.p)} passes one card to ${name(e.to1)} and one to ${name(e.to2)}`;
        case 'marriage':
            return `💍 ${name(e.p)} declare${s(e.p)} the ${SUIT_CHAR[e.suit]} marriage — ${suitName(e.suit)} are trump! +${MARRIAGE[e.suit]}`;
        case 'play':
            return `${name(e.p)} play${s(e.p)} ${cardLabel(e.card)}${e.isLead ? ' (led)' : ''}`;
        case 'trick-won':
            return `${name(e.p)} take${s(e.p)} the trick (+${e.pts} — ${reasonText(e.reason)})`;
        case 'deal-end':
            return `Deal ${e.deal} scored — ` + e.deltas
                .map(d => `${name(d.p)} ${d.delta >= 0 ? '+' : ''}${d.delta}`)
                .join(' · ');
        default:
            return '';
    }
}
