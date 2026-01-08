import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Card from './Card';

const Hand = ({ title, cards, score, hideSecondCard = false, isActive = true, result = null, bet = 0, chips = [], cardBack = 'classic' }) => {
  return (
    <div className={`relative flex flex-col items-center p-4 rounded-xl transition-all duration-500 transform ${isActive ? 'scale-105 opacity-100 z-20' : 'scale-95 opacity-60 z-10'}`}>
      
      {/* Hand Spotlight */}
      <div className={`absolute inset-0 bg-white/5 rounded-xl blur-xl transition-opacity duration-500 pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className={`absolute -inset-4 bg-bj-gold/10 rounded-full blur-2xl transition-opacity duration-500 pointer-events-none ${isActive ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
      
      <div className="flex justify-between items-center w-full mb-4 px-2">
        <h2 className="text-white/80 font-bold uppercase tracking-wider text-sm md:text-base">
            {title} {bet > 0 && <span className="text-bj-gold ml-1">(${bet})</span>}
        </h2>
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center font-mono font-bold text-white shadow-inner">
          {hideSecondCard ? '?' : score}
        </div>
      </div>
      
      <div className="flex justify-center items-center relative h-[140px] min-w-[120px]">
        <AnimatePresence>
            {cards.map((card, index) => (
              <motion.div 
                key={`${card.rank}-${card.suit}-${index}`} // Unique key for animation
                initial={{ 
                    opacity: 0, 
                    y: -300, 
                    x: -200, 
                    rotateY: 180, 
                    scale: 0.5 
                }}
                animate={{ 
                    opacity: 1, 
                    y: index * -2, 
                    x: index * 30, 
                    rotateY: 0, 
                    scale: 1,
                    zIndex: index 
                }}
                exit={{ 
                    opacity: 0, 
                    y: -100, 
                    scale: 0.8,
                    transition: { duration: 0.2 }
                }}
                transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 20,
                    delay: index * 0.1 // Stagger effect
                }}
                style={{ position: 'absolute', top: 0 }}
              >
                 <Card 
                    suit={card.suit} 
                    rank={card.rank} 
                    index={index}
                    hidden={hideSecondCard && index === 1}
                    cardBack={cardBack}
                 />
              </motion.div>
            ))}
        </AnimatePresence>

        {/* This creates the width for the relative container based on number of cards roughly, or we use absolute stacking which is fine for blackjack */}
        <div style={{ width: `${cards.length * 30 + 100}px` }} className="h-1 w-1 opacity-0 pointer-events-none"></div>

        {/* Result Overlay */}
        <AnimatePresence>
            {result && (
                <motion.div 
                    initial={{ scale: 0, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded border-2 font-black text-xl md:text-2xl uppercase tracking-widest shadow-xl backdrop-blur-sm z-50
                        ${(result === 'win' || result === 'blackjack' || result === 'Gagné' || result === 'Ganaste') ? 'bg-green-900/90 border-green-400 text-green-400' : 
                          (result === 'loss' || result === 'Perdu' || result === 'Perdiste') ? 'bg-red-900/90 border-red-500 text-red-500' : 
                          'bg-yellow-900/90 border-yellow-400 text-yellow-400'}
                    `}
                >
                    {result}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      {/* Chips Stack */}
      {chips && chips.length > 0 && (
          <div className="absolute -bottom-6 flex flex-col-reverse items-center justify-center pointer-events-none z-30">
             {chips.map((val, i) => (
                 <div 
                    key={`chip-${i}`} 
                    className={`w-10 h-10 rounded-full border border-white/30 shadow-[0_2px_5px_rgba(0,0,0,0.5)] -mt-8 ${
                        val === 10 ? 'bg-red-600 ring-1 ring-red-400' :
                        val === 25 ? 'bg-green-600 ring-1 ring-green-400' :
                        val === 100 ? 'bg-blue-600 ring-1 ring-blue-400' :
                        'bg-yellow-500 ring-1 ring-yellow-300 text-black'
                    } flex items-center justify-center text-[10px] font-bold`}
                 >
                    {val}
                 </div>
             ))}
          </div>
      )}

    </div>
  );
};

export default React.memo(Hand);

