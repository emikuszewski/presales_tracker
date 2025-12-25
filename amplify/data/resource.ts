import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
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
    
    // Relationships
    phases: a.hasMany('Phase', 'engagementId'),
    activities: a.hasMany('Activity', 'engagementId'),
    // Phase 3: Change history
    changeLogs: a.hasMany('ChangeLog', 'engagementId'),
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
      'COMPLETE'
    ]),
    completedDate: a.date(),
    notes: a.string(),
    // Links stored as JSON array: [{title: string, url: string}]
    links: a.json(),
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
      'OWNER_ADDED',
      'OWNER_REMOVED',
      'COMMENT_ADDED',
      'LINK_ADDED',
      'INTEGRATION_UPDATE',
      'ARCHIVED',
      'RESTORED'
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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
