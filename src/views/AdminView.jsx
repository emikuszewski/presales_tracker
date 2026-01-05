import React, { useState } from 'react';
import { ChevronLeftIcon } from '../components';
import { getAvatarColorClasses } from '../utils';

/**
 * Admin view for team management
 * Allows admins to activate/deactivate users and manage admin roles
 * System users (like SE Team) are hidden from this list
 */
const AdminView = ({
  currentUser,
  allTeamMembers,
  engagements,
  onToggleActive,
  onToggleAdmin,
  onBack
}) => {
  const [showInactive, setShowInactive] = useState(false);

  // Filter out system users from the admin panel entirely
  const nonSystemMembers = allTeamMembers.filter(m => m.isSystemUser !== true);
  
  const displayedMembers = showInactive 
    ? nonSystemMembers 
    : nonSystemMembers.filter(m => m.isActive !== false);

  // Count only non-system users for display
  const activeCount = nonSystemMembers.filter(m => m.isActive !== false).length;
  const inactiveCount = nonSystemMembers.filter(m => m.isActive === false).length;

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
          <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100">Team Management</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setShowInactive(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !showInactive ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Active Users
          </button>
          <button
            onClick={() => setShowInactive(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              showInactive ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Users
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {displayedMembers.map(member => {
          const isInactive = member.isActive === false;
          const isSelf = member.id === currentUser?.id;
          const ownedEngagements = engagements.filter(e => 
            e.ownerIds?.includes(member.id) || e.ownerId === member.id
          ).length;
          
          // Use centralized helper for color classes
          const colorClasses = getAvatarColorClasses(member, currentUser?.id);
          
          return (
            <div
              key={member.id}
              className={`bg-white dark:bg-gray-900 border rounded-xl p-5 ${
                isInactive ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${colorClasses}`}>
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-medium ${isInactive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {member.name}
                      </h3>
                      {member.isAdmin && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-medium rounded">Admin</span>
                      )}
                      {isInactive && (
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium rounded">Inactive</span>
                      )}
                      {isSelf && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{ownedEngagements} engagement{ownedEngagements !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                
                {!isSelf && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleAdmin(member.id, member.isAdmin)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        member.isAdmin 
                          ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {member.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      onClick={() => onToggleActive(member.id, member.isActive !== false)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        isInactive
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800'
                          : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                      }`}
                    >
                      {isInactive ? 'Reactivate' : 'Deactivate'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">About User Management</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• <strong>Deactivated users</strong> cannot be assigned as owners but their existing engagements remain.</li>
          <li>• <strong>Admins</strong> can manage team members and access this panel.</li>
          <li>• <strong>Users</strong> automatically join when they sign up with a @plainid.com email.</li>
          <li>• <strong>SE Team</strong> is a shared pool for unassigned engagements visible to everyone.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminView;
