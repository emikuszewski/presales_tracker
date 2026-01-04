// Barrel export for UI components
export { default as Modal } from './Modal';
export { default as OwnersDisplay } from './OwnersDisplay';
export { default as StaleBadge } from './StaleBadge';
export { default as NotificationBadge } from './NotificationBadge';
export { default as LinkifyText } from './LinkifyText';
export { default as IntegrationLinksIndicator } from './IntegrationLinksIndicator';
export { default as CompetitorLogo } from './CompetitorLogo';
export { default as CompetitorChips } from './CompetitorChips';
export { default as EngagementStatusIcon } from './EngagementStatusIcon';

// Icons - re-export from icons folder for backward compatibility
export { 
  SlackIcon, 
  DriveIcon, 
  DocsIcon, 
  SlidesIcon, 
  SheetsIcon,
  // New extracted icons
  ArchiveIcon,
  CheckIcon,
  ChartIcon,
  ChatIcon,
  ClockIcon,
  DocumentIcon,
  EllipsisIcon,
  GearIcon,
  GlobeIcon,
  PencilIcon,
  RefreshIcon,
  RestoreIcon,
  UsersIcon,
  // TabIcons map for TabSidebar/TabBottomBar
  TabIcons
} from './icons';
