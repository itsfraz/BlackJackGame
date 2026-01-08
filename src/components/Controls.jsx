import React from 'react';
import { Button } from './ui/button';

const Controls = ({ 
  gameState, 
  phase,
  features, 
  actions,
  onAction 
}) => {
  if (phase === 'resolving' || phase === 'dealerTurn') return null;

  const handleAction = (actionName, fn) => {
      if (onAction) onAction('medium');
      fn();
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-black/80 backdrop-blur-2xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,0.6)] px-4 py-4 flex flex-col items-center animate-slide-up origin-bottom">
        <div className="flex flex-wrap justify-center gap-4 w-full">
            <Button 
                variant="hit" 
                size="game"
                className="flex-1 min-w-[120px]" 
                onClick={() => handleAction('hit', actions.hit)} 
                disabled={!features.canHit}
            >
                Hit
            </Button>
            
            <Button 
                variant="stand" 
                size="game"
                className="flex-1 min-w-[120px]" 
                onClick={() => handleAction('stand', actions.stand)} 
                disabled={!features.canStand}
            >
                Stand
            </Button>

            {features.canDouble && (
                <Button 
                    variant="gold" 
                    size="game"
                    className="flex-1 min-w-[120px]" 
                    onClick={() => handleAction('double', actions.doubleDown)}
                >
                    Double
                </Button>
            )}

            {features.canSplit && (
                <Button 
                    variant="action" 
                    size="game"
                    className="flex-1 min-w-[120px]" 
                    onClick={() => handleAction('split', actions.split)}
                >
                    Split
                </Button>
            )}

            {features.canSurrender && (
                <Button 
                    variant="ghost" 
                    className="flex-0 px-4 text-sm bg-transparent border border-white/20 text-white/50 hover:text-white hover:border-white/50" 
                    onClick={() => handleAction('surrender', actions.surrender)}
                >
                    Surrender
                </Button>
            )}
        </div>
    </div>
  );
};

export default Controls;
