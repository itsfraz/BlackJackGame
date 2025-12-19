import React from 'react';
import Card from './Card';

const Hand = ({ title, cards, score, hideSecondCard = false, isActive = true, result = null, bet = 0, cardBack = 'classic' }) => {
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
        {cards.map((card, index) => (
          <div key={`${card.rank}-${card.suit}-${index}`} style={{ transform: `translateX(${index * 30}px) translateY(${index * -2}px)`, zIndex: index, position: 'absolute', top: 0 }}>
             <Card 
                suit={card.suit} 
                rank={card.rank} 
                index={index}
                hidden={hideSecondCard && index === 1}
                cardBack={cardBack}
             />
          </div>
        ))}

        {/* This creates the width for the relative container based on number of cards roughly, or we use absolute stacking which is fine for blackjack */}
        <div style={{ width: `${cards.length * 30 + 100}px` }} className="h-1 w-1 opacity-0 pointer-events-none"></div>

        {/* Result Overlay */}
        {result && (
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded border-2 font-black text-xl md:text-2xl uppercase tracking-widest shadow-xl backdrop-blur-sm animate-pop z-50
                ${(result === 'win' || result === 'blackjack' || result === 'Gagné' || result === 'Ganaste') ? 'bg-green-900/90 border-green-400 text-green-400' : 
                  (result === 'loss' || result === 'Perdu' || result === 'Perdiste') ? 'bg-red-900/90 border-red-500 text-red-500' : 
                  'bg-yellow-900/90 border-yellow-400 text-yellow-400'}
            `}>
                {result}
            </div>
        )}
      </div>
    </div>
  );
};

export default Hand;

