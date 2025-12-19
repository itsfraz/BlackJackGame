import { useState, useEffect, useCallback } from 'react';
import { createDeck, shuffleDeck, calculateScore } from '../utils/deck';

export const useBlackjack = () => {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState('initial'); // initial, playing, dealerTurn, gameOver
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState(null); // 'player', 'dealer', 'draw', null

  const initializeGame = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    
    // Deal initial cards
    const pHand = [newDeck.pop(), newDeck.pop()];
    const dHand = [newDeck.pop(), newDeck.pop()];
    
    setPlayerHand(pHand);
    setDealerHand(dHand);
    setGameState('playing');
    setMessage('');
    setWinner(null);

    // Check for natural Blackjack
    const pScore = calculateScore(pHand);
    const dScore = calculateScore(dHand);

    if (pScore === 21) {
       if (dScore === 21) {
         setGameState('gameOver');
         setWinner('draw');
         setMessage('Push! Both have Blackjack.');
       } else {
         setGameState('gameOver');
         setWinner('player');
         setMessage('Blackjack! You win!');
       }
    }
  }, []);

  const hit = useCallback(() => {
    if (gameState !== 'playing') return;

    const newDeck = [...deck];
    const card = newDeck.pop();
    const newHand = [...playerHand, card];
    
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (calculateScore(newHand) > 21) {
      setGameState('gameOver');
      setWinner('dealer');
      setMessage('Bust! You lose.');
    }
  }, [deck, playerHand, gameState]);

  const stand = useCallback(() => {
    if (gameState !== 'playing') return;
    setGameState('dealerTurn');
  }, [gameState]);

  const doubleDown = useCallback(() => {
    if (gameState !== 'playing' || playerHand.length !== 2) return;

    const newDeck = [...deck];
    const card = newDeck.pop();
    const newHand = [...playerHand, card];
    
    setPlayerHand(newHand);
    setDeck(newDeck);

    if (calculateScore(newHand) > 21) {
      setGameState('gameOver');
      setWinner('dealer');
      setMessage('Bust! You lose.');
    } else {
      setGameState('dealerTurn');
    }
  }, [gameState, deck, playerHand]);

  // Dealer Logic
  useEffect(() => {
    if (gameState === 'dealerTurn') {
      const playDealer = async () => {
        let currentDeck = [...deck];
        let currentHand = [...dealerHand];
        let score = calculateScore(currentHand);

        // Simple delay for animation
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        while (score < 17) {
          await delay(800);
          const card = currentDeck.pop();
          currentHand = [...currentHand, card];
          score = calculateScore(currentHand);
          setDealerHand([...currentHand]);
          setDeck([...currentDeck]);
        }

        setGameState('gameOver');
        
        const pScore = calculateScore(playerHand);
        const dScore = calculateScore(currentHand);

        if (dScore > 21) {
          setWinner('player');
          setMessage('Dealer Busts! You win!');
        } else if (dScore > pScore) {
          setWinner('dealer');
          setMessage('Dealer wins!');
        } else if (dScore < pScore) {
          setWinner('player');
          setMessage('You win!');
        } else {
          setWinner('draw');
          setMessage('Push! It\'s a tie.');
        }
      };
      playDealer();
    }
  }, [gameState, deck, dealerHand, playerHand]);

  return {
    playerHand,
    dealerHand,
    gameState,
    message,
    winner,
    initializeGame,
    hit,
    stand,
    doubleDown,
    calculateScore
  };
};
