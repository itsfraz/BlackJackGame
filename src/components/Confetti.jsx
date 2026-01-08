import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Confetti = ({ active }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (active) {
            // Generate distinct particles for the explosion
            const newParticles = Array.from({ length: 150 }).map((_, i) => {
                const angle = Math.random() * Math.PI * 2;
                const velocity = Math.random() * 800 + 200; // Random distance
                return {
                    id: i,
                    x: Math.cos(angle) * velocity,
                    y: Math.sin(angle) * velocity,
                    color: ['#FFD700', '#FF4444', '#44FF44', '#4444FF', '#FFFFFF'][Math.floor(Math.random() * 5)],
                    delay: Math.random() * 0.2
                };
            });
            setParticles(newParticles);
        } else {
            setParticles([]);
        }
    }, [active]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-center justify-center">
            <AnimatePresence>
                {active && particles.map(p => (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
                        animate={{ 
                            opacity: 0, 
                            x: p.x,
                            y: p.y,
                            scale: 0,
                            rotate: Math.random() * 720
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                            duration: 1.5, 
                            ease: "easeOut", 
                            delay: p.delay 
                        }}
                        className="absolute w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: p.color, color: p.color }} // shadowing uses currentcolor
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Confetti;
