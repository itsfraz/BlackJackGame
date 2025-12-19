import React from 'react';

const Controls = ({ 
  gameState, 
  phase,
  features, 
  actions 
}) => {
  if (phase === 'resolving' || phase === 'dealerTurn') return null;

  const btnBase = "px-6 py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all transform active:scale-95 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed border-t-2 border-white/10";
  const btnHit = "bg-gradient-to-br from-green-600 to-green-800 text-white shadow-green-900/50 hover:brightness-110 hover:-translate-y-1";
  const btnStand = "bg-gradient-to-br from-red-600 to-red-800 text-white shadow-red-900/50 hover:brightness-110 hover:-translate-y-1";
  const btnAction = "bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-blue-900/50 hover:brightness-110 hover:-translate-y-1";
  const btnGold = "bg-gradient-to-br from-bj-gold to-yellow-600 text-black shadow-yellow-900/50 border-yellow-300 hover:brightness-110 hover:-translate-y-1";

  return (
    <div className="w-full max-w-4xl mx-auto bg-black/80 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.6)] px-4 py-4 flex flex-col items-center animate-slide-up origin-bottom">
        <div className="flex flex-wrap justify-center gap-4 w-full">
            <button 
                className={`flex-1 min-w-[120px] ${btnBase} ${btnHit}`} 
                onClick={actions.hit} 
                disabled={!features.canHit}
            >
                Hit
            </button>
            
            <button 
                className={`flex-1 min-w-[120px] ${btnBase} ${btnStand}`} 
                onClick={actions.stand} 
                disabled={!features.canStand}
            >
                Stand
            </button>

            {features.canDouble && (
                <button className={`flex-1 min-w-[120px] ${btnBase} ${btnGold}`} onClick={actions.doubleDown}>
                Double
                </button>
            )}

            {features.canSplit && (
                <button className={`flex-1 min-w-[120px] ${btnBase} ${btnAction}`} onClick={actions.split}>
                Split
                </button>
            )}

            {features.canSurrender && (
                <button className={`flex-0 px-4 text-sm bg-transparent border border-white/20 text-white/50 hover:text-white hover:border-white/50`} onClick={actions.surrender}>
                Surrender
                </button>
            )}
        </div>
    </div>
  );
};

export default Controls;
