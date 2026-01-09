import React, { useState } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from "framer-motion";

const CHIPS = [10, 25, 100, 500];

const BettingControls = ({ 
    bankroll, 
    currentBet, 
    activeSpots = [], 
    sideBets, 
    onBet, 
    onClear, 
    onReBet, 
    onDeal,

    onAction,
    players = [] 
}) => {
  const maxSpendingPower = players.length > 0 
      ? Math.max(...players.map(p => p.spendingPower || 0)) 
      : bankroll;
  const [timer, setTimer] = useState(30);

  React.useEffect(() => {
    const interval = setInterval(() => {
        setTimer(prev => prev <= 1 ? 30 : prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  
  const [selectedChip, setSelectedChip] = useState(25);

  const getChipColor = (val) => {
      switch(val) {
          case 10: return 'bg-gradient-to-b from-red-500 to-red-800 ring-2 ring-red-400/50 shadow-[0_4px_10px_rgba(220,38,38,0.5)]';
          case 25: return 'bg-gradient-to-b from-green-500 to-green-800 ring-2 ring-green-400/50 shadow-[0_4px_10px_rgba(22,163,74,0.5)]';
          case 100: return 'bg-gradient-to-b from-blue-500 to-blue-800 ring-2 ring-blue-400/50 shadow-[0_4px_10px_rgba(37,99,235,0.5)]';
          case 500: return 'bg-gradient-to-b from-yellow-400 to-yellow-600 ring-2 ring-yellow-200/50 text-black shadow-[0_4px_10px_rgba(250,204,21,0.5)]';
          default: return 'bg-gray-500';
      }
  };

  const handleSpotClick = (index) => {
      if (onAction) onAction('light');
      onBet(selectedChip, 'main', index);
  };
  
  const handleSideBet = (amount, type) => {
      if (onAction) onAction('light');
      onBet(amount, type);
  };

  const selectChip = (val) => {
      if (onAction) onAction('light');
      setSelectedChip(val);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto animate-slide-up origin-bottom">
      
      {/* 3 Betting Spots (Floating above controls) */}
      <div className="absolute -top-48 md:-top-40 left-0 w-full flex justify-center items-center gap-4 md:gap-16 z-50 px-4 pointer-events-none">
          {activeSpots.map((spot, idx) => (
             <div 
                key={`spot-${idx}`}
                className="pointer-events-auto relative group"
                onClick={() => handleSpotClick(idx)}
             >
                <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-dashed transition-all duration-200 flex justify-center items-center relative cursor-pointer shadow-lg
                    ${spot.bet > 0 ? 'border-bj-gold bg-black/40 shadow-[0_0_20px_rgba(255,215,0,0.2)]' : 'border-white/20 hover:border-bj-gold/50 hover:bg-white/10 hover:scale-105 active:scale-95'}
                `}>
                    {/* Spot Hint */}
                    {spot.bet === 0 && (
                        <span className="text-white/10 text-xs font-bold uppercase tracking-widest group-hover:text-white/40 transition-colors">
                            Spot {idx+1}
                        </span>
                    )}

                    {/* Chips Render */}
                    <AnimatePresence>
                        {spot.chips && spot.chips.length > 0 && (
                            <div className="relative w-full h-full flex justify-center items-center">
                                {spot.chips.map((val, chipIdx) => (
                                    <motion.div 
                                      key={`chip-${idx}-${chipIdx}`} 
                                      initial={{ opacity: 0, y: 100, scale: 0.5, rotate: Math.random() * 180 }} 
                                      animate={{ opacity: 1, y: -chipIdx * 4, scale: 1, rotate: 0 }} 
                                      exit={{ opacity: 0, scale: 0 }}
                                      className={`absolute w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/20 shadow-xl ${getChipColor(val)}`}
                                    />
                                ))}
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-6 w-max px-2 py-0.5 bg-black/80 rounded full text-bj-gold font-mono font-bold text-sm border border-bj-gold/30 shadow-lg backdrop-blur"
                                >
                                    ${spot.bet}
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
             </div>
          ))}
      </div>

      {/* Main Control Deck */}
      <div className="bg-black/90 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.8)] px-4 py-4 md:px-6 flex flex-col items-center gap-4 md:gap-6 relative overflow-visible mt-24 md:mt-0">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-transparent via-bj-gold to-transparent opacity-50 w-full" />
          <div className="absolute top-0 left-0 h-[3px] bg-bj-gold shadow-[0_0_15px_#ffd700] transition-all duration-1000 ease-linear z-10" style={{ width: `${(timer/30)*100}%` }}></div>

          {/* Controls Row */}
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-8">
              
              {/* Left: Chips Selection */}
              <div className="flex flex-wrap justify-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                  {CHIPS.map(val => (
                    <button 
                      key={val} 
                      className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-full flex justify-center items-center font-black text-sm md:text-base transition-all 
                        ${selectedChip === val ? 'scale-110 ring-4 ring-white/50 -translate-y-2 z-10' : 'hover:scale-105 opacity-80 hover:opacity-100'}
                        disabled:opacity-20 disabled:grayscale 
                        ${getChipColor(val)} ${val === 500 ? 'text-black' : 'text-white'}
                      `}
                      onClick={() => selectChip(val)}
                      disabled={maxSpendingPower < val}
                    >
                      {val}
                    </button>
                  ))}
              </div>
              
              {/* Middle: Side Bets (+10 buttons) */}
              <div className="flex gap-2">
                  <button 
                    className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 flex flex-col items-center" 
                    onClick={() => handleSideBet(10, 'pairs')} 
                    disabled={bankroll < 10}
                  >
                      <span>Pair</span>
                      <span className="text-bj-gold">${sideBets.pairs}</span>
                  </button>
                  <button 
                    className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/30 transition-all disabled:opacity-30 flex flex-col items-center" 
                    onClick={() => handleSideBet(10, 'poker')} 
                    disabled={bankroll < 10}
                  >
                      <span>Poker</span>
                      <span className="text-bj-gold">${sideBets.poker}</span>
                  </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost"
                    className="px-4 py-3 rounded-xl text-gray-400 font-bold text-xs uppercase tracking-wider hover:text-white hover:bg-white/5 disabled:opacity-30 h-auto" 
                    onClick={() => { if (onAction) onAction('medium'); onClear(); }} 
                    disabled={currentBet === 0 && sideBets.pairs === 0}
                  >
                      Clear
                  </Button>
                  <Button
                    variant="outline" 
                    className="px-4 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 h-auto disabled:opacity-30" 
                    onClick={() => { if (onAction) onAction('medium'); onReBet(); }} 
                    onReBet
                  >
                      Re-Bet
                  </Button>
                  
                  {/* DEAL Button */}
                  <Button 
                    variant="gold"
                    size="xl"
                    className="ml-2 shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] min-w-[120px]" 
                    onClick={onDeal} 
                    disabled={currentBet === 0}
                  >
                      Deal
                  </Button>
              </div>

          </div>
      </div>
    </div>
  );
};

export default React.memo(BettingControls);
