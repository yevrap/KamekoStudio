// ═══════════════════════════════════════════════════════════════════════════
// LOG — structured game-event stream + text formatting. DOM-free.
//       Every game action appends a typed entry to state.log; the banner and
//       the log drawer are views of the same entries, so the live
//       announcement and the reviewable history can never disagree.
//       The log spans the whole match (reset in newMatch), grouped by deal.
//       Entries hold no display text (except captured hints) — formatting
//       happens at render via the i18n table, so a language switch
//       re-renders the whole history in the new language.
// ═══════════════════════════════════════════════════════════════════════════

import { state } from './state.js';
import { t } from './i18n.js';

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
    return t('reason.' + reason.kind, reason);
}

// One human-readable line per entry, in the active language.
export function eventText(e) {
    const line = t('ev.' + e.type, e);
    return line === undefined ? '' : line;
}
