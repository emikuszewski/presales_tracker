import React from 'react';

/**
 * Component that renders text with URLs converted to clickable links
 * 
 * @param {Object} props
 * @param {string} props.text - Text to render with linkified URLs
 * @param {string} props.className - Optional CSS class for wrapper
 */
const LinkifyText = ({ text, className = '' }) => {
  if (!text) return null;

  // URL regex pattern
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  
  const parts = text.split(urlPattern);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlPattern.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
};

export default LinkifyText;
