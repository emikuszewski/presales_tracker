import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that triggers a refresh when the browser tab becomes visible
 * after being hidden for at least the specified threshold.
 * 
 * Layer 1 of stale data prevention: handles the "back from lunch" scenario
 * with zero overhead during active use.
 * 
 * @param {Object} options
 * @param {Function} options.onRefresh - Callback to trigger data refresh
 * @param {boolean} options.hasOpenModal - Whether a modal is currently open (skip refresh if true)
 * @param {string} options.currentView - Current view name (skip refresh for 'new')
 * @param {number} options.thresholdMs - Minimum hidden time before refresh (default: 30000ms = 30s)
 */
const useVisibilityRefresh = ({
  onRefresh,
  hasOpenModal = false,
  currentView = 'list',
  thresholdMs = 30000
}) => {
  // Track when the tab was hidden
  const lastHiddenTimestamp = useRef(null);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden') {
      // Tab is now hidden - record the timestamp
      lastHiddenTimestamp.current = Date.now();
    } else if (document.visibilityState === 'visible') {
      // Tab is now visible - check if we should refresh
      const hiddenAt = lastHiddenTimestamp.current;
      
      if (hiddenAt !== null) {
        const hiddenDuration = Date.now() - hiddenAt;
        
        // Only refresh if hidden for at least the threshold
        if (hiddenDuration >= thresholdMs) {
          // Skip refresh if modal is open (user might have unsaved changes)
          if (hasOpenModal) {
            return;
          }
          
          // Skip refresh if on NewEngagementView (user is filling out form)
          if (currentView === 'new') {
            return;
          }
          
          // Skip refresh if on DetailView (handled locally with different threshold)
          if (currentView === 'detail') {
            return;
          }
          
          onRefresh();
        }
      }
      
      // Clear the timestamp
      lastHiddenTimestamp.current = null;
    }
  }, [onRefresh, hasOpenModal, currentView, thresholdMs]);

  // Set up visibility change listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  // No return value needed - this hook just sets up the listener
};

export default useVisibilityRefresh;
