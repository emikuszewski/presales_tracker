/**
 * useAssistantPanel Hook
 * 
 * Manages the assistant panel open/close state.
 * Simple state management - no keyboard shortcuts.
 */

import { useState, useCallback } from 'react';

export default function useAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
