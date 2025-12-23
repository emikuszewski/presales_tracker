import React, { useState } from 'react';

// Team members
const teamMembers = [
  { id: 'ed', name: 'Ed', initials: 'E' },
  { id: 'sarah', name: 'Sarah', initials: 'S' },
  { id: 'mike', name: 'Mike', initials: 'M' },
  { id: 'lisa', name: 'Lisa', initials: 'L' }
];

// Sample data with multiple owners and integration fields
const initialEngagements = [
  {
    id: 1,
    company: "Acme Financial",
    contactName: "Sarah Chen",
    contactEmail: "schen@acmefinancial.com",
    contactPhone: "+1 (555) 123-4567",
    industry: "Financial Services",
    dealSize: "$450K",
    currentPhase: "demonstrate",
    startDate: "2024-11-15",
    lastActivity: "2024-12-18",
    owner: "ed",
    // Integration fields
    salesforceId: "006Dn000004XXXX",
    salesforceUrl: "https://plainid.lightning.force.com/006Dn000004XXXX",
    jiraTicket: "SE-1234",
    jiraUrl: "https://plainid.atlassian.net/browse/SE-1234",
    slackChannel: "#acme-financial-poc",
    phases: {
      discover: { 
        status: "complete", 
        completedDate: "2024-11-22", 
        notes: "Strong interest in PBAC for their trading platform. Key pain point: managing entitlements across 12 applications.",
        links: [
          { title: "Discovery Call Recording", url: "https://zoom.us/rec/123abc" },
          { title: "Technical Requirements Doc", url: "https://docs.google.com/document/d/abc123" }
        ]
      },
      design: { 
        status: "complete", 
        completedDate: "2024-12-01", 
        notes: "Architecture approved. Integration with Okta and ServiceNow identified.",
        links: [
          { title: "Solution Architecture Diagram", url: "https://lucid.app/documents/abc123" },
          { title: "Integration Spec", url: "https://docs.google.com/document/d/xyz789" }
        ]
      },
      demonstrate: { 
        status: "in-progress", 
        completedDate: null, 
        notes: "Platform overview done. Technical deep-dive scheduled for Dec 20.",
        links: [
          { title: "Demo Recording - Overview", url: "https://zoom.us/rec/456def" }
        ]
      },
      validate: { status: "pending", completedDate: null, notes: "", links: [] },
      enable: { status: "pending", completedDate: null, notes: "", links: [] }
    },
    activities: [
      { date: "2024-12-18", type: "Meeting", description: "Technical deep-dive prep call with IT team" },
      { date: "2024-12-10", type: "Demo", description: "Platform overview presentation - 8 attendees" },
      { date: "2024-12-01", type: "Document", description: "Delivered solution architecture diagram" }
    ]
  },
  {
    id: 2,
    company: "HealthFirst Systems",
    contactName: "Michael Torres",
    contactEmail: "mtorres@healthfirst.com",
    contactPhone: "+1 (555) 234-5678",
    industry: "Healthcare",
    dealSize: "$280K",
    currentPhase: "validate",
    startDate: "2024-10-20",
    lastActivity: "2024-12-17",
    owner: "ed",
    salesforceId: "006Dn000004YYYY",
    salesforceUrl: "https://plainid.lightning.force.com/006Dn000004YYYY",
    jiraTicket: "SE-1198",
    jiraUrl: "https://plainid.atlassian.net/browse/SE-1198",
    slackChannel: "#healthfirst-poc",
    phases: {
      discover: { 
        status: "complete", 
        completedDate: "2024-10-28", 
        notes: "HIPAA compliance critical. Need fine-grained access to patient records.",
        links: [
          { title: "HIPAA Requirements Checklist", url: "https://docs.google.com/spreadsheets/d/abc" }
        ]
      },
      design: { 
        status: "complete", 
        completedDate: "2024-11-08", 
        notes: "ReBAC model proposed for patient-provider relationships.",
        links: [
          { title: "ReBAC Model Diagram", url: "https://lucid.app/documents/rebac123" }
        ]
      },
      demonstrate: { 
        status: "complete", 
        completedDate: "2024-11-20", 
        notes: "Hands-on workshop completed. Team very engaged.",
        links: [
          { title: "Workshop Recording", url: "https://zoom.us/rec/workshop456" },
          { title: "Lab Guide", url: "https://docs.google.com/document/d/lab789" }
        ]
      },
      validate: { 
        status: "in-progress", 
        completedDate: null, 
        notes: "POC in progress - 2 weeks remaining. Testing with Epic integration.",
        links: [
          { title: "POC Success Criteria", url: "https://docs.google.com/document/d/poc123" },
          { title: "Epic Integration Guide", url: "https://confluence.plainid.com/epic" }
        ]
      },
      enable: { status: "pending", completedDate: null, notes: "", links: [] }
    },
    activities: [
      { date: "2024-12-17", type: "Meeting", description: "Weekly POC checkpoint - on track" },
      { date: "2024-12-10", type: "Support", description: "Resolved PDP configuration issue" }
    ]
  },
  {
    id: 3,
    company: "TechNova Corp",
    contactName: "Jennifer Walsh",
    contactEmail: "jwalsh@technova.io",
    contactPhone: "+1 (555) 345-6789",
    industry: "Technology",
    dealSize: "$180K",
    currentPhase: "discover",
    startDate: "2024-12-10",
    lastActivity: "2024-12-16",
    owner: "ed",
    salesforceId: "006Dn000004ZZZZ",
    salesforceUrl: "https://plainid.lightning.force.com/006Dn000004ZZZZ",
    jiraTicket: "",
    jiraUrl: "",
    slackChannel: "",
    phases: {
      discover: { 
        status: "in-progress", 
        completedDate: null, 
        notes: "Initial call complete. Follow-up scheduled for requirements workshop.",
        links: [
          { title: "Discovery Call Notes", url: "https://docs.google.com/document/d/notes123" }
        ]
      },
      design: { status: "pending", completedDate: null, notes: "", links: [] },
      demonstrate: { status: "pending", completedDate: null, notes: "", links: [] },
      validate: { status: "pending", completedDate: null, notes: "", links: [] },
      enable: { status: "pending", completedDate: null, notes: "", links: [] }
    },
    activities: [
      { date: "2024-12-16", type: "Meeting", description: "Discovery call - multi-tenant SaaS authorization needs" }
    ]
  },
  {
    id: 4,
    company: "Global Retail Inc",
    contactName: "David Park",
    contactEmail: "dpark@globalretail.com",
    contactPhone: "+1 (555) 456-7890",
    industry: "Retail",
    dealSize: "$320K",
    currentPhase: "design",
    startDate: "2024-11-28",
    lastActivity: "2024-12-15",
    owner: "sarah",
    salesforceId: "006Dn000004AAAA",
    salesforceUrl: "https://plainid.lightning.force.com/006Dn000004AAAA",
    jiraTicket: "SE-1256",
    jiraUrl: "https://plainid.atlassian.net/browse/SE-1256",
    slackChannel: "#global-retail",
    phases: {
      discover: { 
        status: "complete", 
        completedDate: "2024-12-05", 
        notes: "E-commerce platform needs dynamic pricing authorization based on customer tiers.",
        links: []
      },
      design: { 
        status: "in-progress", 
        completedDate: null, 
        notes: "Working on ABAC model for pricing engine integration.",
        links: []
      },
      demonstrate: { status: "pending", completedDate: null, notes: "", links: [] },
      validate: { status: "pending", completedDate: null, notes: "", links: [] },
      enable: { status: "pending", completedDate: null, notes: "", links: [] }
    },
    activities: [
      { date: "2024-12-15", type: "Meeting", description: "Architecture review with platform team" }
    ]
  },
  {
    id: 5,
    company: "SecureBank Corp",
    contactName: "Amanda Liu",
    contactEmail: "aliu@securebank.com",
    contactPhone: "+1 (555) 567-8901",
    industry: "Financial Services",
    dealSize: "$520K",
    currentPhase: "validate",
    startDate: "2024-10-01",
    lastActivity: "2024-12-18",
    owner: "mike",
    salesforceId: "006Dn000004BBBB",
    salesforceUrl: "https://plainid.lightning.force.com/006Dn000004BBBB",
    jiraTicket: "SE-1145",
    jiraUrl: "https://plainid.atlassian.net/browse/SE-1145",
    slackChannel: "#securebank-poc",
    phases: {
      discover: { status: "complete", completedDate: "2024-10-10", notes: "Core banking authorization modernization.", links: [] },
      design: { status: "complete", completedDate: "2024-10-25", notes: "Hybrid PBAC/ReBAC approach.", links: [] },
      demonstrate: { status: "complete", completedDate: "2024-11-08", notes: "Executive demo well received.", links: [] },
      validate: { 
        status: "in-progress", 
        completedDate: null, 
        notes: "POC extended by 1 week for additional security testing.",
        links: []
      },
      enable: { status: "pending", completedDate: null, notes: "", links: [] }
    },
    activities: [
      { date: "2024-12-18", type: "Meeting", description: "Security review with CISO team" }
    ]
  },
  {
    id: 6,
    company: "MedDevice Pro",
    contactName: "Robert Kim",
    contactEmail: "rkim@meddevicepro.com",
    contactPhone: "+1 (555) 678-9012",
    industry: "Healthcare",
    dealSize: "$195K",
    currentPhase: "demonstrate",
    startDate: "2024-11-20",
    lastActivity: "2024-12-14",
    owner: "lisa",
    salesforceId: "006Dn000004CCCC",
    salesforceUrl: "https://plainid.lightning.force.com/006Dn000004CCCC",
    jiraTicket: "SE-1267",
    jiraUrl: "https://plainid.atlassian.net/browse/SE-1267",
    slackChannel: "",
    phases: {
      discover: { status: "complete", completedDate: "2024-11-28", notes: "IoT device access control requirements.", links: [] },
      design: { status: "complete", completedDate: "2024-12-06", notes: "API gateway integration pattern.", links: [] },
      demonstrate: { 
        status: "in-progress", 
        completedDate: null, 
        notes: "Technical workshop scheduled for next week.",
        links: []
      },
      validate: { status: "pending", completedDate: null, notes: "", links: [] },
      enable: { status: "pending", completedDate: null, notes: "", links: [] }
    },
    activities: [
      { date: "2024-12-14", type: "Demo", description: "Platform overview completed" }
    ]
  }
];

