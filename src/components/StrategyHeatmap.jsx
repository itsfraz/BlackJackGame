import React from 'react';

const DEALER_UPCARDS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // 11 is Ace
const DEALER_LABELS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

const HARD_TOTALS = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
const SOFT_TOTALS = [20, 19, 18, 17, 16, 15, 14, 13]; // Soft 13 (A2) to Soft 20 (A9)
const PAIRS = ['A', 10, 9, 8, 7, 6, 5, 4, 3, 2];

const Cell = ({ stat }) => {
    let color = 'bg-gray-800/50';
    let text = '-';
    
    if (stat && stat.total > 0) {
        const rate = stat.correct / stat.total;
        text = `${Math.round(rate * 100)}%`;
        if (rate >= 0.9) color = 'bg-green-600/80 text-white';
        else if (rate >= 0.7) color = 'bg-yellow-600/80 text-white';
        else color = 'bg-red-600/80 text-white';
    }

    return (
        <div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[10px] md:text-xs font-bold rounded ${color} border border-white/5`}>
            {text}
        </div>
    );
};

const StrategyHeatmap = ({ stats }) => {
  
  const getStat = (type, pVal, dVal) => {
      // Key format from engine: 'type-PVal-DVal'
      // Note: dVal for Ace in engine logic needs to be verified. 
      // If card value function returns 11 for Ace, then we use 11.
      const key = `${type}-${pVal}-${dVal}`;
      return stats[key];
  };

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto max-h-[70vh]">
        
        {/* Header Row for Dealer Up cards */}
        <div className="grid grid-cols-[60px_repeat(10,1fr)] gap-1 mb-2 sticky top-0 bg-black/90 p-2 z-10 border-b border-white/10">
            <div className="text-xs font-bold text-white/50 flex items-end pb-1">You \ Dlr</div>
            {DEALER_LABELS.map((label, i) => (
                <div key={label} className="text-center font-bold text-bj-gold text-sm md:text-base">{label}</div>
            ))}
        </div>

        {/* Section: Hard Totals */}
        <div className="space-y-1">
            <h3 className="text-white/80 font-bold uppercase text-xs tracking-wider mb-2">Hard Totals</h3>
            {HARD_TOTALS.map(total => (
                <div key={`hard-${total}`} className="grid grid-cols-[60px_repeat(10,1fr)] gap-1 items-center">
                    <div className="text-right pr-3 font-mono font-bold text-gray-400 text-sm">{total}</div>
                    {DEALER_UPCARDS.map(dVal => (
                        <Cell key={`H-${total}-${dVal}`} stat={getStat('H', total, dVal)} />
                    ))}
                </div>
            ))}
        </div>

        {/* Section: Soft Totals */}
        <div className="space-y-1">
            <h3 className="text-white/80 font-bold uppercase text-xs tracking-wider mb-2 mt-4">Soft Totals</h3>
            {SOFT_TOTALS.map(total => (
                <div key={`soft-${total}`} className="grid grid-cols-[60px_repeat(10,1fr)] gap-1 items-center">
                    <div className="text-right pr-3 font-mono font-bold text-gray-400 text-sm">A,{total - 11}</div>
                    {DEALER_UPCARDS.map(dVal => (
                        <Cell key={`S-${total}-${dVal}`} stat={getStat('S', total, dVal)} />
                    ))}
                </div>
            ))}
        </div>

        {/* Section: Pairs */}
        <div className="space-y-1">
            <h3 className="text-white/80 font-bold uppercase text-xs tracking-wider mb-2 mt-4">Pairs</h3>
            {PAIRS.map(rank => (
                <div key={`pair-${rank}`} className="grid grid-cols-[60px_repeat(10,1fr)] gap-1 items-center">
                    <div className="text-right pr-3 font-mono font-bold text-gray-400 text-sm">
                        {typeof rank === 'number' ? `${rank},${rank}` : `${rank},${rank}`}
                    </div>
                    {DEALER_UPCARDS.map(dVal => (
                        <Cell key={`P-${rank}-${dVal}`} stat={getStat('P', rank, dVal)} />
                    ))}
                </div>
            ))}
        </div>

        <div className="text-center text-xs text-white/30 mt-8">
            Green: {'>'}90% Correct • Yellow: 70-90% • Red: {'<'}70%
        </div>
    </div>
  );
};

export default StrategyHeatmap;
