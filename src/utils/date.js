// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format date for display: "Jan 8, 2025"
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format datetime for display: "Jan 8, 2025 at 3:45 PM"
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (datetime) => {
  if (!datetime) return '';
  const d = new Date(datetime);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * Format relative time for display: "Just now", "5 min ago", "2 hours ago", "3 days ago", or "Jan 5"
 * @param {string|Date} datetime - DateTime to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (datetime) => {
  if (!datetime) return '';
  
  const d = new Date(datetime);
  const now = new Date();
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Just now (less than 1 minute)
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  // Minutes (1-59)
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }
  
  // Hours (1-23)
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  // Days (1-6)
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  // 7+ days - fall back to date format "Jan 5"
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate business days between two dates (excludes weekends)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of business days
 */
export const getBusinessDaysBetween = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};
