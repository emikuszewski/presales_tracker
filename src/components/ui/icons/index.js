// ============================================================================
// ICONS BARREL EXPORT
// ============================================================================

// Action icons
export { default as ArchiveIcon } from './ArchiveIcon';
export { default as CheckIcon } from './CheckIcon';
export { default as CloseIcon } from './CloseIcon';
export { default as EllipsisIcon } from './EllipsisIcon';
export { default as FilterIcon } from './FilterIcon';
export { default as GearIcon } from './GearIcon';
export { default as LinkIcon } from './LinkIcon';
export { default as LogoutIcon } from './LogoutIcon';
export { default as PencilIcon } from './PencilIcon';
export { default as PlusIcon } from './PlusIcon';
export { default as RefreshIcon } from './RefreshIcon';
export { default as RestoreIcon } from './RestoreIcon';
export { default as SearchIcon } from './SearchIcon';
export { default as ShareIcon } from './ShareIcon';
export { default as TrashIcon } from './TrashIcon';
export { default as WarningIcon } from './WarningIcon';

// Navigation icons
export { default as ChevronDownIcon } from './ChevronDownIcon';
export { default as ChevronLeftIcon } from './ChevronLeftIcon';
export { default as ChevronRightIcon } from './ChevronRightIcon';
export { default as ChevronUpIcon } from './ChevronUpIcon';

// Tab/Navigation icons
export { default as ChartIcon } from './ChartIcon';
export { default as ChatIcon } from './ChatIcon';
export { default as ClockIcon } from './ClockIcon';
export { default as DocumentIcon } from './DocumentIcon';
export { default as GlobeIcon } from './GlobeIcon';

// User icons
export { default as UserIcon } from './UserIcon';
export { default as UsersIcon } from './UsersIcon';

// Theme icons
export { SunIcon, MoonIcon } from './ThemeIcons';

// Integration icons (brand colors)
export { default as DocsIcon } from './DocsIcon';
export { default as DriveIcon } from './DriveIcon';
export { default as SheetsIcon } from './SheetsIcon';
export { default as SlidesIcon } from './SlidesIcon';
export { default as SlackIcon } from './SlackIcon';

// ============================================================================
// TAB ICONS MAP
// For backward compatibility with TabSidebar and TabBottomBar
// Usage: const IconComponent = TabIcons[tab.icon];
// ============================================================================

import ChartIcon from './ChartIcon';
import ChatIcon from './ChatIcon';
import ClockIcon from './ClockIcon';
import DocumentIcon from './DocumentIcon';

export const TabIcons = {
  chart: ChartIcon,
  chat: ChatIcon,
  clock: ClockIcon,
  document: DocumentIcon
};
