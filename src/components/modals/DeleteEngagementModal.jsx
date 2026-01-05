import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { WarningIcon } from '../ui';

/**
 * Modal for confirming engagement deletion with cascade impact display
 * Requires user to type company name to confirm
 */
const DeleteEngagementModal = ({ 
  isOpen, 
  onClose, 
  engagement, 
  cascadeInfo, 
  onConfirm, 
  isDeleting 
}) => {
  const [confirmText, setConfirmText] = useState('');

  // Reset confirmation text when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  if (!engagement) return null;

  const canDelete = confirmText.toLowerCase() === engagement.company.toLowerCase();

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
          <WarningIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Delete Engagement</h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        You are about to permanently delete <strong className="text-gray-900 dark:text-gray-100">{engagement.company}</strong>. This action cannot be undone.
      </p>

      {/* Cascade Impact */}
      <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">The following will be permanently deleted:</p>
        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
          <li>• {cascadeInfo.phases} phase record{cascadeInfo.phases !== 1 ? 's' : ''}</li>
          <li>• {cascadeInfo.activities} activit{cascadeInfo.activities !== 1 ? 'ies' : 'y'}</li>
          <li>• {cascadeInfo.comments} comment{cascadeInfo.comments !== 1 ? 's' : ''}</li>
          <li>• {cascadeInfo.notes || 0} note{(cascadeInfo.notes || 0) !== 1 ? 's' : ''}</li>
          <li>• {cascadeInfo.changeLogs} change log entr{cascadeInfo.changeLogs !== 1 ? 'ies' : 'y'}</li>
          <li>• {cascadeInfo.owners} owner assignment{cascadeInfo.owners !== 1 ? 's' : ''}</li>
        </ul>
      </div>

      {/* Confirmation Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type <strong className="text-gray-900 dark:text-gray-100">{engagement.company}</strong> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isDeleting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700"
          placeholder="Type company name..."
        />
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handleClose}
          disabled={isDeleting}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={!canDelete || isDeleting}
          className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Deleting...
            </>
          ) : (
            'Delete Permanently'
          )}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteEngagementModal;
