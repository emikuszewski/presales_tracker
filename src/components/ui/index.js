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
export { default as EngagementCard } from './EngagementCard';

// Icons - re-export from icons folder for backward compatibility
export { 
  // Integration icons (brand colors)
  SlackIcon, 
  DriveIcon, 
  DocsIcon, 
  SlidesIcon, 
  SheetsIcon,
  // Action icons
  ArchiveIcon,
  CheckIcon,
  CloseIcon,
  EllipsisIcon,
  FilterIcon,
  GearIcon,
  LinkIcon,
  LogoutIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  RestoreIcon,
  SearchIcon,
  TrashIcon,
  WarningIcon,
  // Navigation icons
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  // Tab/Navigation icons
  ChartIcon,
  ChatIcon,
  ClockIcon,
  DocumentIcon,
  GlobeIcon,
  // User icons
  UserIcon,
  UsersIcon,
  // TabIcons map for TabSidebar/TabBottomBar
  TabIcons
} from './icons';
