import React, { useEffect, useState } from 'react';

const StrategyFeedback = ({ feedback }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (feedback) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    if (!visible || !feedback) return null;

    return (
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 bg-yellow-500/90 text-yellow-900 px-8 py-3 rounded-full font-extrabold text-xl z-50 shadow-2xl border-2 border-white animate-pop flex items-center gap-2">
            <span className="text-2xl">⚠️</span> {feedback.msg}
        </div>
    );
};

const IntelligencePanel = ({ data, onToggleMode }) => {
    const { learningMode, runningCount, trueCount } = data;

    return (
        <div className="absolute top-[80px] left-[20px] bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2 z-50 shadow-xl transition-all hover:bg-black/70">
            <div className="flex items-center gap-2 text-white/90 font-bold text-sm">
                <label className="relative inline-block w-10 h-5">
                    <input 
                        type="checkbox" 
                        checked={learningMode} 
                        onChange={onToggleMode} 
                        className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-500 transition-all duration-300 rounded-full before:absolute before:content-[''] before:h-4 before:w-4 before:left-[2px] before:bottom-[2px] before:bg-white before:transition-all before:duration-300 before:rounded-full peer-checked:bg-bj-gold peer-checked:before:translate-x-5 peer-focus:shadow-[0_0_1px_#ffd700]"></span>
                </label>
                <span>{learningMode ? "Trainer Mode ON" : "Pro Mode"}</span>
            </div>
            
            {learningMode && (
                <div className="flex gap-4 p-2 bg-black/40 rounded-lg justify-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">RC</span>
                        <span className={`text-lg font-bold ${runningCount > 0 ? 'text-green-400' : runningCount < 0 ? 'text-red-400' : 'text-gray-300'}`}>{runningCount}</span>
                    </div>
                    <div className="w-[1px] bg-white/10"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">TC</span>
                        <span className={`text-lg font-bold ${trueCount > 0 ? 'text-green-400' : trueCount < 0 ? 'text-red-400' : 'text-gray-300'}`}>{trueCount}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export { StrategyFeedback, IntelligencePanel };
