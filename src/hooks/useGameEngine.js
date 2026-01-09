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
import { Player } from '../utils/Player';

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
  // Money & Economy
  const [players, setPlayers] = useState(() => {
    const saved = localStorage.getItem('bj_players');
    if (saved) {
        const data = JSON.parse(saved);
        return data.map(p => new Player(p.id, p.name, p.spendingPower));
    }
    const savedLegacy = localStorage.getItem('bj_bankroll');
    const startMoney = savedLegacy ? parseInt(savedLegacy) : 1000;
    return [
        new Player(1, 'Player 1', startMoney),
        new Player(2, 'Player 2', 1000), 
        new Player(3, 'Player 3', 1000)
    ];
  });
  

  
  const [sideBets, setSideBets] = useState({ pairs: 0, poker: 0 }); // Kept global/center for simplicity now
  const [lastBet, setLastBet] = useState(null);

  // Jackpot & Streaks
  const [jackpot, setJackpot] = useState(JACKPOT_SEED);
  const [winStreak, setWinStreak] = useState(0);
  const [betHistory, setBetHistory] = useState([]);
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
  const [isRiskFree, setIsRiskFree] = useState(true); // First bet logic



  // Player  // Intelligence & Training
  const [learningMode, setLearningMode] = useState(false);
  const [runningCount, setRunningCount] = useState(0);
  const [trueCount, setTrueCount] = useState(0);
  const [suggestion, setSuggestion] = useState(null); 
  const [latestMistake, setLatestMistake] = useState(null);
  
  // Training Mode State
  const [gameMode, setGameMode] = useState('standard'); // 'standard' | 'drill'
  const [drillType, setDrillType] = useState('all'); // 'soft' | 'pairs' | 'hard' | 'all'
  const [strategyHistory, setStrategyHistory] = useState(() => {
      const saved = localStorage.getItem('bj_strategy_history');
      return saved ? JSON.parse(saved) : {};
  });

  // Game Proper
  const [phase, setPhase] = useState('betting'); 
  const [shoe, setShoe] = useState([]);
  const [cutCardIdx, setCutCardIdx] = useState(0);
  
  // Hands
  const [playerCount, setPlayerCount] = useState(3); // Default 3 for full table
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
  const [trainingOpen, setTrainingOpen] = useState(false);

  // Betting State
  // Dynamic init based on playerCount
  const [activeSpots, setActiveSpots] = useState(
      Array(3).fill(null).map(() => ({ bet: 0, chips: [] }))
  );
  
  const updatePlayerCount = (count) => {
      if (count < 1 || count > 3) return;
      setPlayerCount(count);
      // Reset spots
      setActiveSpots(Array(count).fill(null).map(() => ({ bet: 0, chips: [] })));
      // Clear last bet history to avoid count mismatch
      setLastBet(null); 
  };

  // Derived Total Bet
  const totalBet = activeSpots.reduce((sum, spot) => sum + spot.bet, 0);

  // --- Effects ---
  
  // Persist Players
  useEffect(() => {
     localStorage.setItem('bj_players', JSON.stringify(players));
  }, [players]);
  
  // Persist Strategy History
  useEffect(() => {
     localStorage.setItem('bj_strategy_history', JSON.stringify(strategyHistory));
  }, [strategyHistory]);

  // Daily Bonus Check
  useEffect(() => {
      const lastClaim = localStorage.getItem('bj_last_daily');
      const now = Date.now();
      if (!lastClaim || now - parseInt(lastClaim) > 24 * 60 * 60 * 1000) {
          setDailyBonusAvailable(true);
          setShowDailyModal(true);
      }
  }, []);



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
      // Add to Player 1
      setPlayers(prev => {
          const newPlayers = prev.map(p => {
              if (p.id === 1) {
                  const np = new Player(p.id, p.name, p.spendingPower);
                  np.addFunds(DAILY_BONUS_AMOUNT);
                  return np;
              }
              return p;
          });
          return newPlayers;
      });
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
  const placeBet = (amount, type = 'main', spotIndex) => { 
      if (gameMode === 'drill') return; 
      const defaultIdx = activeSpots.length === 1 ? 0 : 1;
      const idx = spotIndex !== undefined ? spotIndex : defaultIdx;
      addChip(amount, type, idx);
  };

  const addChip = (amount, type = 'main', spotIndex) => {
      // Use spotIndex to find player. Assuming 1:1 mapping for now.
      const playerIdx = spotIndex !== undefined ? spotIndex : 0;
      const player = players[playerIdx];

      if (!player || !player.hasEnoughFunds(amount)) return;
      
      const defaultIdx = activeSpots.length === 1 ? 0 : 1;
      const idx = spotIndex !== undefined ? spotIndex : defaultIdx;

      if (type === 'main') {
         // Validate Spot Limit (optional) and Table Limit
         if (!activeSpots[idx]) return; // Safety check
         const currentSpotBet = activeSpots[idx].bet;
         if (currentSpotBet + amount > rules.maxBet) {
             setMessage("Spot Max Limit Reached");
             return;
         }

         // Deduct from Player
         setPlayers(prev => {
             const newPlayers = [...prev];
             // Clone to trigger update/avoid mutation issues
             const p = newPlayers[playerIdx];
             const np = new Player(p.id, p.name, p.spendingPower);
             np.deductFunds(amount);
             newPlayers[playerIdx] = np;
             return newPlayers;
         });


         setActiveSpots(prev => {
             const newSpots = [...prev];
             if (newSpots[idx]) {
                 newSpots[idx] = {
                     ...newSpots[idx],
                     bet: newSpots[idx].bet + amount,
                     chips: [...newSpots[idx].chips, amount]
                 };
             }
             return newSpots;
         });

      } else {
         // Side Bet support - deducted from Player 1 (Index 0) by default as they are global-ish
         // OR if side bets are per-spot in UI, we use playerIdx. 
         // Current UI usually puts side bets in center. Let's assume Player 1 pays.
         if (playerIdx !== 0 && (type === 'pairs' || type === 'poker')) {
             // For now force Player 1 (Main)
         }
         
         const sideBetPlayerIdx = 0; 
         if (!players[sideBetPlayerIdx].hasEnoughFunds(amount)) return;

         setPlayers(prev => {
            const newPlayers = [...prev];
            const p = newPlayers[sideBetPlayerIdx];
            const np = new Player(p.id, p.name, p.spendingPower);
            np.deductFunds(amount);
            newPlayers[sideBetPlayerIdx] = np;
            return newPlayers;
        });

         setSideBets(prev => ({ ...prev, [type]: prev[type] + amount }));
      }
      // Progressive Tick
      setJackpot(prev => prev + (amount * 0.01)); 
  };

  const clearBets = () => {
    if (gameMode === 'drill') return;
    
    // Refund Main Bets
    setPlayers(prev => {
        const newPlayers = [...prev];
        activeSpots.forEach((spot, i) => {
            if (spot.bet > 0 && newPlayers[i]) {
                const np = new Player(newPlayers[i].id, newPlayers[i].name, newPlayers[i].spendingPower);
                np.addFunds(spot.bet);
                newPlayers[i] = np;
            }
        });
        // Refund Side Bets (Player 1)
        const sideTotal = sideBets.pairs + sideBets.poker;
        if (sideTotal > 0 && newPlayers[0]) {
             const np = new Player(newPlayers[0].id, newPlayers[0].name, newPlayers[0].spendingPower);
             np.addFunds(sideTotal);
             newPlayers[0] = np;
        }
        return newPlayers;
    });
    
    // Dynamic reset
    setActiveSpots(prev => Array(prev.length).fill(null).map(() => ({ bet: 0, chips: [] })));
    setSideBets({ pairs: 0, poker: 0 });
  };

  const reBet = () => {
    if (gameMode === 'drill') return;
    if (!lastBet) return;
    
    // Check total needed
    let totalNeeded = 0;
    
    if (lastBet.spots) {
        // If spot counts mismatch, we can't easily restore multi-spot bets 1:1 unless we map them.
        // Best effort: only restore if lengths match.
        if (lastBet.spots.length !== activeSpots.length) {
            setMessage("Bet history incompatible with current player count.");
            return;
        }
        totalNeeded = lastBet.spots.reduce((acc, s) => acc + s.bet, 0) + lastBet.pairs + lastBet.poker;
    } else {
        totalNeeded = lastBet.main + lastBet.pairs + lastBet.poker;
    }

    if (lastBet.spots) {
        // Validation: Check if each player can afford their previous bet
        for (let i = 0; i < lastBet.spots.length; i++) {
            const bet = lastBet.spots[i].bet;
            if (bet > 0) {
                 if (!players[i] || !players[i].hasEnoughFunds(bet)) {
                     setMessage(`Player ${i+1} insufficient funds`);
                     return;
                 }
            }
        }
        // Side bets (Player 1)
        const sideTotal = lastBet.pairs + lastBet.poker;
        if (sideTotal > 0 && (!players[0] || !players[0].hasEnoughFunds(sideTotal))) {
             setMessage("Player 1 insufficient funds for side bets");
             return;
        }

        // Deduct
        setPlayers(prev => {
            const newPlayers = [...prev];
            lastBet.spots.forEach((spot, i) => {
                 if (spot.bet > 0 && newPlayers[i]) {
                    const np = new Player(newPlayers[i].id, newPlayers[i].name, newPlayers[i].spendingPower);
                    np.deductFunds(spot.bet);
                    newPlayers[i] = np;
                 }
            });
            if (sideTotal > 0 && newPlayers[0]) {
                 const np = new Player(newPlayers[0].id, newPlayers[0].name, newPlayers[0].spendingPower);
                 np.deductFunds(sideTotal);
                 newPlayers[0] = np;
            }
            return newPlayers;
        });

    } else {
        // ... (Legacy single bet path - assumes Player 1/Main)
         totalNeeded = lastBet.main + lastBet.pairs + lastBet.poker;
         if (!players[0].hasEnoughFunds(totalNeeded)) {
             setMessage("Insufficient funds");
             return;
         }
         setPlayers(prev => {
             const np = new Player(prev[0].id, prev[0].name, prev[0].spendingPower);
             np.deductFunds(totalNeeded);
             const newArr = [...prev];
             newArr[0] = np;
             return newArr;
         });
    }
    setSideBets({ pairs: lastBet.pairs, poker: lastBet.poker });

    if (lastBet.spots) {
        setActiveSpots(lastBet.spots); 
    } else {
         // Fallback legacy
         const newStack = [];
         let rem = lastBet.main;
         const denoms = [500, 100, 25, 10];
         for (let d of denoms) {
             while (rem >= d) { newStack.push(d); rem -= d; }
         }
         setActiveSpots(prev => {
             const n = [...prev];
             const targetIdx = n.length === 1 ? 0 : 1;
             if (n[targetIdx]) {
                 n[targetIdx] = { bet: lastBet.main, chips: newStack.reverse() }; 
             }
             return n;
         });
    }
  }

  // --- Drill Tools ---
  const generateDrillHand = (type) => {
      // Create a fresh mini-deck for random generation
      const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
      const suits = ['h','d','c','s'];
      const getRandomCard = (specificRank = null) => {
          const rank = specificRank || ranks[Math.floor(Math.random() * ranks.length)];
          const suit = suits[Math.floor(Math.random() * suits.length)];
          const value = ['J','Q','K'].includes(rank) ? 10 : rank === 'A' ? 11 : parseInt(rank);
          return { rank, suit, value };
      };

      let c1, c2;

      switch(type) {
          case 'pairs': {
             const r = ranks[Math.floor(Math.random() * ranks.length)];
             c1 = getRandomCard(r);
             c2 = getRandomCard(r);
             break;
          }
          case 'soft': {
             c1 = getRandomCard('A');
             // 2-9 for other card
             const softRanks = ['2','3','4','5','6','7','8','9'];
             c2 = getRandomCard(softRanks[Math.floor(Math.random() * softRanks.length)]);
             break;
          }
          case 'hard': {
             // Generate hard totals 8-16
             // Simplest way: deal two randoms, retry if soft or > 17
             do {
                 c1 = getRandomCard();
                 c2 = getRandomCard();
             } while (c1.rank === 'A' || c2.rank === 'A' || c1.value + c2.value < 8 || c1.value + c2.value > 17 || c1.value === c2.value);
             break;
          }
          default: // 'all'
             c1 = getRandomCard();
             c2 = getRandomCard();
             break;
      }
      const dealerUp = getRandomCard();
      const dealerHole = getRandomCard();
      
      return { 
          player: [c1, c2], 
          dealer: [dealerUp, dealerHole] 
      };
  };

  // --- Actions: Gameplay ---
  const dealGame = async () => {
    
    if (gameMode === 'standard') {
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
        
        // Save state for ReBet logic in standard mode
        setLastBet({ 
            spots: JSON.parse(JSON.stringify(activeSpots)), 
            pairs: sideBets.pairs, 
            poker: sideBets.poker 
        });
    }

    setPhase('dealing');
    setInsuranceBet(0);
    setShowInsuranceModal(false);

    let newPlayerHands = [];
    let dHandCards = [];
    let newShoe = [...shoe];

    if (gameMode === 'drill') {
        // DRILL MODE DEAL
        const drillData = generateDrillHand(drillType);
        
        // Setup Player Hand (Single Spot for drills)
        newPlayerHands.push({
            id: Date.now(), 
            cards: drillData.player,
            bet: 0, // No money in drills
            chips: [],
            status: 'playing',
            result: null,
            spotIndex: 1 // Center
        });
        dHandCards = drillData.dealer;
        
        // In drills, we don't consume the main shoe or update count
        // to keep the main game state pure.

    } else {
        // STANDARD MODE DEAL
        // Identify active spots
        const dealingSpots = activeSpots.map((s, i) => ({ ...s, index: i })).filter(s => s.bet > 0);
        
        for (let spot of dealingSpots) {
            const c1 = newShoe.pop();
            const c2 = newShoe.pop();
            
            newPlayerHands.push({
                id: Date.now() + spot.index, 
                cards: [c1, c2],
                bet: spot.bet,
                chips: [...spot.chips],
                status: 'playing',
                result: null,
                spotIndex: spot.index 
            });
        }
        dHandCards = [newShoe.pop(), newShoe.pop()];
        
        // Count Update
        let rc = runningCount;
        newPlayerHands.forEach(h => {
            h.cards.forEach(c => rc += getHiLoCount(c));
        });
        rc += getHiLoCount(dHandCards[0]);
        
        setRunningCount(rc);
        const decksRem = Math.max(1, (newShoe.length) / 52);
        setTrueCount(Math.round(rc / decksRem));
        
        setShoe(newShoe);
    }

    setDealerHand(dHandCards);
    setPlayerHands(newPlayerHands);
    setCurrentHandIndex(0);

    // Standard Mode Side Bets
    if (gameMode === 'standard') {
        let winnings = 0;
        let payoutMsg = ""; // ... (same as before)
        const mainHand = newPlayerHands[0];
        if (mainHand) {
            if (sideBets.pairs > 0) {
                const mult = checkPerfectPairs(mainHand.cards);
                if (mult > 0) { winnings += sideBets.pairs * mult + sideBets.pairs; payoutMsg += `Pairs Win! `; }
            }
            if (sideBets.poker > 0) {
                const mult = check21Plus3(mainHand.cards, dHandCards[0]);
                if (mult > 0) { winnings += sideBets.poker * mult + sideBets.poker; payoutMsg += `Poker Win! `; }
            }
        }
        if (winnings > 0) {
            setPlayers(prev => {
                const np = new Player(prev[0].id, prev[0].name, prev[0].spendingPower);
                np.addFunds(winnings);
                const newArr = [...prev];
                newArr[0] = np;
                return newArr;
            });
            setMessage(payoutMsg);
            await new Promise(r => setTimeout(r, 1500));
        }
    }
    
    // Check Naturals
    newPlayerHands.forEach(h => {
        if (calculateScore(h.cards) === 21) {
            h.status = 'blackjack';
        }
    });
    setPlayerHands([...newPlayerHands]);

    const dealerHasAce = dHandCards[0].rank === 'A';
    
    // Insurance Logic
    if (dealerHasAce && gameMode === 'standard') {
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
        const allBJ = pHands.every(h => h.status === 'blackjack');
        if (allBJ) {
            finishRound(pHands, dHand);
        } else {
            let startIdx = 0;
            while(startIdx < pHands.length && pHands[startIdx].status === 'blackjack') {
                startIdx++;
            }
            if (startIdx >= pHands.length) {
                setPhase('dealerTurn'); 
            } else {
                setCurrentHandIndex(startIdx);
                setPhase('playerTurn');
            }
        }
    }
  };

  const hit = async () => {
    checkStrategy('hit');
    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    
    let card;
    if (gameMode === 'drill') {
        // Random card
        const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        const suits = ['h','d','c','s'];
        const r = ranks[Math.floor(Math.random() * ranks.length)];
        const s = suits[Math.floor(Math.random() * suits.length)];
        card = { rank: r, suit: s, value: ['J','Q','K'].includes(r) ? 10 : r === 'A' ? 11 : parseInt(r) };
    } else {
        const newShoe = [...shoe];
        card = newShoe.pop();
        setShoe(newShoe);
        setRunningCount(prev => prev + getHiLoCount(card));
    }

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
    
    const pIdx = hand.spotIndex; // Map hand spot to player
    if (gameMode === 'standard' && (!players[pIdx] || !players[pIdx].hasEnoughFunds(hand.bet))) {
      setMessage("Insufficient funds");
      return;
    }

    if (gameMode === 'standard') {
        setPlayers(prev => {
            const newPlayers = [...prev];
            const np = new Player(newPlayers[pIdx].id, newPlayers[pIdx].name, newPlayers[pIdx].spendingPower);
            np.deductFunds(hand.bet);
            newPlayers[pIdx] = np;
            return newPlayers;
        });
    }
    
    hand.bet *= 2;
    // Don't duplicate chips visually for drills, or do it with fake chips? 
    if (gameMode === 'standard') hand.chips = [...hand.chips, ...hand.chips]; 
    hand.isDoubled = true;

    let card;
    if (gameMode === 'drill') {
        const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        const r = ranks[Math.floor(Math.random() * ranks.length)];
        card = { rank: r, suit: 'd', value: ['J','Q','K'].includes(r) ? 10 : r === 'A' ? 11 : parseInt(r) };
    } else {
        const newShoe = [...shoe];
        card = newShoe.pop();
        setShoe(newShoe);
        setRunningCount(prev => prev + getHiLoCount(card));
    }
    
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
    
    const pIdx = hand.spotIndex;
    if (gameMode === 'standard' && (!players[pIdx] || !players[pIdx].hasEnoughFunds(hand.bet))) return;
    
    if (gameMode === 'standard') {
        setPlayers(prev => {
            const newPlayers = [...prev];
            const np = new Player(newPlayers[pIdx].id, newPlayers[pIdx].name, newPlayers[pIdx].spendingPower);
            np.deductFunds(hand.bet);
            newPlayers[pIdx] = np;
            return newPlayers;
        });
    }
    
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
    
    // Deal card to current hand
    let c1;
    if (gameMode === 'drill') {
         // cheat a bit, simpler random
         const ranks = ['2','9','J','K','3'];
         const r = ranks[Math.floor(Math.random()*ranks.length)];
         c1 = { rank: r, suit: 's', value: 10 }; // Simplified
    } else {
        const newShoe = [...shoe];
        c1 = newShoe.pop();
        setRunningCount(prev => prev + getHiLoCount(c1));
        setShoe(newShoe); 
    }
    hand.cards.push(c1);

    setPlayerHands(updatedHands);
  };
  
  const surrender = () => {
    checkStrategy('surrender');
    const updatedHands = [...playerHands];
    const hand = updatedHands[currentHandIndex];
    
    hand.status = 'surrender';
    if (gameMode === 'standard') {
        setPlayers(prev => {
             const newPlayers = [...prev];
             const pIdx = hand.spotIndex;
             if (newPlayers[pIdx]) {
                const np = new Player(newPlayers[pIdx].id, newPlayers[pIdx].name, newPlayers[pIdx].spendingPower);
                np.addFunds(hand.bet / 2);
                newPlayers[pIdx] = np;
             }
             return newPlayers;
        });
    }
    hand.result = 'loss'; 
    advanceHand(updatedHands);
  };

  // ... (resolveInsurance remains mostly same, can skip for drills)
  const resolveInsurance = (buy) => { /* ... existing ... */ 
      setShowInsuranceModal(false);
      // ... (rest of logic same as before, essentially skipped in drills since insurance modal isn't shown)
      // I'll leave the existing body or assume it is kept from previous file state if I didn't replace it all? 
      // The replace block seems to be covering the whole file mostly. I should include it.
      // Re-implement simplified:
      
      let currentBankroll = 0; // Local var not used much now
      // Insurance logic is tricky with multiple players. 
      // Simplified: Assume Player 1 pays/receives for now as insurance is global modal.
      if (buy && gameMode === 'standard') {
          const insuranceCost = Math.floor(totalBet / 2);
          if (players[0].hasEnoughFunds(insuranceCost)) {
             setPlayers(prev => {
                 const np = new Player(prev[0].id, prev[0].name, prev[0].spendingPower);
                 np.deductFunds(insuranceCost);
                 const newArr = [...prev];
                 newArr[0] = np;
                 return newArr;
             });
             setInsuranceBet(insuranceCost);
          }
      }
      
      const dHand = dealerHand;
      if (isBlackjack(dHand)) {
         if (buy && gameMode === 'standard') {
             setPlayers(prev => {
                 const np = new Player(prev[0].id, prev[0].name, prev[0].spendingPower);
                 np.addFunds(Math.floor(totalBet / 2) * 3);
                 const newArr = [...prev];
                 newArr[0] = np;
                 return newArr;
             });
             setMessage("Insurance Pays!");
         } else {
             setMessage("Dealer has Blackjack.");
         }
         finishRound(playerHands, dHand, 'dealerBJ'); 
      } else {
         if (buy) setMessage("Insurance Lost");
         checkDealerNatural(shoe, dHand, playerHands);
      }
  };

  const advanceHand = (hands) => {
    let nextIdx = currentHandIndex + 1;
    
    // Auto-skip
    while (nextIdx < hands.length && hands[nextIdx].status !== 'playing') {
        nextIdx++;
    }

    if (nextIdx < hands.length) {
        setPlayerHands(hands);
        // Split 2nd card deal logic if needed
        if (hands[nextIdx].cards.length === 1) {
             let c;
             if (gameMode === 'drill') {
                 c = { rank: '5', suit: 'h', value: 5 }; // simple
             } else {
                 const newShoe = [...shoe];
                 c = newShoe.pop();
                 setShoe(newShoe);
             }
             hands[nextIdx].cards.push(c);
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

            if (dealerHand.length === 2 && gameMode === 'standard') {
                 setRunningCount(prev => prev + getHiLoCount(dealerHand[1]));
            }

            // Fast forward in Drill Mode? No, visual is good.
            while (score < 17 || (score === 17 && soft && rules.dealerSoft17)) {
                await delay(gameMode === 'drill' ? 400 : 800);
                let card;
                if (gameMode === 'drill') {
                    // Random card
                    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
                    const r = ranks[Math.floor(Math.random() * ranks.length)];
                    card = { rank: r, suit: 'c', value: ['J','Q','K'].includes(r) ? 10 : r === 'A' ? 11 : parseInt(r) };
                } else {
                    card = currentShoe.pop();
                    setRunningCount(prev => prev + getHiLoCount(card));
                }
                
                currentDHand.push(card);
                score = calculateScore(currentDHand);
                soft = isSoftHand(currentDHand);
                setDealerHand([...currentDHand]);
            }
            if (gameMode === 'standard') setShoe(currentShoe);
            finishRound(playerHands, currentDHand);
        };
        executeDealer();
    }
  }, [phase, gameMode]);

  const finishRound = (pHands, dHand, overrideReason = null) => {
      // ... Logic is largely same, just no bankroll update in drill
      const dScore = calculateScore(dHand);
      const dIsBJ = isBlackjack(dHand);
      let roundWinnings = 0;
      
      const finalHands = pHands.map(hand => {
          if (hand.status === 'surrender') return hand;
          let result = 'push';
          let msg = '';
          let payout = 0;
          const pScore = calculateScore(hand.cards);
          
          if (hand.status === 'bust') { result = 'loss'; msg = 'Bust'; }
          else if (overrideReason === 'dealerBJ') {
              if (hand.status === 'blackjack') { result = 'push'; msg = 'Push'; }
              else { result = 'loss'; msg = 'Dealer BJ'; }
          } else if (dScore > 21) {
              result = 'win'; msg = 'Dealer Bust'; payout = hand.bet * 2;
          } else if (pScore > dScore) {
              result = 'win'; msg = 'Win'; payout = hand.status==='blackjack' ? hand.bet*2.5 : hand.bet*2;
          } else if (pScore < dScore) {
              result = 'loss'; msg = 'Lose';
          } else {
              result = 'push'; msg = 'Push'; payout = hand.bet;
          }
          roundWinnings += payout;
          return { ...hand, result, message: msg, payout };
      });

      if (gameMode === 'standard') {
          // ... Bankroll and Streak logic ...
          if (roundWinnings > 0) {
              setPlayers(prev => {
                  const newPlayers = [...prev];
                  finalHands.forEach(hand => {
                      if (hand.payout > 0) {
                          const pIdx = hand.spotIndex;
                          if (newPlayers[pIdx]) {
                              const np = new Player(newPlayers[pIdx].id, newPlayers[pIdx].name, newPlayers[pIdx].spendingPower);
                              np.addFunds(hand.payout);
                              newPlayers[pIdx] = np;
                          }
                      }
                  });
                  return newPlayers;
              });
          }
          // Risk Free Refund (Player 1 context usually)
          else if (isRiskFree && roundWinnings === 0 && finalHands.every(h => h.result === 'loss')) {
               const totalLost = finalHands.reduce((acc, h) => acc + h.bet, 0);
               setPlayers(prev => {
                    // Refund to whoever bet? Or just Main?
                    // Simplify: Refund to respective players
                   const newPlayers = [...prev];
                   finalHands.forEach(hand => {
                       const pIdx = hand.spotIndex;
                       if (newPlayers[pIdx]) {
                           const np = new Player(newPlayers[pIdx].id, newPlayers[pIdx].name, newPlayers[pIdx].spendingPower);
                           np.addFunds(hand.bet);
                           newPlayers[pIdx] = np;
                       }
                   });
                   return newPlayers;
               });
               setMessage("Risk-Free Refunded!");
               setIsRiskFree(false);
          }
          

          // History: Record per-player results
          const timestamp = Date.now();
          const newHistoryItems = [];
          
          // Group by player (spotIndex -> playerId)
          // Assumption: spotIndex 0 -> Player 1, 1 -> Player 2, etc. (Matches initialization)
          const playerRoundData = {};
          
          finalHands.forEach(h => {
              const pIdx = h.spotIndex; 
              // Only track if valid player exists
              if (players[pIdx]) {
                  const pId = players[pIdx].id;
                  if (!playerRoundData[pId]) {
                      playerRoundData[pId] = { bet: 0, payout: 0, results: [] };
                  }
                  playerRoundData[pId].bet += h.bet;
                  playerRoundData[pId].payout += h.payout;
                  playerRoundData[pId].results.push(h.result);
              }
          });

          Object.keys(playerRoundData).forEach(pIdStr => {
              const pId = parseInt(pIdStr);
              const data = playerRoundData[pId];
              const net = data.payout - data.bet;
              
              // Determine aggregate result string
              // e.g. "Win (+$50)" or "Loss vs Dealer"
              let resString = 'Push';
              if (data.results.every(r => r === 'loss' || r === 'bust')) resString = 'Loss';
              else if (data.results.some(r => r === 'blackjack')) resString = 'Blackjack';
              else if (net > 0) resString = 'Win';
              else if (net < 0) resString = 'Loss';
              
              newHistoryItems.push({
                  id: `${timestamp}-${pId}`,
                  playerId: pId,
                  result: resString,
                  amount: net,
                  timestamp: timestamp,
                  details: data.results.join(', ')
              });
          });

          setBetHistory(prev => [...newHistoryItems, ...prev].slice(0, 50));
      }

      setPlayerHands(finalHands);
      
      if (gameMode === 'drill') {
           // Auto-redealing in drills? Or show results then quick button?
           // Let's just show result. User presses "Next Hand" (Deal).
      }
      
      setPhase('resolving');
  };
  
  // Strategy Check Helper
  const checkStrategy = (action) => {
      // NOTE: We check strategy ALWAYS in Drill mode, or if learningMode is ON in standard.
      if (!learningMode && gameMode === 'standard') return;
      
      const currentHand = playerHands[currentHandIndex];
      const pScore = calculateScore(currentHand.cards);
      const isSoft = isSoftHand(currentHand.cards);
      const canSplit = currentHand.cards.length === 2 && currentHand.cards[0].value === currentHand.cards[1].value;
      
      // Determine Scenario Key for Heatmap
      // Key Format: 'type-PVal-DVal'
      // Type: H (Hard), S (Soft), P (Pair)
      let type = 'H';
      let pVal = pScore;
      if (canSplit) {
          type = 'P';
          pVal = getCardValue(currentHand.cards[0]); // Rank value (e.g., 8 for 8s)
          // Adjust for Aces (11)
          if (currentHand.cards[0].rank === 'A') pVal = 'A';
      } else if (isSoft) {
          type = 'S';
      }
      
      const dVal = getCardValue(dealerHand[0]);
      
      const ideal = getBasicStrategyMove({ cards: currentHand.cards, score: pScore, isSoft, canSplit, canDouble: true }, dealerHand[0]);
      
      // Is Correct?
      // Note: Basic strategy might return 'double'. If user hits, is it wrong? Yes.
      // Exception: double vs hit. If 'double' is ideal, 'hit' is usually 2nd best but still a mistake in drill.
      
      const isCorrect = ideal === action || (ideal === 'double' && action === 'hit' && canDouble === false); // fallback
      
      // Update History
      const key = `${type}-${pVal}-${dVal}`; // e.g., H-16-10, P-8-10, S-18-9
      setStrategyHistory(prev => {
          const entry = prev[key] || { correct: 0, total: 0 };
          return {
              ...prev,
              [key]: {
                  correct: entry.correct + (isCorrect ? 1 : 0),
                  total: entry.total + 1
              }
          };
      });

      if (!isCorrect) {
          setLatestMistake({ msg: `Mistake! Basic Strategy says: ${ideal.toUpperCase()}`, ts: Date.now() });
      } else if (gameMode === 'drill') {
          // Positive feedback in drill?
          // maybe? setSuggestion("Correct!");
      }
  };

  const resetGame = () => {
    setPhase('betting');
    setPlayerHands([]);
    setDealerHand([]);
    setMessage('');
    // Clear spots logic: 
    if (gameMode === 'standard') {
        setActiveSpots(Array(playerCount).fill(null).map(() => ({ bet: 0, chips: [] }))); 
        setSideBets({ pairs: 0, poker: 0 });

    }
  };

  return {
    gameState: {
        players, 
        bankroll: players[0] ? players[0].spendingPower : 0, // Legacy support for header if not updated yet
        activeSpots,
        currentBet: totalBet,
        playerCount,
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
        training: { open: trainingOpen, mode: gameMode, drillType, stats: strategyHistory },
        lastBet,
        jackpot,
        winStreak,

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
        setTrainingOpen: (v) => setTrainingOpen(v), 
        setGameMode: (m) => { setGameMode(m); resetGame(); },
        setDrillType: (t) => { setDrillType(t); },
        updateRules: (newRules) => setRules(prev => ({...prev, ...newRules})),
        setPlayerCount: updatePlayerCount
    }
  };
};
