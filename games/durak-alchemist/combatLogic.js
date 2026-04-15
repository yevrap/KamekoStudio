import { state } from './state.js';

export function canBeat(attackCard, defenseCard, trumpSuit) {
    if (!attackCard || !defenseCard) return false;

    const isTrumpDefense = defenseCard.suit === trumpSuit;
    const isTrumpAttack = attackCard.suit === trumpSuit;

    if (isTrumpDefense && !isTrumpAttack) {
        return true;
    }

    if (attackCard.suit === defenseCard.suit && defenseCard.rank > attackCard.rank) {
        return true;
    }

    return false;
}

export function canTransfer(attackCards, defenseCard) {
    if (!attackCards || attackCards.length === 0 || !defenseCard) return false;
    
    // Can only transfer if the card matches the rank of all current attacks
    // and no defense has been played yet.
    return attackCards.every(card => card.rank === defenseCard.rank);
}

export function getExposedRanks(bout) {
    const ranks = new Set();
    bout.forEach(pair => {
        if (pair.attack) ranks.add(pair.attack.rank);
        if (pair.defense) ranks.add(pair.defense.rank);
    });
    return Array.from(ranks);
}