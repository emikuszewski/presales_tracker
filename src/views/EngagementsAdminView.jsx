import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { OwnersDisplay, DeleteEngagementModal, ChevronLeftIcon } from '../components';
import { phaseLabels } from '../constants';
import { formatDate } from '../utils';

/**
 * Admin view for engagement management
 * Allows admins to view all engagements, delete them, and see deletion audit log
 */
const EngagementsAdminView = ({
  engagements,
  currentUser,
  getOwnerInfo,
  getCascadeInfo,
  onDeleteEngagement,
  onBack
}) => {
  // Local filter state
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modal state - owned by this view
  const [deleteModalEngagement, setDeleteModalEngagement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deletion log state
  const [deletionLogs, setDeletionLogs] = useState([]);
  const [loadingDeletionLogs, setLoadingDeletionLogs] = useState(false);

  /**
   * Fetch deletion logs from the database
   * Filters out expired records (belt and suspenders with DynamoDB TTL)
   */
  const fetchDeletionLogs = useCallback(async () => {
    setLoadingDeletionLogs(true);
    try {
      const client = generateClient();
      const result = await client.models.DeletionLog.list();
      
      // Filter out expired records (in case TTL hasn't cleaned them up yet)
      const now = Math.floor(Date.now() / 1000);
      const validLogs = (result.data || []).filter(log => {
        // Keep if no expiresAt or if expiresAt is in the future
        return !log.expiresAt || log.expiresAt > now;
      });
      
      // Sort by createdAt (most recent first)
      validLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setDeletionLogs(validLogs);
    } catch (error) {
      console.error('Error fetching deletion logs:', error);
      setDeletionLogs([]);
    } finally {
      setLoadingDeletionLogs(false);
    }
  }, []);

  // Fetch deletion logs when switching to 'deleted' tab
  useEffect(() => {
    if (filter === 'deleted') {
      fetchDeletionLogs();
    }
  }, [filter, fetchDeletionLogs]);

  // Filter engagements (only for non-deleted tabs)
  const filteredEngagements = engagements
    .filter(e => {
      if (filter === 'active' && e.isArchived) return false;
      if (filter === 'archived' && !e.isArchived) return false;
      
      if (search) {
        const query = search.toLowerCase();
        const matchesCompany = e.company.toLowerCase().includes(query);
        const matchesContact = e.contactName.toLowerCase().includes(query);
        if (!matchesCompany && !matchesContact) return false;
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));

  const handleConfirmDelete = async () => {
    await onDeleteEngagement(deleteModalEngagement, setDeleteModalEngagement, setIsDeleting, getOwnerInfo);
    // Refresh deletion logs if we're on the deleted tab
    if (filter === 'deleted') {
      fetchDeletionLogs();
    }
  };

  // Count for deletion log badge
  const deletionLogCount = deletionLogs.length;

  return (
    <div>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to Engagements
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Engagement Management</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {engagements.filter(e => !e.isArchived).length} active · {engagements.filter(e => e.isArchived).length} archived · {engagements.length} total
          </p>
        </div>
      </div>

      {/* Search bar - hidden when on Deleted tab */}
      {filter !== 'deleted' && (
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by company or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      )}

      {/* Tab buttons */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All ({engagements.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'active' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Active ({engagements.filter(e => !e.isArchived).length})
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'archived' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Archived ({engagements.filter(e => e.isArchived).length})
          </button>
          <button
            onClick={() => setFilter('deleted')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              filter === 'deleted' ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Deleted
            {deletionLogCount > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                filter === 'deleted' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}>
                {deletionLogCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content based on selected tab */}
      {filter === 'deleted' ? (
        // Deletion Log View
        <div>
          {loadingDeletionLogs ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-gray-900 dark:border-gray-100 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading deletion history...</p>
            </div>
          ) : deletionLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No deletion history</h3>
              <p className="text-gray-500 dark:text-gray-400">No engagements have been deleted in the past year.</p>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deleted By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Removed Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {deletionLogs.map(log => (
                    <tr key={log.id} className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{log.companyName}</p>
                          {log.currentPhase && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Was in: {log.currentPhase}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-600 dark:text-gray-400">{log.contactName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-600 dark:text-gray-400">{log.deletedByName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{formatDate(log.createdAt)}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{log.cascadeSummary || 'No related data'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Info box for deletion log */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About Deletion History</h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <li>• This log shows engagements deleted in the past 365 days.</li>
              <li>• Deleted data cannot be restored - this is for audit purposes only.</li>
              <li>• Records are automatically removed after one year.</li>
            </ul>
          </div>
        </div>
      ) : (
        // Regular Engagement Table View
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owners</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phase</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activities</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEngagements.map(engagement => (
                  <tr key={engagement.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{engagement.company}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{engagement.contactName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <OwnersDisplay 
                        ownerIds={engagement.ownerIds} 
                        size="sm" 
                        getOwnerInfo={getOwnerInfo} 
                        currentUserId={currentUser?.id} 
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {phaseLabels[engagement.currentPhase] || engagement.currentPhase}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{engagement.activities?.length || 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{engagement.startDate}</span>
                    </td>
                    <td className="px-4 py-4">
                      {engagement.isArchived ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setDeleteModalEngagement(engagement)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEngagements.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                No engagements found
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
            <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">About Engagement Deletion</h4>
            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• <strong>Deletion is permanent</strong> and cannot be undone.</li>
              <li>• All related data (phases, activities, comments, change logs) will be removed.</li>
              <li>• Consider archiving engagements instead if you may need the data later.</li>
              <li>• Deletions are logged for audit purposes and visible in the "Deleted" tab.</li>
            </ul>
          </div>
        </>
      )}

      {/* Delete Modal - owned by this view */}
      <DeleteEngagementModal
        isOpen={deleteModalEngagement !== null}
        engagement={deleteModalEngagement}
        cascadeInfo={getCascadeInfo(deleteModalEngagement)}
        onClose={() => setDeleteModalEngagement(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default EngagementsAdminView;
