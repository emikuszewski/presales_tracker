import React from 'react';

/**
 * Displays a notification count badge
 * Shows "9+" for counts greater than 9
 */
const NotificationBadge = React.memo(({ count }) => {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

export default NotificationBadge;
