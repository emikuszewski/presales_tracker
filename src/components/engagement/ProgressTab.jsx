import React, { useState, useRef, useEffect } from 'react';
import { phaseConfig } from '../../constants';
import { formatDate, formatRelativeTime } from '../../utils';
import { WarningIcon, PlusIcon, CloseIcon, LinkIcon } from '../ui';

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    IN_PROGRESS: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    COMPLETE: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    BLOCKED: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    SKIPPED: 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 italic'
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

/**
 * Extract first name from full name
 * For system users (like "SE Team"), return full name
 */
const getFirstName = (fullName, isSystemUser) => {
  if (!fullName) return 'SE Team';
  if (isSystemUser) return fullName;
  
  const parts = fullName.trim().split(' ');
  return parts[0] || fullName;
};

/**
 * Inline note input component for adding notes from Progress tab
 */
const InlineNoteInput = ({ phaseType, onAdd, onCancel }) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAdd(phaseType, text.trim());
    setText('');
    setIsSubmitting(false);
    onCancel(); // Close the form after saving
  };

  const handleKeyDown = (e) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="mt-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a note..."
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

/**
 * Note preview component - shows latest note with author and timestamp
 */
const NotePreview = ({ note, getOwnerInfo, onClick }) => {
  if (!note) return null;

  // Get author info - fallback to SE Team if unknown
  const author = getOwnerInfo(note.authorId);
  const authorName = author?.name || 'SE Team';
  const isSystemUser = author?.isSystemUser || !author?.name;
  const firstName = getFirstName(authorName, isSystemUser);
  const relativeTime = formatRelativeTime(note.createdAt);

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      {/* Note text - 2 lines max with ellipsis */}
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
        "{note.text}"
      </p>
      {/* Attribution */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        — {firstName}, {relativeTime}
      </p>
    </button>
  );
};

const PhaseCard = ({ 
  phase, 
  phaseType, 
  phaseInfo, 
  latestNote,
  notesCount, 
  onStatusChange, 
  onAddLink, 
  onRemoveLink, 
  onNotesClick,
  onAddNote,
  getOwnerInfo
}) => {
  const [showAddLink, setShowAddLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

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

  const handleNotePreviewClick = () => {
    onNotesClick(phaseType);
  };

  const handleAddNoteClick = () => {
    setShowAddNote(true);
  };

  const handleCancelAddNote = () => {
    setShowAddNote(false);
  };

  const isPending = phase.status === 'PENDING';
  const isSkipped = phase.status === 'SKIPPED';
  const isBlocked = phase.status === 'BLOCKED';

  // Determine if content should be muted (PENDING or SKIPPED states)
  const isMuted = isPending || isSkipped;

  // All available statuses for the dropdown
  const allStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETE', 'BLOCKED', 'SKIPPED'];

  // Check if we have notes
  const hasNotes = notesCount > 0;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border ${isBlocked ? 'border-amber-300 dark:border-amber-600' : 'border-gray-200 dark:border-gray-700'} p-4`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`font-medium ${isSkipped ? 'text-gray-400 dark:text-gray-500 line-through' : isPending ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
            {phaseInfo.label}
          </h3>
          
          {/* Status dropdown */}
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
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                  {allStatuses.map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusSelect(status)}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${phase.status === status ? 'bg-gray-50 dark:bg-gray-700 font-medium' : ''}`}
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
            <span className="text-amber-500 dark:text-amber-400" title="This phase is blocked">
              <WarningIcon className="w-4 h-4" />
            </span>
          )}
        </div>
        
        {phase.completedDate && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(phase.completedDate)}</span>
        )}
      </div>

      {/* Note preview area OR Add note button */}
      <div className={`mb-3 ${isMuted ? 'opacity-75' : ''}`}>
        {hasNotes ? (
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <NotePreview 
                note={latestNote} 
                getOwnerInfo={getOwnerInfo}
                onClick={handleNotePreviewClick}
              />
            </div>
            {/* Add note button [+] */}
            <button
              onClick={handleAddNoteClick}
              className="flex-shrink-0 p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Add note"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddNoteClick}
            className="w-full py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg flex items-center justify-center gap-1 transition-colors border border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
          >
            <PlusIcon className="w-4 h-4" />
            Add note
          </button>
        )}
      </div>

      {/* Inline add note form */}
      {showAddNote && onAddNote && (
        <InlineNoteInput
          phaseType={phaseType}
          onAdd={onAddNote}
          onCancel={handleCancelAddNote}
        />
      )}

      {/* Links section */}
      {phase.links && phase.links.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {phase.links.map((link, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 group">
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {link.title}
                </a>
                <button
                  onClick={() => onRemoveLink(phaseType, idx)}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  title="Remove link"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom action row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Add Link button - hidden for SKIPPED */}
          {!showAddLink && !isSkipped && (
            <button 
              onClick={() => setShowAddLink(true)} 
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <LinkIcon className="w-4 h-4" />
              Add Link
            </button>
          )}
        </div>

        {/* Notes count button */}
        {notesCount > 0 && (
          <button 
            onClick={() => onNotesClick(phaseType)} 
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
          >
            📝 {notesCount} note{notesCount !== 1 ? 's' : ''} →
          </button>
        )}
      </div>

      {/* Add link form */}
      {showAddLink && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Link title"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
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
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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

const ProgressTab = ({ 
  engagement, 
  onStatusChange, 
  onAddLink, 
  onRemoveLink, 
  onNotesClick,
  onAddNote,
  getOwnerInfo
}) => {
  if (!engagement) return null;

  return (
    <div className="space-y-4 p-4">
      {phaseConfig.map((phaseInfo) => {
        const phase = engagement.phases?.[phaseInfo.id] || { status: 'PENDING', completedDate: null, links: [] };
        const phaseNotes = engagement.notesByPhase?.[phaseInfo.id] || [];
        const notesCount = phaseNotes.length;
        const latestNote = phaseNotes[0] || null; // Notes are sorted newest first

        return (
          <PhaseCard
            key={phaseInfo.id}
            phase={phase}
            phaseType={phaseInfo.id}
            phaseInfo={phaseInfo}
            latestNote={latestNote}
            notesCount={notesCount}
            onStatusChange={onStatusChange}
            onAddLink={onAddLink}
            onRemoveLink={onRemoveLink}
            onNotesClick={onNotesClick}
            onAddNote={onAddNote}
            getOwnerInfo={getOwnerInfo}
          />
        );
      })}
    </div>
  );
};

export default ProgressTab;
