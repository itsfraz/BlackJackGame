import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Howl } from 'howler';

const AudioContext = createContext(null);

export const SOUNDS = {
  CARD_FLIP: 'card_flip',
  CHIP_PLACE: 'chip_place',
  SHUFFLE: 'shuffle',
  WIN: 'win',
  BUST: 'bust',
  CLICK: 'click',
  DEAL: 'deal'
};

export const AudioProvider = ({ children }) => {
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loaded, setLoaded] = useState(false);
  const [soundBank, setSoundBank] = useState({});

  useEffect(() => {
    // Preload sounds
    const manifest = {
      [SOUNDS.CARD_FLIP]: '/sounds/card_flip.mp3',
      [SOUNDS.CHIP_PLACE]: '/sounds/chip_place.mp3',
      [SOUNDS.SHUFFLE]: '/sounds/shuffle.mp3',
      [SOUNDS.WIN]: '/sounds/win_fanfare.mp3',
      [SOUNDS.BUST]: '/sounds/bust.mp3',
      [SOUNDS.CLICK]: '/sounds/click.mp3',
      [SOUNDS.DEAL]: '/sounds/deal.mp3'
    };

    const newSoundBank = {};
    
    Object.keys(manifest).forEach(key => {
      newSoundBank[key] = new Howl({
        src: [manifest[key]],
        volume: volume,
        onload: () => console.log(`Loaded ${key}`),
        onloaderror: (id, err) => console.warn(`Failed to load ${key}:`, err)
      });
    });

    setSoundBank(newSoundBank);
    setLoaded(true);

    return () => {
      // Cleanup
      Object.values(newSoundBank).forEach(sound => sound.unload());
    };
  }, []);

  // Update global volume
  useEffect(() => {
    Howler.volume(muted ? 0 : volume);
  }, [muted, volume]);

  const playSound = useCallback((soundName, options = {}) => {
    if (muted) return;
    const sound = soundBank[soundName];
    if (sound) {
      if (options.rate) sound.rate(options.rate);
      if (options.volume) sound.volume(options.volume * volume);
      sound.play();
    }
  }, [soundBank, muted, volume]);

  return (
    <AudioContext.Provider value={{ 
      muted, 
      toggleMute: () => setMuted(prev => !prev),
      volume,
      setVolume,
      playSound,
      isLoaded: loaded
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
