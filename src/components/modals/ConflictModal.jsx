import React from 'react';
import Modal from '../ui/Modal';

/**
 * Modal shown when an optimistic locking conflict is detected.
 * This occurs when another user modified or deleted a record while
 * the current user was viewing/editing it.
 * 
 * Layer 2 of stale data prevention: last line of defense against
 * data loss from concurrent edits.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {string} props.recordType - Type of record that conflicted (e.g., "activity", "phase")
 * @param {Function} props.onRefresh - Callback to refresh all data
 * @param {Function} props.onDismiss - Callback to close modal without refreshing
 */
const ConflictModal = ({ isOpen, recordType = 'record', onRefresh, onDismiss }) => {
  const handleRefresh = () => {
    onRefresh();
  };

  const handleDismiss = () => {
    onDismiss();
  };

  return (
    <Modal isOpen={isOpen} onClose={onDismiss}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900">Sync Conflict</h3>
      </div>

      <p className="text-gray-600 mb-6">
        This {recordType} was changed by another user. Refresh to see the current version.
      </p>

      <div className="flex gap-3">
        <button 
          onClick={handleDismiss}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Dismiss
        </button>
        <button 
          onClick={handleRefresh}
          className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
    </Modal>
  );
};

export default ConflictModal;
