// Application configuration constants

// Admin email - hardcoded for Phase 1
export const ADMIN_EMAIL = 'edward.mikuszewski@plainid.com';

// Allowed domain for sign-up
export const ALLOWED_DOMAIN = 'plainid.com';

// Phase 3: Stale threshold in business days
export const STALE_THRESHOLD_BUSINESS_DAYS = 14;

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
