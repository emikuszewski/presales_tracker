import React from 'react';
import { detailTabs } from '../../constants';
import { TabIcons } from '../ui';

const TabBottomBar = ({ activeTab, onTabChange, activityCount = 0, unreadCount = 0, notesCount = 0 }) => {
  const getBadgeValue = (tabId) => {
    switch (tabId) {
      case 'activity': return activityCount;
      case 'history': return unreadCount;
      case 'notes': return notesCount;
      default: return null;
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40">
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
                  ? 'text-blue-600 dark:text-blue-400 border-t-2 border-blue-600 dark:border-blue-400 -mt-[2px]' 
                  : 'text-gray-500 dark:text-gray-400'
                }
              `}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
              
              {badgeValue !== null && (
                <span 
                  className={`
                    absolute top-1 right-1/4 min-w-[16px] h-[16px] 
                    flex items-center justify-center
                    text-[10px] font-medium rounded-full px-1
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
    </div>
  );
};

export default TabBottomBar;
