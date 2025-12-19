import React from 'react';

const HistoryPanel = ({ isOpen, history, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-[70px] right-4 w-72 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl p-4 z-[100] shadow-2xl animate-pop text-white max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
            <h3 className="font-bold text-lg text-bj-gold uppercase tracking-wider">Hand History</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white font-bold p-1">✕</button>
        </div>
        <div className="overflow-y-auto no-scrollbar flex-1">
            <ul className="space-y-2">
                {history.length === 0 ? <li className="text-gray-500 text-center italic py-4">No hands played yet.</li> : 
                 history.slice().reverse().map(h => (
                     <li key={h.id} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                         <span className="text-gray-400 text-xs">{new Date(h.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         <span className={`font-bold uppercase ${h.result.toLowerCase().includes('win') ? 'text-green-400' : h.result.toLowerCase().includes('push') ? 'text-yellow-400' : 'text-red-400'}`}>{h.result}</span>
                         <span className={`font-mono ${h.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{h.amount > 0 ? `+$${h.amount}` : `-$${Math.abs(h.amount)}`}</span>
                     </li>
                 ))
                }
            </ul>
        </div>
    </div>
  );
};

export default HistoryPanel;
