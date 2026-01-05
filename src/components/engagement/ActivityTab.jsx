import React, { useState, useEffect, useRef } from 'react';
import { activityTypeLabels, activityTypes } from '../../constants';
import { formatDate } from '../../utils';
import LinkifyText from '../ui/LinkifyText';
import { PencilIcon, TrashIcon, ChevronRightIcon, PlusIcon } from '../ui';

const ActivityIcon = ({ type }) => {
  const icons = {
    MEETING: '👥', DEMO: '🎯', DOCUMENT: '📄', EMAIL: '📧',
    SUPPORT: '🔧', WORKSHOP: '🛠️', CALL: '📞'
  };
  return <span className="text-lg">{icons[type] || '📋'}</span>;
};

const ActivityCard = ({ 
  activity, 
  getOwnerInfo, 
  onAddComment, 
  onDeleteComment, 
  onEditActivity,
  onDeleteActivity,
  highlightId, 
  scrollRef 
}) => {
  const [showComments, setShowComments] = useState(activity.comments?.length > 0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isHighlighted = activity.id === highlightId;
  const commentCount = activity.comments?.length || 0;

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAddComment(activity.id, newComment.trim());
    setNewComment('');
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (onDeleteComment) {
      await onDeleteComment(commentId);
    }
  };

  // Edit handlers
  const handleEditClick = () => {
    setEditData({
      type: activity.type,
      date: activity.date,
      description: activity.description
    });
    setIsEditing(true);
    setShowDeleteConfirm(false); // Close delete confirm if open
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSaveEdit = async () => {
    if (!editData.description.trim() || isSaving) return;
    setIsSaving(true);
    const success = await onEditActivity(activity.id, {
      type: editData.type,
      date: editData.date,
      description: editData.description.trim()
    });
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
      setEditData(null);
    }
  };

  const updateEditField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Delete handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setIsEditing(false); // Close edit if open
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    await onDeleteActivity(activity.id);
    // Component will unmount after deletion, no need to reset state
  };

  // Editing mode - render inline form
  if (isEditing) {
    return (
      <div 
        ref={isHighlighted ? scrollRef : null}
        className="bg-white rounded-lg border border-blue-300 p-4"
      >
        <h3 className="font-medium text-gray-900 mb-3">Edit Activity</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select 
                value={editData.type} 
                onChange={(e) => updateEditField('type', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {activityTypes.map(t => <option key={t} value={t}>{activityTypeLabels[t]}</option>)}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input 
                type="date" 
                value={editData.date} 
                onChange={(e) => updateEditField('date', e.target.value)} 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={editData.description} 
              onChange={(e) => updateEditField('description', e.target.value)} 
              placeholder="What happened?" 
              rows={3} 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
            />
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={handleCancelEdit} 
              disabled={isSaving}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveEdit}
              disabled={!editData.description.trim() || isSaving} 
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal display mode
  return (
    <div 
      ref={isHighlighted ? scrollRef : null}
      className={`bg-white rounded-lg border border-gray-200 p-4 transition-all duration-500 group ${isHighlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <ActivityIcon type={activity.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-gray-100">{activityTypeLabels[activity.type] || activity.type}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatDate(activity.date)}</span>
          </div>
          <p className="text-gray-700 mt-1"><LinkifyText text={activity.description} /></p>
        </div>
        
        {/* Edit/Delete buttons - hover reveal */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={handleEditClick}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Edit activity"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete activity"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete confirmation bar */}
      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between mt-3">
          <span className="text-sm text-red-700">
            Delete this activity{commentCount > 0 ? ` and ${commentCount} comment${commentCount !== 1 ? 's' : ''}` : ''}?
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handleCancelDelete} 
              disabled={isDeleting}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmDelete} 
              disabled={isDeleting}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 pl-13">
        <button onClick={() => setShowComments(!showComments)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ChevronRightIcon className={`w-4 h-4 transition-transform ${showComments ? 'rotate-90' : ''}`} />
          {commentCount} comment{commentCount !== 1 ? 's' : ''}
        </button>

        {showComments && (
          <div className="mt-2 space-y-2">
            {activity.comments?.map((comment) => {
              const author = getOwnerInfo(comment.authorId);
              return (
                <div key={comment.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2 group/comment">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${author.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`} title={author.name}>
                    {author.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300"><LinkifyText text={comment.text} /></p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  {/* Delete button - visible on hover */}
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded opacity-0 group-hover/comment:opacity-100 transition-opacity flex-shrink-0"
                    title="Delete comment"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmitting} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AddActivityForm = ({ onAdd, onCancel }) => {
  const [type, setType] = useState('MEETING');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAdd({ type, description: description.trim(), date });
    setDescription('');
    setType('MEETING');
    setDate(new Date().toISOString().split('T')[0]);
    setIsSubmitting(false);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <h3 className="font-medium text-gray-900 mb-3">Log Activity</h3>
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {activityTypes.map(t => <option key={t} value={t}>{activityTypeLabels[t]}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened?" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-200">Cancel</button>
          <button type="submit" disabled={!description.trim() || isSubmitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Adding...' : 'Add Activity'}
          </button>
        </div>
      </div>
    </form>
  );
};

const ActivityTab = ({ 
  engagement, 
  getOwnerInfo, 
  onAddActivity, 
  onAddComment, 
  onDeleteComment,
  onEditActivity,
  onDeleteActivity,
  highlightId 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (highlightId && scrollRef.current) {
      setTimeout(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
    }
  }, [highlightId]);

  const activities = engagement?.activities || [];

  return (
    <div className="p-4">
      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)} className="w-full mb-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Log Activity
        </button>
      )}

      {showAddForm && <AddActivityForm onAdd={onAddActivity} onCancel={() => setShowAddForm(false)} />}

      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard 
              key={activity.id} 
              activity={activity} 
              getOwnerInfo={getOwnerInfo} 
              onAddComment={onAddComment} 
              onDeleteComment={onDeleteComment}
              onEditActivity={onEditActivity}
              onDeleteActivity={onDeleteActivity}
              highlightId={highlightId} 
              scrollRef={scrollRef} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No activities logged yet</h3>
          <p className="text-gray-500 mb-4">Start tracking meetings, demos, and other activities.</p>
          {!showAddForm && (
            <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Log First Activity</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTab;
