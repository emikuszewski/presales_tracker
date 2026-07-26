import React from 'react';
import { SlackIcon, DriveIcon, DocsIcon, SlidesIcon, SheetsIcon } from '../ui';

/**
 * Integration links indicator - displays integration icons directly
 * Shows nothing if no integrations are configured
 */
const IntegrationLinksIndicator = ({ engagement }) => {
  // Build array of available integrations
  const integrations = [];
  
  if (engagement.driveFolderUrl) {
    integrations.push({
      key: 'drive',
      url: engagement.driveFolderUrl,
      title: engagement.driveFolderName || 'Open Google Drive',
      icon: DriveIcon
    });
  }
  if (engagement.docsUrl) {
    integrations.push({
      key: 'docs',
      url: engagement.docsUrl,
      title: engagement.docsName || 'Open Google Doc',
      icon: DocsIcon
    });
  }
  if (engagement.slidesUrl) {
    integrations.push({
      key: 'slides',
      url: engagement.slidesUrl,
      title: engagement.slidesName || 'Open Google Slides',
      icon: SlidesIcon
    });
  }
  if (engagement.sheetsUrl) {
    integrations.push({
      key: 'sheets',
      url: engagement.sheetsUrl,
      title: engagement.sheetsName || 'Open Google Sheet',
      icon: SheetsIcon
    });
  }
  if (engagement.slackUrl) {
    integrations.push({
      key: 'slack',
      url: engagement.slackUrl,
      title: engagement.slackChannel || 'Open Slack',
      icon: SlackIcon
    });
  }

  // Show nothing if no integrations
  if (integrations.length === 0) {
    return null;
  }

  const handleIconClick = (e, url) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-1">
      {integrations.map((integration) => {
        const IconComponent = integration.icon;
        return (
          <button
            key={integration.key}
            onClick={(e) => handleIconClick(e, integration.url)}
            className="inline-flex items-center justify-center w-7 h-7 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={integration.title}
          >
            <IconComponent className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
};

export default IntegrationLinksIndicator;
