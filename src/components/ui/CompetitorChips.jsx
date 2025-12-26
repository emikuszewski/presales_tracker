import React from 'react';
import CompetitorLogo from './CompetitorLogo';
import { competitorConfigMap } from '../../constants';

/**
 * Displays competitor logos as chips with overflow indicator
 * Shows max 3 logos + "+N" for additional competitors
 */
const CompetitorChips = React.memo(({ 
  competitors = [], 
  otherCompetitorName,
  maxDisplay = 3,
  size = 'sm',
  onClick,
  className = ''
}) => {
  if (!competitors || competitors.length === 0) {
    return null;
  }

  const displayedCompetitors = competitors.slice(0, maxDisplay);
  const overflowCount = competitors.length - maxDisplay;

  const sizeClasses = {
    xs: 'gap-0.5',
    sm: 'gap-1',
    md: 'gap-1.5'
  };

  const chipSizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7'
  };

  const overflowSizeClasses = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs'
  };

  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div 
      className={`flex items-center ${sizeClasses[size]} ${className} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={handleClick}
      title={onClick ? 'Click to edit competitors' : undefined}
    >
      {displayedCompetitors.map((competitor) => {
        const config = competitorConfigMap[competitor];
        // For OTHER, show the custom name as tooltip
        const tooltipName = competitor === 'OTHER' && otherCompetitorName 
          ? `Other: ${otherCompetitorName}` 
          : config?.label || competitor;
        
        return (
          <div 
            key={competitor} 
            className={`${chipSizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center`}
            title={tooltipName}
          >
            <CompetitorLogo competitor={competitor} size={size} />
          </div>
        );
      })}
      
      {overflowCount > 0 && (
        <div 
          className={`${overflowSizeClasses[size]} rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-medium`}
          title={`+${overflowCount} more`}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
});

CompetitorChips.displayName = 'CompetitorChips';

export default CompetitorChips;
