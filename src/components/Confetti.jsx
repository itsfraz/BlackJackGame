import React, { useEffect, useState } from 'react';

const Confetti = ({ active }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (active) {
            const count = 100;
            const newParticles = [];
            
            for (let i = 0; i < count; i++) {
                newParticles.push({
                    id: i,
                    x: 50, // Start center
                    y: 50,
                    angle: Math.random() * 360,
                    speed: Math.random() * 10 + 5,
                    color: ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FFFFFF'][Math.floor(Math.random() * 5)],
                    delay: Math.random() * 0.5
                });
            }
            setParticles(newParticles);
        } else {
            setParticles([]);
        }
    }, [active]);

    if (!active) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        backgroundColor: p.color,
                        transform: 'translate(-50%, -50%)',
                        animation: `explode 1.5s ease-out forwards ${p.delay}s`
                    }}
                />
            ))}
            <style>{`
                @keyframes explode {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { 
                        transform: translate(
                            calc(-50% + ${Math.random() * 200 - 100}vw), 
                            calc(-50% + ${Math.random() * 200 - 100}vh)
                        ) scale(0); 
                        opacity: 0; 
                    }
                }
            `}</style>
        </div>
    );
};

export default Confetti;
