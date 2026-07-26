import React from 'react';
import Modal from '../ui/Modal';
import { getAvatarColorClasses } from '../../utils';

/**
 * Modal for managing engagement owners
 * No form state - just displays current owners and available team members
 * System users display with blue avatar styling
 */
const OwnersModal = ({ 
  isOpen, 
  onClose, 
  currentOwnerIds, 
  teamMembers, 
  currentUserId, 
  getOwnerInfo, 
  onAddOwner, 
  onRemoveOwner 
}) => {
  const availableMembers = teamMembers.filter(m => !currentOwnerIds?.includes(m.id));
  const isOnlyOneOwner = currentOwnerIds?.length === 1;

  const footerContent = (
    <div className="flex gap-3">
      <button 
        onClick={onClose}
        className="flex-1 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-white"
      >
        Done
      </button>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Manage Owners"
      scrollable
      footer={footerContent}
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Owners</p>
        <div className="space-y-2">
          {currentOwnerIds?.map(ownerId => {
            const owner = getOwnerInfo(ownerId);
            const isInactive = owner.isActive === false;
            const isSystemUser = owner.isSystemUser === true;
            // Use centralized helper for color classes
            const colorClasses = getAvatarColorClasses(owner, currentUserId);
            
            return (
              <div key={ownerId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${colorClasses}`}>
                    {owner.initials}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{owner.name}</span>
                    {isInactive && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Inactive)</span>}
                    {isSystemUser && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Shared)</span>}
                  </div>
                </div>
                {!isOnlyOneOwner && (
                  <button 
                    onClick={() => onRemoveOwner(ownerId)}
                    className="text-sm text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Add Owner</p>
        <div className="space-y-2">
          {availableMembers.map(member => {
            const isSystemUser = member.isSystemUser === true;
            // Use centralized helper for color classes
            const colorClasses = getAvatarColorClasses(member, currentUserId);
            
            return (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${colorClasses}`}>
                    {member.initials}
                  </div>
                  <div>
                    <span className="text-gray-900 dark:text-gray-100">{member.name}</span>
                    {isSystemUser && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Shared)</span>}
                  </div>
                </div>
                <button 
                  onClick={() => onAddOwner(member.id)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Add
                </button>
              </div>
            );
          })}
          {availableMembers.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              All active team members are already owners
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OwnersModal;
