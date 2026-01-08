import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

const DailyBonusModal = ({ isOpen, onClaim }) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-bj-gold max-w-sm text-center shadow-[0_0_50px_rgba(255,215,0,0.3)]">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white mb-4 uppercase tracking-widest drop-shadow-md text-center">🎉 Daily Rewards! 🎉</DialogTitle>
            </DialogHeader>
            
            <div className="flex flex-col items-center">
                <div className="text-6xl mb-4 animate-bounce">💎</div>
                <p className="text-gray-300 mb-6">Welcome back! Here are your free chips.</p>
                <div className="text-5xl font-black text-bj-gold mb-8 drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">+$500</div>
                
                <Button 
                    className="w-full py-6 rounded-full bg-gradient-to-r from-bj-gold to-yellow-600 text-black font-extrabold text-xl uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.6)] hover:-translate-y-1 transition-all active:scale-95 hover:bg-yellow-500 animate-pulse" 
                    onClick={onClaim}
                >
                    Claim Reward
                </Button>
            </div>
        </DialogContent>
    </Dialog>
  );
};

export default DailyBonusModal;
