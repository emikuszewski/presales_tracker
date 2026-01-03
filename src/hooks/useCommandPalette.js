/**
 * useCommandPalette Hook
 * 
 * Manages the command palette state and keyboard shortcuts.
 * - Opens with ⌘K (Mac) or Ctrl+K (Windows/Linux)
 * - Closes with Escape
 */

import { useState, useEffect, useCallback } from 'react';

export default function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
