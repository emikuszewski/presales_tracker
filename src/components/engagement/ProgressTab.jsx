import React, { useState } from 'react';
import { phaseConfig } from '../../constants';
import { formatDate } from '../../utils';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETE: 'bg-green-100 text-green-700',
    BLOCKED: 'bg-amber-100 text-amber-700',
    SKIPPED: 'bg-gray-100 text-gray-400 italic'
  };
  
  const labels = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETE: 'Complete',
    BLOCKED: 'Blocked',
    SKIPPED: 'Skipped'
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const PhaseCard = ({ phase, phaseType, phaseInfo, notesCount, onStatusChange, onAddLink, onRemoveLink, onNotesClick }) => {
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
  const isSkipped = phase.status === 'SKIPPED';
  const isBlocked = phase.status === 'BLOCKED';

  // Determine if content should be muted (PENDING or SKIPPED states)
  // FIX: No longer applying opacity to the entire card wrapper
  // Instead, selectively mute text content while keeping interactive elements at full strength
  const isMuted = isPending || isSkipped;

  // All available statuses for the dropdown
  const allStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'SKIPPED'];

  return (
    // FIX: Removed opacity-75 and opacity-60 from this wrapper div
    // This prevents CSS opacity from affecting dropdown stacking context
    <div className={`bg-white rounded-lg border ${isBlocked ? 'border-amber-300' : 'border-gray-200'} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* FIX: Apply muted text color to label instead of card-level opacity */}
          {/* SKIPPED gets line-through + muted, PENDING gets just muted */}
          <h3 className={`font-medium ${isSkipped ? 'text-gray-400 line-through' : isPending ? 'text-gray-400' : 'text-gray-900'}`}>
            {phaseInfo.label}
          </h3>
          
          {/* Status dropdown - stays at full visual strength */}
          <div className="relative">
            <button 
              onClick={() => setShowStatusDropdown(!showStatusDropdown)} 
              className="hover:opacity-80 transition-opacity"
            >
              <StatusBadge status={phase.status} />
            </button>
            
            {showStatusDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowStatusDropdown(false)} 
                />
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  {allStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusSelect(status)}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${phase.status === status ? 'bg-gray-50 font-medium' : ''}`}
                    >
                      <StatusBadge status={status} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Blocked indicator icon */}
          {isBlocked && (
            <span className="text-amber-500" title="This phase is blocked">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          )}
        </div>
        
        {phase.completedDate && (
          <span className="text-xs text-gray-500">{formatDate(phase.completedDate)}</span>
        )}
      </div>

      {/* FIX: Apply muted text to description for PENDING/SKIPPED states */}
      <p className={`text-sm mb-3 ${isMuted ? 'text-gray-400' : 'text-gray-500'}`}>
        {phaseInfo.description}
      </p>

      {/* Links section - stays at full visual strength for accessibility */}
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Add Link button - stays at full visual strength, hidden for SKIPPED */}
          {!showAddLink && !isSkipped && (
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

        {/* Notes count button - stays at full visual strength */}
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
                onClick={() => { setShowAddLink(false); setLinkTitle(''); setLinkUrl(''); }}
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

const ProgressTab = ({ engagement, onStatusChange, onAddLink, onRemoveLink, onNotesClick }) => {
  if (!engagement) return null;

  return (
    <div className="space-y-4 p-4">
      {phaseConfig.map((phaseInfo) => {
        const phase = engagement.phases?.[phaseInfo.id] || { status: 'PENDING', completedDate: null, links: [] };
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
