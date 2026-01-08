
export const getCardValue = (card) => {
    if (!card) return 0;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    if (card.rank === 'A') return 11;
    return parseInt(card.rank);
};

export const getHiLoCount = (card) => {
    if (!card) return 0;
    const val = getCardValue(card);
    if (val >= 2 && val <= 6) return 1;
    if (val >= 7 && val <= 9) return 0;
    return -1; // 10, J, Q, K, A
};

export const getBasicStrategyMove = (playerHand, dealerUpCard) => {
    // playerHand: { cards: [], score: int, isSoft: bool, canSplit: bool, canDouble: bool }
    // dealerUpCard: card object
    
    const dVal = getCardValue(dealerUpCard);
    const pScore = playerHand.score; // Assumed handled externally or recalculated
    const isSoft = playerHand.isSoft;
    const isPair = playerHand.canSplit;
    
    // Helper for Actions: H=Hit, S=Stand, D=Double/Hit, Ds=Double/Stand, P=Split
    
    // PAIRS
    if (isPair) {
        const rank = playerHand.cards[0].rank;
        const val = getCardValue(playerHand.cards[0]);
        
        if (rank === 'A' || rank === '8') return 'split';
        if (rank === '9' && ![7, 10, 11].includes(dVal)) return 'split';
        if (rank === '7' && dVal <= 7) return 'split';
        if (rank === '6' && dVal <= 6) return 'split'; // Usually 2-6
        if (rank === '3' || rank === '2') {
             if (dVal >= 4 && dVal <= 7) return 'split'; // Simplified
             if (dVal <= 7) return 'split'; // Standard
        }
        if (rank === '5') {
            // Treat as Hard 10
            if (dVal <= 9) return 'double';
            return 'hit';
        }
        // 4,4 usually hit unless dealer 5,6 (sometimes split) - Keeping simple: Hit
        if (rank === '4' && (dVal === 5 || dVal === 6)) return 'split'; 
    }
    
    // SOFT TOTALS
    if (isSoft) {
        if (pScore >= 20) return 'stand'; // A,9
        if (pScore === 19) { // A,8
            if (dVal === 6) return 'double';
            return 'stand';
        }
        if (pScore === 18) { // A,7
            if (dVal >= 2 && dVal <= 6) return 'double';
            if (dVal >= 9) return 'hit';
            return 'stand'; // 7,8
        }
        if (pScore === 17) { // A,6
            if (dVal >= 3 && dVal <= 6) return 'double';
            return 'hit';
        }
        if (pScore === 16 || pScore === 15) { // A,5 / A,4
            if (dVal >= 4 && dVal <= 6) return 'double';
            return 'hit';
        }
        if (pScore === 13 || pScore === 14) { // A,2 / A,3
            if (dVal === 5 || dVal === 6) return 'double';
            return 'hit';
        }
    }
    
    // HARD TOTALS
    if (pScore >= 17) return 'stand';
    if (pScore >= 13 && pScore <= 16) {
        if (dVal >= 2 && dVal <= 6) return 'stand';
        return 'hit';
    }
    if (pScore === 12) {
        if (dVal >= 4 && dVal <= 6) return 'stand';
        return 'hit';
    }
    if (pScore === 11) return 'double';
    if (pScore === 10) {
        if (dVal >= 10) return 'hit';
        return 'double';
    }
    if (pScore === 9) {
        if (dVal >= 3 && dVal <= 6) return 'double';
        return 'hit';
    }
    
    return 'hit'; // 8 or less
};


