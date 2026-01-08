import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { cn } from "../lib/utils";

const HistoryPanel = ({ isOpen, history, onClose }) => {
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
            <DialogHeader className="flex flex-row justify-between items-center border-b border-white/10 pb-2 mb-2 space-y-0">
                <DialogTitle className="font-bold text-lg text-bj-gold uppercase tracking-wider">Hand History</DialogTitle>
                {/* Close button is handled by DialogContent automatically, but we can have a custom one too or rely on the X */}
            </DialogHeader>
            
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
        </DialogContent>
    </Dialog>
  );
};

export default HistoryPanel;
