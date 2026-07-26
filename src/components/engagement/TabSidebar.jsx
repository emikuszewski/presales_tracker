import React from 'react';
import { detailTabs } from '../../constants';
import { TabIcons } from '../ui';

const TabSidebar = ({ activeTab, onTabChange, activityCount = 0, unreadCount = 0, notesCount = 0, hiddenTabs = [] }) => {
  const getBadgeValue = (tabId) => {
    switch (tabId) {
      case 'activity': return activityCount;
      case 'history': return unreadCount;
      case 'notes': return notesCount;
      default: return null;
    }
  };

  // Filter out hidden tabs
  const visibleTabs = detailTabs.filter((tab) => hiddenTabs.indexOf(tab.id) === -1);

  return (
    <div className="hidden md:flex flex-col w-16 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
      {visibleTabs.map((tab) => {
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
                ? 'bg-white dark:bg-gray-900 border-l-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 border-l-2 border-transparent'
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
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
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
