// ============================================================================
// DEAL SIZE UTILITIES
// ============================================================================

/**
 * Format deal size from number and unit (new structured input)
 * @param {string|number} amount - Numeric amount (e.g., 1.5)
 * @param {string} unit - Unit: 'K' or 'M'
 * @returns {string} Formatted deal size (e.g., "$1.5M")
 */
export const formatDealSizeFromParts = (amount, unit) => {
  if (!amount || !unit) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  
  // Format with up to 2 decimal places, removing trailing zeros
  const formatted = num.toFixed(2).replace(/\.?0+$/, '');
  return `$${formatted}${unit}`;
};

/**
 * Parse existing deal size string into parts for editing
 * @param {string} value - Deal size string (e.g., "$1.5M", "$400K", "500000")
 * @returns {Object} { amount: string, unit: string } or { amount: '', unit: '' } if unparseable
 */
export const parseDealSizeToParts = (value) => {
  if (!value) return { amount: '', unit: '' };
  
  // Handle already formatted strings like "$1.5M" or "$400K"
  const upperValue = value.toUpperCase();
  
  if (upperValue.includes('M')) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      return { amount: num.toString(), unit: 'M' };
    }
  }
  
  if (upperValue.includes('K')) {
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      return { amount: num.toString(), unit: 'K' };
    }
  }
  
  // Handle raw numbers - try to infer unit
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!isNaN(num)) {
    if (num >= 1000000) {
      return { amount: (num / 1000000).toString(), unit: 'M' };
    }
    if (num >= 1000) {
      return { amount: (num / 1000).toString(), unit: 'K' };
    }
    // Small numbers - leave as-is with no unit (legacy data)
    return { amount: num.toString(), unit: '' };
  }
  
  // Unparseable - return empty (legacy data will show as-is in display)
  return { amount: '', unit: '' };
};

/**
 * Parse deal size string to number (internal use for pipeline calculations)
 * @param {string} value - Deal size string (e.g., "$50K", "$1.2M")
 * @returns {number} Numeric value
 */
const parseDealSize = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  
  const cleaned = value.replace(/[^0-9.KMkm]/g, '');
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) return 0;
  
  if (value.toUpperCase().includes('M')) {
    return num * 1000000;
  }
  if (value.toUpperCase().includes('K')) {
    return num * 1000;
  }
  return num;
};

/**
 * Compute pipeline total from engagements
 * @param {Array} engagements - Array of engagement objects
 * @param {boolean} activeOnly - If true, only count non-archived engagements (default: true)
 * @returns {Object} { total: number, count: number } - Total value and count of deals with sizes
 */
export const computePipelineTotal = (engagements, activeOnly = true) => {
  if (!engagements || !Array.isArray(engagements)) {
    return { total: 0, count: 0 };
  }
  
  let total = 0;
  let count = 0;
  
  engagements.forEach(engagement => {
    // Skip archived if activeOnly is true
    if (activeOnly && engagement.isArchived === true) {
      return;
    }
    
    if (engagement.dealSize) {
      const value = parseDealSize(engagement.dealSize);
      if (value > 0) {
        total += value;
        count++;
      }
    }
  });
  
  return { total, count };
};

/**
 * Format pipeline total for display
 * @param {number} value - Total pipeline value in dollars
 * @returns {string} Formatted string (e.g., "$2.4M", "$850K")
 */
export const formatPipelineTotal = (value) => {
  if (!value || value === 0) return '$0';
  
  if (value >= 1000000) {
    const millions = value / 1000000;
    // Show 1 decimal for values like 2.4M, no decimal for round numbers
    return `$${millions.toFixed(1).replace(/\.0$/, '')}M`;
  }
  
  if (value >= 1000) {
    const thousands = value / 1000;
    return `$${thousands.toFixed(0)}K`;
  }
  
  return `$${value}`;
};
