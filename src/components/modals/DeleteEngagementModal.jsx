import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

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
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900">Delete Engagement</h3>
      </div>

      <p className="text-gray-600 mb-4">
        You are about to permanently delete <strong>{engagement.company}</strong>. This action cannot be undone.
      </p>

      {/* Cascade Impact */}
      <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
        <p className="text-sm font-medium text-red-800 mb-2">The following will be permanently deleted:</p>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• {cascadeInfo.phases} phase record{cascadeInfo.phases !== 1 ? 's' : ''}</li>
          <li>• {cascadeInfo.activities} activit{cascadeInfo.activities !== 1 ? 'ies' : 'y'}</li>
          <li>• {cascadeInfo.comments} comment{cascadeInfo.comments !== 1 ? 's' : ''}</li>
          <li>• {cascadeInfo.changeLogs} change log entr{cascadeInfo.changeLogs !== 1 ? 'ies' : 'y'}</li>
          <li>• {cascadeInfo.owners} owner assignment{cascadeInfo.owners !== 1 ? 's' : ''}</li>
        </ul>
      </div>

      {/* Confirmation Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type <strong>{engagement.company}</strong> to confirm
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isDeleting}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="Type company name..."
        />
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handleClose}
          disabled={isDeleting}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          onClick={onConfirm}
          disabled={!canDelete || isDeleting}
          className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
