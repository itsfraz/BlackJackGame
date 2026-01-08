import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";

const SettingsModal = ({ isOpen, rules, onUpdateRules, onClose, themeHook, playerCount, setPlayerCount }) => {
    const { preferences, updatePreferences, themes, cardBacks, languages, t } = themeHook;
    const [activeTab, setActiveTab] = React.useState('game');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900 border-white/20 text-white max-w-md p-0 overflow-hidden gap-0">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-black/40 flex justify-between items-center">
                    <DialogTitle className="text-2xl font-black uppercase tracking-wider text-white">{t('settings')}</DialogTitle>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                     <button 
                        onClick={() => setActiveTab('game')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'game' ? 'text-bj-gold border-b-2 border-bj-gold bg-white/5' : 'text-gray-500 hover:text-white/80'}`}
                     >
                         {t('rules')}
                     </button>
                     <button 
                        onClick={() => setActiveTab('visuals')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'visuals' ? 'text-bj-gold border-b-2 border-bj-gold bg-white/5' : 'text-gray-500 hover:text-white/80'}`}
                     >
                         {t('visuals')}
                     </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-left flex flex-col gap-6 max-h-[60vh]">
                    
                    {/* Game Rules Tab */}
                    {activeTab === 'game' && (
                        <>
                             {/* Active Seats */}
                             <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Seats</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(n => (
                                        <Button 
                                            key={n}
                                            variant={playerCount === n ? "default" : "outline"}
                                            className={`flex-1 ${playerCount === n ? 'bg-bj-gold text-black hover:bg-yellow-400' : 'bg-black/40 text-gray-500 border-white/10 hover:text-white'}`}
                                            onClick={() => setPlayerCount(n)}
                                        >
                                            {n}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Decks Selector */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('decks')}</label>
                                <select 
                                    className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-bj-gold transition-colors appearance-none cursor-pointer"
                                    value={rules.numberOfDecks}
                                    onChange={(e) => onUpdateRules({ numberOfDecks: parseInt(e.target.value) })}
                                >
                                    {[1, 2, 4, 6, 8].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dealer Soft 17 */}
                            <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                                <span className="text-sm font-bold uppercase tracking-wide text-gray-300">{t('soft17')}</span>
                                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                                    <Button 
                                        variant={!rules.dealerSoft17 ? "destructive" : "ghost"}
                                        size="sm"
                                        onClick={() => onUpdateRules({ dealerSoft17: false })}
                                        className={!rules.dealerSoft17 ? "bg-red-600 hover:bg-red-700" : "text-gray-500"}
                                    >
                                        {t('stand')}
                                    </Button>
                                    <Button 
                                        variant={rules.dealerSoft17 ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => onUpdateRules({ dealerSoft17: true })}
                                        className={rules.dealerSoft17 ? "bg-bj-gold text-black hover:bg-yellow-400" : "text-gray-500"}
                                    >
                                        {t('hit')}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Visuals Tab */}
                    {activeTab === 'visuals' && (
                        <>
                            {/* Language */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('language')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {languages.map(l => (
                                        <Button 
                                            key={l.code}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => updatePreferences({ lang: l.code })}
                                            className={`border-white/10 ${preferences.lang === l.code ? 'bg-bj-gold text-black border-bj-gold hover:bg-yellow-400' : 'bg-black/40 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {l.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Themes */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Table Theme</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.entries(themes).map(([key, theme]) => (
                                        <button 
                                            key={key}
                                            onClick={() => updatePreferences({ themeId: key })}
                                            className={`w-full aspect-square rounded-full border-2 transition-all shadow-lg hover:scale-110 ${preferences.themeId === key ? 'border-white scale-110 ring-2 ring-bj-gold' : 'border-transparent opacity-70'}`}
                                            style={{ backgroundColor: theme.felt }}
                                            title={theme.name}
                                        />
                                    ))}
                                </div>
                                <p className="text-center text-xs text-gray-500 font-serif italic mt-1">{themes[preferences.themeId].name}</p>
                            </div>

                            {/* Card Backs */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Card Back</label>
                                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                    {Object.entries(cardBacks).map(([key, bg]) => (
                                        <button 
                                            key={key}
                                            onClick={() => updatePreferences({ cardBack: key })}
                                            className={`min-w-[50px] h-[70px] rounded border-2 transition-all ${preferences.cardBack === key ? 'border-bj-gold scale-105 shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white'}`}
                                        >
                                            <div className="w-full h-full bg-bj-red rounded overflow-hidden relative">
                                                <div className="absolute inset-0 opacity-80" style={{ background: bg === 'none' ? 'none' : bg, backgroundSize: key === 'classic' ? '10px 10px' : 'auto' }}></div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Accessibility */}
                            <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5 mt-2">
                                <span className="text-sm font-bold uppercase tracking-wide text-gray-300">Accessibility</span>
                                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                                     <Button
                                        variant="ghost"
                                        size="sm"
                                        className={!rules.accessibility ? 'hidden' : 'text-gray-500 hover:text-white'}
                                        onClick={() => onUpdateRules({ accessibility: false })}
                                     >
                                         OFF
                                     </Button>
                                     <Button
                                        variant={rules.accessibility ? "secondary" : "ghost"}
                                        size="sm"
                                        className={rules.accessibility ? "bg-white text-black shadow-lg" : "text-gray-500 hover:text-white"}
                                        onClick={() => onUpdateRules({ accessibility: !rules.accessibility })}
                                     >
                                         {rules.accessibility ? 'ON' : 'OFF'}
                                     </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-6 pt-0 mt-4">
                    <DialogClose asChild>
                        <Button 
                            variant="outline"
                            className="w-full py-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-widest border-white/10 hover:border-white/30"
                        >
                            {t('close')}
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SettingsModal;
