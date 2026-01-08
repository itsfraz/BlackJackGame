import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hand from './components/Hand';
import Controls from './components/Controls';
import BettingControls from './components/BettingControls';
import SettingsModal from './components/SettingsModal';
import InsuranceModal from './components/InsuranceModal';
import DailyBonusModal from './components/DailyBonusModal';
import HistoryPanel from './components/HistoryPanel';
import ProfileModal from './components/ProfileModal';
import Confetti from './components/Confetti';
import { IntelligencePanel, StrategyFeedback } from './components/Intelligence';
import { useGameEngine } from './hooks/useGameEngine';
import { usePlayerProfile } from './hooks/usePlayerProfile';
import { calculateScore, isSoftHand } from './utils/deck';
import { useTheme } from './hooks/useTheme';
import { useHaptics } from './hooks/useHaptics';
import { useAudio, SOUNDS } from './hooks/useAudio';

function App() {
  const [showProfile, setShowProfile] = useState(false);
  const profileHook = usePlayerProfile();
  const themeHook = useTheme();
  const { triggerHaptic } = useHaptics();
  const { playSound, muted, toggleMute } = useAudio();
  
  // Pass the result processor to the engine
  const { gameState, actions } = useGameEngine(profileHook.processGameResult);
  
  const { 
    bankroll, currentBet, chipStack, sideBets, phase, playerHands, dealerHand, 
    currentHandIndex, message, insurance, settings, dailyBonus, history, jackpot, 
    winStreak, timer 
  } = gameState;

  // Use translation helper
  const { t } = themeHook;

  // Audio & Haptic Feedback for critical game states
  useEffect(() => {
    if (phase === 'resolving') {
        const anyWin = playerHands.some(h => ['win', 'blackjack', 'Gagné', 'Ganaste'].includes(h.result));
        const anyLoss = playerHands.some(h => ['loss', 'bust', 'Perdu', 'Perdiste'].includes(h.result));
        
        if (anyWin) {
            triggerHaptic('success');
            playSound(SOUNDS.WIN);
        } else if (anyLoss) {
            triggerHaptic('error');
            playSound(SOUNDS.BUST);
        }
    }
  }, [phase, playerHands, triggerHaptic, playSound]);

  // Play shuffle sound on new game/deal if deck is reshuffled (simplified to deal for now)
  useEffect(() => {
    if (phase === 'dealing') {
        playSound(SOUNDS.SHUFFLE);
        setTimeout(() => playSound(SOUNDS.DEAL), 500);
    }
  }, [phase, playSound]);

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
  
  const currentHand = playerHands[currentHandIndex];
  const canAct = phase === 'playerTurn' && currentHand && currentHand.status === 'playing';
  
  const features = {
     canHit: canAct,
     canStand: canAct,
     canDouble: canAct && bankroll >= currentHand.bet && currentHand.cards.length === 2,
     canSplit: canAct && bankroll >= currentHand.bet && currentHand.cards.length === 2 && currentHand.cards[0].value === currentHand.cards[1].value, 
     canSurrender: canAct && currentHand.cards.length === 2 && settings.rules.surrenderAllowed
  };

  // Check for win for confetti
  const activeWin = winStreak > 0 || jackpot > 0 || (playerHands.some(h => h.result === 'blackjack') && phase === 'resolving');

  // Handle Accessibility
  useEffect(() => {
    if (settings.rules.accessibility) {
        document.body.classList.add('high-contrast');
    } else {
        document.body.classList.remove('high-contrast');
    }
  }, [settings.rules.accessibility]);

  // Camera Variants
  const cameraVariants = {
    betting: { scale: 1, y: 0, opacity: 1 },
    dealing: { scale: 1.02, y: 0 },
    playerTurn: { 
        scale: 1.05, 
        y: window.innerWidth > 768 ? '5%' : '-5%', // Shift attention to player area
        transition: { duration: 0.8, ease: "easeInOut" }
    },
    dealerTurn: { 
        scale: 1.05, 
        y: window.innerWidth > 768 ? '-5%' : '5%', // Shift attention to dealer area
        transition: { duration: 0.8, ease: "easeInOut" }
    },
    resolving: { scale: 1, y: 0 }
  };

  return (
    <div className={`flex flex-col min-h-screen w-full bg-felt overflow-hidden relative text-white font-sans select-none transition-all duration-700`}>
      
      {/* Visual Effects */}
      <Confetti active={activeWin} />
      
      {/* Header */}
      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
           <div className="bg-black text-bj-gold border border-bj-gold px-3 py-1 rounded shadow-[0_0_15px_rgba(255,215,0,0.6)] font-mono font-bold text-lg animate-glow">
              JP: ${jackpot.toFixed(2)}
           </div>
        </div>
        
        <h1 className="pointer-events-auto text-3xl md:text-4xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-md hidden md:block">
            {t('title')}
        </h1>
        
        <div className="pointer-events-auto flex items-center gap-4">
           
           <button 
             onClick={toggleMute}
             className="w-10 h-10 flex justify-center items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all text-xl"
             title={muted ? "Unmute" : "Mute"}
           >
             {muted ? '🔇' : '🔊'}
           </button>

           {/* Profile Button */}
           <button 
             onClick={() => setShowProfile(true)}
             className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 hover:bg-white/10 transition-all group"
           >
               <div className="w-8 h-8 rounded-full bg-bj-gold text-black flex items-center justify-center text-lg shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                   {profileHook.profile.avatar}
               </div>
               <div className="flex flex-col items-start leading-none gap-1">
                   <span className="text-xs font-bold text-bj-gold uppercase">Lvl {profileHook.profile.level}</span>
                   <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-bj-gold" style={{ width: `${(profileHook.profile.xp / profileHook.profile.nextLevelXp) * 100}%` }}></div>
                   </div>
               </div>
           </button>

           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-bj-gold/30 text-bj-gold font-extrabold text-xl shadow-[0_0_10px_rgba(255,215,0,0.5)]">
               ${bankroll} 
               {winStreak > 1 && <span className="text-sm text-orange-400 animate-pulse">🔥{winStreak}</span>}
           </div>
           
           <button 
             onClick={actions.toggleHistory} 
             className="w-10 h-10 flex justify-center items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg text-2xl"
             title={t('history')}
           >
             📜
           </button>
           <button 
             onClick={actions.toggleSettings} 
             className="w-10 h-10 flex justify-center items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg text-2xl"
             title={t('settings')}
           >
             ⚙️
           </button>
        </div>
      </header>
      
      {/* Main Game Table Container with Dynamic Camera */}
      <motion.main 
        className="flex-1 flex flex-col w-full h-full relative"
        animate={phase}
        variants={cameraVariants}
        initial="betting"
      >
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center w-full px-2 md:px-4 relative perspective-1000 gap-4 md:gap-0 pb-24 md:pb-0">
            
            {/* Dealer Section (Top on mobile, Left on desktop) */}
            <div className="flex-1 w-full md:w-auto flex justify-center border-b md:border-b-0 md:border-r border-white/5 h-[40%] md:h-full items-center py-4 md:py-0">
              <Hand 
                title={t('dealer')}
                cards={dealerHand} 
                score={dealerScoreDisplay()} 
                hideSecondCard={phase === 'playing' || phase === 'playerTurn' || phase === 'dealing'}
                isActive={phase === 'dealerTurn'}
                result={null} 
                cardBack={themeHook.preferences.cardBack}
              />
            </div>

            {/* Global Message (Center overlay) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center w-full">
               {message && (
                 <div className="inline-block px-8 py-2 rounded-lg bg-black/80 backdrop-blur-md text-xl md:text-4xl font-bold text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pop border border-white/20 whitespace-nowrap">
                   {message}
                 </div>
               )}
            </div>

            {/* Player Section (Bottom on mobile, Right on desktop) */}
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
                        cardBack={themeHook.preferences.cardBack}
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

        {/* Fixed Bottom Controls Footer */}
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 flex justify-center items-end pointer-events-none bg-gradient-to-t from-black/90 to-transparent pb-6">
             <div className="pointer-events-auto w-full flex justify-center perspective-1000">
                 {phase === 'betting' || phase === 'resolving' ? (
                     <BettingControls 
                        bankroll={bankroll}
                        currentBet={currentBet}
                        activeSpots={gameState.activeSpots}
                        sideBets={sideBets}
                        onBet={actions.placeBet}
                        onClear={actions.clearBets}
                        onReBet={actions.reBet}
                        onDeal={() => {
                            triggerHaptic('heavy');
                            if (phase === 'resolving') actions.resetGame();
                            actions.dealGame();
                        }}
                        timer={phase === 'betting' ? timer : 0}
                        onAction={(type) => {
                            triggerHaptic(type);
                            if (type === 'light') playSound(SOUNDS.CHIP_PLACE);
                        }}
                     />
                 ) : (
                     <Controls 
                        gameState={gameState}
                        phase={phase}
                        features={features} 
                        actions={actions}
                        onAction={(type) => {
                            triggerHaptic(type);
                            playSound(SOUNDS.CLICK);
                        }}
                     />
                 )}
             </div>
        </div>
      </motion.main>
      
      {/* Modals & Panels */}
      <ProfileModal 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        {...profileHook}
      />

      <SettingsModal 
         isOpen={settings.open}
         rules={settings.rules}
         onUpdateRules={actions.updateRules}
         onClose={actions.toggleSettings}
         themeHook={themeHook}
      />
      
      <InsuranceModal 
         isOpen={insurance.show}
         bet={currentBet}
         onResolve={actions.resolveInsurance}
      />
      
      <DailyBonusModal 
         isOpen={dailyBonus.show} 
         onClaim={dailyBonus.claim} 
      />
      
      <HistoryPanel 
         isOpen={history.open}
         history={history.list}
         onClose={actions.toggleHistory}
      />

      <IntelligencePanel 
           data={gameState.intelligence}
           onToggleMode={actions.toggleLearningMode}
      />
      
      <StrategyFeedback feedback={gameState.intelligence.mistake} />
      
      {/* Achievement Toasts */}
      <div className="fixed bottom-32 right-4 flex flex-col gap-2 pointer-events-none z-[100]">
         {profileHook.newUnlocks.map((ach, idx) => (
             <div 
                key={`${ach.id}-${idx}`}
                className="bg-gradient-to-r from-gray-900 to-black border-l-4 border-bj-gold p-4 rounded shadow-2xl animate-slide-left flex items-center gap-3"
                onAnimationEnd={profileHook.clearUnlocks} 
             >
                 <div className="text-3xl">{ach.icon}</div>
                 <div>
                     <h4 className="text-bj-gold font-bold uppercase text-xs">Achievement Unlocked!</h4>
                     <p className="font-bold text-white">{ach.name}</p>
                 </div>
             </div>
         ))}
      </div>

    </div>
  );
}

export default App;
