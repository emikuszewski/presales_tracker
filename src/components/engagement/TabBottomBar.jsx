import React from 'react';
import { detailTabs } from '../../constants';

/**
 * Icon components for tabs (same as TabSidebar)
 */
const TabIcons = {
  chart: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  chat: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  clock: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  document: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};

/**
 * Bottom tab bar for mobile view (<768px)
 * 
 * @param {Object} props
 * @param {string} props.activeTab - Currently active tab id
 * @param {Function} props.onTabChange - Callback when tab is clicked
 * @param {number} props.activityCount - Total activity count for badge
 * @param {number} props.unreadCount - Unread history count for badge
 * @param {number} props.notesCount - Total notes count for badge
 */
const TabBottomBar = ({ 
  activeTab, 
  onTabChange, 
  activityCount = 0, 
  unreadCount = 0, 
  notesCount = 0 
}) => {
  
  const getBadgeValue = (tabId) => {
    switch (tabId) {
      case 'activity':
        return activityCount;
      case 'history':
        return unreadCount;
      case 'notes':
        return notesCount;
      default:
        return null;
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around">
        {detailTabs.map((tab) => {
          const IconComponent = TabIcons[tab.icon];
          const isActive = activeTab === tab.id;
          const badgeValue = getBadgeValue(tab.id);
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex flex-col items-center justify-center py-2 px-4 flex-1
                transition-colors duration-150
                ${isActive 
                  ? 'text-blue-600 border-t-2 border-blue-600 -mt-[2px]' 
                  : 'text-gray-500'
                }
              `}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              
              {/* Badge */}
              {badgeValue !== null && (
                <span 
                  className={`
                    absolute top-1 right-1/4 min-w-[16px] h-[16px] 
                    flex items-center justify-center
                    text-[10px] font-medium rounded-full px-1
                    ${tab.id === 'history' && badgeValue > 0
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBottomBar;
