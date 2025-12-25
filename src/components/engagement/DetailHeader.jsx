import React from 'react';
import { phaseLabels } from '../../constants';

/**
 * Integration icon button component
 */
const IntegrationIcon = ({ url, name, icon, color }) => {
  if (!url) return null;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${color}`}
      title={name}
    >
      {icon}
    </a>
  );
};

/**
 * Compact header for detail view with back button, avatars, company, phase, and actions
 * 
 * @param {Object} props
 * @param {Object} props.engagement - The engagement data
 * @param {Array} props.owners - Array of owner objects with name, initials
 * @param {Function} props.onBack - Callback for back button
 * @param {Function} props.onEdit - Callback for edit button
 * @param {Function} props.onArchive - Callback for archive button
 * @param {boolean} props.isStale - Whether engagement is stale
 * @param {number} props.daysSinceActivity - Days since last activity
 */
const DetailHeader = ({ 
  engagement, 
  owners = [], 
  onBack, 
  onEdit, 
  onArchive,
  isStale,
  daysSinceActivity
}) => {
  const currentPhase = engagement?.currentPhase || 'DISCOVER';
  
  // Integration icons
  const integrations = [
    {
      url: engagement?.driveFolderUrl,
      name: engagement?.driveFolderName || 'Drive Folder',
      color: 'text-yellow-600',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.71 3.5L1.15 15l4.58 7.5h13.54l4.58-7.5L17.29 3.5H7.71zm-.56 1h9.7l5.5 9.5H2.65l5.5-9.5zm4.85.75L6.5 14h11l-5.5-8.75z"/>
        </svg>
      )
    },
    {
      url: engagement?.docsUrl,
      name: engagement?.docsName || 'Google Doc',
      color: 'text-blue-600',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h6v6h6v10H6zm2-6h8v2H8v-2zm0-4h8v2H8v-2zm0 8h5v2H8v-2z"/>
        </svg>
      )
    },
    {
      url: engagement?.slidesUrl,
      name: engagement?.slidesName || 'Google Slides',
      color: 'text-orange-500',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v6H7v-6z"/>
        </svg>
      )
    },
    {
      url: engagement?.sheetsUrl,
      name: engagement?.sheetsName || 'Google Sheets',
      color: 'text-green-600',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 2v3H5V5h14zM5 19v-9h6v9H5zm8 0v-9h6v9h-6z"/>
        </svg>
      )
    },
    {
      url: engagement?.slackUrl,
      name: engagement?.slackChannel || 'Slack Channel',
      color: 'text-purple-600',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 012.52-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.52V8.834zm-1.271 0a2.528 2.528 0 01-2.521 2.521 2.528 2.528 0 01-2.521-2.521V2.522A2.528 2.528 0 0115.166 0a2.528 2.528 0 012.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 012.521 2.52A2.528 2.528 0 0115.166 24a2.528 2.528 0 01-2.521-2.522v-2.52h2.521zm0-1.271a2.528 2.528 0 01-2.521-2.521 2.528 2.528 0 012.521-2.521h6.312A2.528 2.528 0 0124 15.166a2.528 2.528 0 01-2.522 2.521h-6.312z"/>
        </svg>
      )
    }
  ];

  const hasIntegrations = integrations.some(i => i.url);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Back button + Owners + Company + Phase */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Back button */}
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Back to list"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Owner avatars */}
          <div className="flex -space-x-2 flex-shrink-0">
            {owners.slice(0, 3).map((owner, idx) => (
              <div
                key={owner.id || idx}
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium
                  border-2 border-white
                  ${owner.isSystemUser 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-200 text-gray-700'
                  }
                `}
                title={owner.name}
              >
                {owner.initials}
              </div>
            ))}
            {owners.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white">
                +{owners.length - 3}
              </div>
            )}
          </div>

          {/* Company name */}
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {engagement?.company || 'Engagement'}
          </h1>

          {/* Phase badge */}
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
            {phaseLabels[currentPhase] || currentPhase}
          </span>

          {/* Deal size */}
          {engagement?.dealSize && (
            <span className="text-sm text-gray-500 flex-shrink-0 hidden sm:inline">
              {engagement.dealSize}
            </span>
          )}

          {/* Stale indicator */}
          {isStale && (
            <span className="text-xs text-amber-600 flex-shrink-0 hidden sm:inline" title={`${daysSinceActivity} days since last activity`}>
              ⚠️ {daysSinceActivity}d stale
            </span>
          )}
        </div>

        {/* Right: Integrations + Edit + Archive */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Integration icons */}
          {hasIntegrations && (
            <div className="hidden sm:flex items-center gap-0.5 mr-2">
              {integrations.map((integration, idx) => (
                <IntegrationIcon key={idx} {...integration} />
              ))}
            </div>
          )}

          {/* Edit button */}
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Edit engagement"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Archive button */}
          <button
            onClick={onArchive}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={engagement?.isArchived ? 'Restore engagement' : 'Archive engagement'}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailHeader;

