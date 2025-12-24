import React from 'react';

/**
 * Parses text and converts URLs to clickable links
 * Matches https://, http://, and www. URLs
 * Handles trailing punctuation and parentheses gracefully
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

    parts.push({
      type: 'link',
      content: url,
      href: href,
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
            className="text-blue-600 hover:underline"
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
