export const SUITS = ['♠', '♥', '♣', '♦'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const createDeck = () => {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: getCardValue(rank) });
    }
  }
  return deck;
};

export const createShoe = (numDecks = 1) => {
  let shoe = [];
  for (let i = 0; i < numDecks; i++) {
    shoe = [...shoe, ...createDeck()];
  }
  return shoe;
};

export const shuffleDeck = (deck) => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  } // Fisher-Yates
  return newDeck;
};

const getCardValue = (rank) => {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank);
};

export const calculateScore = (hand) => {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    score += card.value;
    if (card.rank === 'A') aces += 1;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
};

export const isSoftHand = (hand) => {
  let score = 0;
  let aces = 0;

  for (const card of hand) {
    score += card.value;
    if (card.rank === 'A') aces += 1;
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }
  
  return aces > 0; // If any aces left contributing 11
};

export const isBlackjack = (hand) => {
  return hand.length === 2 && calculateScore(hand) === 21;
};

// Side Bets Logic
export const checkPerfectPairs = (hand) => {
  if (hand.length !== 2) return 0;
  const [c1, c2] = hand;
  if (c1.rank !== c2.rank) return 0; // No pair

  // Perfect Pair (Same Suit) - Payout 25:1
  if (c1.suit === c2.suit) return 25;

  // Colored Pair (Same Color) - Payout 12:1
  const isRed = (s) => s === '♥' || s === '♦';
  if (isRed(c1.suit) === isRed(c2.suit)) return 12;

  // Mixed Pair - Payout 6:1
  return 6;
};

export const check21Plus3 = (playerHand, dealerUpCard) => {
  if (playerHand.length !== 2 || !dealerUpCard) return 0;
  const cards = [...playerHand, dealerUpCard];
  
  // Sort for straight check
  const ranksIdx = cards.map(c => RANKS.indexOf(c.rank)).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);
  
  const isFlush = suits.every(s => s === suits[0]);
  const isTrips = ranksIdx[0] === ranksIdx[1] && ranksIdx[1] === ranksIdx[2];
  const isStraight = (ranksIdx[1] === ranksIdx[0] + 1 && ranksIdx[2] === ranksIdx[1] + 1) || 
                     (ranksIdx[0] === 0 && ranksIdx[1] === 1 && ranksIdx[2] === 12); // A-2-3 (A is index 12 in RANKS array? No, A is index 12. 2 is index 0.) 
                     // My RANKS: 2(0), 3(1)... A(12). So A-2-3 is 12, 0, 1. Sorted: 0, 1, 12.
                     
  // Fix Straight check for Ace low
  const isStraightAceLow = (ranksIdx[0] === 0 && ranksIdx[1] === 1 && ranksIdx[2] === 12);
  const isStandardStraight = (ranksIdx[1] === ranksIdx[0] + 1 && ranksIdx[2] === ranksIdx[1] + 1);
  const validStraight = isStandardStraight || isStraightAceLow;

  if (isFlush && isTrips) return 100; // Suited Trips
  if (isFlush && validStraight) return 40; // Straight Flush
  if (isTrips) return 30; // Three of a Kind
  if (validStraight) return 10; // Straight
  if (isFlush) return 5; // Flush

  return 0;
};
