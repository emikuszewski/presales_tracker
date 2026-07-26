import React from 'react';

/**
 * SVG icons for engagement status badges
 * Uses currentColor to inherit text color from parent badge
 * Size consistent with filter icons (w-4 h-4)
 */

const PauseIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
  </svg>
);

const WarningIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BanIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const MinusIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
  </svg>
);

/**
 * Renders the appropriate SVG icon for an engagement status
 * Returns null for ACTIVE status (no icon needed)
 * 
 * @param {string} status - Engagement status enum value
 * @param {string} className - Optional CSS classes for sizing
 */
const EngagementStatusIcon = React.memo(({ status, className = "w-4 h-4" }) => {
  switch (status) {
    case 'ON_HOLD':
      return <PauseIcon className={className} />;
    case 'UNRESPONSIVE':
      return <WarningIcon className={className} />;
    case 'WON':
      return <CheckCircleIcon className={className} />;
    case 'LOST':
      return <XCircleIcon className={className} />;
    case 'DISQUALIFIED':
      return <BanIcon className={className} />;
    case 'NO_DECISION':
      return <MinusIcon className={className} />;
    case 'ACTIVE':
    default:
      return null;
  }
});

EngagementStatusIcon.displayName = 'EngagementStatusIcon';

export default EngagementStatusIcon;
