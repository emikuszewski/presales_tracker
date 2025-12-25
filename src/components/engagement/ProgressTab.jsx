import React, { useState } from 'react';
import { phaseConfig, phaseLabels } from '../../constants';
import { formatDate } from '../../utils';
import LinkifyText from '../common/LinkifyText';

/**
 * Status badge component
 */
const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETE: 'bg-green-100 text-green-700'
  };
  
  const labels = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETE: 'Complete'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

/**
 * Phase card component
 */
const PhaseCard = ({ 
  phase, 
  phaseType, 
  phaseInfo, 
  notesCount,
  onStatusChange,
  onAddLink,
  onRemoveLink,
  onNotesClick
}) => {
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const handleAddLink = () => {
    if (linkTitle.trim() && linkUrl.trim()) {
      onAddLink(phaseType, { title: linkTitle.trim(), url: linkUrl.trim() });
      setLinkTitle('');
      setLinkUrl('');
      setShowAddLink(false);
    }
  };

  const handleStatusSelect = (newStatus) => {
    if (newStatus !== phase.status) {
      onStatusChange(phaseType, newStatus);
    }
    setShowStatusDropdown(false);
  };

  const isPending = phase.status === 'PENDING';

  return (
    <div className={`bg-white rounded-lg border ${isPending ? 'border-gray-200 opacity-75' : 'border-gray-200'} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900">{phaseInfo.label}</h3>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="hover:opacity-80 transition-opacity"
            >
              <StatusBadge status={phase.status} />
            </button>
            
            {/* Status dropdown */}
            {showStatusDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  {['PENDING', 'IN_PROGRESS', 'COMPLETE'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusSelect(status)}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                        phase.status === status ? 'bg-gray-50 font-medium' : ''
                      }`}
                    >
                      <StatusBadge status={status} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Completion date */}
        {phase.completedDate && (
          <span className="text-xs text-gray-500">
            {formatDate(phase.completedDate)}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-3">{phaseInfo.description}</p>

      {/* Links */}
      {phase.links && phase.links.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {phase.links.map((link, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1 group">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {link.title}
                </a>
                <button
                  onClick={() => onRemoveLink(phaseType, idx)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  title="Remove link"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes indicator + Add link button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Add link */}
          {!showAddLink && (
            <button
              onClick={() => setShowAddLink(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Add Link
            </button>
          )}
        </div>

        {/* Notes indicator */}
        {notesCount > 0 && (
          <button
            onClick={() => onNotesClick(phaseType)}
            className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
          >
            📝 {notesCount} note{notesCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Add link form */}
      {showAddLink && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Link title"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddLink}
                disabled={!linkTitle.trim() || !linkUrl.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddLink(false);
                  setLinkTitle('');
                  setLinkUrl('');
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Progress tab showing all 5 phase cards
 * 
 * @param {Object} props
 * @param {Object} props.engagement - The engagement data
 * @param {Function} props.onStatusChange - Callback for phase status change
 * @param {Function} props.onAddLink - Callback for adding a link
 * @param {Function} props.onRemoveLink - Callback for removing a link
 * @param {Function} props.onNotesClick - Callback when notes indicator is clicked
 */
const ProgressTab = ({ 
  engagement, 
  onStatusChange, 
  onAddLink, 
  onRemoveLink,
  onNotesClick
}) => {
  if (!engagement) return null;

  return (
    <div className="space-y-4 p-4">
      {phaseConfig.map((phaseInfo) => {
        const phase = engagement.phases?.[phaseInfo.id] || {
          status: 'PENDING',
          completedDate: null,
          links: []
        };
        const notesCount = engagement.notesByPhase?.[phaseInfo.id]?.length || 0;

        return (
          <PhaseCard
            key={phaseInfo.id}
            phase={phase}
            phaseType={phaseInfo.id}
            phaseInfo={phaseInfo}
            notesCount={notesCount}
            onStatusChange={onStatusChange}
            onAddLink={onAddLink}
            onRemoveLink={onRemoveLink}
            onNotesClick={onNotesClick}
          />
        );
      })}
    </div>
  );
};

export default ProgressTab;

