import React, { useState, useEffect, useRef } from 'react';
import { activityTypeLabels, activityTypes } from '../../constants';
import { formatDate } from '../../utils';
import LinkifyText from '../ui/LinkifyText';

const ActivityIcon = ({ type }) => {
  const icons = {
    MEETING: '👥', DEMO: '🎯', DOCUMENT: '📄', EMAIL: '📧',
    SUPPORT: '🔧', WORKSHOP: '🛠️', CALL: '📞'
  };
  return <span className="text-lg">{icons[type] || '📋'}</span>;
};

const ActivityCard = ({ activity, getOwnerInfo, onAddComment, onDeleteComment, highlightId, scrollRef }) => {
  const [showComments, setShowComments] = useState(activity.comments?.length > 0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isHighlighted = activity.id === highlightId;

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

  return (
    <div 
      ref={isHighlighted ? scrollRef : null}
      className={`bg-white rounded-lg border border-gray-200 p-4 transition-all duration-500 ${isHighlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <ActivityIcon type={activity.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{activityTypeLabels[activity.type] || activity.type}</span>
            <span className="text-sm text-gray-500">{formatDate(activity.date)}</span>
          </div>
          <p className="text-gray-700 mt-1"><LinkifyText text={activity.description} /></p>
        </div>
      </div>

      <div className="mt-3 pl-13">
        <button onClick={() => setShowComments(!showComments)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className={`w-4 h-4 transition-transform ${showComments ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {activity.comments?.length || 0} comment{activity.comments?.length !== 1 ? 's' : ''}
        </button>

        {showComments && (
          <div className="mt-2 space-y-2">
            {activity.comments?.map((comment) => {
              const author = getOwnerInfo(comment.authorId);
              return (
                <div key={comment.id} className="flex items-start gap-2 bg-gray-50 rounded-lg p-2 group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${author.isSystemUser ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`} title={author.name}>
                    {author.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700"><LinkifyText text={comment.text} /></p>
                    <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                  </div>
                  {/* Delete button - visible on hover */}
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Delete comment"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
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
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button type="submit" disabled={!description.trim() || isSubmitting} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Adding...' : 'Add Activity'}
          </button>
        </div>
      </div>
    </form>
  );
};

const ActivityTab = ({ engagement, getOwnerInfo, onAddActivity, onAddComment, onDeleteComment, highlightId }) => {
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
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
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
