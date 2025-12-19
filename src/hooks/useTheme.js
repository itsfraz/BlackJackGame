import { useState, useEffect } from 'react';

const THEMES = {
    green: { name: 'Classic Green', felt: '#1a472a', accent: '#ffd700' },
    blue: { name: 'Royal Blue', felt: '#1e3a8a', accent: '#60a5fa' },
    red: { name: 'Ruby Red', felt: '#7f1d1d', accent: '#f87171' },
    black: { name: 'Midnight', felt: '#111827', accent: '#9ca3af' },
    purple: { name: 'Amethyst', felt: '#4c1d95', accent: '#c084fc' },
};

const CARD_BACKS = {
    classic: 'radial-gradient(circle, transparent 20%, #000 20%, #000 80%, transparent 80%, transparent)', // The current dots
    modern: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
    lines: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.5) 10px, rgba(0,0,0,0.5) 20px)',
    solid: 'none' 
};

const TRANSLATIONS = {
    en: {
        title: 'Blackjack Pro',
        dealer: 'Dealer',
        player: 'Player',
        hand: 'Hand',
        settings: 'Settings',
        history: 'History',
        profile: 'Profile',
        rules: 'Table Rules',
        visuals: 'Visuals & Theme',
        language: 'Language',
        decks: 'Number of Decks',
        soft17: 'Dealer Soft 17',
        stand: 'Stand',
        hit: 'Hit',
        on: 'ON',
        off: 'OFF',
        close: 'Close',
        bet: 'Place Bet',
        deal: 'Deal',
        win: 'Win',
        loss: 'Loss',
        push: 'Push',
        blackjack: 'Blackjack'
    },
    es: {
        title: 'Blackjack Pro',
        dealer: 'Crupier',
        player: 'Jugador',
        hand: 'Mano',
        settings: 'Ajustes',
        history: 'Historial',
        profile: 'Perfil',
        rules: 'Reglas de Mesa',
        visuals: 'Tema y Visuales',
        language: 'Idioma',
        decks: 'Número de Barajas',
        soft17: 'Dealer Soft 17',
        stand: 'Plantarse',
        hit: 'Pedir',
        on: 'ON',
        off: 'OFF',
        close: 'Cerrar',
        bet: 'Apostar',
        deal: 'Repartir',
        win: 'Ganaste',
        loss: 'Perdiste',
        push: 'Empate',
        blackjack: 'Blackjack'
    },
    fr: {
        title: 'Blackjack Pro',
        dealer: 'Croupier',
        player: 'Joueur',
        hand: 'Main',
        settings: 'Paramètres',
        history: 'Historique',
        profile: 'Profil',
        rules: 'Règles du Jeu',
        visuals: 'Thème et Visuels',
        language: 'Langue',
        decks: 'Nombre de Paquets',
        soft17: 'Dealer Soft 17',
        stand: 'Rester',
        hit: 'Tirer',
        on: 'ON',
        off: 'OFF',
        close: 'Fermer',
        bet: 'Miser',
        deal: 'Distribuer',
        win: 'Gagné',
        loss: 'Perdu',
        push: 'Égalité',
        blackjack: 'Blackjack'
    }
};

export const useTheme = () => {
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem('bj_theme');
        return saved ? JSON.parse(saved) : {
            themeId: 'green',
            cardBack: 'classic',
            darkMode: true,
            lang: 'en'
        };
    });

    useEffect(() => {
        localStorage.setItem('bj_theme', JSON.stringify(preferences));
        
        // Apply CSS Variables
        const theme = THEMES[preferences.themeId];
        const root = document.documentElement;
        
        root.style.setProperty('--felt-color', theme.felt);
        root.style.setProperty('--accent-color', theme.accent);
        
        // Handle Card Back Logic if needed via CSS, or just pass prop
        
    }, [preferences]);

    const updatePreferences = (updates) => {
        setPreferences(prev => ({ ...prev, ...updates }));
    };

    const t = (key) => TRANSLATIONS[preferences.lang][key] || key;

    return {
        preferences,
        updatePreferences,
        themes: THEMES,
        cardBacks: CARD_BACKS,
        languages: [{code:'en', name: 'English'}, {code:'es', name: 'Español'}, {code:'fr', name: 'Français'}],
        t
    };
};
