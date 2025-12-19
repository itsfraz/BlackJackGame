import React from 'react';

const Card = ({ suit, rank, hidden = false, index = 0, cardBack = 'classic' }) => {
  const isRed = suit === '♥' || suit === '♦';

  const getBackStyle = () => {
      const CARD_BACKS = {
        classic: 'radial-gradient(circle, transparent 20%, #000 20%, #000 80%, transparent 80%, transparent)', 
        modern: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
        lines: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.5) 10px, rgba(0,0,0,0.5) 20px)',
        solid: 'none' 
      };
      
      return {
          backgroundImage: CARD_BACKS[cardBack] || CARD_BACKS.classic,
          backgroundSize: cardBack === 'classic' || cardBack === 'modern' ? '10px 10px' : 'auto',
          backgroundColor: '#b71c1c'
      };
  };

  return (
    <div 
      className="w-[100px] h-[140px] perspective-1000 animate-deal"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div 
        className={`relative w-full h-full text-center transition-transform duration-500 preserve-3d shadow-2xl rounded-xl ${hidden ? 'rotate-y-180' : ''}`}
      >
        {/* Front Face */}
        <div className={`absolute w-full h-full backface-hidden bg-white rounded-xl flex flex-col justify-between p-2 select-none border border-gray-300 ${isRed ? 'text-red-600' : 'text-black'} overflow-hidden`}>
          {/* Glare Effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/40 to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="text-left flex flex-col leading-none relative z-10">
            <span className="text-xl font-bold font-serif">{rank}</span>
            <span className="text-xl">{suit}</span>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl opacity-20 z-0">
            {suit}
          </div>
          <div className="text-right flex flex-col leading-none rotate-180 relative z-10">
            <span className="text-xl font-bold font-serif">{rank}</span>
            <span className="text-xl">{suit}</span>
          </div>
        </div>

        {/* Back Face */}
        <div 
            className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl border-2 border-white overflow-hidden shadow-inner"
            style={getBackStyle()}
        >
             <div className="w-full h-full opacity-50 bg-gradient-to-b from-transparent to-black/30"></div>
        </div>
      </div>
    </div>
  );
};

export default Card;
