import React from 'react';
import Modal from '../ui/Modal';
import { WarningIcon, RefreshIcon } from '../ui';

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
          <WarningIcon className="w-5 h-5 text-amber-600" />
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
          <RefreshIcon className="w-4 h-4" />
          Refresh
        </button>
      </div>
    </Modal>
  );
};

export default ConflictModal;
