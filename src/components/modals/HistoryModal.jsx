import React from 'react';
import Modal from '../ui/Modal';
import LinkifyText from '../ui/LinkifyText';
import { changeTypeLabels } from '../../constants';
import { getAvatarColorClasses } from '../../utils';

/**
 * Modal for viewing engagement change history
 * Read-only, scrollable for long histories
 * System users display with blue avatar styling
 */
const HistoryModal = ({ 
  isOpen, 
  onClose, 
  changeLogs, 
  currentUserId, 
  getOwnerInfo 
}) => {
  const footerContent = (
    <div className="flex gap-3">
      <button 
        onClick={onClose}
        className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
      >
        Close
      </button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Change History" 
      size="lg" 
      scrollable
      footer={footerContent}
    >
      <div className="space-y-3">
        {changeLogs?.length > 0 ? (
          changeLogs.map((log) => {
            const author = getOwnerInfo(log.userId);
            // Use centralized helper for color classes (handles system user, inactive, current user)
            const colorClasses = getAvatarColorClasses(author, currentUserId);
            
            return (
              <div key={log.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${colorClasses}`}>
                  {author.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{author.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      {changeTypeLabels[log.changeType] || log.changeType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    <LinkifyText text={log.description} />
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center py-8">No change history yet</p>
        )}
      </div>
    </Modal>
  );
};

export default HistoryModal;
