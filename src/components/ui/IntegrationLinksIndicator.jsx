import React, { useState } from 'react';
import { SlackIcon, DriveIcon, DocsIcon, SlidesIcon, SheetsIcon } from '../ui';

/**
 * Integration links indicator with hover-to-reveal behavior
 * - Default: shows link icon + count (e.g., 🔗 4)
 * - Hover (desktop): icons slide in, count disappears
 * - Mobile: tap to reveal, tap icon to follow, tap elsewhere to collapse
 */
const IntegrationLinksIndicator = ({ engagement }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Build array of available integrations
  const integrations = [];
  if (engagement.driveFolderUrl) {
    integrations.push({
      key: 'drive',
      url: engagement.driveFolderUrl,
      title: engagement.driveFolderName || 'Open Google Drive',
      icon: DriveIcon,
      bgColor: 'bg-green-50 hover:bg-green-100'
    });
  }
  if (engagement.docsUrl) {
    integrations.push({
      key: 'docs',
      url: engagement.docsUrl,
      title: engagement.docsName || 'Open Google Doc',
      icon: DocsIcon,
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    });
  }
  if (engagement.slidesUrl) {
    integrations.push({
      key: 'slides',
      url: engagement.slidesUrl,
      title: engagement.slidesName || 'Open Google Slides',
      icon: SlidesIcon,
      bgColor: 'bg-yellow-50 hover:bg-yellow-100'
    });
  }
  if (engagement.sheetsUrl) {
    integrations.push({
      key: 'sheets',
      url: engagement.sheetsUrl,
      title: engagement.sheetsName || 'Open Google Sheet',
      icon: SheetsIcon,
      bgColor: 'bg-emerald-50 hover:bg-emerald-100'
    });
  }
  if (engagement.slackUrl) {
    integrations.push({
      key: 'slack',
      url: engagement.slackUrl,
      title: engagement.slackChannel || 'Open Slack',
      icon: SlackIcon,
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    });
  }

  const count = integrations.length;

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    // Mobile: toggle expanded state
    setIsExpanded(!isExpanded);
  };

  const handleIconClick = (e, url) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle click outside to collapse (for mobile)
  const handleContainerClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
    >
      {/* Collapsed state: count indicator */}
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-500 cursor-pointer transition-opacity duration-150 ${
          isExpanded ? 'opacity-0 absolute pointer-events-none' : 'opacity-100'
        }`}
        onClick={handleClick}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span>{count}</span>
      </div>

      {/* Expanded state: actual icons */}
      <div
        className={`flex items-center gap-1 transition-all duration-150 ease-out ${
          isExpanded 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-2 absolute pointer-events-none'
        }`}
      >
        {integrations.map((integration) => {
          const IconComponent = integration.icon;
          return (
            <button
              key={integration.key}
              onClick={(e) => handleIconClick(e, integration.url)}
              className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${integration.bgColor}`}
              title={integration.title}
            >
              <IconComponent className="w-3.5 h-3.5" />
            </button>
          );
        })}
        {integrations.length === 0 && (
          <span className="text-xs text-gray-400 px-2">No links</span>
        )}
      </div>
    </div>
  );
};

export default IntegrationLinksIndicator;
