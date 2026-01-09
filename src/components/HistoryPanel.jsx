import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { cn } from "../lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

const HistoryPanel = ({ isOpen, history, onClose, players = [] }) => {
  const [selectedPlayerId, setSelectedPlayerId] = React.useState('all');

  // Filter history based on selected player
  const filteredHistory = React.useMemo(() => {
    if (selectedPlayerId === 'all') return history;
    return history.filter(h => h.playerId === (selectedPlayerId === 'all' ? null : parseInt(selectedPlayerId)));
  }, [history, selectedPlayerId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        {/* We override the default centering to position it top-right like the original panel */}
        <DialogContent 
            className={cn(
                "fixed z-[100] w-72 p-4 border border-white/20 rounded-xl shadow-2xl bg-black/90 backdrop-blur-md text-white flex flex-col gap-2",
                // Position overrides:
                "top-[70px] right-4 left-auto bottom-auto translate-x-0 translate-y-0",
                "max-h-[80vh]",
                // Animation overrides (optional, keeping standard dialog animations or customizing)
                "data-[state=open]:slide-in-from-right-10 data-[state=open]:slide-in-from-top-0"
            )}
            // We can disable the overlay background color if we want it to feel less modal-like, 
            // but for now we keep the Dialog behavior including focus trap. 
            // If overlay is not desired, we might need a non-modal primitives or just transparent overlay.
            // For this implementation, we assume standard Modal behavior is acceptable or desired for accessibility.
        >
            <DialogHeader className="flex flex-col gap-2 border-b border-white/10 pb-4 mb-2">
                <div className="flex justify-between items-center w-full">
                    <DialogTitle className="font-bold text-lg text-bj-gold uppercase tracking-wider">Hand History</DialogTitle>
                </div>
                
                {/* Player Selector Dropdown */}
                {players.length > 0 && (
                    <Select value={selectedPlayerId.toString()} onValueChange={setSelectedPlayerId}>
                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select Player" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/20 text-white">
                            <SelectItem value="all">All Players</SelectItem>
                            {players.map(player => (
                                <SelectItem key={player.id} value={player.id.toString()}>
                                    <span className="flex justify-between w-full gap-4">
                                       <span>{player.name}</span>
                                       <span className="font-mono text-bj-gold">${player.spendingPower}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </DialogHeader>
            
            <div className="overflow-y-auto no-scrollbar flex-1 relative min-h-[200px]">
                {/* Balance History Component (Inline for now as requested distinct visual view) */}
                <div className="space-y-2">
                     {filteredHistory.length === 0 ? (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-500 italic">
                             {selectedPlayerId === 'all' ? "No hands played yet." : "No history for this player."}
                         </div>
                     ) : (
                         filteredHistory.slice().reverse().map(h => (
                             <div key={h.id} className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all border border-transparent hover:border-white/5">
                                 <div className="flex flex-col gap-0.5">
                                     <span className="text-gray-400 text-[10px] uppercase tracking-wider">
                                        {new Date(h.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}
                                     </span>
                                     <span className="text-xs text-gray-500">
                                         Player {h.playerId || '?'} | {h.details || h.result}
                                     </span>
                                 </div>
                                 <div className="flex flex-col items-end">
                                     <span className={`font-bold uppercase ${h.result.toLowerCase().includes('win') ? 'text-green-400' : h.result.toLowerCase().includes('push') ? 'text-yellow-400' : 'text-red-400'}`}>
                                         {h.result}
                                     </span>
                                     <span className={`font-mono font-bold ${h.amount > 0 ? 'text-green-400' : h.amount < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                         {h.amount > 0 ? `+$${h.amount}` : h.amount < 0 ? `-$${Math.abs(h.amount)}` : `$0`}
                                     </span>
                                 </div>
                             </div>
                         ))
                     )}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
};

export default HistoryPanel;
