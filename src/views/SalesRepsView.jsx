import React, { useState } from 'react';
import { ChevronLeftIcon, PlusIcon, UserIcon, PencilIcon, TrashIcon } from '../components';

/**
 * Sales Reps Management View
 * Allows adding, editing, and removing sales reps (AEs)
 * Shows engagement count for each rep
 */
const SalesRepsView = ({
  salesReps,
  onCreateSalesRep,
  onUpdateSalesRep,
  onDeleteSalesRep,
  getEngagementCount,
  onBack
}) => {
  const [newRepName, setNewRepName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Handle adding a new sales rep
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newRepName.trim() || isAdding) return;

    setIsAdding(true);
    const result = await onCreateSalesRep(newRepName.trim());
    if (result) {
      setNewRepName('');
    }
    setIsAdding(false);
  };

  // Start editing a sales rep
  const handleStartEdit = (rep) => {
    setEditingId(rep.id);
    setEditName(rep.name);
    setEditEmail(rep.email || '');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditEmail('');
  };

  // Save edits
  const handleSaveEdit = async () => {
    if (!editName.trim() || isSaving) return;

    setIsSaving(true);
    const result = await onUpdateSalesRep(editingId, {
      name: editName.trim(),
      email: editEmail.trim()
    });
    if (result) {
      setEditingId(null);
      setEditName('');
      setEditEmail('');
    }
    setIsSaving(false);
  };

  // Handle deleting a sales rep
  const handleDelete = async (repId) => {
    if (deletingId) return;
    
    setDeletingId(repId);
    await onDeleteSalesRep(repId);
    setDeletingId(null);
  };

  return (
    <div>
      {/* Back button */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Back to Engagements
      </button>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-gray-900">Sales Reps</h2>
        <p className="text-gray-500 mt-1">
          {salesReps.length} sales rep{salesReps.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Add New Rep Form */}
      <form onSubmit={handleAdd} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            id="new-sales-rep-name"
            name="salesRepName"
            value={newRepName}
            onChange={(e) => setNewRepName(e.target.value)}
            placeholder="Enter sales rep name..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            disabled={isAdding}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!newRepName.trim() || isAdding}
            className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAdding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Adding...
              </>
            ) : (
              <>
                <PlusIcon className="w-4 h-4" />
                Add Sales Rep
              </>
            )}
          </button>
        </div>
      </form>

      {/* Sales Reps List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {salesReps.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-gray-500">No sales reps added yet</p>
            <p className="text-sm text-gray-400 mt-1">Add sales reps to track which AE is assigned to each engagement</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {salesReps.map((rep) => {
              const engagementCount = getEngagementCount(rep.id);
              const isDeleting = deletingId === rep.id;
              const isEditing = editingId === rep.id;
              
              return (
                <li key={rep.id} className="px-6 py-4">
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            placeholder="Name"
                            autoFocus
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            placeholder="email@company.com"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName.trim() || isSaving}
                          className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Saving...
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between hover:bg-gray-50 -mx-6 -my-4 px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Purple avatar with initials */}
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-600">{rep.initials || '?'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{rep.name}</p>
                          <p className="text-sm text-gray-500">
                            {rep.email ? (
                              <span>{rep.email} · </span>
                            ) : null}
                            {engagementCount} engagement{engagementCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {/* Edit button */}
                        <button
                          onClick={() => handleStartEdit(rep)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit sales rep"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(rep.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title={engagementCount > 0 ? `Will unassign from ${engagementCount} engagement${engagementCount !== 1 ? 's' : ''}` : 'Delete sales rep'}
                        >
                          {isDeleting ? (
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <TrashIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Help text */}
      {salesReps.length > 0 && (
        <p className="text-sm text-gray-400 mt-4">
          Deleting a sales rep will unassign them from any engagements they're currently assigned to.
        </p>
      )}
    </div>
  );
};

export default SalesRepsView;
