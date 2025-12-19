import React from 'react';

const InsuranceModal = ({ isOpen, bet, onResolve }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/20 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-pop">
        <h2 className="text-2xl font-bold text-white mb-2 uppercase">Insurance?</h2>
        <p className="text-gray-300 mb-2">Dealer shows an Ace. Protect your bet?</p>
        <p className="text-bj-gold font-bold text-xl mb-6">Cost: ${Math.floor(bet / 2)}</p>
        
        <div className="flex gap-4 justify-center">
            <button 
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all active:scale-95 shadow-lg" 
                onClick={() => onResolve(true)}
            >
                Yes (Buy)
            </button>
            <button 
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all active:scale-95 shadow-lg" 
                onClick={() => onResolve(false)}
            >
                No
            </button>
        </div>
      </div>
    </div>
  );
};

export default InsuranceModal;
