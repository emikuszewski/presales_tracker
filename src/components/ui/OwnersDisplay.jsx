import React from 'react';
import { getAvatarColorClasses } from '../../utils';

/**
 * Displays a stack of owner avatars with overlap effect
 * Shows up to 3 avatars plus a "+N" indicator for additional owners
 * System users display with blue avatar styling
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
        // Use centralized helper for color classes (handles system user, inactive, current user)
        const colorClasses = getAvatarColorClasses(owner, currentUserId);
        const isInactive = owner.isActive === false;
        const isSystemUser = owner.isSystemUser === true;
        
        return (
          <div
            key={ownerId}
            className={`${sizeClasses} rounded-full flex items-center justify-center font-medium border-2 border-white ${colorClasses} ${index > 0 ? overlapClass : ''}`}
            title={`${owner.name}${isInactive ? ' (Inactive)' : ''}${isSystemUser ? ' (Shared)' : ''}`}
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
