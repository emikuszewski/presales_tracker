// Display labels for enum values

export const industryLabels = {
  FINANCIAL_SERVICES: 'Financial Services',
  HEALTHCARE: 'Healthcare',
  TECHNOLOGY: 'Technology',
  RETAIL: 'Retail',
  MANUFACTURING: 'Manufacturing',
  GOVERNMENT: 'Government'
};

export const phaseLabels = {
  DISCOVER: 'Discover',
  DESIGN: 'Design',
  DEMONSTRATE: 'Demonstrate',
  VALIDATE: 'Validate',
  ENABLE: 'Enable'
};

export const activityTypeLabels = {
  MEETING: 'Meeting',
  DEMO: 'Demo',
  DOCUMENT: 'Document',
  EMAIL: 'Email',
  SUPPORT: 'Support',
  WORKSHOP: 'Workshop',
  CALL: 'Call'
};

export const phaseStatusLabels = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETE: 'Complete',
  BLOCKED: 'Blocked',
  SKIPPED: 'Skipped'
};

// Engagement-level deal health status labels
export const engagementStatusLabels = {
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  UNRESPONSIVE: 'Unresponsive',
  WON: 'Won',
  LOST: 'Lost',
  DISQUALIFIED: 'Disqualified',
  NO_DECISION: 'No Decision'
};

// Engagement status icons for display
export const engagementStatusIcons = {
  ACTIVE: null,        // No icon for active (default state)
  ON_HOLD: '⏸️',
  UNRESPONSIVE: '⚠️',
  WON: '🎉',
  LOST: '❌',
  DISQUALIFIED: '🚫',
  NO_DECISION: '➖'
};

// Competitor display labels
export const competitorLabels = {
  AMIDA: 'Amida',
  ASERTO: 'Aserto',
  AWS_VERIFIED_PERMISSIONS: 'AWS Verified Permissions',
  AXIOMATICS: 'Axiomatics',
  CERBOS: 'Cerbos',
  CYBERARK: 'CyberArk',
  FORGEROCK: 'ForgeRock',
  KEYCLOAK: 'Keycloak',
  MICROSOFT_ENTRA: 'Microsoft Entra',
  NEXTLABS: 'NextLabs',
  OKTA: 'Okta',
  ONE_IDENTITY: 'One Identity',
  OPA: 'OPA',
  ORY: 'Ory',
  PERMIT_IO: 'Permit.io',
  PING_IDENTITY: 'Ping Identity',
  SAILPOINT: 'SailPoint',
  SAVIYNT: 'Saviynt',
  STYRA: 'Styra',
  ZANZIBAR: 'Zanzibar',
  OTHER: 'Other'
};

export const changeTypeLabels = {
  CREATED: 'Created engagement',
  PHASE_UPDATE: 'Updated phase',
  ACTIVITY_ADDED: 'Added activity',
  ACTIVITY_EDITED: 'Edited activity',
  ACTIVITY_DELETED: 'Deleted activity',
  OWNER_ADDED: 'Added owner',
  OWNER_REMOVED: 'Removed owner',
  COMMENT_ADDED: 'Added comment',
  COMMENT_DELETED: 'Deleted comment',
  LINK_ADDED: 'Added link',
  INTEGRATION_UPDATE: 'Updated integrations',
  ARCHIVED: 'Archived',
  RESTORED: 'Restored',
  NOTE_ADDED: 'Added note',
  NOTE_EDITED: 'Edited note',
  NOTE_DELETED: 'Deleted note',
  STATUS_CHANGED: 'Changed status',
  COMPETITORS_UPDATED: 'Updated competitors'
};
