import React, { useState, useEffect } from 'react';
import Controls from './components/Controls';
import BettingControls from './components/BettingControls';
import TrainingModal from './components/TrainingModal';
import SettingsModal from './components/SettingsModal';
import InsuranceModal from './components/InsuranceModal';
import DailyBonusModal from './components/DailyBonusModal';
import HistoryPanel from './components/HistoryPanel';
import ProfileModal from './components/ProfileModal';
import Confetti from './components/Confetti';
import Header from './components/Header';
import GameArea from './components/GameArea';
import { IntelligencePanel, StrategyFeedback } from './components/Intelligence';
import { useGameEngine } from './hooks/useGameEngine';
import { usePlayerProfile } from './hooks/usePlayerProfile';
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
    bankroll, currentBet, sideBets, phase, playerHands, dealerHand, 
    currentHandIndex, message, insurance, settings, dailyBonus, history, jackpot, 
    winStreak
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

  return (
    <div className={`flex flex-col min-h-screen w-full bg-felt overflow-hidden relative text-white font-sans select-none transition-all duration-700`}>
      
      {/* Visual Effects */}
      <Confetti active={activeWin} />
      
      <Header 
        jackpot={jackpot}
        t={t}
        muted={muted}
        toggleMute={toggleMute}
        onOpenProfile={() => setShowProfile(true)}
        profile={profileHook.profile}
        bankroll={bankroll}
        winStreak={winStreak}
        onOpenTraining={() => actions.setTrainingOpen(true)}
        onToggleHistory={actions.toggleHistory}
        onToggleSettings={actions.toggleSettings}
      />
      
      <GameArea 
        phase={phase}
        dealerHand={dealerHand}
        playerHands={playerHands}
        currentHandIndex={currentHandIndex}
        message={message}
        t={t}
        cardBack={themeHook.preferences.cardBack}
      />

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
      
      {/* Modals & Panels */}
      <ProfileModal 
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        {...profileHook}
      />

      <TrainingModal 
         isOpen={gameState.training.open}
         onClose={() => actions.setTrainingOpen(false)}
         actions={actions}
         trainingState={gameState.training}
      />

      <SettingsModal 
         isOpen={settings.open}
         rules={settings.rules}
         onUpdateRules={actions.updateRules}
         onClose={actions.toggleSettings}
         themeHook={themeHook}
         playerCount={gameState.playerCount}
         setPlayerCount={actions.setPlayerCount}
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
