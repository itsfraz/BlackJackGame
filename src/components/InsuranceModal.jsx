import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

const InsuranceModal = ({ isOpen, bet, onResolve }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-slate-900 border border-white/20 max-w-sm text-center shadow-2xl">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white mb-2 uppercase text-center">Insurance?</DialogTitle>
                <DialogDescription className="text-gray-300 mb-2 text-center">
                    Dealer shows an Ace. Protect your bet?
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4">
                <p className="text-bj-gold font-bold text-xl">Cost: ${Math.floor(bet / 2)}</p>
                
                <div className="flex gap-4 justify-center w-full">
                    <Button 
                        variant="default" // Using default but overriding colors to match Green/Hit
                        className="flex-1 py-6 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all active:scale-95 shadow-lg text-lg" 
                        onClick={() => onResolve(true)}
                    >
                        Yes (Buy)
                    </Button>
                    <Button 
                        variant="destructive"
                        className="flex-1 py-6 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all active:scale-95 shadow-lg text-lg" 
                        onClick={() => onResolve(false)}
                    >
                        No
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
};

export default InsuranceModal;
