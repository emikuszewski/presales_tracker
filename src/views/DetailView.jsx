import React, { useState, useEffect } from 'react';
import {
  OwnersDisplay,
  StaleBadge,
  SlackIcon,
  DriveIcon,
  SlidesIcon,
  LinkifyText,
  ActivityModal,
  PhaseEditModal,
  LinkModal,
  IntegrationsModal,
  EditDetailsModal,
  OwnersModal,
  HistoryModal
} from '../components';
import { parseLinks } from '../utils';
import { industryLabels, phaseConfig, activityTypeLabels } from '../constants';

/**
 * Detail view for a single engagement
 * Shows phases, activities, and allows editing
 */
const DetailView = ({
  engagement,
  teamMembers,
  currentUser,
  getOwnerInfo,
  detail, // Namespaced hook object: detail.phase.save, detail.activity.add, etc.
  navigationOptions,
  onClearNavigationOptions,
  onToggleArchive,
  onBack
}) => {
  // Modal states - owned by this view
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  
  // Local UI state
  const [newComment, setNewComment] = useState({});
  const [expandedActivities, setExpandedActivities] = useState({});
  const [highlightedActivityId, setHighlightedActivityId] = useState(null);

  // Handle navigation options (scroll to activity)
  useEffect(() => {
    if (navigationOptions?.scrollToActivityId) {
      const activityId = navigationOptions.scrollToActivityId;
      
      // Auto-expand the activity
      setExpandedActivities(prev => ({
        ...prev,
        [activityId]: true
      }));
      
      // Set highlight
      setHighlightedActivityId(activityId);
      
      // Scroll to the activity after DOM updates
      requestAnimationFrame(() => {
        const element = document.getElementById(`activity-${activityId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
      
      // Clear highlight after animation completes (2 seconds)
      const highlightTimer = setTimeout(() => {
        setHighlightedActivityId(null);
      }, 2000);
      
      // Clear navigation options
      onClearNavigationOptions();
      
      return () => clearTimeout(highlightTimer);
    }
  }, [navigationOptions, onClearNavigationOptions]);

  const toggleActivityExpansion = (activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETE': return 'bg-emerald-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      default: return 'bg-gray-200';
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETE': return { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Complete' };
      case 'IN_PROGRESS': return { bg: 'bg-blue-50', text: 'text-blue-700', label: 'In Progress' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Pending' };
    }
  };

  // Handlers that bridge modals to hook operations
  const handleAddActivity = async (activityData) => {
    const success = await detail.activity.add(activityData);
    if (success) {
      setShowActivityModal(false);
    }
  };

  const handleSavePhase = async (phaseData) => {
    await detail.phase.save(showPhaseModal, phaseData);
    setShowPhaseModal(null);
  };

  const handleAddLink = async (linkData) => {
    await detail.phase.addLink(showLinkModal, linkData);
    setShowLinkModal(null);
  };

  const handleUpdateIntegrations = async (updates) => {
    await detail.integrations.update(updates);
    setShowIntegrationsModal(false);
  };

  const handleUpdateDetails = async (updates) => {
    await detail.details.update(updates);
    setShowEditDetailsModal(false);
  };

  const handleAddComment = async (activityId) => {
    const commentText = newComment[activityId];
    const success = await detail.activity.addComment(activityId, commentText);
    if (success) {
      setNewComment(prev => ({ ...prev, [activityId]: '' }));
    }
  };

  return (
    <div>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Engagements
      </button>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          <OwnersDisplay ownerIds={engagement.ownerIds} size="md" getOwnerInfo={getOwnerInfo} currentUserId={currentUser?.id} />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-medium text-gray-900">{engagement.company}</h2>
              {engagement.isArchived && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">Archived</span>
              )}
              {engagement.isStale && !engagement.isArchived && (
                <StaleBadge daysSinceActivity={engagement.daysSinceActivity} />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-gray-500">
                {industryLabels[engagement.industry] || engagement.industry} · Started {engagement.startDate}
              </p>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setShowEditDetailsModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Details
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setShowOwnersModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Manage Owners ({engagement.ownerIds?.length || 1})
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-medium text-gray-900">{engagement.dealSize || '—'}</p>
          <button
            onClick={() => onToggleArchive(engagement.id, !engagement.isArchived)}
            className="mt-2 text-sm text-gray-500 hover:text-gray-900"
          >
            {engagement.isArchived ? 'Restore' : 'Archive'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Primary Contact</p>
            <button 
              onClick={() => setShowEditDetailsModal(true)}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              Edit
            </button>
          </div>
          <p className="font-medium text-gray-900">{engagement.contactName}</p>
          {engagement.contactEmail && (
            <p className="text-sm text-gray-600">{engagement.contactEmail}</p>
          )}
          {engagement.contactPhone && (
            <p className="text-sm text-gray-600">{engagement.contactPhone}</p>
          )}
        </div>

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
            {engagement.salesforceId ? (
              <a href={engagement.salesforceUrl || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                Salesforce: {engagement.salesforceId}
              </a>
            ) : (
              <p className="text-sm text-gray-400">No Salesforce linked</p>
            )}
            {engagement.jiraTicket ? (
              <a href={engagement.jiraUrl || '#'} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                Jira: {engagement.jiraTicket}
              </a>
            ) : (
              <p className="text-sm text-gray-400">No Jira ticket linked</p>
            )}
            {engagement.driveFolderName ? (
              engagement.driveFolderUrl ? (
                <a 
                  href={engagement.driveFolderUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <DriveIcon className="w-4 h-4" />
                  {engagement.driveFolderName}
                </a>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <DriveIcon className="w-4 h-4" />
                  {engagement.driveFolderName}
                </p>
              )
            ) : (
              <p className="text-sm text-gray-400">No Drive folder linked</p>
            )}
            {engagement.slidesName ? (
              engagement.slidesUrl ? (
                <a 
                  href={engagement.slidesUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <SlidesIcon className="w-4 h-4" />
                  {engagement.slidesName}
                </a>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <SlidesIcon className="w-4 h-4" />
                  {engagement.slidesName}
                </p>
              )
            ) : (
              <p className="text-sm text-gray-400">No Slides deck linked</p>
            )}
            {engagement.slackChannel ? (
              engagement.slackUrl ? (
                <a 
                  href={engagement.slackUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <SlackIcon className="w-4 h-4" />
                  {engagement.slackChannel}
                </a>
              ) : (
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <SlackIcon className="w-4 h-4" />
                  {engagement.slackChannel}
                </p>
              )
            ) : (
              <p className="text-sm text-gray-400">No Slack channel linked</p>
            )}
          </div>
        </div>
      </div>

      {/* Phase Tracker */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Engagement Progress</h3>
        <div className="space-y-2">
          {phaseConfig.map((phase, index) => {
            const phaseData = engagement.phases[phase.id] || { status: 'PENDING', notes: '', links: [] };
            const statusBadge = getStatusBadge(phaseData.status);
            const links = parseLinks(phaseData.links);
            
            return (
              <div 
                key={phase.id}
                className={`border rounded-xl p-5 transition-all ${
                  phaseData.status === 'IN_PROGRESS' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
                }`}
              >
                <div 
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => setShowPhaseModal(phase.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold ${
                      phaseData.status === 'COMPLETE' ? 'bg-emerald-100 text-emerald-700' :
                      phaseData.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {phaseData.status === 'COMPLETE' ? '✓' : index + 1}
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
                  <p className="text-sm text-gray-600 mt-3 pl-11">
                    <LinkifyText text={phaseData.notes} />
                  </p>
                )}
                
                <div className="mt-3 pl-11">
                  {links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {links.map((link, linkIndex) => (
                        <div key={linkIndex} className="group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm">
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-gray-700 hover:text-blue-600" onClick={(e) => e.stopPropagation()}>
                            {link.title}
                          </a>
                          <button 
                            onClick={(e) => { e.stopPropagation(); detail.phase.removeLink(phase.id, linkIndex); }}
                            className="ml-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowLinkModal(phase.id); }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >+ Add Link</button>
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
          >+ Add Activity</button>
        </div>
        
        <div className="space-y-3">
          {engagement.activities.map((activity) => {
            const isExpanded = expandedActivities[activity.id];
            const isHighlighted = highlightedActivityId === activity.id;
            const commentCount = activity.comments?.length || 0;
            
            return (
              <div 
                key={activity.id} 
                id={`activity-${activity.id}`}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-500 ${
                  isHighlighted ? 'activity-highlight' : ''
                }`}
              >
                <div className="flex gap-4 p-4">
                  <div className="text-sm text-gray-400 w-24 flex-shrink-0">{activity.date}</div>
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded mb-1">
                      {activityTypeLabels[activity.type] || activity.type}
                    </span>
                    <p className="text-gray-900">
                      <LinkifyText text={activity.description} />
                    </p>
                    
                    <button
                      onClick={() => toggleActivityExpansion(activity.id)}
                      className="mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {commentCount} comment{commentCount !== 1 ? 's' : ''}
                    </button>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    {activity.comments?.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {activity.comments.map((comment) => {
                          const author = getOwnerInfo(comment.authorId);
                          const isOwnComment = comment.authorId === currentUser?.id;
                          
                          return (
                            <div key={comment.id} className="flex gap-3">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                isOwnComment ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>{author.initials}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{author.name}</span>
                                  <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                  {isOwnComment && (
                                    <button onClick={() => detail.activity.deleteComment(comment.id)}
                                      className="text-xs text-gray-400 hover:text-red-500">Delete</button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 mt-0.5">
                                  <LinkifyText text={comment.text} />
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {currentUser?.initials}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={newComment[activity.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [activity.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(activity.id);
                            }
                          }}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleAddComment(activity.id)}
                          disabled={!newComment[activity.id]?.trim()}
                          className="px-3 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >Post</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {engagement.activities.length === 0 && (
            <p className="text-gray-400 text-center py-8">No activities logged yet</p>
          )}
        </div>
      </div>

      {/* Modals - owned by this view */}
      <ActivityModal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        onSave={handleAddActivity}
      />

      <PhaseEditModal
        isOpen={showPhaseModal !== null}
        onClose={() => setShowPhaseModal(null)}
        phaseId={showPhaseModal}
        initialStatus={engagement.phases[showPhaseModal]?.status}
        initialNotes={engagement.phases[showPhaseModal]?.notes}
        onSave={handleSavePhase}
      />

      <LinkModal
        isOpen={showLinkModal !== null}
        onClose={() => setShowLinkModal(null)}
        phaseLabel={phaseConfig.find(p => p.id === showLinkModal)?.label || ''}
        onAdd={handleAddLink}
      />

      <IntegrationsModal
        isOpen={showIntegrationsModal}
        onClose={() => setShowIntegrationsModal(false)}
        initialData={engagement}
        onSave={handleUpdateIntegrations}
      />

      <EditDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        initialData={engagement}
        onSave={handleUpdateDetails}
      />

      <OwnersModal
        isOpen={showOwnersModal}
        onClose={() => setShowOwnersModal(false)}
        currentOwnerIds={engagement.ownerIds}
        teamMembers={teamMembers}
        currentUserId={currentUser?.id}
        getOwnerInfo={getOwnerInfo}
        onAddOwner={detail.owner.add}
        onRemoveOwner={detail.owner.remove}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        changeLogs={engagement.changeLogs}
        currentUserId={currentUser?.id}
        getOwnerInfo={getOwnerInfo}
      />

      {/* Highlight animation styles */}
      <style>{`
        @keyframes activityHighlight {
          0% {
            background-color: rgb(251 191 36 / 0.3);
          }
          100% {
            background-color: white;
          }
        }
        
        .activity-highlight {
          animation: activityHighlight 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DetailView;
