import React from 'react';

const CHIPS = [10, 25, 100, 500];

const BettingControls = ({ 
    bankroll, 
    currentBet, 
    sideBets, 
    onBet, 
    onClear, 
    onReBet, 
    onDeal,
    chipStack,
    timer 
}) => {

  const getChipColor = (val) => {
      switch(val) {
          case 10: return 'bg-gradient-to-b from-red-500 to-red-800 ring-2 ring-red-400/50 shadow-[0_4px_10px_rgba(220,38,38,0.5)]';
          case 25: return 'bg-gradient-to-b from-green-500 to-green-800 ring-2 ring-green-400/50 shadow-[0_4px_10px_rgba(22,163,74,0.5)]';
          case 100: return 'bg-gradient-to-b from-blue-500 to-blue-800 ring-2 ring-blue-400/50 shadow-[0_4px_10px_rgba(37,99,235,0.5)]';
          case 500: return 'bg-gradient-to-b from-yellow-400 to-yellow-600 ring-2 ring-yellow-200/50 text-black shadow-[0_4px_10px_rgba(250,204,21,0.5)]';
          default: return 'bg-gray-500';
      }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto animate-slide-up origin-bottom">
      
      {/* Bet Spot Visual (Floating above) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 pointer-events-none z-0">
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 flex justify-center items-center relative group">
              {chipStack && chipStack.length > 0 ? (
                  <div className="relative w-full h-full flex justify-center items-center">
                      {chipStack.map((val, idx) => (
                          <div 
                            key={idx} 
                            className={`absolute w-16 h-16 rounded-full border-2 border-white/20 shadow-xl ${getChipColor(val)} transition-all duration-300`}
                            style={{ transform: `translateY(-${idx * 4}px)` }}
                          ></div>
                      ))}
                      <div className="absolute -top-8 w-max px-3 py-1 bg-black/80 rounded-full text-bj-gold font-mono font-bold text-lg border border-bj-gold/30 shadow-[0_0_10px_rgba(255,215,0,0.3)] backdrop-blur-sm">
                          ${currentBet}
                      </div>
                  </div>
              ) : (
                  <span className="text-white/20 text-xs font-bold uppercase tracking-widest animate-pulse">Place Bet</span>
              )}
          </div>
      </div>

      {/* Main Control Deck */}
      <div className="bg-black/80 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          
          {/* Progress Bar Line */}
          <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-bj-gold to-transparent opacity-50 w-full transition-all duration-100 ease-linear" />
          <div className="absolute top-0 left-0 h-[2px] bg-bj-gold shadow-[0_0_10px_#ffd700] transition-all duration-1000 ease-linear z-10" style={{ width: `${(timer/30)*100}%` }}></div>

          {/* Left: Side Bets & Chips */}
          <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Chips */}
              <div className="flex gap-4 p-2 bg-white/5 rounded-full border border-white/5 shadow-inner">
                  {CHIPS.map(val => (
                    <button 
                      key={val} 
                      className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex justify-center items-center font-black text-sm md:text-base transition-all hover:scale-110 hover:-translate-y-1 active:scale-95 disabled:opacity-20 disabled:grayscale ${getChipColor(val)} ${val === 500 ? 'text-black' : 'text-white'}`}
                      onClick={() => onBet(val, 'main')}
                      disabled={bankroll < val}
                    >
                      {val}
                    </button>
                  ))}
              </div>
              
              {/* Side Bets */}
              <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/60 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/30 transition-all disabled:opacity-30" 
                    onClick={() => onBet(10, 'pairs')} 
                    disabled={bankroll < 10}
                  >
                      Pair <span className="text-bj-gold">${sideBets.pairs}</span>
                  </button>
                  <button 
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/60 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/30 transition-all disabled:opacity-30" 
                    onClick={() => onBet(10, 'poker')} 
                    disabled={bankroll < 10}
                  >
                      Poker <span className="text-bj-gold">${sideBets.poker}</span>
                  </button>
              </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center">
              <button 
                className="px-6 py-3 rounded-xl text-gray-400 font-bold text-sm uppercase tracking-wider hover:text-white hover:bg-white/5 transition-all active:scale-95 border border-transparent hover:border-white/10 disabled:opacity-30" 
                onClick={onClear} 
                disabled={currentBet === 0 && sideBets.pairs === 0}
              >
                  Clear
              </button>
              <button 
                className="px-6 py-3 rounded-xl text-white font-bold text-sm uppercase tracking-wider border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all active:scale-95 shadow-lg disabled:opacity-30" 
                onClick={onReBet}
              >
                  Re-Bet
              </button>
              
              {/* DEAL Button - Dominant */}
              <button 
                className="ml-4 px-10 py-3 rounded-xl bg-gradient-to-br from-bj-gold via-yellow-500 to-yellow-600 text-black font-black text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.4)] border-t border-yellow-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.6)] hover:-translate-y-1 hover:brightness-110 active:scale-95 active:brightness-90 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none" 
                onClick={onDeal} 
                disabled={currentBet === 0}
              >
                  Deal
              </button>
          </div>

      </div>
    </div>
  );
};

export default BettingControls;
