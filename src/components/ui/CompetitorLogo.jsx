import React from 'react';
import { competitorConfigMap } from '../../constants';

/**
 * Renders a competitor logo in monochrome gray
 * Uses SVG for known logos, initials fallback for others
 */
const CompetitorLogo = React.memo(({ competitor, size = 'sm', className = '' }) => {
  const config = competitorConfigMap[competitor];
  if (!config) return null;

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-7 h-7 text-xs'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  const iconSize = size === 'xs' ? 12 : size === 'sm' ? 14 : 16;

  // SVG logos - all rendered in monochrome gray (#6B7280)
  const renderSvgLogo = () => {
    switch (competitor) {
      case 'OKTA':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 0C5.389 0 0 5.389 0 12s5.389 12 12 12 12-5.389 12-12S18.611 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
          </svg>
        );

      case 'MICROSOFT_ENTRA':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M11 11V0H0v11h11zm2 0h11V0H13v11zM11 24v-11H0v11h11zm2 0h11V13H13v11z"/>
          </svg>
        );

      case 'AWS_VERIFIED_PERMISSIONS':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm0 2.18l8.25 4.71v9.42L12 21.02l-8.25-4.71V6.89L12 2.18zm-1 5.32v9l-5-2.86V9.36l5-1.86zm2 0l5 1.86v4.28l-5 2.86v-9z"/>
          </svg>
        );

      case 'PING_IDENTITY':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );

      case 'KEYCLOAK':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14c-2.67 0-8-1.33-8-4v-1c0-1.33 2.67-2 8-2s8 .67 8 2v1c0 2.67-5.33 4-8 4z"/>
          </svg>
        );

      case 'STYRA_OPA':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        );

      // Simplified SVGs
      case 'FORGEROCK':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        );

      case 'SAILPOINT':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.06 13.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z"/>
          </svg>
        );

      case 'CYBERARK':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        );

      case 'ORY':
        return (
          <svg viewBox="0 0 24 24" className={`${sizeClass} ${className}`} fill="#6B7280">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        );

      default:
        return null;
    }
  };

  // Initials fallback
  const renderInitials = () => {
    return (
      <div 
        className={`${sizeClass} ${className} rounded bg-gray-200 text-gray-600 flex items-center justify-center font-medium`}
        title={config.label}
      >
        {config.initials}
      </div>
    );
  };

  // Check if we have an SVG logo
  const hasSvg = ['OKTA', 'MICROSOFT_ENTRA', 'AWS_VERIFIED_PERMISSIONS', 'PING_IDENTITY', 'KEYCLOAK', 'STYRA_OPA', 'FORGEROCK', 'SAILPOINT', 'CYBERARK', 'ORY'].includes(competitor);

  if (hasSvg) {
    return (
      <div className={`flex items-center justify-center ${className}`} title={config.label}>
        {renderSvgLogo()}
      </div>
    );
  }

  return renderInitials();
});

CompetitorLogo.displayName = 'CompetitorLogo';

export default CompetitorLogo;
