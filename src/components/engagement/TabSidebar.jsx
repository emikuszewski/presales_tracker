import React from 'react';
import { detailTabs } from '../../constants';

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

const TabSidebar = ({ activeTab, onTabChange, activityCount = 0, unreadCount = 0, notesCount = 0 }) => {
  const getBadgeValue = (tabId) => {
    switch (tabId) {
      case 'activity': return activityCount;
      case 'history': return unreadCount;
      case 'notes': return notesCount;
      default: return null;
    }
  };

  return (
    <div className="hidden md:flex flex-col w-16 bg-gray-50 border-r border-gray-200 flex-shrink-0">
      {detailTabs.map((tab) => {
        const IconComponent = TabIcons[tab.icon];
        const isActive = activeTab === tab.id;
        const badgeValue = getBadgeValue(tab.id);
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex flex-col items-center justify-center py-4 px-2
              transition-colors duration-150
              ${isActive 
                ? 'bg-white border-l-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-l-2 border-transparent'
              }
            `}
            title={tab.label}
          >
            <IconComponent className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">{tab.label}</span>
            
            {badgeValue !== null && (
              <span 
                className={`
                  absolute top-2 right-2 min-w-[18px] h-[18px] 
                  flex items-center justify-center
                  text-xs font-medium rounded-full px-1
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
  );
};

export default TabSidebar;
