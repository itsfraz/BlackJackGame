import React from 'react';

const Header = ({ 
    jackpot, 
    t, 
    muted, 
    toggleMute, 
    onOpenProfile, 
    profile, 
    bankroll, 
    winStreak, 
    onOpenTraining, 
    onToggleHistory, 
    onToggleSettings 
}) => {
  return (
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
             onClick={onOpenProfile}
             className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/20 hover:bg-white/10 transition-all group"
           >
               <div className="w-8 h-8 rounded-full bg-bj-gold text-black flex items-center justify-center text-lg shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                   {profile.avatar}
               </div>
               <div className="flex flex-col items-start leading-none gap-1">
                   <span className="text-xs font-bold text-bj-gold uppercase">Lvl {profile.level}</span>
                   <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full bg-bj-gold" style={{ width: `${(profile.xp / profile.nextLevelXp) * 100}%` }}></div>
                   </div>
               </div>
           </button>

           <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 border border-bj-gold/30 text-bj-gold font-extrabold text-xl shadow-[0_0_10px_rgba(255,215,0,0.5)]">
               ${bankroll} 
               {winStreak > 1 && <span className="text-sm text-orange-400 animate-pulse">🔥{winStreak}</span>}
           </div>
           
           <button 
             onClick={onOpenTraining} 
             className="w-10 h-10 flex justify-center items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg text-2xl"
             title={t('training')}
           >
             🎓
           </button>
           <button 
             onClick={onToggleHistory} 
             className="w-10 h-10 flex justify-center items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg text-2xl"
             title={t('history')}
           >
             📜
           </button>
           <button 
             onClick={onToggleSettings} 
             className="w-10 h-10 flex justify-center items-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 hover:-translate-y-0.5 transition-all shadow-lg text-2xl"
             title={t('settings')}
           >
             ⚙️
           </button>
        </div>
    </header>
  );
};

export default React.memo(Header);
