import React from 'react';

/**
 * Default maximum display length for URLs before truncation
 */
const DEFAULT_MAX_URL_LENGTH = 50;

/**
 * Formats a URL for display:
 * - Strips protocol (https://, http://)
 * - Middle truncates if longer than maxLength
 * 
 * @param {string} url - Full URL
 * @param {number} maxLength - Maximum display length
 * @returns {string} Formatted display URL
 */
const formatUrlForDisplay = (url, maxLength = DEFAULT_MAX_URL_LENGTH) => {
  // Strip protocol for cleaner display
  let displayUrl = url.replace(/^https?:\/\//, '');
  
  // If short enough, return as-is
  if (displayUrl.length <= maxLength) {
    return displayUrl;
  }
  
  // Middle truncation
  // Show beginning and end with ellipsis in middle
  const ellipsis = '...';
  const availableLength = maxLength - ellipsis.length;
  const frontLength = Math.ceil(availableLength / 2);
  const backLength = Math.floor(availableLength / 2);
  
  const front = displayUrl.slice(0, frontLength);
  const back = displayUrl.slice(-backLength);
  
  return `${front}${ellipsis}${back}`;
};

/**
 * Parses text and converts URLs to clickable links
 * Matches https://, http://, and www. URLs
 * Handles trailing punctuation and parentheses gracefully
 * 
 * Features:
 * - Strips protocol from display (https://, http://)
 * - Middle truncates long URLs (~50 chars)
 * - Full URL available via hover tooltip and right-click copy
 */
const LinkifyText = React.memo(({ text, className = '' }) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Regex to match URLs starting with http://, https://, or www.
  // Captures the URL and allows for common URL characters including parentheses
  const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]|www\.[^\s<]+[^\s<.,:;"')\]!?])/gi;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    let url = match[0];
    const matchIndex = match.index;

    // Add text before the URL
    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex),
        key: `text-${lastIndex}`
      });
    }

    // Handle trailing punctuation that might have been included
    // But preserve parentheses if they're balanced within the URL
    const trailingPunctuation = /[.,:;"'!?)\]]+$/;
    const trailingMatch = url.match(trailingPunctuation);
    
    if (trailingMatch) {
      const trailing = trailingMatch[0];
      // Count opening and closing parentheses to handle Wikipedia-style URLs
      const openParens = (url.match(/\(/g) || []).length;
      const closeParens = (url.match(/\)/g) || []).length;
      
      // If parentheses are balanced or more closing than opening, strip trailing )
      if (closeParens > openParens && trailing.includes(')')) {
        // Remove excess closing parentheses from the end
        let excess = closeParens - openParens;
        let newUrl = url;
        while (excess > 0 && newUrl.endsWith(')')) {
          newUrl = newUrl.slice(0, -1);
          excess--;
        }
        // Also strip any remaining trailing punctuation
        newUrl = newUrl.replace(/[.,:;"'!?]+$/, '');
        url = newUrl;
      } else {
        // Just strip trailing punctuation (but not parentheses if balanced)
        url = url.replace(/[.,:;"'!?]+$/, '');
      }
    }

    // Ensure the URL has a protocol for the href
    const href = url.startsWith('www.') ? `https://${url}` : url;
    
    // Format URL for display (stripped protocol, middle truncated)
    const displayUrl = formatUrlForDisplay(url);

    parts.push({
      type: 'link',
      content: displayUrl,
      href: href,
      fullUrl: url, // Keep full URL for tooltip
      key: `link-${matchIndex}`
    });

    lastIndex = matchIndex + match[0].length;
    
    // Adjust lastIndex if we trimmed the URL
    if (match[0].length > url.length) {
      lastIndex = matchIndex + url.length;
    }
  }

  // Add any remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
      key: `text-${lastIndex}`
    });
  }

  // If no URLs found, just return the text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map(part => 
        part.type === 'link' ? (
          <a
            key={part.key}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            title={part.fullUrl}
            onClick={(e) => e.stopPropagation()}
          >
            {part.content}
          </a>
        ) : (
          <React.Fragment key={part.key}>{part.content}</React.Fragment>
        )
      )}
    </span>
  );
});

LinkifyText.displayName = 'LinkifyText';

export default LinkifyText;
