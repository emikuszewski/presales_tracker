/**
 * useGary Hook
 * 
 * Manages Gary's panel open/close state and notification state.
 * Gary is the SE Tracker's slightly world-weary AI assistant.
 */

import { useState, useCallback, useEffect } from 'react';

export default function useGary(engagements = [], currentUser = null) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  
  const open = useCallback(() => {
    setIsOpen(true);
    setHasNotification(false); // Clear notification when opened
  }, []);
  
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setHasNotification(false); // Clear notification when opening
      return !prev;
    });
  }, []);
  
  // Check for proactive insights to show notification badge
  useEffect(() => {
    if (isOpen || !engagements || engagements.length === 0) {
      return;
    }
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Find stale deals (no update in 30 days)
    const staleDeals = engagements.filter(e => {
      if (e.isArchived || e.engagementStatus === 'CLOSED_WON' || e.engagementStatus === 'CLOSED_LOST') return false;
      const lastUpdate = new Date(e.updatedAt || e.createdAt);
      return lastUpdate < thirtyDaysAgo;
    });
    
    // Find deals closing soon
    const closingSoon = engagements.filter(e => {
      if (e.isArchived || !e.expectedCloseDate) return false;
      const closeDate = new Date(e.expectedCloseDate);
      return closeDate <= sevenDaysFromNow && closeDate >= now;
    });
    
    // Show notification if there are insights
    // Random chance to add some variety (60%)
    const shouldNotify = (staleDeals.length > 0 || closingSoon.length > 0) && Math.random() < 0.6;
    setHasNotification(shouldNotify);
    
  }, [engagements, isOpen, currentUser]);
  
  return {
    isOpen,
    open,
    close,
    toggle,
    hasNotification,
    clearNotification: () => setHasNotification(false),
  };
}
