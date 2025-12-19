import { useState, useEffect } from 'react';

const XP_PER_LEVEL_BASE = 100;
const XP_GROWTH_FACTOR = 1.2;

const INITIAL_PROFILE = {
    username: 'Player',
    avatar: '😎',
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    title: 'Novice Gambler'
};

const INITIAL_STATS = {
    totalHands: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    blackjacks: 0,
    totalWagered: 0,
    highestWin: 0,
    biggestBet: 0,
    perfectPairs: 0
};

const ACHIEVEMENTS_LIST = [
    { id: 'first_win', icon: '🏆', name: 'First Blood', desc: 'Win your first hand' },
    { id: 'blackjack', icon: '♠️', name: 'Natural', desc: 'Hit a Blackjack' },
    { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: 'Win 3 hands in a row' },
    { id: 'streak_5', icon: '⚡', name: 'Unstoppable', desc: 'Win 5 hands in a row' },
    { id: 'high_roller', icon: '💎', name: 'High Roller', desc: 'Bet more than $500 in one hand' },
    { id: 'big_win', icon: '💰', name: 'Big Win', desc: 'Win over $1000 in one round' },
    { id: 'master_strategist', icon: '🧠', name: 'Master Strategist', desc: 'Win 10 hands in Pro Mode' },
    { id: 'survivor', icon: '🛡️', name: 'Survivor', desc: 'Win an Insurance bet' }
];

export const usePlayerProfile = () => {
    // State
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('bj_profile');
        return saved ? JSON.parse(saved) : INITIAL_PROFILE;
    });

    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('bj_stats');
        return saved ? JSON.parse(saved) : INITIAL_STATS;
    });

    const [achievements, setAchievements] = useState(() => {
        const saved = localStorage.getItem('bj_achievements');
        return saved ? JSON.parse(saved) : []; // List of IDs
    });
    
    const [newUnlocks, setNewUnlocks] = useState([]); // Temporary queue for notifications

    // Persistence
    useEffect(() => {
        localStorage.setItem('bj_profile', JSON.stringify(profile));
    }, [profile]);
    
    useEffect(() => {
        localStorage.setItem('bj_stats', JSON.stringify(stats));
    }, [stats]);

    useEffect(() => {
        localStorage.setItem('bj_achievements', JSON.stringify(achievements));
    }, [achievements]);

    // Profile Actions
    const updateProfile = (updates) => {
        setProfile(prev => ({ ...prev, ...updates }));
    };

    const addXp = (amount) => {
        setProfile(prev => {
            let { xp, level, nextLevelXp } = prev;
            xp += amount;
            
            // Level Up Logic
            if (xp >= nextLevelXp) {
                level++;
                xp -= nextLevelXp;
                nextLevelXp = Math.floor(nextLevelXp * XP_GROWTH_FACTOR);
                // Can trigger level up modal here if needed
            }
            
            return { ...prev, xp, level, nextLevelXp };
        });
    };

    const unlockAchievement = (id) => {
        if (!achievements.includes(id)) {
            setAchievements(prev => [...prev, id]);
            setNewUnlocks(prev => [...prev, ACHIEVEMENTS_LIST.find(a => a.id === id)]);
        }
    };

    const processGameResult = (roundHands, totalWinnings) => {
        const newStats = { ...stats };
        newStats.totalHands += roundHands.length;
        
        let xpGained = 0;
        let wonRound = false;

        roundHands.forEach(hand => {
            if (hand.result === 'win') {
                newStats.wins++;
                xpGained += 50;
                if (hand.status === 'blackjack') {
                    newStats.blackjacks++;
                    xpGained += 50;
                    unlockAchievement('blackjack');
                }
                wonRound = true;
            } else if (hand.result === 'loss') {
                newStats.losses++;
                xpGained += 10;
            } else if (hand.result === 'push') {
                newStats.pushes++;
                xpGained += 20;
            }
            
            newStats.totalWagered += hand.bet;
            if (hand.bet > newStats.biggestBet) newStats.biggestBet = hand.bet;
            if (hand.bet > 500) unlockAchievement('high_roller');
        });

        if (totalWinnings > newStats.highestWin) {
            newStats.highestWin = totalWinnings;
        }
        if (totalWinnings > 1000) unlockAchievement('big_win');
        if (wonRound) unlockAchievement('first_win'); // Checks duplicates internally
        
        // Save stats
        setStats(newStats);
        
        // Add XP
        addXp(xpGained);
    };

    const clearUnlocks = () => setNewUnlocks([]);

    return {
        profile,
        stats,
        achievements,
        allAchievements: ACHIEVEMENTS_LIST,
        newUnlocks,
        updateProfile,
        processGameResult,
        clearUnlocks,
        unlockAchievement
    };
};