const phaseConfig = [
  { id: "discover", label: "Discover", description: "Technical qualification & requirements gathering" },
  { id: "design", label: "Design", description: "Solution architecture & POC scoping" },
  { id: "demonstrate", label: "Demonstrate", description: "Demos, workshops & technical deep-dives" },
  { id: "validate", label: "Validate", description: "POC execution & technical proof" },
  { id: "enable", label: "Enable", description: "Handoff, training & success planning" }
];

const activityTypes = ["Meeting", "Demo", "Document", "Email", "Support", "Workshop", "Call"];
const industries = ["Financial Services", "Healthcare", "Technology", "Retail", "Manufacturing", "Government"];

export default function PresalesTracker() {
  const [engagements, setEngagements] = useState(initialEngagements);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [view, setView] = useState('list');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all'); // 'all', 'mine', or specific owner id
  const [currentUser] = useState('ed'); // Simulated logged-in user
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [newActivity, setNewActivity] = useState({ date: '', type: 'Meeting', description: '' });
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newEngagement, setNewEngagement] = useState({
    company: '', contactName: '', contactEmail: '', contactPhone: '', 
    industry: 'Technology', dealSize: '', owner: 'ed',
    salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'complete': return 'bg-emerald-500';
      case 'in-progress': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'complete': return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Complete' };
      case 'in-progress': return { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Pending' };
    }
  };

  const getOwnerInfo = (ownerId) => teamMembers.find(m => m.id === ownerId) || { name: 'Unknown', initials: '?' };

  // Filtered engagements based on phase and owner
  const filteredEngagements = engagements.filter(e => {
    const phaseMatch = filterPhase === 'all' || e.currentPhase === filterPhase;
    const ownerMatch = filterOwner === 'all' || 
                       (filterOwner === 'mine' && e.owner === currentUser) || 
                       e.owner === filterOwner;
    return phaseMatch && ownerMatch;
  });

  const handleAddActivity = () => {
    if (!newActivity.date || !newActivity.description) return;
    
    setEngagements(prev => prev.map(e => {
      if (e.id === selectedEngagement.id) {
        return {
          ...e,
          activities: [{ ...newActivity }, ...e.activities],
          lastActivity: newActivity.date
        };
      }
      return e;
    }));
    
    setSelectedEngagement(prev => ({
      ...prev,
      activities: [{ ...newActivity }, ...prev.activities],
      lastActivity: newActivity.date
    }));
    
    setNewActivity({ date: '', type: 'Meeting', description: '' });
    setShowActivityModal(false);
  };

  const handleAddLink = (phaseId) => {
    if (!newLink.title || !newLink.url) return;
    
    setEngagements(prev => prev.map(e => {
      if (e.id === selectedEngagement.id) {
        return {
          ...e,
          phases: {
            ...e.phases,
            [phaseId]: {
              ...e.phases[phaseId],
              links: [...e.phases[phaseId].links, { ...newLink }]
            }
          }
        };
      }
      return e;
    }));
    
    setSelectedEngagement(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [phaseId]: {
          ...prev.phases[phaseId],
          links: [...prev.phases[phaseId].links, { ...newLink }]
        }
      }
    }));
    
    setNewLink({ title: '', url: '' });
    setShowLinkModal(null);
  };

  const handleRemoveLink = (phaseId, linkIndex) => {
    setEngagements(prev => prev.map(e => {
      if (e.id === selectedEngagement.id) {
        const newLinks = e.phases[phaseId].links.filter((_, i) => i !== linkIndex);
        return {
          ...e,
          phases: {
            ...e.phases,
            [phaseId]: { ...e.phases[phaseId], links: newLinks }
          }
        };
      }
      return e;
    }));
    
    setSelectedEngagement(prev => {
      const newLinks = prev.phases[phaseId].links.filter((_, i) => i !== linkIndex);
      return {
        ...prev,
        phases: {
          ...prev.phases,
          [phaseId]: { ...prev.phases[phaseId], links: newLinks }
        }
      };
    });
  };

  const handleUpdatePhase = (phaseId, updates) => {
    setEngagements(prev => prev.map(e => {
      if (e.id === selectedEngagement.id) {
        const newPhases = { ...e.phases, [phaseId]: { ...e.phases[phaseId], ...updates } };
        
        let newCurrentPhase = e.currentPhase;
        if (updates.status === 'complete') {
          const phaseIndex = phaseConfig.findIndex(p => p.id === phaseId);
          if (phaseIndex < phaseConfig.length - 1) {
            newCurrentPhase = phaseConfig[phaseIndex + 1].id;
          }
        }
        
        return { ...e, phases: newPhases, currentPhase: newCurrentPhase };
      }
      return e;
    }));
    
    setSelectedEngagement(prev => {
      const newPhases = { ...prev.phases, [phaseId]: { ...prev.phases[phaseId], ...updates } };
      let newCurrentPhase = prev.currentPhase;
      if (updates.status === 'complete') {
        const phaseIndex = phaseConfig.findIndex(p => p.id === phaseId);
        if (phaseIndex < phaseConfig.length - 1) {
          newCurrentPhase = phaseConfig[phaseIndex + 1].id;
        }
      }
      return { ...prev, phases: newPhases, currentPhase: newCurrentPhase };
    });
    
    setShowPhaseModal(null);
  };

  const handleUpdateIntegrations = (updates) => {
    setEngagements(prev => prev.map(e => {
      if (e.id === selectedEngagement.id) {
        return { ...e, ...updates };
      }
      return e;
    }));
    
    setSelectedEngagement(prev => ({ ...prev, ...updates }));
    setShowIntegrationsModal(false);
  };

  const handleCreateEngagement = () => {
    if (!newEngagement.company || !newEngagement.contactName) return;
    
    const engagement = {
      id: Date.now(),
      ...newEngagement,
      currentPhase: 'discover',
      startDate: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString().split('T')[0],
      phases: {
        discover: { status: 'in-progress', completedDate: null, notes: '', links: [] },
        design: { status: 'pending', completedDate: null, notes: '', links: [] },
        demonstrate: { status: 'pending', completedDate: null, notes: '', links: [] },
        validate: { status: 'pending', completedDate: null, notes: '', links: [] },
        enable: { status: 'pending', completedDate: null, notes: '', links: [] }
      },
      activities: []
    };
    
    setEngagements(prev => [engagement, ...prev]);
    setNewEngagement({
      company: '', contactName: '', contactEmail: '', contactPhone: '',
      industry: 'Technology', dealSize: '', owner: 'ed',
      salesforceId: '', salesforceUrl: '', jiraTicket: '', jiraUrl: '', slackChannel: ''
    });
    setView('list');
  };

  // ========== LIST VIEW ==========
  const ListView = () => (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">
            {filterOwner === 'mine' ? 'My Engagements' : filterOwner === 'all' ? 'All Team Engagements' : `${getOwnerInfo(filterOwner).name}'s Engagements`}
          </h2>
          <p className="text-gray-500 mt-1">
            {filteredEngagements.length} engagement{filteredEngagements.length !== 1 ? 's' : ''} · {filteredEngagements.filter(e => e.phases[e.currentPhase].status === 'in-progress').length} in progress
          </p>
        </div>
        <button 
          onClick={() => setView('new')}
          className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New Engagement
        </button>
      </div>

      {/* Team Filter */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">View</p>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterOwner('mine')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterOwner === 'mine' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            My Engagements
          </button>
          <button
            onClick={() => setFilterOwner('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterOwner === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Team
          </button>
          <div className="w-px bg-gray-200 mx-2" />
          {teamMembers.map(member => (
            <button
              key={member.id}
              onClick={() => setFilterOwner(member.id)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                filterOwner === member.id 
                  ? 'bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={member.name}
            >
              {member.initials}
            </button>
          ))}
        </div>
      </div>

      {/* Phase Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterPhase('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            filterPhase === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Phases
        </button>
        {phaseConfig.map(phase => (
          <button
            key={phase.id}
            onClick={() => setFilterPhase(phase.id)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterPhase === phase.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {/* Engagement List */}
      <div className="space-y-3">
        {filteredEngagements.map(engagement => {
          const owner = getOwnerInfo(engagement.owner);
          return (
            <div
              key={engagement.id}
              onClick={() => { setSelectedEngagement(engagement); setView('detail'); }}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium ${
                      engagement.owner === currentUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                    title={owner.name}
                  >
                    {owner.initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{engagement.company}</h3>
                    <p className="text-sm text-gray-500">{engagement.contactName} · {engagement.industry}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-medium text-gray-900">{engagement.dealSize}</p>
                  <p className="text-xs text-gray-400">Last activity: {engagement.lastActivity}</p>
                </div>
              </div>
              
              {/* Integration badges */}
              {(engagement.salesforceId || engagement.jiraTicket) && (
                <div className="flex gap-2 mb-3">
                  {engagement.salesforceId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                      SF
                    </span>
                  )}
                  {engagement.jiraTicket && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {engagement.jiraTicket}
                    </span>
                  )}
                </div>
              )}
              
              {/* Phase Progress */}
              <div className="flex items-center gap-1">
                {phaseConfig.map((phase, index) => {
                  const status = engagement.phases[phase.id].status;
                  return (
                    <React.Fragment key={phase.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                        <span className={`text-xs font-medium ${
                          status === 'complete' ? 'text-emerald-700' : 
                          status === 'in-progress' ? 'text-blue-700' : 'text-gray-400'
                        }`}>
                          {phase.label}
                        </span>
                      </div>
                      {index < phaseConfig.length - 1 && (
                        <div className={`flex-1 h-px mx-2 ${
                          status === 'complete' ? 'bg-emerald-300' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {filteredEngagements.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No engagements found with current filters
          </div>
        )}
      </div>
    </div>
  );

  // ========== DETAIL VIEW ==========
  const DetailView = () => {
    if (!selectedEngagement) return null;
    const owner = getOwnerInfo(selectedEngagement.owner);
    
    return (
      <div>
        {/* Back Button & Header */}
        <button 
          onClick={() => { setView('list'); setSelectedEngagement(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Engagements
        </button>

        <div className="flex items-start justify-between mb-8">
          <div className="flex items-start gap-4">
            <div 
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                selectedEngagement.owner === currentUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {owner.initials}
            </div>
            <div>
              <h2 className="text-3xl font-medium text-gray-900">{selectedEngagement.company}</h2>
              <p className="text-gray-500 mt-1">{selectedEngagement.industry} · Started {selectedEngagement.startDate} · Owner: {owner.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-medium text-gray-900">{selectedEngagement.dealSize}</p>
          </div>
        </div>

        {/* Contact & Integrations Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-500 mb-2">Primary Contact</p>
            <p className="font-medium text-gray-900">{selectedEngagement.contactName}</p>
            <p className="text-sm text-gray-600">{selectedEngagement.contactEmail}</p>
            {selectedEngagement.contactPhone && (
              <p className="text-sm text-gray-600">{selectedEngagement.contactPhone}</p>
            )}
          </div>

          {/* Integrations */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Integrations</p>
              <button 
                onClick={() => setShowIntegrationsModal(true)}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Edit
              </button>
            </div>
            <div className="space-y-1">
              {selectedEngagement.salesforceId ? (
                <a 
                  href={selectedEngagement.salesforceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Salesforce: {selectedEngagement.salesforceId}
                </a>
              ) : (
                <p className="text-sm text-gray-400">No Salesforce linked</p>
              )}
              {selectedEngagement.jiraTicket ? (
                <a 
                  href={selectedEngagement.jiraUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.53 2c-.63 0-1.24.1-1.82.29-.54.18-1.05.44-1.51.77-.46.33-.87.73-1.21 1.18-.34.45-.61.96-.8 1.5-.19.54-.29 1.12-.29 1.72 0 .96.24 1.86.67 2.65.43.79 1.04 1.47 1.77 1.99.73.52 1.58.89 2.49 1.07.91.18 1.85.17 2.76-.03.91-.2 1.75-.58 2.48-1.12.73-.54 1.33-1.23 1.75-2.03.42-.8.65-1.7.65-2.65 0-.6-.1-1.18-.29-1.72-.19-.54-.46-1.05-.8-1.5-.34-.45-.75-.85-1.21-1.18-.46-.33-.97-.59-1.51-.77C12.77 2.1 12.16 2 11.53 2z"/>
                  </svg>
                  Jira: {selectedEngagement.jiraTicket}
                </a>
              ) : (
                <p className="text-sm text-gray-400">No Jira ticket linked</p>
              )}
              {selectedEngagement.slackChannel && (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
                  </svg>
                  {selectedEngagement.slackChannel}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Phase Tracker */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Engagement Progress</h3>
          <div className="space-y-2">
            {phaseConfig.map((phase, index) => {
              const phaseData = selectedEngagement.phases[phase.id];
              const statusBadge = getStatusBadge(phaseData.status);
              
              return (
                <div 
                  key={phase.id}
                  className={`border rounded-xl p-5 transition-all ${
                    phaseData.status === 'in-progress' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div 
                    className="flex items-center justify-between mb-2 cursor-pointer"
                    onClick={() => setShowPhaseModal(phase.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                        phaseData.status === 'complete' ? 'bg-emerald-100 text-emerald-700' :
                        phaseData.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {phaseData.status === 'complete' ? '✓' : index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{phase.label}</h4>
                        <p className="text-sm text-gray-500">{phase.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {phaseData.completedDate && (
                        <span className="text-xs text-gray-400">{phaseData.completedDate}</span>
                      )}
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                  
                  {phaseData.notes && (
                    <p className="text-sm text-gray-600 mt-3 pl-11">{phaseData.notes}</p>
                  )}
                  
                  {/* Links Section */}
                  <div className="mt-3 pl-11">
                    {phaseData.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {phaseData.links.map((link, linkIndex) => (
                          <div key={linkIndex} className="group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-blue-600"
                            >
                              {link.title}
                            </a>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRemoveLink(phase.id, linkIndex); }}
                              className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowLinkModal(phase.id); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Activity Log</h3>
            <button 
              onClick={() => setShowActivityModal(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              + Add Activity
            </button>
          </div>
          
          <div className="space-y-3">
            {selectedEngagement.activities.map((activity, index) => (
              <div key={index} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-xl">
                <div className="text-sm text-gray-400 w-24 flex-shrink-0">{activity.date}</div>
                <div>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-1">
                    {activity.type}
                  </span>
                  <p className="text-gray-900">{activity.description}</p>
                </div>
              </div>
            ))}
            {selectedEngagement.activities.length === 0 && (
              <p className="text-gray-400 text-center py-8">No activities logged yet</p>
            )}
          </div>
        </div>

        {/* Activity Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowActivityModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Log Activity</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newActivity.date}
                    onChange={e => setNewActivity(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newActivity.type}
                    onChange={e => setNewActivity(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {activityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newActivity.description}
                    onChange={e => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="What happened?"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddActivity}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Save Activity
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase Edit Modal */}
        {showPhaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPhaseModal(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                Update {phaseConfig.find(p => p.id === showPhaseModal)?.label} Phase
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedEngagement.phases[showPhaseModal].status}
                    onChange={e => handleUpdatePhase(showPhaseModal, { 
                      status: e.target.value,
                      completedDate: e.target.value === 'complete' ? new Date().toISOString().split('T')[0] : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={selectedEngagement.phases[showPhaseModal].notes}
                    onChange={e => handleUpdatePhase(showPhaseModal, { notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    placeholder="Key findings, decisions, blockers..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowPhaseModal(null)}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLinkModal(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">
                Add Link to {phaseConfig.find(p => p.id === showLinkModal)?.label}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newLink.title}
                    onChange={e => setNewLink(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Architecture Diagram"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => { setShowLinkModal(null); setNewLink({ title: '', url: '' }); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleAddLink(showLinkModal)}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Modal */}
        {showIntegrationsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowIntegrationsModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-medium text-gray-900 mb-6">Edit Integrations</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Opportunity ID</label>
                  <input
                    type="text"
                    defaultValue={selectedEngagement.salesforceId}
                    onChange={e => setSelectedEngagement(prev => ({ ...prev, salesforceId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="006Dn000004XXXX"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce URL</label>
                  <input
                    type="url"
                    defaultValue={selectedEngagement.salesforceUrl}
                    onChange={e => setSelectedEngagement(prev => ({ ...prev, salesforceUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://plainid.lightning.force.com/..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket</label>
                  <input
                    type="text"
                    defaultValue={selectedEngagement.jiraTicket}
                    onChange={e => setSelectedEngagement(prev => ({ ...prev, jiraTicket: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="SE-1234"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
                  <input
                    type="url"
                    defaultValue={selectedEngagement.jiraUrl}
                    onChange={e => setSelectedEngagement(prev => ({ ...prev, jiraUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="https://plainid.atlassian.net/browse/..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
                  <input
                    type="text"
                    defaultValue={selectedEngagement.slackChannel}
                    onChange={e => setSelectedEngagement(prev => ({ ...prev, slackChannel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="#customer-poc"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowIntegrationsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleUpdateIntegrations({
                    salesforceId: selectedEngagement.salesforceId,
                    salesforceUrl: selectedEngagement.salesforceUrl,
                    jiraTicket: selectedEngagement.jiraTicket,
                    jiraUrl: selectedEngagement.jiraUrl,
                    slackChannel: selectedEngagement.slackChannel
                  })}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========== NEW ENGAGEMENT VIEW ==========
  const NewEngagementView = () => (
    <div>
      <button 
        onClick={() => setView('list')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Cancel
      </button>

      <h2 className="text-2xl font-medium text-gray-900 mb-8">New Engagement</h2>

      <div className="max-w-xl space-y-6">
        {/* Company & Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Company & Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={newEngagement.company}
                onChange={e => setNewEngagement(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Acme Corporation"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input
                type="text"
                value={newEngagement.contactName}
                onChange={e => setNewEngagement(prev => ({ ...prev, contactName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="John Smith"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={newEngagement.contactEmail}
                onChange={e => setNewEngagement(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="john@acme.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newEngagement.contactPhone}
                onChange={e => setNewEngagement(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                value={newEngagement.industry}
                onChange={e => setNewEngagement(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deal Size</label>
              <input
                type="text"
                value={newEngagement.dealSize}
                onChange={e => setNewEngagement(prev => ({ ...prev, dealSize: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="$100K"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={newEngagement.owner}
                onChange={e => setNewEngagement(prev => ({ ...prev, owner: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Integrations (Optional)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce Opportunity ID</label>
              <input
                type="text"
                value={newEngagement.salesforceId}
                onChange={e => setNewEngagement(prev => ({ ...prev, salesforceId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="006Dn000004XXXX"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesforce URL</label>
              <input
                type="url"
                value={newEngagement.salesforceUrl}
                onChange={e => setNewEngagement(prev => ({ ...prev, salesforceUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jira Ticket</label>
              <input
                type="text"
                value={newEngagement.jiraTicket}
                onChange={e => setNewEngagement(prev => ({ ...prev, jiraTicket: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="SE-1234"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jira URL</label>
              <input
                type="url"
                value={newEngagement.jiraUrl}
                onChange={e => setNewEngagement(prev => ({ ...prev, jiraUrl: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://..."
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slack Channel</label>
              <input
                type="text"
                value={newEngagement.slackChannel}
                onChange={e => setNewEngagement(prev => ({ ...prev, slackChannel: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="#customer-poc"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleCreateEngagement}
          className="w-full px-4 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          Create Engagement
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-400 tracking-widest uppercase">Pre-Sales Engineering</p>
            <span className="text-gray-300">|</span>
            <p className="font-medium text-gray-900">Engagement Tracker</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{getOwnerInfo(currentUser).name}</span>
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
              {getOwnerInfo(currentUser).initials}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {view === 'list' && <ListView />}
        {view === 'detail' && <DetailView />}
        {view === 'new' && <NewEngagementView />}
      </main>
    </div>
  );
}
