import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createShoe, 
  shuffleDeck, 
  calculateScore, 
  isBlackjack, 
  checkPerfectPairs, 
  check21Plus3, 
  isSoftHand 
} from '../utils/deck';
import { getBasicStrategyMove, getHiLoCount } from '../utils/strategy';

const DEFAULT_RULES = {
  numberOfDecks: 6,
  dealerSoft17: true, 
  surrenderAllowed: true,
  blackjackPayout: 1.5,
  minBet: 10,
  maxBet: 500,
};

const DAILY_BONUS_AMOUNT = 500;
const JACKPOT_SEED = 10000;

export const useGameEngine = (onRoundEnd) => {
  // Money & Economy
  const [bankroll, setBankroll] = useState(() => {
    const saved = localStorage.getItem('bj_bankroll');
    return saved ? parseInt(saved) : 1000;
  });
  
  const [currentBet, setCurrentBet] = useState(0);
  const [chipStack, setChipStack] = useState([]); // Array of chip values [10, 10, 25] for visual stacking
  
  const [sideBets, setSideBets] = useState({ pairs: 0, poker: 0 }); 
  const [lastBet, setLastBet] = useState(null);

  // Jackpot & Streaks
  const [jackpot, setJackpot] = useState(JACKPOT_SEED);
  const [winStreak, setWinStreak] = useState(0);
  const [betHistory, setBetHistory] = useState([]);
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
  const [isRiskFree, setIsRiskFree] = useState(true); // First bet logic

  // Timer
  const [timer, setTimer] = useState(30);

  // Player Intelligence
  const [learningMode, setLearningMode] = useState(false); // Toggle
  const [runningCount, setRunningCount] = useState(0);
  const [trueCount, setTrueCount] = useState(0);
  const [suggestion, setSuggestion] = useState(null); // { action: 'hit', reason: 'Basic Strategy' }
  const [latestMistake, setLatestMistake] = useState(null); // User feedback

  // Game Proper
  const [phase, setPhase] = useState('betting'); 
  const [shoe, setShoe] = useState([]);
  const [cutCardIdx, setCutCardIdx] = useState(0);
  
  // Hands
  const [playerHands, setPlayerHands] = useState([]); 
  const [currentHandIndex, setCurrentHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState([]);
  
  // UI
  const [message, setMessage] = useState('');
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [insuranceBet, setInsuranceBet] = useState(0);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // --- Effects ---
  
  // Persist Bankroll
  useEffect(() => {
     localStorage.setItem('bj_bankroll', bankroll);
  }, [bankroll]);

  // Daily Bonus Check
  useEffect(() => {
      const lastClaim = localStorage.getItem('bj_last_daily');
      const now = Date.now();
      if (!lastClaim || now - parseInt(lastClaim) > 24 * 60 * 60 * 1000) {
          setDailyBonusAvailable(true);
          setShowDailyModal(true);
      }
  }, []);

  // Timer Logic
  useEffect(() => {
      let interval;
      if (phase === 'betting') {
          setTimer(30);
          interval = setInterval(() => {
              setTimer(prev => {
                  if (prev <= 1) {
                      // Auto deal if bet placed, else reset?
                      // Usually auto-deal implies forcing the deal. 
                      // If bet == 0, just restart timer?
                      return 30; 
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [phase]);

  // Init Shoe
  useEffect(() => {
    initShoe();
  }, [rules.numberOfDecks]);

  const initShoe = () => {
    const newShoe = shuffleDeck(createShoe(rules.numberOfDecks));
    setShoe(newShoe);
    const cutIdx = Math.floor(newShoe.length * 0.25);
    setCutCardIdx(cutIdx);
    setRunningCount(0); // Reset count on shuffle
    setTrueCount(0);
  };

  // Helper: Update Count
  const updateCount = (newCards) => {
      let rc = runningCount;
      newCards.forEach(c => {
          rc += getHiLoCount(c);
      });
      setRunningCount(rc);
      
      // True Count
      const decksExhausted = (rules.numberOfDecks * 52 - shoe.length) / 52;
      const decksRem = rules.numberOfDecks - decksExhausted;
      const tc = decksRem > 0 ? Math.round(rc / decksRem) : rc;
      setTrueCount(tc);
  };

  const claimDailyBonus = () => {
      setBankroll(prev => prev + DAILY_BONUS_AMOUNT);
      localStorage.setItem('bj_last_daily', Date.now());
      setDailyBonusAvailable(false);
      setShowDailyModal(false);
      const msg = `Daily Bonus Claimed! +$${DAILY_BONUS_AMOUNT}`;
      setMessage(msg);
      setTimeout(() => {
        setMessage(current => current === msg ? '' : current);
      }, 1000);
  };

  // --- Actions: Betting Phase ---
  const placeBet = (amount, type = 'main') => { // For backward compatibility if needed, but we used addChip main
      addChip(amount, type);
  };

  const addChip = (amount, type = 'main') => {
      if (bankroll < amount) return;
      if (type === 'main') {
         if (currentBet + amount > rules.maxBet) {
             setMessage("Max Table Limit Reached");
             return;
         }
         setCurrentBet(prev => prev + amount);
         setChipStack(prev => [...prev, amount]); // Add to stack for ID/visuals
         setBankroll(prev => prev - amount);
         setTimer(30); // Reset timer on interaction
      } else {
         setSideBets(prev => ({ ...prev, [type]: prev[type] + amount }));
         setBankroll(prev => prev - amount);
      }
      // Progressive Tick
      setJackpot(prev => prev + (amount * 0.01)); 
  };

  const clearBets = () => {
    setBankroll(prev => prev + currentBet + sideBets.pairs + sideBets.poker);
    setCurrentBet(0);
    setChipStack([]); // Clear chips
    setSideBets({ pairs: 0, poker: 0 });
  };

  const reBet = () => {
    if (!lastBet) return;
    const totalNeeded = lastBet.main + lastBet.pairs + lastBet.poker;
    if (bankroll < totalNeeded) {
        setMessage("Insufficient funds to Re-Bet");
        return;
    }
    // Logic to reconstruct chip stack approximately (greedy)
    const newStack = [];
    let rem = lastBet.main;
    const denoms = [500, 100, 25, 10];
    for (let d of denoms) {
        while (rem >= d) {
            newStack.push(d);
            rem -= d;
        }
    }

    setBankroll(prev => prev - totalNeeded);
    setCurrentBet(lastBet.main);
    setChipStack(newStack.reverse()); // Stack usually builds up
    setSideBets({ pairs: lastBet.pairs, poker: lastBet.poker });
  }

  // --- Actions: Gameplay ---
  const dealGame = async () => {
    if (currentBet < rules.minBet) {
      setMessage(`Minimum bet is $${rules.minBet}`);
      return;
    }

    // Check Shoe
    if (shoe.length < cutCardIdx || shoe.length < 20) {
        setMessage("Shuffling Shoe...");
        setPhase('shuffling');
        await new Promise(r => setTimeout(r, 1000));
        initShoe();
        setMessage("");
    }

    setPhase('dealing');
    setLastBet({ main: currentBet, pairs: sideBets.pairs, poker: sideBets.poker });
    setInsuranceBet(0);
    setShowInsuranceModal(false);

    const newShoe = [...shoe];
    const pHandCards = [newShoe.pop(), newShoe.pop()];
    const dHandCards = [newShoe.pop(), newShoe.pop()]; // dHand[1] hidden, do not count yet?
    
    // In Hi-Lo, you only count visible cards.
    // Update count with Player Cards + Dealer Upcard (dHand[0])
    // dHand[1] is hidden.
    let rc = runningCount;
    [...pHandCards, dHandCards[0]].forEach(c => rc += getHiLoCount(c));
    // We can't update state immediately inside dealGame correctly due to closure on runningCount if not careful
    // But since we use setRunningCount(prev => ...), we can do it.
    // Actually, simpler to recalculate. (See updateCount helper logic, need to integrate carefully).
    setRunningCount(rc);
    const decksRem = Math.max(1, (newShoe.length) / 52);
    setTrueCount(Math.round(rc / decksRem));

    setShoe(newShoe);
    setDealerHand(dHandCards);
    
    const initialHand = {
      id: Date.now(),
      cards: pHandCards,
      bet: currentBet,
      status: 'playing',
      result: null,
      chips: [...chipStack] // Store visual stack with hand
    };
    setPlayerHands([initialHand]);
    setCurrentHandIndex(0);

    // Initial Payouts & History Log
    let roundLog = {
        ts: Date.now(),
        bet: currentBet,
        result: 'pending',
        payout: 0,
        hand: [] 
    };

    // Side Bet Resolution
    let winnings = 0;
    let payoutMsg = "";

    if (sideBets.pairs > 0) {
        const mult = checkPerfectPairs(pHandCards);
        if (mult > 0) {
            winnings += sideBets.pairs * mult + sideBets.pairs;
            payoutMsg += `Pairs Win! `;
        }
    }

    if (sideBets.poker > 0) {
        const mult = check21Plus3(pHandCards, dHandCards[0]);
        if (mult > 0) {
            winnings += sideBets.poker * mult + sideBets.poker;
            payoutMsg += `Poker Win! `;
        }
    }
    
    // Jackpot Check (Triple 7s Suited)
    // Actually standard JP is usually 7-7-7 Suited in one hand?
    // Hard to get in 2 cards. usually first 3 cards (Hit once) or Side Bet specific game.
    // We'll stick to basic side bets for now.

    if (winnings > 0) {
        setBankroll(prev => prev + winnings);
        setMessage(payoutMsg);
        await new Promise(r => setTimeout(r, 1500));
    }
    
    const pScore = calculateScore(pHandCards);
    const dealerHasAce = dHandCards[0].rank === 'A';
    
    if (pScore === 21) {
        initialHand.status = 'blackjack';
        setPlayerHands([initialHand]);
    }

    if (dealerHasAce && pScore !== 21) {
        setShowInsuranceModal(true);
    } else {
        checkDealerNatural(newShoe, dHandCards, [initialHand]);
    }
  };

  const resolveInsurance = (buy) => {
    setShowInsuranceModal(false);
    let currentBankroll = bankroll;
    
    // Logic for insurance... (Kept same as before)
    if (buy) {
      const cost = Math.floor(currentBet / 2);
      if (currentBankroll >= cost) {
         setInsuranceBet(cost);
         currentBankroll -= cost;
         setBankroll(currentBankroll);
      }
    }
    
    const dHand = dealerHand;
    const isDealerBJ = isBlackjack(dHand);
    
    if (isDealerBJ) {
       if (buy) {
         setBankroll(currentBankroll + (Math.floor(currentBet / 2) * 3)); 
         setMessage("Insurance Pays!");
       } else {
         setMessage("Dealer has Blackjack.");
       }
       finishRound(playerHands, dHand, 'dealerBJ'); 
    } else {
       if (buy) setMessage("Insurance Lost");
       const currentPHand = playerHands[0];
       if (currentPHand.status === 'blackjack') {
          finishRound(playerHands, dHand);
       } else {
          setPhase('playerTurn');
       }
    }
  };

  const checkDealerNatural = (deckStr, dHand, pHands) => {
    const isDealerBJ = isBlackjack(dHand);
    const pHand = pHands[0]; 

    if (isDealerBJ) {
        if (pHand.status === 'blackjack') {
            finishRound(pHands, dHand, 'dealerBJ');
        } else {
            finishRound(pHands, dHand, 'dealerBJ'); 
        }
    } else {
        if (pHand.status === 'blackjack') {
            finishRound(pHands, dHand); 
        } else {
            setPhase('playerTurn');
        }
    }
  };


  const checkStrategy = (action) => {
      if (!learningMode) return;
      
      const currentHand = playerHands[currentHandIndex];
      const pScore = calculateScore(currentHand.cards);
      const isSoft = isSoftHand(currentHand.cards);
      const canSplit = currentHand.cards.length === 2 && currentHand.cards[0].value === currentHand.cards[1].value;
      // We don't check double ability inside strict strategy helper yet, assuming "Double" is always strategy if allowed.
      
      const ideal = getBasicStrategyMove({ 
          cards: currentHand.cards, 
          score: pScore, 
          isSoft, 
          canSplit, 
          canDouble: true // simplified
      }, dealerHand[0]);

      // Map ideal to generic action for comparison
      // ideal: hit, stand, double, split
      // action: hit, stand, double, split, surrender
      let isMistake = false;
      let msg = "";

      if (ideal !== action) {
          // Allow Double as Hit if Bankroll low? No strict enforcement.
          if (ideal === 'double' && action === 'hit') { /* Acceptable sometimes */ }
          else {
              isMistake = true;
              msg = `Mistake! Basic Strategy says: ${ideal.toUpperCase()}`;
          }
      }
      
      if (isMistake) {
          setLatestMistake({ msg, ts: Date.now() });
      }
  };

  const hit = async () => {
    checkStrategy('hit');
    const newShoe = [...shoe];
    const card = newShoe.pop();
    setShoe(newShoe);
    
    // Count Update
    setRunningCount(prev => prev + getHiLoCount(card));
    // True count update implied loosely for UI, exact calc done on phase changes or separate effect?
    // Let's rely on basic increment for speed here.

    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    hand.cards.push(card);

    const score = calculateScore(hand.cards);

    if (score > 21) {
       hand.status = 'bust';
       advanceHand(updatedHands);
    } else if (score === 21) {
        // Auto Stand on 21 (Requested Feature)
        hand.status = 'stand';
        advanceHand(updatedHands);
    } else {
        setPlayerHands(updatedHands);
    }
  };

  const stand = () => {
     checkStrategy('stand');
     const updatedHands = [...playerHands];
     updatedHands[currentHandIndex].status = 'stand';
     advanceHand(updatedHands);
  };

  const doubleDown = () => {
    checkStrategy('double');
    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    
    if (bankroll < hand.bet) {
      setMessage("Insufficient funds");
      return;
    }

    setBankroll(prev => prev - hand.bet);
    hand.bet *= 2;
    hand.chips = [...hand.chips, ...hand.chips]; // Visual double keys? Just duplicate stack
    hand.isDoubled = true;

    const newShoe = [...shoe];
    const card = newShoe.pop();
    setShoe(newShoe);
    setRunningCount(prev => prev + getHiLoCount(card));
    
    hand.cards.push(card);
    const score = calculateScore(hand.cards);
    
    if (score > 21) hand.status = 'bust';
    else hand.status = 'stand';
    
    advanceHand(updatedHands);
  };

  const split = () => {
    checkStrategy('split');
    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    
    if (bankroll < hand.bet) return;
    
    setBankroll(prev => prev - hand.bet);
    
    const splitCard = hand.cards.pop();
    
    const newHand = {
        id: Date.now() + 1,
        cards: [splitCard],
        bet: hand.bet,
        status: 'playing',
        chips: [...hand.chips], // Clone stack
        result: null
    };
    
    updatedHands.splice(currentHandIndex + 1, 0, newHand); 
    
    const newShoe = [...shoe];
    const c1 = newShoe.pop();
    hand.cards.push(c1);
    setRunningCount(prev => prev + getHiLoCount(c1)); // Count
    setShoe(newShoe); // intermediate update
    
    setPlayerHands(updatedHands);
    // Note: split usually gets another card for split hand when that hand becomes active.
    // Our logic handles card dealing on "advanceHand" if card count is 1.
  };
  
  const surrender = () => {
    checkStrategy('surrender');
    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    
    hand.status = 'surrender';
    setBankroll(prev => prev + (hand.bet / 2)); 
    hand.result = 'loss'; 
    
    advanceHand(updatedHands);
  };

  const advanceHand = (hands) => {
    let nextIdx = currentHandIndex + 1;
    if (nextIdx < hands.length) {
        const nextHand = hands[nextIdx];
        if (nextHand.cards.length === 1) {
            const newShoe = [...shoe];
            nextHand.cards.push(newShoe.pop());
            setShoe(newShoe);
        }
        setPlayerHands(hands);
        setCurrentHandIndex(nextIdx);
    } else {
        setPlayerHands(hands);
        setPhase('dealerTurn');
    }
  };

  // Dealer Effect
  useEffect(() => {
    if (phase === 'dealerTurn') {
        const executeDealer = async () => {
            let currentShoe = [...shoe];
            let currentDHand = [...dealerHand];
            const delay = (ms) => new Promise(r => setTimeout(r, ms));
            
            let score = calculateScore(currentDHand);
            let soft = isSoftHand(currentDHand);

            while (
                score < 17 || 
                (score === 17 && soft && rules.dealerSoft17)
            ) {
                // Dealer Hole Card Reveal Count!
                // Actually hole card is D[1]. It was logically in "dHand" state but "hidden" in UI.
                // In Hi-Lo, you count it when revealed.
                // We should add its count when 'dealerTurn' starts?
                // For simplicity, we assume user counts it when revealed.
                // We'll update the runningCount state here for hole card once.
                
                await delay(800);
                const card = currentShoe.pop();
                currentDHand = [...currentDHand, card];
                setRunningCount(prev => prev + getHiLoCount(card));
                
                score = calculateScore(currentDHand);
                soft = isSoftHand(currentDHand);
                setDealerHand([...currentDHand]);
            }
            setShoe(currentShoe);
            finishRound(playerHands, currentDHand);
        };
        // Count the hole card when dealer turn starts
        if (dealerHand.length === 2) {
             setRunningCount(prev => prev + getHiLoCount(dealerHand[1]));
        }
        executeDealer();
    }
  }, [phase]);

  const finishRound = (pHands, dHand, overrideReason = null) => {
    const dScore = calculateScore(dHand);
    const dIsBJ = isBlackjack(dHand);
    let roundWinnings = 0;
    
    const finalHands = pHands.map(hand => {
        if (hand.status === 'surrender') return hand;
        
        let result = 'push';
        let msg = '';
        let payout = 0;
        
        const pScore = calculateScore(hand.cards);
        
        if (hand.status === 'bust') {
            result = 'loss'; msg = 'Bust';
        } else if (overrideReason === 'dealerBJ') {
            if (hand.status === 'blackjack') { result = 'push'; msg = 'Push'; payout = hand.bet; }
            else { result = 'loss'; msg = 'Dealer BJ'; }
        } else if (dScore > 21) {
            result = 'win'; msg = 'Dealer Bust'; payout = hand.bet * 2;
        } else if (pScore > dScore) {
            result = 'win'; msg = 'Win';
            if (hand.status === 'blackjack') payout = hand.bet + (hand.bet * rules.blackjackPayout);
            else payout = hand.bet * 2;
        } else if (pScore < dScore) {
            result = 'loss'; msg = 'Lose';
        } else {
             if (hand.status === 'blackjack' && !dIsBJ) {
                 result = 'win'; msg = 'BJ Win';
                 payout = hand.bet + (hand.bet * rules.blackjackPayout);
             } else {
                 result = 'push'; msg = 'Push'; payout = hand.bet;
             }
        }
        
        roundWinnings += payout;
        return { ...hand, result, message: msg, payout };
    });

    // Risk Free First Bet Logic
    if (isRiskFree && roundWinnings === 0 && finalHands.every(h => h.result === 'loss')) {
        // Refund
        const totalLost = finalHands.reduce((acc, h) => acc + h.bet, 0);
        roundWinnings += totalLost; // Give it back
        setMessage("Risk-Free Bet Refunded!");
        setIsRiskFree(false);
    } else if (roundWinnings > 0) {
        setIsRiskFree(false);
    }

    setPlayerHands(finalHands);
    setBankroll(prev => prev + roundWinnings);
    
    // Streaks
    const anyWin = finalHands.some(h => h.result === 'win');
    if (anyWin) {
        const newStreak = winStreak + 1;
        setWinStreak(newStreak);
        if (newStreak % 3 === 0) {
            setBankroll(prev => prev + 50); // Streak Bonus
            setMessage(`Streak Bonus! +$50`);
        }
    } else if (finalHands.some(h => h.result === 'loss')) {
        setWinStreak(0);
    }

    // History
    setBetHistory(prev => [{
        id: Date.now(),
        result: anyWin ? 'Win' : 'Loss',
        amount: roundWinnings,
        date: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 10));
    
    // External Callback for Profile Stats
    if (onRoundEnd) {
        onRoundEnd(finalHands, roundWinnings);
    }
    
    setPhase('resolving');
  };
  
  const resetGame = () => {
    setPhase('betting');
    setPlayerHands([]);
    setDealerHand([]);
    setMessage('');
    setChipStack([]); // Reset visual stack on table? Usually yes, chips collected.
    setCurrentBet(0);
    setSideBets({ pairs: 0, poker: 0 });
    setTimer(30);
  };

  return {
    gameState: {
        bankroll,
        currentBet,
        chipStack, // Exposed for rendering
        sideBets,
        phase,
        playerHands,
        dealerHand,
        currentHandIndex,
        message,
        insurance: { show: showInsuranceModal, bet: insuranceBet },
        settings: { open: settingsOpen, rules },
        dailyBonus: { show: showDailyModal, claim: claimDailyBonus },
        history: { open: historyOpen, list: betHistory },
        lastBet,
        jackpot,
        winStreak,
        timer,
        intelligence: {
            learningMode,
            runningCount,
            trueCount,
            mistake: latestMistake
        }
    },
    actions: {
        addChip, // Exposed
        placeBet,
        clearBets,
        reBet,
        dealGame,
        hit,
        stand,
        doubleDown,
        split,
        surrender,
        resolveInsurance,
        resetGame,
        toggleSettings: () => setSettingsOpen(!settingsOpen),
        toggleHistory: () => setHistoryOpen(!historyOpen),
        toggleLearningMode: () => setLearningMode(!learningMode),
        updateRules: (newRules) => setRules(prev => ({...prev, ...newRules}))
    }
  };
};
