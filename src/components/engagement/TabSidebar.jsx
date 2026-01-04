import React from 'react';
import { detailTabs } from '../../constants';
import { TabIcons } from '../ui';

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
