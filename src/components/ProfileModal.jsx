import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";

const ProfileModal = ({ isOpen, onClose, profile, stats, achievements, allAchievements, updateProfile }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState(profile.username);

    const AVATARS = ['😎', '🕵️', '🤖', '🦊', '🦁', '🐉', '🎩', '👽'];

    const saveName = () => {
        updateProfile({ username: newName });
        setEditMode(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-slate-900 border-white/20 text-white p-0 overflow-hidden gap-0">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
                    <DialogTitle className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Player Profile</DialogTitle>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 bg-black/20">
                    {['profile', 'stats', 'achievements'].map(tab => (
                        <button 
                            key={tab}
                            className={`flex-1 py-4 font-bold uppercase tracking-wider text-xs md:text-sm transition-all outline-none focus:outline-none ${activeTab === tab ? 'bg-white/5 text-bj-gold border-b-2 border-bj-gold' : 'text-gray-500 hover:text-white/80'}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-white max-h-[70vh]">
                    
                    {activeTab === 'profile' && (
                        <div className="flex flex-col items-center gap-8">
                            {/* Avatar & Level */}
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full border-4 border-bj-gold flex items-center justify-center text-6xl bg-black shadow-[0_0_30px_rgba(255,215,0,0.3)]">
                                    {profile.avatar}
                                </div>
                                <div className="absolute -bottom-2 w-full text-center">
                                    <span className="bg-bj-gold text-black font-black px-3 py-1 rounded text-sm uppercase">Lvl {profile.level}</span>
                                </div>
                                
                                {/* Avatar Selector */}
                                <div className="hidden group-hover:flex absolute top-0 left-full ml-4 bg-black/90 p-2 rounded-xl border border-white/20 gap-2 flex-wrap w-[140px] z-50 animate-in fade-in zoom-in slide-in-from-left-2 duration-200">
                                    {AVATARS.map(av => (
                                        <button key={av} onClick={() => updateProfile({ avatar: av })} className="text-2xl hover:scale-125 transition-transform p-1">
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="w-full text-center">
                                {editMode ? (
                                    <div className="flex gap-2 justify-center mb-2 items-center">
                                        <input 
                                            value={newName} 
                                            onChange={(e) => setNewName(e.target.value)} 
                                            className="bg-white/10 border border-white/30 rounded px-3 py-1 text-white text-center font-bold"
                                        />
                                        <Button size="icon" variant="ghost" onClick={saveName} className="text-green-400 hover:text-green-300 hover:bg-green-900/20 h-8 w-8">
                                            ✅
                                        </Button>
                                    </div>
                                ) : (
                                    <h3 
                                        className="text-3xl font-black mb-1 cursor-pointer hover:text-bj-gold transition-colors flex items-center justify-center gap-2"
                                        onClick={() => setEditMode(true)}
                                        title="Click to edit name"
                                    >
                                        {profile.username} <span className="text-sm opacity-30">✎</span>
                                    </h3>
                                )}
                                <p className="text-gray-400 font-serif italic text-lg">{profile.title}</p>
                            </div>

                            {/* XP Progress */}
                            <div className="w-full max-w-md">
                                <div className="flex justify-between text-xs text-gray-400 mb-1 uppercase font-bold">
                                    <span>XP Progress</span>
                                    <span>{profile.xp} / {profile.nextLevelXp} XP</span>
                                </div>
                                <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.min(100, (profile.xp / profile.nextLevelXp) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatBox label="Hands Played" value={stats.totalHands} />
                            <StatBox label="Hands Won" value={stats.wins} color="text-green-400" />
                            <StatBox label="Blackjacks" value={stats.blackjacks} color="text-bj-gold" />
                            <StatBox label="Biggest Win" value={`$${stats.highestWin}`} color="text-green-400" />
                            <StatBox label="Win Rate" value={`${stats.totalHands > 0 ? ((stats.wins / stats.totalHands) * 100).toFixed(1) : 0}%`} />
                            <StatBox label="Total Wagered" value={`$${stats.totalWagered}`} />
                        </div>
                    )}

                    {activeTab === 'achievements' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allAchievements.map(ach => {
                                const isUnlocked = achievements.includes(ach.id);
                                return (
                                    <div 
                                        key={ach.id} 
                                        className={`p-4 rounded-xl border flex items-center gap-4 ${isUnlocked ? 'bg-white/5 border-bj-gold/30' : 'bg-black/20 border-white/5 opacity-50 grayscale'}`}
                                    >
                                        <div className="text-4xl">{ach.icon}</div>
                                        <div>
                                            <h4 className={`font-bold uppercase ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>{ach.name}</h4>
                                            <p className="text-sm text-gray-400">{ach.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    );
};

const StatBox = ({ label, value, color = "text-white" }) => (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center hover:bg-white/10 transition-colors">
        <h4 className="text-gray-400 text-xs uppercase font-bold mb-1">{label}</h4>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
    </div>
);

export default ProfileModal;
