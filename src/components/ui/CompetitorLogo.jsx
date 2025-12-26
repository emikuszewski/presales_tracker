import React from 'react';
import { competitorConfigMap } from '../../constants';

/**
 * Renders a competitor logo in monochrome gray (#6B7280)
 * Brand-accurate SVG logos optimized for 20-28px chip display
 * 
 * All 21 competitors implemented with recognizable brand logos
 */
const CompetitorLogo = React.memo(({ competitor, size = 'sm', className = '' }) => {
  const config = competitorConfigMap[competitor];
  if (!config) return null;

  const sizeClasses = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.sm;
  const fillColor = '#6B7280';
  const strokeColor = '#6B7280';

  // SVG logos - all rendered in monochrome gray
  const renderLogo = () => {
    switch (competitor) {
      // ============================================
      // OKTA - Thick donut/ring
      // ============================================
      case 'OKTA':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            <path d="M12 0C5.389 0 0 5.389 0 12s5.389 12 12 12 12-5.389 12-12S18.611 0 12 0zm0 18c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686 6 6-2.686 6-6 6z"/>
          </svg>
        );

      // ============================================
      // MICROSOFT ENTRA - 2x2 grid of squares
      // ============================================
      case 'MICROSOFT_ENTRA':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            <rect x="1" y="1" width="10" height="10" rx="1"/>
            <rect x="13" y="1" width="10" height="10" rx="1"/>
            <rect x="1" y="13" width="10" height="10" rx="1"/>
            <rect x="13" y="13" width="10" height="10" rx="1"/>
          </svg>
        );

      // ============================================
      // AWS VERIFIED PERMISSIONS - Amazon "a" + smile arrow
      // Vertically stacked and centered
      // ============================================
      case 'AWS_VERIFIED_PERMISSIONS':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Amazon lowercase "a" - double-story style */}
            {/* Outer bowl shape */}
            <path d="
              M11 3
              C7.5 3 5 5.5 5 8.5
              C5 11.5 7.5 14 11 14
              C12.2 14 13.3 13.6 14 13
              L14 14
              L17 14
              L17 8.5
              C17 5 14.5 3 11 3
              Z
              M11 6
              C13 6 14 7 14 8.5
              L14 10.5
              C13.3 11.4 12.2 12 11 12
              C9 12 7.5 10.5 7.5 8.5
              C7.5 6.5 9 6 11 6
              Z
            "/>
            {/* Amazon smile arrow - curved swoosh with arrow tip */}
            <path d="
              M3 18.5
              Q12 22.5 19.5 18
              L18.5 19.5
              L21 20
              L20 17
              L18.5 18
              Q12 21 4.5 18
              Z
            "/>
          </svg>
        );

      // ============================================
      // PING IDENTITY - Bold "Ping" wordmark
      // ============================================
      case 'PING_IDENTITY':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass}>
            <text 
              x="12" 
              y="16" 
              textAnchor="middle" 
              fontFamily="Arial, sans-serif" 
              fontWeight="900" 
              fontSize="9"
              fill={fillColor}
            >
              PING
            </text>
          </svg>
        );

      // ============================================
      // KEYCLOAK - Key inside shield outline
      // ============================================
      case 'KEYCLOAK':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke={strokeColor} strokeWidth="1.5">
            {/* Shield outline */}
            <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5V6l-8-4z" strokeLinejoin="round"/>
            {/* Key head (circle) */}
            <circle cx="12" cy="9" r="2.5" fill={fillColor}/>
            {/* Key shaft */}
            <path d="M12 11.5v5" strokeWidth="2" strokeLinecap="round"/>
            {/* Key teeth */}
            <path d="M12 14.5h2M12 16.5h1.5" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );

      // ============================================
      // CYBERARK - Isometric nested cube (vault/ark)
      // ============================================
      case 'CYBERARK':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round">
            {/* Outer cube - isometric view */}
            <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z"/>
            {/* Top face lines */}
            <path d="M12 2v6.5M4 6.5l8 4.5 8-4.5"/>
            {/* Inner cube cutout */}
            <path d="M12 11l4 2.25v4.5L12 20l-4-2.25v-4.5L12 11z"/>
            {/* Inner cube top */}
            <path d="M8 13.25l4 2.25 4-2.25"/>
          </svg>
        );

      // ============================================
      // FORGEROCK - Two interlocking angular pieces (gem/rock)
      // ============================================
      case 'FORGEROCK':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Left piece - solid angular chevron */}
            <path d="M2 12l6-8v16l-6-8z"/>
            {/* Right piece - hexagonal with stripe cutouts */}
            <path d="M10 4l8 4v8l-8 4V4z"/>
            {/* Diagonal stripe cutouts (negative space) */}
            <path d="M12 6l4 2v2l-4-2V6z" fill="white"/>
            <path d="M12 12l4 2v2l-4-2v-2z" fill="white"/>
          </svg>
        );

      // ============================================
      // SAILPOINT - Triangular sail/pyramid
      // ============================================
      case 'SAILPOINT':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Main triangle/sail shape */}
            <path d="M12 2L3 20h18L12 2z"/>
            {/* Inner facet lines for 3D effect */}
            <path d="M12 2v18M12 20L3 20" fill="none" stroke="white" strokeWidth="1" opacity="0.5"/>
            <path d="M12 20l9 0" fill="none" stroke="white" strokeWidth="1" opacity="0.3"/>
          </svg>
        );

      // ============================================
      // ORY - Vertical stack: chevron up + circle + chevron down
      // ============================================
      case 'ORY':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Upward chevron */}
            <path d="M6 9l6-5 6 5" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            {/* Center circle */}
            <circle cx="12" cy="12" r="3"/>
            {/* Downward chevron */}
            <path d="M6 15l6 5 6-5" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );

      // ============================================
      // AXIOMATICS - Hexagon with stacked cube inside
      // ============================================
      case 'AXIOMATICS':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke={strokeColor} strokeWidth="1.5">
            {/* Outer hexagon */}
            <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" strokeLinejoin="round"/>
            {/* Isometric cube layers inside */}
            <path d="M12 8l4 2v3l-4 2-4-2v-3l4-2z" fill={fillColor} stroke="none"/>
            <path d="M8 10l4 2 4-2M12 12v3" stroke="white" strokeWidth="1"/>
          </svg>
        );

      // ============================================
      // ASERTO - Circle with A-shaped negative space
      // ============================================
      case 'ASERTO':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass}>
            {/* Outer circle */}
            <circle cx="12" cy="12" r="10" fill={fillColor}/>
            {/* A-shaped cutout (arrow pointing up, no crossbar) */}
            <path d="M12 5l5 12h-3l-2-5-2 5H7l5-12z" fill="white"/>
          </svg>
        );

      // ============================================
      // AMIDA - Stylized A with parallel stripes + dot
      // ============================================
      case 'AMIDA':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Left side - three parallel diagonal stripes */}
            <path d="M5 20l4-16h1.5l-4 16H5z"/>
            <path d="M7.5 20l4-16H13l-4 16H7.5z"/>
            <path d="M10 20l4-16h1.5l-4 16H10z"/>
            {/* Right side - single solid diagonal */}
            <path d="M14 20l4-16h2l-4 16h-2z"/>
            {/* Dot in upper right */}
            <circle cx="20" cy="6" r="2"/>
          </svg>
        );

      // ============================================
      // NEXTLABS - X with softened terminals + orbital arcs
      // ============================================
      case 'NEXTLABS':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round">
            {/* Central X */}
            <path d="M6 6l12 12M18 6L6 18"/>
            {/* Inner circle */}
            <circle cx="12" cy="12" r="3" strokeWidth="1.5"/>
            {/* Orbital arc segments on right */}
            <path d="M18 8a7 7 0 0 1 0 8" strokeWidth="1.5"/>
            <path d="M20 6a10 10 0 0 1 0 12" strokeWidth="1.5"/>
          </svg>
        );

      // ============================================
      // PERMIT_IO - Shiba Inu dog head silhouette
      // ============================================
      case 'PERMIT_IO':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Dog head silhouette with pointed ears */}
            <path d="
              M12 3
              L8 2 L6 7
              L3 9 L4 12
              L3 15 L6 17
              L8 21 L16 21
              L18 17 L21 15
              L20 12 L21 9
              L18 7 L16 2
              L12 3
              Z
            "/>
            {/* Eyes */}
            <circle cx="9" cy="11" r="1.5" fill="white"/>
            <circle cx="15" cy="11" r="1.5" fill="white"/>
            {/* Nose */}
            <ellipse cx="12" cy="15" rx="2" ry="1.5" fill="white"/>
          </svg>
        );

      // ============================================
      // SAVIYNT - Bold S with chevron notch in lower curve
      // ============================================
      case 'SAVIYNT':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Bold S shape */}
            <path d="
              M17 6.5
              C17 4 14.5 2 11.5 2
              C8.5 2 6 4 6 6.5
              C6 9 8 10 11 11
              C14 12 17 13 17 16
              C17 19 14.5 21 11.5 21
              C8.5 21 6 19 6 16.5
              L9 16.5
              C9 17.5 10 19 11.5 19
              C13 19 14 17.5 14 16.5
              C14 15 12.5 14 10 13
              C7.5 12 6 10.5 6 7.5
              C6 4.5 8.5 2 11.5 2
            "/>
            {/* Chevron notch cutout in lower left of S */}
            <path d="M6 18l3-2-3-2v4z" fill="white"/>
          </svg>
        );

      // ============================================
      // CERBOS - Monster/creature silhouette with ears and teeth
      // ============================================
      case 'CERBOS':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Monster head silhouette */}
            <path d="
              M4 8 L4 4 L7 8
              L7 6 C7 3, 17 3, 17 6
              L17 8 L20 4 L20 8
              L20 14 C20 18, 16 21, 12 21
              C8 21, 4 18, 4 14
              L4 8 Z
            "/>
            {/* Eyes */}
            <circle cx="9" cy="11" r="2" fill="white"/>
            <circle cx="15" cy="11" r="2" fill="white"/>
            {/* Pupils */}
            <circle cx="9" cy="11" r="1" fill={fillColor}/>
            <circle cx="15" cy="11" r="1" fill={fillColor}/>
            {/* Jagged teeth */}
            <path d="M8 17l1-2 1 2 1-2 1 2 1-2 1 2 1-2 1 2" fill="white"/>
          </svg>
        );

      // ============================================
      // ONE_IDENTITY - Circle ring with orbital/swirl arcs
      // ============================================
      case 'ONE_IDENTITY':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round">
            {/* Central ring */}
            <circle cx="12" cy="12" r="4"/>
            {/* Orbital arc segments at increasing radii, staggered */}
            <path d="M12 2a10 10 0 0 1 8.5 4.5" strokeWidth="2"/>
            <path d="M21 10a10 10 0 0 1-2 8" strokeWidth="2"/>
            <path d="M16 20.5a10 10 0 0 1-9 0" strokeWidth="2"/>
            <path d="M3 14a10 10 0 0 1 1-8" strokeWidth="2"/>
          </svg>
        );

      // ============================================
      // STYRA - Filled circle with Viking helmet negative space
      // ============================================
      case 'STYRA':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass}>
            {/* Outer filled circle */}
            <circle cx="12" cy="12" r="11" fill={fillColor}/>
            {/* Viking helmet as negative space (white) */}
            {/* Helmet body */}
            <path d="M6 14 C6 10, 8 7, 12 7 C16 7, 18 10, 18 14 L18 16 L6 16 Z" fill="white"/>
            {/* Left horn curving outward */}
            <path d="M7 11 C4 8, 3 5, 5 4 C6 5, 6 8, 8 10" fill="white"/>
            {/* Right horn curving outward */}
            <path d="M17 11 C20 8, 21 5, 19 4 C18 5, 18 8, 16 10" fill="white"/>
            {/* Bottom notch */}
            <rect x="10" y="16" width="4" height="2" fill="white"/>
          </svg>
        );

      // ============================================
      // OPA - Viking helmet as positive shape (distinguishes from Styra)
      // ============================================
      case 'OPA':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Left horn */}
            <path d="M3 3 C5 5, 5 9, 7 12 L9 10 C7 7, 6 4, 5 2 Z"/>
            {/* Right horn */}
            <path d="M21 3 C19 5, 19 9, 17 12 L15 10 C17 7, 18 4, 19 2 Z"/>
            {/* Helmet body */}
            <path d="M5 11 C5 7, 8 5, 12 5 C16 5, 19 7, 19 11 L19 18 C19 19, 18 20, 17 20 L7 20 C6 20, 5 19, 5 18 Z"/>
            {/* Center dot/rivet */}
            <circle cx="12" cy="12" r="2" fill="white"/>
            {/* Slight shading split - left side darker effect via opacity */}
            <path d="M5 11 C5 7, 8 5, 12 5 L12 20 L7 20 C6 20, 5 19, 5 18 Z" opacity="0.8"/>
          </svg>
        );

      // ============================================
      // ZANZIBAR - Google "G" logo shape
      // ============================================
      case 'ZANZIBAR':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Google G shape - simplified */}
            <path d="
              M12 2
              C6.48 2 2 6.48 2 12
              C2 17.52 6.48 22 12 22
              C17.52 22 22 17.52 22 12
              L22 11
              L12 11
              L12 14
              L18.5 14
              C17.93 17.45 15.24 19 12 19
              C8.13 19 5 15.87 5 12
              C5 8.13 8.13 5 12 5
              C13.93 5 15.68 5.79 16.95 7.05
              L19.07 4.93
              C17.22 3.13 14.73 2 12 2
              Z
            "/>
          </svg>
        );

      // ============================================
      // OTHER - Question mark icon
      // ============================================
      case 'OTHER':
        return (
          <svg viewBox="0 0 24 24" className={sizeClass} fill={fillColor}>
            {/* Circle background */}
            <circle cx="12" cy="12" r="10" fill={fillColor}/>
            {/* Question mark */}
            <path 
              d="M9 9c0-2 1.5-3 3-3s3 1 3 3c0 1.5-1 2-2 2.5-.5.25-1 .75-1 1.5" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            {/* Dot */}
            <circle cx="12" cy="17" r="1.5" fill="white"/>
          </svg>
        );

      default:
        return null;
    }
  };

  const logo = renderLogo();

  // If we have a logo, wrap it in a container
  if (logo) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`} 
        title={config.label}
      >
        {logo}
      </div>
    );
  }

  // Fallback to initials (should not happen with full implementation)
  return (
    <div 
      className={`${sizeClass} ${className} rounded bg-gray-200 text-gray-600 flex items-center justify-center font-medium text-xs`}
      title={config.label}
    >
      {config.initials}
    </div>
  );
});

CompetitorLogo.displayName = 'CompetitorLogo';

export default CompetitorLogo;
