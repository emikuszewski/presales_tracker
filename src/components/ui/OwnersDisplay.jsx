import React from 'react';

/**
 * Displays a stack of owner avatars with overlap effect
 * Shows up to 3 avatars plus a "+N" indicator for additional owners
 */
const OwnersDisplay = React.memo(({ 
  ownerIds, 
  size = 'md', 
  getOwnerInfo, 
  currentUserId 
}) => {
  const sizeClasses = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const overlapClass = size === 'sm' ? '-ml-2' : '-ml-3';
  
  return (
    <div className="flex items-center">
      {ownerIds?.slice(0, 3).map((ownerId, index) => {
        const owner = getOwnerInfo(ownerId);
        const isCurrentUser = ownerId === currentUserId;
        const isInactive = owner.isActive === false;
        return (
          <div
            key={ownerId}
            className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 border-white ${
              isInactive ? 'bg-gray-300 text-gray-500' :
              isCurrentUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
            } ${index > 0 ? overlapClass : ''}`}
            title={`${owner.name}${isInactive ? ' (Inactive)' : ''}`}
            style={{ zIndex: 10 - index }}
          >
            {owner.initials}
          </div>
        );
      })}
      {ownerIds?.length > 3 && (
        <div className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 border-white bg-gray-200 text-gray-600 ${overlapClass}`}>
          +{ownerIds.length - 3}
        </div>
      )}
    </div>
  );
});

OwnersDisplay.displayName = 'OwnersDisplay';

export default OwnersDisplay;
