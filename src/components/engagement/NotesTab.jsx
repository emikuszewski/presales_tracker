import React, { useState, useEffect, useRef } from 'react';
import { phaseConfig } from '../../constants';
import LinkifyText from '../ui/LinkifyText';

const formatNoteDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return date.getFullYear() === now.getFullYear() 
    ? `${month} ${day}` 
    : `${month} ${day}, ${date.getFullYear()}`;
};

const NoteCard = ({ 
  note, 
  getOwnerInfo, 
  onEdit, 
  onDelete, 
  isEditing, 
  editText, 
  setEditText, 
  onSaveEdit, 
  onCancelEdit 
}) => {
  const author = getOwnerInfo(note.authorId);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 240) + 'px';
    }
  }, [isEditing, editText]);

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-blue-300 p-3">
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => {
            setEditText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 240) + 'px';
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          rows={3}
          placeholder="Edit note..."
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onSaveEdit}
            disabled={!editText.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 group hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{formatNoteDate(note.createdAt)}</span>
          <span>·</span>
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
              author.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
            }`}
            title={author.name}
          >
            {author.initials}
          </span>
          {note.updatedAt && note.updatedAt !== note.createdAt && (
            <>
              <span>·</span>
              <span className="italic">Edited</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(note)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(note)}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap">
        <LinkifyText text={note.text} />
      </div>
    </div>
  );
};

const AddNoteInput = ({ onAdd, phaseType }) => {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAdd(phaseType, text.trim());
    setText('');
    setIsExpanded(false);
    setIsSubmitting(false);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add note
      </button>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm bg-white"
        rows={3}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => { setText(''); setIsExpanded(false); }}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
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

const PhaseNotesSection = ({ 
  phaseType, 
  phaseInfo, 
  notes, 
  isPending, 
  isExpanded, 
  onToggle, 
  getOwnerInfo, 
  onAddNote, 
  onEditNote, 
  onDeleteNote, 
  scrollRef 
}) => {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const hasNotes = notes && notes.length > 0;

  const isLabelMuted = isPending && !hasNotes;

  const handleStartEdit = (note) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = async () => {
    if (editingNoteId && editText.trim()) {
      await onEditNote(editingNoteId, phaseType, editText.trim());
      setEditingNoteId(null);
      setEditText('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const handleConfirmDelete = async (note) => {
    await onDeleteNote(note.id, phaseType);
    setShowDeleteConfirm(null);
  };

  return (
    <div ref={scrollRef} className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className={`font-medium ${isLabelMuted ? 'text-gray-400' : 'text-gray-900'}`}>
            {phaseInfo.label}
          </span>
          {hasNotes && (
            <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
              {notes.length}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          {hasNotes ? (
            notes.map((note) => (
              <React.Fragment key={note.id}>
                <NoteCard
                  note={note}
                  getOwnerInfo={getOwnerInfo}
                  onEdit={handleStartEdit}
                  onDelete={(n) => setShowDeleteConfirm(n)}
                  isEditing={editingNoteId === note.id}
                  editText={editText}
                  setEditText={setEditText}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
                {showDeleteConfirm?.id === note.id && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-red-700">Delete this note?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleConfirmDelete(note)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No notes yet</p>
          )}
          <AddNoteInput onAdd={onAddNote} phaseType={phaseType} />
        </div>
      )}
    </div>
  );
};

const NotesTab = ({ 
  engagement, 
  getOwnerInfo, 
  onAddNote, 
  onEditNote, 
  onDeleteNote, 
  scrollToPhase 
}) => {
  const [expandedPhases, setExpandedPhases] = useState(() => {
    const expanded = {};
    phaseConfig.forEach(p => {
      expanded[p.id] = engagement?.notesByPhase?.[p.id]?.length > 0;
    });
    return expanded;
  });
  const scrollRefs = useRef({});

  useEffect(() => {
    if (scrollToPhase) {
      setExpandedPhases(prev => ({ ...prev, [scrollToPhase]: true }));
      setTimeout(() => {
        scrollRefs.current[scrollToPhase]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [scrollToPhase]);

  const currentPhase = engagement?.currentPhase || 'DISCOVER';
  const currentPhaseIndex = phaseConfig.findIndex(p => p.id === currentPhase);

  const togglePhase = (phaseId) => {
    setExpandedPhases(prev => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-gray-500 mb-4">
        Running notes for each phase. Notes are shared with all engagement owners.
      </p>
      {phaseConfig.map((phaseInfo, idx) => (
        <PhaseNotesSection
          key={phaseInfo.id}
          phaseType={phaseInfo.id}
          phaseInfo={phaseInfo}
          notes={engagement?.notesByPhase?.[phaseInfo.id] || []}
          isPending={idx > currentPhaseIndex}
          isExpanded={expandedPhases[phaseInfo.id] || false}
          onToggle={() => togglePhase(phaseInfo.id)}
          getOwnerInfo={getOwnerInfo}
          onAddNote={onAddNote}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
          scrollRef={(el) => { scrollRefs.current[phaseInfo.id] = el; }}
        />
      ))}
    </div>
  );
};

export default NotesTab;
