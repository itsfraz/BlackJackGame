import React from 'react';

const DailyBonusModal = ({ isOpen, onClaim }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-bj-gold p-8 rounded-2xl max-w-sm w-full text-center shadow-[0_0_50px_rgba(255,215,0,0.3)] animate-pop">
        <h2 className="text-2xl font-bold text-white mb-4 uppercase tracking-widest drop-shadow-md">🎉 Daily Rewards! 🎉</h2>
        <div className="text-6xl mb-4 animate-bounce">💎</div>
        <p className="text-gray-300 mb-6">Welcome back! Here are your free chips.</p>
        <div className="text-5xl font-black text-bj-gold mb-8 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">+$500</div>
        
        <button 
            className="w-full py-4 rounded-full bg-gradient-to-r from-bj-gold to-yellow-600 text-black font-extrabold text-xl uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] hover:-translate-y-1 transition-all active:scale-95 animate-pulse-slow" 
            onClick={onClaim}
        >
            Claim Reward
        </button>
      </div>
    </div>
  );
};

export default DailyBonusModal;
