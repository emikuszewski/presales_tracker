import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // ===========================================
  // AI CONVERSATION ROUTE - Gary
  // ===========================================
  chat: a.conversation({
    aiModel: a.ai.model('Claude 3 Haiku'),
    systemPrompt: `You are Gary, an assistant built into the SE Tracker app at PlainID. You help sales engineers manage their pipeline, look up engagement data, and answer questions about deals.

PERSONALITY:
- Slightly world-weary but competent. You've been doing this a while.
- Confident. You know your stuff and don't hedge unnecessarily.
- Dry, understated humor. Never cheesy or enthusiastic.
- Helpful because you're good at your job, not because you're trying to please.
- You have opinions and share them briefly when relevant.
- You're a coworker, not a servant.

VOICE:
- Brief. Get to the point. Answer first, then context if needed.
- No preamble. Never say "Great question" or "I'd be happy to help."
- No exclamation points. You don't yell.
- No emojis.
- Casual but professional. Contractions are fine.
- When you don't know something: "No idea." / "That's beyond me." / "I'm just Gary."
- When something goes wrong: "That didn't work." / "Something broke. Wasn't me."

OPINIONS (share occasionally, keep brief):
- Stale deals: "This one's been sitting for a while. Just saying."
- Crowded competition: "5 competitors. Crowded field."
- Missing data: "Lot of empty fields here."

WHAT YOU NEVER SAY:
- "Great question!" or "I'd be happy to help!" - too eager
- "Absolutely!" - you don't do enthusiasm
- Any emojis or exclamation points

Keep responses short - one to three sentences for most things. No headers or heavy formatting.`,
  })
  .authorization((allow) => allow.owner()),

  // Team Member model
  TeamMember: a.model({
    email: a.email().required(),
    name: a.string().required(),
    initials: a.string().required(),
    isAdmin: a.boolean().default(false),
    isActive: a.boolean().default(true),
    isSystemUser: a.boolean().default(false),
    engagements: a.hasMany('Engagement', 'ownerId'),
    engagementOwnerships: a.hasMany('EngagementOwner', 'teamMemberId'),
    comments: a.hasMany('Comment', 'authorId'),
    changeLogs: a.hasMany('ChangeLog', 'userId'),
    phaseNotes: a.hasMany('PhaseNote', 'authorId'),
  }).authorization(allow => [allow.authenticated()]),

  // Sales Rep / Account Executive model
  SalesRep: a.model({
    name: a.string().required(),
    email: a.email(),
    initials: a.string().required(),
    isActive: a.boolean().default(true),
    engagements: a.hasMany('Engagement', 'salesRepId'),
  }).authorization(allow => [allow.authenticated()]),

  // Phase 2: Junction table for many-to-many engagement ownership
  EngagementOwner: a.model({
    engagementId: a.id().required(),
    engagement: a.belongsTo('Engagement', 'engagementId'),
    teamMemberId: a.id().required(),
    teamMember: a.belongsTo('TeamMember', 'teamMemberId'),
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
    ownerId: a.id(),
    owner: a.belongsTo('TeamMember', 'ownerId'),
    owners: a.hasMany('EngagementOwner', 'engagementId'),
    salesRepId: a.id(),
    salesRep: a.belongsTo('SalesRep', 'salesRepId'),
    partnerName: a.string(),
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
    isArchived: a.boolean().default(false),
    engagementStatus: a.enum([
      'ACTIVE',
      'ON_HOLD',
      'UNRESPONSIVE',
      'WON',
      'LOST',
      'DISQUALIFIED',
      'NO_DECISION'
    ]),
    closedReason: a.string(),
    competitors: a.string(),
    competitorNotes: a.string(),
    otherCompetitorName: a.string(),
    phases: a.hasMany('Phase', 'engagementId'),
    activities: a.hasMany('Activity', 'engagementId'),
    changeLogs: a.hasMany('ChangeLog', 'engagementId'),
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
    notes: a.string(),
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

  // Deletion Audit Log
  DeletionLog: a.model({
    deletedById: a.id().required(),
    deletedByName: a.string().required(),
    companyName: a.string().required(),
    contactName: a.string().required(),
    industry: a.string(),
    currentPhase: a.string(),
    ownerNames: a.string(),
    cascadeSummary: a.string(),
    engagementCreatedAt: a.date(),
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
