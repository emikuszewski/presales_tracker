import React from 'react';
import Modal from '../ui/Modal';

/**
 * Modal for managing engagement owners
 * No form state - just displays current owners and available team members
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Owners">
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Current Owners</p>
        <div className="space-y-2">
          {currentOwnerIds?.map(ownerId => {
            const owner = getOwnerInfo(ownerId);
            const isInactive = owner.isActive === false;
            
            return (
              <div key={ownerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isInactive ? 'bg-gray-300 text-gray-500' :
                    ownerId === currentUserId ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {owner.initials}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{owner.name}</span>
                    {isInactive && <span className="ml-2 text-xs text-gray-500">(Inactive)</span>}
                  </div>
                </div>
                {!isOnlyOneOwner && (
                  <button 
                    onClick={() => onRemoveOwner(ownerId)}
                    className="text-sm text-red-500 hover:text-red-700"
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
        <p className="text-sm font-medium text-gray-700 mb-3">Add Owner</p>
        <div className="space-y-2">
          {availableMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-medium">
                  {member.initials}
                </div>
                <span className="text-gray-900">{member.name}</span>
              </div>
              <button 
                onClick={() => onAddOwner(member.id)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Add
              </button>
            </div>
          ))}
          {availableMembers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              All active team members are already owners
            </p>
          )}
        </div>
      </div>
      
      <div className="flex gap-3 mt-6">
        <button 
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default OwnersModal;
