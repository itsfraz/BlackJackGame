import React from 'react';
import { motion } from 'framer-motion';
import Hand from './Hand';
import { calculateScore, isSoftHand } from '../utils/deck';

// Helper to format score
const getHandScore = (cards) => {
  if (!cards || cards.length === 0) return 0;
  const score = calculateScore(cards);
  const soft = isSoftHand(cards);
  if (soft && score <= 21) {
     return `${score - 10}/${score}`;
  }
  return score;
};

const GameArea = ({ 
    phase, 
    dealerHand, 
    playerHands, 
    currentHandIndex, 
    message, 
    t, 
    cardBack 
}) => {

  // Camera Variants
  const cameraVariants = {
    betting: { scale: 1, y: 0, opacity: 1 },
    dealing: { scale: 1.02, y: 0 },
    playerTurn: { 
        scale: 1.05, 
        y: window.innerWidth > 768 ? '5%' : '-5%', 
        transition: { duration: 0.8, ease: "easeInOut" }
    },
    dealerTurn: { 
        scale: 1.05, 
        y: window.innerWidth > 768 ? '-5%' : '5%', 
        transition: { duration: 0.8, ease: "easeInOut" }
    },
    resolving: { scale: 1, y: 0 }
  };

  // Dealer Score logic
  const dealerScoreDisplay = () => {
     if (dealerHand.length === 0) return 0;
     if (phase === 'betting') return 0;
     
     if (phase === 'playing' || phase === 'dealing' || phase === 'playerTurn') {
         const visible = [dealerHand[0]];
         return getHandScore(visible);
     }
     
     return getHandScore(dealerHand);
  };

  return (
      <motion.main 
        className="flex-1 flex flex-col w-full h-full relative"
        animate={phase}
        variants={cameraVariants}
        initial="betting"
      >
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center w-full px-2 md:px-4 relative perspective-1000 gap-4 md:gap-0 pb-24 md:pb-0">
            
            {/* Dealer Section */}
            <div className="flex-1 w-full md:w-auto flex justify-center border-b md:border-b-0 md:border-r border-white/5 h-[40%] md:h-full items-center py-4 md:py-0">
              <Hand 
                title={t('dealer')}
                cards={dealerHand} 
                score={dealerScoreDisplay()} 
                hideSecondCard={phase === 'playing' || phase === 'playerTurn' || phase === 'dealing'}
                isActive={phase === 'dealerTurn'}
                result={null} 
                cardBack={cardBack}
              />
            </div>

            {/* Global Message */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center w-full">
               {message && (
                 <div className="inline-block px-8 py-2 rounded-lg bg-black/80 backdrop-blur-md text-xl md:text-4xl font-bold text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pop border border-white/20 whitespace-nowrap">
                   {message}
                 </div>
               )}
            </div>

            {/* Player Section */}
            <div className="flex-1 w-full md:w-auto flex justify-center md:items-center items-start gap-4 md:gap-8 h-[60%] md:h-full overflow-x-auto no-scrollbar pt-4 md:pt-0">
              {playerHands.length > 0 ? (
                 playerHands.map((hand, idx) => (
                    <Hand 
                        key={hand.id}
                        title={`${t('hand')} ${playerHands.length > 1 ? idx + 1 : ''}`} 
                        cards={hand.cards} 
                        score={getHandScore(hand.cards)} 
                        isActive={phase === 'playerTurn' && idx === currentHandIndex}
                        result={hand.result} 
                        bet={hand.bet}
                        chips={hand.chips}
                        cardBack={cardBack}
                    />
                 ))
              ) : (
                 <div className="flex gap-4 opacity-30 scale-75 md:scale-100 origin-top">
                     <div className="w-[100px] h-[140px] border-2 border-dashed border-white rounded-xl"></div>
                     <div className="w-[100px] h-[140px] border-2 border-dashed border-white rounded-xl"></div>
                 </div>
              )}
            </div>
        </div>
      </motion.main>
  );
};

export default React.memo(GameArea);
