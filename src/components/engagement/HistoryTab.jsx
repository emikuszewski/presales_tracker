import React, { useEffect } from 'react';
import { formatDateTime } from '../../utils';

const getChangeIcon = (changeType) => {
  const icons = {
    CREATED: '🎉', PHASE_UPDATE: '📊', ACTIVITY_ADDED: '📋',
    OWNER_ADDED: '👤', OWNER_REMOVED: '👤', COMMENT_ADDED: '💬',
    LINK_ADDED: '🔗', INTEGRATION_UPDATE: '🔌', ARCHIVED: '📦',
    RESTORED: '📤', NOTE_ADDED: '📝', NOTE_EDITED: '✏️', NOTE_DELETED: '🗑️'
  };
  return icons[changeType] || '📌';
};

const HistoryEntry = ({ entry, getOwnerInfo, isUnread }) => {
  const user = getOwnerInfo(entry.userId);
  
  return (
    <div className={`flex items-start gap-3 py-3 px-3 rounded-lg transition-colors ${isUnread ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
        {getChangeIcon(entry.changeType)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${user.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`} title={user.name}>
            {user.initials}
          </div>
          <span className="font-medium text-gray-900 text-sm">{user.name}</span>
          {isUnread && <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">New</span>}
        </div>
        <p className="text-sm text-gray-700 mt-0.5">{entry.description}</p>
        <span className="text-xs text-gray-400 mt-1 block">{formatDateTime(entry.createdAt)}</span>
      </div>
    </div>
  );
};

const HistoryTab = ({ engagement, getOwnerInfo, lastViewedAt, currentUserId, onMarkViewed }) => {
  const changeLogs = engagement?.changeLogs || [];

  useEffect(() => {
    if (onMarkViewed) onMarkViewed();
  }, [onMarkViewed]);

  const isUnread = (entry) => {
    if (!lastViewedAt || !currentUserId) return false;
    if (entry.userId === currentUserId) return false;
    return new Date(entry.createdAt) > new Date(lastViewedAt);
  };

  if (changeLogs.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📜</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No history yet</h3>
          <p className="text-gray-500">Changes to this engagement will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        Showing all changes made to this engagement, newest first.
      </div>
      <div className="space-y-1">
        {changeLogs.map((entry) => (
          <HistoryEntry key={entry.id} entry={entry} getOwnerInfo={getOwnerInfo} isUnread={isUnread(entry)} />
        ))}
      </div>
    </div>
  );
};

export default HistoryTab;
