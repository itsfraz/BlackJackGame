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
  
  // Multi-Hand Betting State
  // 3 distinct spots: 0 (Left), 1 (Center), 2 (Right)
  const [activeSpots, setActiveSpots] = useState([
      { bet: 0, chips: [] },
      { bet: 0, chips: [] },
      { bet: 0, chips: [] }
  ]);
  
  const [sideBets, setSideBets] = useState({ pairs: 0, poker: 0 }); // Kept global/center for simplicity now
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
  const [suggestion, setSuggestion] = useState(null); 
  const [latestMistake, setLatestMistake] = useState(null); 

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

  // Derived Total Bet
  const totalBet = activeSpots.reduce((sum, spot) => sum + spot.bet, 0);

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
                  if (prev <= 1) return 30; 
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
  // Updated for Spot Support
  const placeBet = (amount, type = 'main', spotIndex = 1) => { 
      // Ensure spotIndex is valid
      const idx = spotIndex !== undefined ? spotIndex : 1;
      addChip(amount, type, idx);
  };

  const addChip = (amount, type = 'main', spotIndex = 1) => {
      if (bankroll < amount) return;

      if (type === 'main') {
         // Validate Spot Limit (optional) and Table Limit
         const currentSpotBet = activeSpots[spotIndex].bet;
         if (currentSpotBet + amount > rules.maxBet) {
             setMessage("Spot Max Limit Reached");
             return;
         }

         setBankroll(prev => prev - amount);
         setTimer(30);

         setActiveSpots(prev => {
             const newSpots = [...prev];
             newSpots[spotIndex] = {
                 ...newSpots[spotIndex],
                 bet: newSpots[spotIndex].bet + amount,
                 chips: [...newSpots[spotIndex].chips, amount]
             };
             return newSpots;
         });

      } else {
         // Legacy Side Bet support (tied to center or global for now)
         setSideBets(prev => ({ ...prev, [type]: prev[type] + amount }));
         setBankroll(prev => prev - amount);
      }
      // Progressive Tick
      setJackpot(prev => prev + (amount * 0.01)); 
  };

  const clearBets = () => {
    const totalReturned = totalBet + sideBets.pairs + sideBets.poker;
    setBankroll(prev => prev + totalReturned);
    
    setActiveSpots([
        { bet: 0, chips: [] },
        { bet: 0, chips: [] },
        { bet: 0, chips: [] }
    ]);
    setSideBets({ pairs: 0, poker: 0 });
  };

  const reBet = () => {
    if (!lastBet) return;
    
    // Check total needed
    // lastBet structure needs update or simple adaptation
    // If lastBet saved 'spots', use that. Else legacy fallback.
    let totalNeeded = 0;
    
    if (lastBet.spots) {
        totalNeeded = lastBet.spots.reduce((acc, s) => acc + s.bet, 0) + lastBet.pairs + lastBet.poker;
    } else {
        totalNeeded = lastBet.main + lastBet.pairs + lastBet.poker;
    }

    if (bankroll < totalNeeded) {
        setMessage("Insufficient funds to Re-Bet");
        return;
    }

    setBankroll(prev => prev - totalNeeded);
    setSideBets({ pairs: lastBet.pairs, poker: lastBet.poker });

    if (lastBet.spots) {
        // Full restore of multi-hand bets
        setActiveSpots(lastBet.spots); // Assuming deep clone or safe reference in setLastBet
    } else {
        // Fallback for single hand legacy
         // Reconstruct chips greedily
         const newStack = [];
         let rem = lastBet.main;
         const denoms = [500, 100, 25, 10];
         for (let d of denoms) {
             while (rem >= d) { newStack.push(d); rem -= d; }
         }
         setActiveSpots(prev => {
             const n = [...prev];
             n[1] = { bet: lastBet.main, chips: newStack.reverse() }; // Center spot
             return n;
         });
    }
  }

  // --- Actions: Gameplay ---
  const dealGame = async () => {
    if (totalBet < rules.minBet) {
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
    // Save state correctly for ReBet
    setLastBet({ 
        spots: JSON.parse(JSON.stringify(activeSpots)), 
        pairs: sideBets.pairs, 
        poker: sideBets.poker 
    });
    
    setInsuranceBet(0);
    setShowInsuranceModal(false);

    const newShoe = [...shoe];
    
    // --- Deal Logic for Multi-Hand ---
    // Identify active spots
    const dealingSpots = activeSpots.map((s, i) => ({ ...s, index: i })).filter(s => s.bet > 0);
    
    // Initial cards for Player Hands
    // Deal sequence: Spot 0 -> Spot 1 -> Spot 2 -> Dealer -> Spot 0 -> Spot 1 -> Spot 2 -> Dealer
    // But simplified: Just deal 2 cards to each active spot.
    
    const newPlayerHands = [];
    
    // Dealing 2 cards to each active spot
    for (let spot of dealingSpots) {
        const c1 = newShoe.pop();
        const c2 = newShoe.pop();
        
        newPlayerHands.push({
            id: Date.now() + spot.index, 
            cards: [c1, c2], // In real deal, it's interlaced, but logically fine here
            bet: spot.bet,
            chips: [...spot.chips],
            status: 'playing',
            result: null,
            spotIndex: spot.index // Track visual position?
        });
    }

    const dHandCards = [newShoe.pop(), newShoe.pop()];
    
    // Count Update
    let rc = runningCount;
    // Add all player cards + dealer upcard
    newPlayerHands.forEach(h => {
        h.cards.forEach(c => rc += getHiLoCount(c));
    });
    rc += getHiLoCount(dHandCards[0]);
    
    setRunningCount(rc);
    const decksRem = Math.max(1, (newShoe.length) / 52);
    setTrueCount(Math.round(rc / decksRem));

    setShoe(newShoe);
    setDealerHand(dHandCards);
    setPlayerHands(newPlayerHands);
    setCurrentHandIndex(0);

    // Side Bet Resolution (Checks only 1st hand or all? Simplified: Check ALL active hands for pair?)
    // But sideBets.pairs is a single value... usually implies Center spot sidebet if global.
    // For now, let's say Side Bets only apply to the FIRST active hand (or Center).
    // Let's apply to Center spot if active, else ignore? 
    // Or split side bet evenly?
    // Implementation: Apply 'Global' side bets to the first dealt hand only.
    
    let winnings = 0;
    let payoutMsg = "";

    const mainHand = newPlayerHands[0]; // Apply side bets to first hand for now
    if (mainHand) {
        if (sideBets.pairs > 0) {
            const mult = checkPerfectPairs(mainHand.cards);
            if (mult > 0) {
                winnings += sideBets.pairs * mult + sideBets.pairs;
                payoutMsg += `Pairs Win! `;
            }
        }
        if (sideBets.poker > 0) {
            const mult = check21Plus3(mainHand.cards, dHandCards[0]);
            if (mult > 0) {
                winnings += sideBets.poker * mult + sideBets.poker;
                payoutMsg += `Poker Win! `;
            }
        }
    }

    if (winnings > 0) {
        setBankroll(prev => prev + winnings);
        setMessage(payoutMsg);
        await new Promise(r => setTimeout(r, 1500));
    }
    
    // Check Naturals
    // Need to check specific hands for blackjack
    newPlayerHands.forEach(h => {
        if (calculateScore(h.cards) === 21) {
            h.status = 'blackjack';
        }
    });

    // Update with blackjack statuses
    setPlayerHands([...newPlayerHands]);

    const dealerHasAce = dHandCards[0].rank === 'A';
    
    // If ANY player hand is not BJ, and dealer has Ace, offer insurance? 
    // Standard: Offer insurance if dealer shows Ace.
    if (dealerHasAce) {
        setShowInsuranceModal(true);
    } else {
        checkDealerNatural(newShoe, dHandCards, newPlayerHands);
    }
  };

  const checkDealerNatural = (deckStr, dHand, pHands) => {
    const isDealerBJ = isBlackjack(dHand);
    
    if (isDealerBJ) {
        finishRound(pHands, dHand, 'dealerBJ');
    } else {
        // Check if all players have BJs?
        const allBJ = pHands.every(h => h.status === 'blackjack');
        if (allBJ) {
            finishRound(pHands, dHand);
        } else {
            // Find first non-BJ hand to start turn
            let startIdx = 0;
            while(startIdx < pHands.length && pHands[startIdx].status === 'blackjack') {
                startIdx++;
            }
            if (startIdx >= pHands.length) {
                setPhase('dealerTurn'); // Should trigger finish logic
            } else {
                setCurrentHandIndex(startIdx);
                setPhase('playerTurn');
            }
        }
    }
  };
  
  // Wrapped Action Helpers to verify current hand validity
  const withCurrentHand = (fn) => {
      const h = playerHands[currentHandIndex];
      // Safety check
      if(!h || h.status !== 'playing') {
          // Try to advance?
          // advanceHand(playerHands);
          return;
      }
      fn(h);
  };

  const hit = async () => {
    checkStrategy('hit');
    const newShoe = [...shoe];
    const card = newShoe.pop();
    setShoe(newShoe);
    setRunningCount(prev => prev + getHiLoCount(card));

    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    hand.cards.push(card);

    const score = calculateScore(hand.cards);

    if (score > 21) {
       hand.status = 'bust';
       advanceHand(updatedHands);
    } else if (score === 21) {
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
    hand.chips = [...hand.chips, ...hand.chips]; 
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
        id: Date.now() + Math.random(),
        cards: [splitCard],
        bet: hand.bet,
        status: 'playing',
        chips: [...hand.chips], 
        result: null,
        spotIndex: hand.spotIndex // Inherit spot visual
    };
    
    updatedHands.splice(currentHandIndex + 1, 0, newHand); 
    
    const newShoe = [...shoe];
    const c1 = newShoe.pop();
    hand.cards.push(c1);
    setRunningCount(prev => prev + getHiLoCount(c1));
    setShoe(newShoe); 
    
    setPlayerHands(updatedHands);
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

  const resolveInsurance = (buy) => {
    setShowInsuranceModal(false);
    let currentBankroll = bankroll;
    
    if (buy) {
      const cost = Math.floor(currentBet / 2); // Wait, currentBet is total. Insurance usually on "Main Hand"?
      // Simplify: Insurance based on TOTAL BET exposed?
      // Standard: Insurance is per hand.
      // Simplification: Insurance only on first hand / center hand or aggregate.
      // Let's take TOTAL bet exposed on table / 2.
      // currentBet is sum(activeSpots).
      
      const insuranceCost = Math.floor(totalBet / 2);
      if (currentBankroll >= insuranceCost) {
         setInsuranceBet(insuranceCost);
         currentBankroll -= insuranceCost;
         setBankroll(currentBankroll);
      }
    }
    
    const dHand = dealerHand;
    const isDealerBJ = isBlackjack(dHand);
    
    if (isDealerBJ) {
       if (buy) {
         setBankroll(currentBankroll + (Math.floor(totalBet / 2) * 3)); 
         setMessage("Insurance Pays!");
       } else {
         setMessage("Dealer has Blackjack.");
       }
       finishRound(playerHands, dHand, 'dealerBJ'); 
    } else {
       if (buy) setMessage("Insurance Lost");
       
       // Resume
       checkDealerNatural(shoe, dHand, playerHands);
    }
  };

  const advanceHand = (hands) => {
    let nextIdx = currentHandIndex + 1;
    if (nextIdx < hands.length) {
        setPlayerHands(hands); // Commit current state
        const nextHand = hands[nextIdx];
        
        // Auto-skip settled hands (blackjacks)
        if (nextHand.status !== 'playing' && nextHand.cards.length >= 2) {
            setCurrentHandIndex(nextIdx); // Set next
            // Recursively advance if that one is also done?
            // Safer to just let next render cycle handle or simple recursion:
            // return advanceHand(hands) -- but careful with state updates.
            // For now, assume player must click "Stand" or we auto-skip here?
            // Actually, we should check status. If next hand is BJ, move past it.
            // Let's do a quick loop
            while (nextIdx < hands.length && hands[nextIdx].status !== 'playing') {
                nextIdx++;
            }
            if (nextIdx >= hands.length) {
                setPhase('dealerTurn');
                return;
            }
        }
        
        // Deal 2nd card to Split hands if needed
        if (hands[nextIdx].cards.length === 1) {
             // It's a split hand needing a card
             const newShoe = [...shoe];
             hands[nextIdx].cards.push(newShoe.pop());
             setShoe(newShoe);
        }
        
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

            if (dealerHand.length === 2) {
                 setRunningCount(prev => prev + getHiLoCount(dealerHand[1]));
            }

            while (score < 17 || (score === 17 && soft && rules.dealerSoft17)) {
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

    if (isRiskFree && roundWinnings === 0 && finalHands.every(h => h.result === 'loss')) {
        const totalLost = finalHands.reduce((acc, h) => acc + h.bet, 0);
        roundWinnings += totalLost; 
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
        if (newStreak % 3 === 0) setBankroll(prev => prev + 50); 
    } else if (finalHands.some(h => h.result === 'loss')) {
        setWinStreak(0);
    }

    setBetHistory(prev => [{
        id: Date.now(),
        result: anyWin ? 'Win' : 'Loss',
        amount: roundWinnings,
        date: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 10));
    
    if (onRoundEnd) onRoundEnd(finalHands, roundWinnings);
    
    setPhase('resolving');
  };
  
  // Strategy Check Helper for methods
  const checkStrategy = (action) => {
      if (!learningMode) return;
      const currentHand = playerHands[currentHandIndex];
      const pScore = calculateScore(currentHand.cards);
      const isSoft = isSoftHand(currentHand.cards);
      const canSplit = currentHand.cards.length === 2 && currentHand.cards[0].value === currentHand.cards[1].value;
      const ideal = getBasicStrategyMove({ cards: currentHand.cards, score: pScore, isSoft, canSplit, canDouble: true }, dealerHand[0]);
      if (ideal !== action && !(ideal === 'double' && action === 'hit')) {
          setLatestMistake({ msg: `Mistake! Basic Strategy says: ${ideal.toUpperCase()}`, ts: Date.now() });
      }
  };

  const resetGame = () => {
    setPhase('betting');
    setPlayerHands([]);
    setDealerHand([]);
    setMessage('');
    // Clear spots logic: Don't clear bets, just keep them for next round? 
    // Usually casino apps keep bets. But for now let's clear visuals of hands.
    // The activeSpots remain as is? No, usually "Repeat Bet" or "Use last bet".
    // Let's clear spots to 0 for a fresh round flow, forcing ReBet.
    setActiveSpots([ { bet: 0, chips: [] }, { bet: 0, chips: [] }, { bet: 0, chips: [] } ]);
    setSideBets({ pairs: 0, poker: 0 });
    setTimer(30);
  };

  return {
    gameState: {
        bankroll,
        activeSpots,
        currentBet: totalBet, // Backwards compat in UI display
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
        intelligence: { learningMode, runningCount, trueCount, mistake: latestMistake }
    },
    actions: {
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
