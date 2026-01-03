import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ===========================================
  // AI CONVERSATION ROUTE - SE Assistant
  // ===========================================
  chat: a.conversation({
    aiModel: a.ai.model('Claude 3.5 Haiku'),
    systemPrompt: `You are SE Assistant, an AI helper for PlainID's Sales Engineering team. You help SEs manage their presales engagements efficiently.

PERSONALITY: Concise Pro - Be crisp, data-focused, and minimal. No fluff. Lead with the answer.

CAPABILITIES (Read-Only):
- Query and summarize engagements
- Find stale engagements (no activity in 14+ business days)
- Show competitor trends across deals
- Summarize activities and notes
- Help draft follow-up emails

LIMITATIONS:
- You CANNOT create, modify, or delete any data
- If asked to create/modify anything, explain: "I'm read-only and can't make changes. You can do that directly in SE Tracker."

RESPONSE FORMAT:
- Keep responses concise (2-5 sentences for simple queries)
- Use bullet points sparingly, only for lists of 3+ items
- When listing engagements, include: Company name, current phase, days since activity
- Always include links to engagements when referencing them: [Company Name](/engagement/ID)

AMBIGUITY HANDLING:
- If a company name is ambiguous (e.g., "Acme" matches "Acme Corp" and "Acme Industries"), ask for clarification
- If a query is vague, ask one clarifying question

CONTEXT AWARENESS:
- You may receive context about the current page and user
- Use this to make responses more relevant (e.g., "this engagement" refers to the current one)

DATA DEFINITIONS:
- Phases: Discover → Design → Demonstrate → Validate → Enable
- Engagement Status: Active, On Hold, Unresponsive, Won, Lost, Disqualified, No Decision
- Stale: Active engagement with no activity in 14+ business days
- Activity Types: Meeting, Demo, Document, Email, Support, Workshop, Call`,
    tools: [
      // Tool to list/search engagements
      a.ai.dataTool({
        name: 'listEngagements',
        description: 'List all engagements. Use this to find engagements, check for stale ones, or get an overview. Returns company, phase, status, last activity date, and owner info.',
        model: a.ref('Engagement'),
        modelOperation: 'list',
      }),
      // Tool to get a specific engagement by ID
      a.ai.dataTool({
        name: 'getEngagement',
        description: 'Get detailed information about a specific engagement by its ID. Use when you need full details about one engagement.',
        model: a.ref('Engagement'),
        modelOperation: 'get',
      }),
      // Tool to list activities
      a.ai.dataTool({
        name: 'listActivities',
        description: 'List all activities across engagements. Activities include meetings, demos, calls, emails, etc. Each has a date, type, and description.',
        model: a.ref('Activity'),
        modelOperation: 'list',
      }),
      // Tool to list phase notes
      a.ai.dataTool({
        name: 'listPhaseNotes',
        description: 'List notes attached to engagement phases. Notes contain important context about what happened in each phase.',
        model: a.ref('PhaseNote'),
        modelOperation: 'list',
      }),
      // Tool to list team members
      a.ai.dataTool({
        name: 'listTeamMembers',
        description: 'List all team members (Sales Engineers). Use to find who owns engagements or look up team info.',
        model: a.ref('TeamMember'),
        modelOperation: 'list',
      }),
      // Tool to list engagement owners (junction table)
      a.ai.dataTool({
        name: 'listEngagementOwners',
        description: 'List engagement ownership records. Maps team members to engagements they own.',
        model: a.ref('EngagementOwner'),
        modelOperation: 'list',
      }),
    ],
  })
  .authorization((allow) => allow.owner()),

  // Team Member model
  TeamMember: a.model({
    email: a.email().required(),
    name: a.string().required(),
    initials: a.string().required(),
    isAdmin: a.boolean().default(false),
    isActive: a.boolean().default(true),
    // NEW: System user flag for SE Team and future system users
    isSystemUser: a.boolean().default(false),
    // Phase 1 legacy relationship (kept for backwards compatibility)
    engagements: a.hasMany('Engagement', 'ownerId'),
    // Phase 2: Co-ownership relationship
    engagementOwnerships: a.hasMany('EngagementOwner', 'teamMemberId'),
    // Phase 2: Comments authored
    comments: a.hasMany('Comment', 'authorId'),
    // Phase 3: Change logs authored
    changeLogs: a.hasMany('ChangeLog', 'userId'),
    // Phase 4: Notes authored
    phaseNotes: a.hasMany('PhaseNote', 'authorId'),
  }).authorization(allow => [allow.authenticated()]),

  // Sales Rep / Account Executive model
  SalesRep: a.model({
    name: a.string().required(),
    email: a.email(),
    initials: a.string().required(),
    isActive: a.boolean().default(true),
    // Relationship to engagements
    engagements: a.hasMany('Engagement', 'salesRepId'),
  }).authorization(allow => [allow.authenticated()]),

  // Phase 2: Junction table for many-to-many engagement ownership
  EngagementOwner: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    teamMemberId: a.id().required(),
    teamMember: a.belongsTo('TeamMember', 'teamMemberId'),
    // Role could be 'primary' or 'secondary' for future use
    role: a.string(),
    addedAt: a.datetime(),
  }).authorization(allow => [allow.authenticated()]),

  // Competitor enum for tracking competition
  Competitor: a.enum([
    'AMIDA',
    'ASERTO',
    'AWS_VERIFIED_PERMISSIONS',
    'AXIOMATICS',
    'CERBOS',
    'CYBERARK',
    'FORGEROCK',
    'IMMUTA',
    'KEYCLOAK',
    'MICROSOFT_ENTRA',
    'NEXTLABS',
    'OKTA',
    'ONE_IDENTITY',
    'OPA',
    'ORY',
    'PERMIT_IO',
    'PING_IDENTITY',
    'SAILPOINT',
    'SAVIYNT',
    'STYRA',
    'ZANZIBAR',
    'OTHER'
  ]),

  // Engagement model
  Engagement: a.model({
    company: a.string().required(),
    contactName: a.string().required(),
    contactEmail: a.email(),
    contactPhone: a.string(),
    industry: a.enum([
      'FINANCIAL_SERVICES',
      'HEALTHCARE', 
      'TECHNOLOGY',
      'RETAIL',
      'MANUFACTURING',
      'GOVERNMENT'
    ]),
    dealSize: a.string(),
    currentPhase: a.enum([
      'DISCOVER',
      'DESIGN',
      'DEMONSTRATE',
      'VALIDATE',
      'ENABLE'
    ]),
    startDate: a.date(),
    lastActivity: a.date(),
    
    // Phase 1 legacy field (kept for backwards compatibility)
    ownerId: a.id(),
    owner: a.belongsTo('TeamMember', 'ownerId'),
    
    // Phase 2: Co-ownership relationship
    owners: a.hasMany('EngagementOwner', 'engagementId'),
    
    // Sales Rep / Account Executive relationship
    salesRepId: a.id(),
    salesRep: a.belongsTo('SalesRep', 'salesRepId'),
    
    // Partner tracking - simple text field for partner company name
    partnerName: a.string(),
    
    // Integration fields
    salesforceId: a.string(),
    salesforceUrl: a.string(),
    jiraTicket: a.string(),
    jiraUrl: a.string(),
    slackChannel: a.string(),
    slackUrl: a.string(),
    driveFolderName: a.string(),
    driveFolderUrl: a.string(),
    docsName: a.string(),
    docsUrl: a.string(),
    slidesName: a.string(),
    slidesUrl: a.string(),
    sheetsName: a.string(),
    sheetsUrl: a.string(),
    
    // Archive support
    isArchived: a.boolean().default(false),
    
    // Engagement status - tracks deal health (separate from phase progress)
    engagementStatus: a.enum([
      'ACTIVE',
      'ON_HOLD',
      'UNRESPONSIVE',
      'WON',
      'LOST',
      'DISQUALIFIED',
      'NO_DECISION'
    ]),
    // Optional notes when engagement is closed
    closedReason: a.string(),
    
    // Competitor tracking fields
    competitors: a.string(), // JSON array of competitor enum values
    competitorNotes: a.string(), // General notes about competition
    otherCompetitorName: a.string(), // Required when OTHER is selected
    
    // Relationships
    phases: a.hasMany('Phase', 'engagementId'),
    activities: a.hasMany('Activity', 'engagementId'),
    // Phase 3: Change history
    changeLogs: a.hasMany('ChangeLog', 'engagementId'),
    // Phase 4: Running notes per phase
    phaseNotes: a.hasMany('PhaseNote', 'engagementId'),
  }).authorization(allow => [allow.authenticated()]),

  // Phase model
  Phase: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    phaseType: a.enum([
      'DISCOVER',
      'DESIGN',
      'DEMONSTRATE',
      'VALIDATE',
      'ENABLE'
    ]),
    status: a.enum([
      'PENDING',
      'IN_PROGRESS',
      'COMPLETE',
      'BLOCKED',
      'SKIPPED'
    ]),
    completedDate: a.date(),
    // Legacy notes field - kept for backwards compatibility, migrated to PhaseNote
    notes: a.string(),
    // Links stored as JSON array: [{title: string, url: string}]
    links: a.json(),
  }).authorization(allow => [allow.authenticated()]),

  // Phase 4: Running notes per phase
  PhaseNote: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    phaseType: a.enum([
      'DISCOVER',
      'DESIGN',
      'DEMONSTRATE',
      'VALIDATE',
      'ENABLE'
    ]),
    text: a.string().required(),
    authorId: a.id().required(),
    author: a.belongsTo('TeamMember', 'authorId'),
  }).authorization(allow => [allow.authenticated()]),

  // Activity model
  Activity: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    date: a.date().required(),
    type: a.enum([
      'MEETING',
      'DEMO',
      'DOCUMENT',
      'EMAIL',
      'SUPPORT',
      'WORKSHOP',
      'CALL'
    ]),
    description: a.string().required(),
    // Phase 2: Comments on activities
    comments: a.hasMany('Comment', 'activityId'),
  }).authorization(allow => [allow.authenticated()]),

  // Phase 2: Comment model
  Comment: a.model({
    activityId: a.id().required(),
    activity: a.belongsTo('Activity', 'activityId'),
    authorId: a.id().required(),
    author: a.belongsTo('TeamMember', 'authorId'),
    text: a.string().required(),
  }).authorization(allow => [allow.authenticated()]),

  // Phase 3: Change log for history tracking
  ChangeLog: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    userId: a.id().required(),
    user: a.belongsTo('TeamMember', 'userId'),
    changeType: a.enum([
      'CREATED',
      'PHASE_UPDATE',
      'ACTIVITY_ADDED',
      'ACTIVITY_EDITED',
      'ACTIVITY_DELETED',
      'OWNER_ADDED',
      'OWNER_REMOVED',
      'COMMENT_ADDED',
      'COMMENT_DELETED',
      'LINK_ADDED',
      'INTEGRATION_UPDATE',
      'ARCHIVED',
      'RESTORED',
      'NOTE_ADDED',
      'NOTE_EDITED',
      'NOTE_DELETED',
      'STATUS_CHANGED',
      'COMPETITORS_UPDATED',
      'SALES_REP_CHANGED',
      'PARTNER_UPDATED'
    ]),
    description: a.string().required(),
    previousValue: a.string(),
    newValue: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  // Phase 3: Track last viewed time per user per engagement
  EngagementView: a.model({
    engagementId: a.id().required(),
    visitorId: a.id().required(),
    lastViewedAt: a.datetime().required(),
  }).authorization(allow => [allow.authenticated()]),

  // Deletion Audit Log - standalone model for tracking deleted engagements
  // Not linked to Engagement since the engagement is deleted
  // Uses TTL for automatic 365-day cleanup
  DeletionLog: a.model({
    // Who deleted it
    deletedById: a.id().required(),
    deletedByName: a.string().required(),
    // Snapshot of deleted engagement data
    companyName: a.string().required(),
    contactName: a.string().required(),
    industry: a.string(),
    currentPhase: a.string(),
    ownerNames: a.string(),
    // Pre-formatted cascade summary: "5 activities, 8 comments, 3 notes"
    cascadeSummary: a.string(),
    // Original engagement creation date
    engagementCreatedAt: a.date(),
    // TTL field - Unix timestamp in seconds (deletedAt + 365 days)
    // DynamoDB will auto-delete records after this time
    expiresAt: a.integer(),
  }).authorization(allow => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
