// Application configuration constants

// Admin email - hardcoded for Phase 1
export const ADMIN_EMAIL = 'edward.mikuszewski@plainid.com';

// Allowed domain for sign-up
export const ALLOWED_DOMAIN = 'plainid.com';

// Phase 3: Stale threshold in business days
export const STALE_THRESHOLD_BUSINESS_DAYS = 14;

// System user configuration for SE Team (shared pool for unassigned engagements)
export const SYSTEM_SE_TEAM = {
  EMAIL: 'se-team@system.local',
  NAME: 'SE Team',
  INITIALS: 'SE'
};

// Phase configuration with labels and descriptions
export const phaseConfig = [
  { id: "DISCOVER", label: "Discover", description: "Technical qualification & requirements gathering" },
  { id: "DESIGN", label: "Design", description: "Solution architecture & POC scoping" },
  { id: "DEMONSTRATE", label: "Demonstrate", description: "Demos, workshops & technical deep-dives" },
  { id: "VALIDATE", label: "Validate", description: "POC execution & technical proof" },
  { id: "ENABLE", label: "Enable", description: "Handoff, training & success planning" }
];

// Activity type options
export const activityTypes = ['MEETING', 'DEMO', 'DOCUMENT', 'EMAIL', 'SUPPORT', 'WORKSHOP', 'CALL'];

// Industry options
export const industries = ['FINANCIAL_SERVICES', 'HEALTHCARE', 'TECHNOLOGY', 'RETAIL', 'MANUFACTURING', 'GOVERNMENT'];

// Tab configuration for detail view
export const detailTabs = [
  { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'activity', label: 'Activity', icon: 'chat' },
  { id: 'history', label: 'History', icon: 'clock' },
  { id: 'notes', label: 'Notes', icon: 'document' }
];

// Competitor configuration (alphabetical order)
// logoType: 'svg' = real logo, 'simplified' = simplified svg, 'initials' = text fallback
export const competitorConfig = [
  { id: 'AMIDA', label: 'Amida', logoType: 'initials', initials: 'Am' },
  { id: 'ASERTO', label: 'Aserto', logoType: 'initials', initials: 'As' },
  { id: 'AWS_VERIFIED_PERMISSIONS', label: 'AWS Verified Permissions', logoType: 'svg' },
  { id: 'AXIOMATICS', label: 'Axiomatics', logoType: 'initials', initials: 'Ax' },
  { id: 'CERBOS', label: 'Cerbos', logoType: 'initials', initials: 'Cb' },
  { id: 'CYBERARK', label: 'CyberArk', logoType: 'simplified' },
  { id: 'FORGEROCK', label: 'ForgeRock', logoType: 'simplified' },
  { id: 'KEYCLOAK', label: 'Keycloak', logoType: 'svg' },
  { id: 'MICROSOFT_ENTRA', label: 'Microsoft Entra', logoType: 'svg' },
  { id: 'NEXTLABS', label: 'NextLabs', logoType: 'initials', initials: 'NL' },
  { id: 'OKTA', label: 'Okta', logoType: 'svg' },
  { id: 'ONE_IDENTITY', label: 'One Identity', logoType: 'initials', initials: '1I' },
  { id: 'ORY', label: 'Ory', logoType: 'simplified' },
  { id: 'PERMIT_IO', label: 'Permit.io', logoType: 'initials', initials: 'Pe' },
  { id: 'PING_IDENTITY', label: 'Ping Identity', logoType: 'svg' },
  { id: 'SAILPOINT', label: 'SailPoint', logoType: 'simplified' },
  { id: 'SAVIYNT', label: 'Saviynt', logoType: 'initials', initials: 'Sv' },
  { id: 'STYRA_OPA', label: 'Styra/OPA', logoType: 'svg' },
  { id: 'ZANZIBAR', label: 'Zanzibar', logoType: 'initials', initials: 'Za' },
  { id: 'OTHER', label: 'Other', logoType: 'initials', initials: '?' }
];

// Quick lookup map for competitor config
export const competitorConfigMap = competitorConfig.reduce((acc, comp) => {
  acc[comp.id] = comp;
  return acc;
}, {});
