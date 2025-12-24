/**
 * useKeyboardShortcuts - Keyboard shortcuts for video stat tracking
 * 
 * Provides keyboard bindings for video controls and quick stat entry.
 * Disables shortcuts when typing in inputs.
 * 
 * @module useKeyboardShortcuts
 */

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
  // Video controls
  onPlayPause?: () => void;
  onRewind10?: () => void;
  onForward10?: () => void;
  onRewind1?: () => void;
  onForward1?: () => void;
  onPrevFrame?: () => void;
  onNextFrame?: () => void;
  onSpeed05?: () => void;
  onSpeed1?: () => void;
  onSpeed2?: () => void;
  
  // Stat shortcuts - Made shots
  onQuickShot2PT?: () => void;  // P = 2PT made
  onQuickShot3PT?: () => void;  // Shift+P = 3PT made
  onQuickShot?: () => void;     // Legacy fallback (defaults to 2PT)
  // Stat shortcuts - Missed shots
  onQuickMiss2PT?: () => void;  // M = 2PT missed
  onQuickMiss3PT?: () => void;  // Shift+M = 3PT missed
  // Stat shortcuts - Free throws
  onQuickFTMade?: () => void;   // G = FT made
  onQuickFTMiss?: () => void;   // Shift+G = FT missed
  onQuickRebound?: () => void;
  onQuickAssist?: () => void;
  onQuickSteal?: () => void;
  onQuickBlock?: () => void;
  onQuickTurnover?: () => void;
  onQuickFoul?: () => void;
  
  // Player selection (numpad 1-0 = players 1-10)
  onSelectPlayer?: (playerIndex: number) => void;
  
  // Editing
  onUndo?: () => void;
  
  // Whether shortcuts are enabled
  enabled?: boolean;
}

/**
 * Check if the active element is an input/textarea
 */
function isTypingElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.getAttribute('contenteditable') === 'true'
  );
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if shortcuts are disabled
    if (handlers.enabled === false) return;
    
    // Skip if typing in an input
    if (isTypingElement(document.activeElement)) return;
    
    const key = event.key.toLowerCase();
    const hasCtrl = event.ctrlKey || event.metaKey;
    
    // Video controls
    switch (key) {
      case ' ':
      case 'k':
        event.preventDefault();
        handlers.onPlayPause?.();
        break;
        
      case 'j':
        handlers.onRewind10?.();
        break;
        
      case 'l':
        handlers.onForward10?.();
        break;
        
      case 'arrowleft':
        if (event.shiftKey) {
          handlers.onRewind10?.();
        } else {
          handlers.onRewind1?.();
        }
        break;
        
      case 'arrowright':
        if (event.shiftKey) {
          handlers.onForward10?.();
        } else {
          handlers.onForward1?.();
        }
        break;
        
      case ',':
        handlers.onPrevFrame?.();
        break;
        
      case '.':
        handlers.onNextFrame?.();
        break;
        
      // Playback speed (with Shift modifier) or player selection (without)
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '0':
        if (event.shiftKey) {
          // Speed controls with Shift
          if (key === '1') handlers.onSpeed05?.();
          else if (key === '2') handlers.onSpeed1?.();
          else if (key === '3') handlers.onSpeed2?.();
        } else if (handlers.onSelectPlayer) {
          // Player selection (1-9 = index 0-8, 0 = index 9)
          event.preventDefault();
          const playerIndex = key === '0' ? 9 : parseInt(key) - 1;
          handlers.onSelectPlayer(playerIndex);
        }
        break;
        
      // Stat shortcuts - P for made shots (Shift+P = 3PT, P = 2PT)
      case 'p':
        if (!hasCtrl) {
          event.preventDefault();
          if (event.shiftKey) {
            handlers.onQuickShot3PT?.();
          } else {
            handlers.onQuickShot2PT?.() || handlers.onQuickShot?.();
          }
        }
        break;
      
      // Stat shortcuts - M for missed shots (Shift+M = 3PT, M = 2PT)
      case 'm':
        if (!hasCtrl) {
          event.preventDefault();
          if (event.shiftKey) {
            handlers.onQuickMiss3PT?.();
          } else {
            handlers.onQuickMiss2PT?.();
          }
        }
        break;
      
      // Stat shortcuts - G for free throws (Shift+G = missed, G = made)
      case 'g':
        if (!hasCtrl) {
          event.preventDefault();
          if (event.shiftKey) {
            handlers.onQuickFTMiss?.();
          } else {
            handlers.onQuickFTMade?.();
          }
        }
        break;
        
      case 'r':
        if (!hasCtrl) {
          event.preventDefault();
          handlers.onQuickRebound?.();
        }
        break;
        
      case 'a':
        if (!hasCtrl) {
          event.preventDefault();
          handlers.onQuickAssist?.();
        }
        break;
        
      case 's':
        if (!hasCtrl) {
          event.preventDefault();
          handlers.onQuickSteal?.();
        }
        break;
        
      case 'b':
        if (!hasCtrl) {
          event.preventDefault();
          handlers.onQuickBlock?.();
        }
        break;
        
      case 't':
        if (!hasCtrl) {
          event.preventDefault();
          handlers.onQuickTurnover?.();
        }
        break;
        
      case 'f':
        if (!hasCtrl) {
          event.preventDefault();
          handlers.onQuickFoul?.();
        }
        break;
        
      // Undo (Ctrl+Z)
      case 'z':
        if (hasCtrl) {
          event.preventDefault();
          handlers.onUndo?.();
        }
        break;
    }
  }, [handlers]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Keyboard shortcut reference for help display
 */
export const KEYBOARD_SHORTCUTS_REFERENCE = [
  { category: 'Video Controls', shortcuts: [
    { keys: 'Space / K', action: 'Play/Pause' },
    { keys: 'J', action: 'Rewind 10s' },
    { keys: 'L', action: 'Forward 10s' },
    { keys: '← / →', action: 'Rewind/Forward 1s' },
    { keys: 'Shift + ← / →', action: 'Rewind/Forward 10s' },
    { keys: ', / .', action: 'Previous/Next frame' },
    { keys: 'Shift + 1/2/3', action: 'Speed 0.5x / 1x / 2x' },
  ]},
  { category: 'Player Selection', shortcuts: [
    { keys: '1-9, 0', action: 'Select player 1-10' },
  ]},
  { category: 'Quick Stats', shortcuts: [
    { keys: 'P', action: '2PT Made' },
    { keys: 'Shift + P', action: '3PT Made' },
    { keys: 'M', action: '2PT Missed' },
    { keys: 'Shift + M', action: '3PT Missed' },
    { keys: 'G', action: 'FT Made' },
    { keys: 'Shift + G', action: 'FT Missed' },
    { keys: 'R', action: 'Rebound' },
    { keys: 'A', action: 'Assist' },
    { keys: 'S', action: 'Steal' },
    { keys: 'B', action: 'Block' },
    { keys: 'T', action: 'Turnover (select type)' },
    { keys: 'F', action: 'Foul (select type)' },
  ]},
  { category: 'Editing', shortcuts: [
    { keys: 'Ctrl + Z', action: 'Undo last stat' },
  ]},
];

