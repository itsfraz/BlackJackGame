import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import StrategyHeatmap from './StrategyHeatmap';

const TrainingModal = ({ isOpen, onClose, actions, trainingState }) => {
  const [activeTab, setActiveTab] = useState('drills'); // 'drills' | 'stats'

  if (!isOpen) return null;

  const isActive = (type) => trainingState.drillType === type;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 border border-white/10 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
                <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                   <span className="text-3xl">🎓</span> Training Center
                </h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">✕</button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button 
                  onClick={() => setActiveTab('drills')}
                  className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-colors ${activeTab === 'drills' ? 'text-bj-gold border-b-2 border-bj-gold bg-white/5' : 'text-white/40'}`}
                >
                    Drill Mode
                </button>
                <button 
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest hover:bg-white/5 transition-colors ${activeTab === 'stats' ? 'text-bj-gold border-b-2 border-bj-gold bg-white/5' : 'text-white/40'}`}
                >
                    Performance Heatmap
                </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-900 to-black">
                {activeTab === 'drills' ? (
                    <div className="flex flex-col gap-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-white">Game Mode</h3>
                                <div className="flex gap-4 p-1 bg-black/50 rounded-xl border border-white/10">
                                    <button 
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${trainingState.mode === 'standard' ? 'bg-bj-gold text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
                                        onClick={() => actions.setGameMode('standard')}
                                    >
                                        Standard Game
                                    </button>
                                    <button 
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${trainingState.mode === 'drill' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-white/50 hover:text-white'}`}
                                        onClick={() => actions.setGameMode('drill')}
                                    >
                                        Drill Mode
                                    </button>
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Standard Mode simulates a real casino game with betting. <br/>
                                    Drill Mode skips betting and deals rapid-fire hands to test your strategy.
                                </p>
                            </div>

                            <div className={`space-y-4 transition-opacity ${trainingState.mode !== 'drill' ? 'opacity-50 pointer-events-none' : ''}`}>
                                <h3 className="text-xl font-bold text-white">Drill Focus</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button 
                                        variant={isActive('soft') ? 'default' : 'outline'} 
                                        className={isActive('soft') ? 'bg-blue-600 border-transparent' : ''}
                                        onClick={() => actions.setDrillType('soft')}
                                    >
                                        Soft Hands (A,x)
                                    </Button>
                                    <Button 
                                        variant={isActive('pairs') ? 'default' : 'outline'}
                                        className={isActive('pairs') ? 'bg-blue-600 border-transparent' : ''}
                                        onClick={() => actions.setDrillType('pairs')}
                                    >
                                        Pairs & Splits
                                    </Button>
                                    <Button 
                                        variant={isActive('hard') ? 'default' : 'outline'}
                                        className={isActive('hard') ? 'bg-blue-600 border-transparent' : ''}
                                        onClick={() => actions.setDrillType('hard')}
                                    >
                                        Hard Totals
                                    </Button>
                                    <Button 
                                        variant={isActive('all') ? 'default' : 'outline'}
                                        className={isActive('all') ? 'bg-blue-600 border-transparent' : ''}
                                        onClick={() => actions.setDrillType('all')}
                                    >
                                        Random Mix
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {trainingState.mode === 'drill' && (
                             <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl flex items-center justify-between">
                                 <div>
                                     <h4 className="text-blue-400 font-bold mb-1">Drill Active: {trainingState.drillType.toUpperCase()}</h4>
                                     <p className="text-sm text-blue-200/60">Press 'Deal' to start rapid fire. Basic Strategy feedback is ALWAYS ON.</p>
                                 </div>
                                 <div className="text-4xl">🚀</div>
                             </div>
                        )}
                    </div>
                ) : (
                    <StrategyHeatmap stats={trainingState.stats} />
                )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
                <Button onClick={onClose} variant="ghost">Close</Button>
            </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrainingModal;
