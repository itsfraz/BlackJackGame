import { useCallback } from 'react';

export const useHaptics = () => {
  const triggerHaptic = useCallback((type = 'light') => {
    if (!navigator.vibrate) return;

    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10); // Quick tap (buttons)
          break;
        case 'medium':
          navigator.vibrate(40); // Standard interaction
          break;
        case 'heavy':
          navigator.vibrate(70); // Important event
          break;
        case 'success':
          navigator.vibrate([50, 30, 50]); // Win/Success
          break;
        case 'error':
          navigator.vibrate([50, 100, 50]); // Bust/Error
          break;
        case 'bust':
          navigator.vibrate(200); // Long vibration for bust
          break;
        case 'blackjack':
          navigator.vibrate([100, 50, 100, 50, 200]); // Celebration
          break;
        default:
          navigator.vibrate(10);
      }
    } catch (e) {
      // Ignore errors (some browsers block vibration without user interaction)
    }
  }, []);

  return { triggerHaptic };
};
