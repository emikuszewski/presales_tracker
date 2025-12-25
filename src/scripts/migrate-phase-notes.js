/**
 * Migration Script: Convert Phase.notes to PhaseNote records
 * 
 * This script migrates legacy notes stored in Phase.notes field to the new
 * PhaseNote model. Run this once after deploying the schema changes.
 * 
 * Usage:
 *   1. Import and call migrateLegacyNotes() after app initialization
 *   2. Or run standalone: node scripts/migrate-phase-notes.js
 * 
 * Migration Logic:
 *   - For each Phase with non-empty notes field:
 *     - Create a PhaseNote record
 *     - Set authorId to engagement's first owner (from EngagementOwner, ordered by addedAt)
 *     - Set createdAt to phase.updatedAt or engagement.startDate
 *     - Set updatedAt to null (will be set by model)
 *   - After successful migration, Phase.notes field becomes unused
 *   - Migration is idempotent: checks for existing PhaseNotes before creating
 */

import { generateClient } from 'aws-amplify/data';

const client = generateClient();

/**
 * Run the migration
 * @param {Object} options - Migration options
 * @param {boolean} options.dryRun - If true, don't actually create records
 * @param {Function} options.onProgress - Progress callback
 * @returns {Object} Migration results
 */
export const migrateLegacyNotes = async (options = {}) => {
  const { dryRun = false, onProgress = () => {} } = options;
  
  const results = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
    details: []
  };

  try {
    onProgress('Fetching all data...');

    // Fetch all required data in parallel
    const [
      phasesResult,
      engagementsResult,
      ownershipsResult,
      existingNotesResult
    ] = await Promise.all([
      client.models.Phase.list(),
      client.models.Engagement.list(),
      client.models.EngagementOwner.list(),
      client.models.PhaseNote.list()
    ]);

    const phases = phasesResult.data;
    const engagements = engagementsResult.data;
    const ownerships = ownershipsResult.data;
    const existingNotes = existingNotesResult.data;

    // Create lookup maps
    const engagementMap = new Map(engagements.map(e => [e.id, e]));
    const ownershipsByEngagement = ownerships.reduce((acc, o) => {
      if (!acc[o.engagementId]) acc[o.engagementId] = [];
      acc[o.engagementId].push(o);
      return acc;
    }, {});

    // Create set of existing notes to avoid duplicates
    // Key: engagementId + phaseType + text (first 50 chars)
    const existingNoteKeys = new Set(
      existingNotes.map(n => `${n.engagementId}:${n.phaseType}:${n.text.substring(0, 50)}`)
    );

    // Find phases with legacy notes
    const phasesWithNotes = phases.filter(p => p.notes && p.notes.trim());
    results.total = phasesWithNotes.length;

    onProgress(`Found ${results.total} phases with legacy notes to migrate`);

    for (let i = 0; i < phasesWithNotes.length; i++) {
      const phase = phasesWithNotes[i];
      const noteKey = `${phase.engagementId}:${phase.phaseType}:${phase.notes.substring(0, 50)}`;

      // Skip if already migrated
      if (existingNoteKeys.has(noteKey)) {
        results.skipped++;
        results.details.push({
          phaseId: phase.id,
          engagementId: phase.engagementId,
          phaseType: phase.phaseType,
          status: 'skipped',
          reason: 'Already migrated'
        });
        continue;
      }

      try {
        const engagement = engagementMap.get(phase.engagementId);
        if (!engagement) {
          results.errors.push({
            phaseId: phase.id,
            error: 'Engagement not found'
          });
          continue;
        }

        // Find the first owner (by addedAt) for this engagement
        const engagementOwners = ownershipsByEngagement[phase.engagementId] || [];
        engagementOwners.sort((a, b) => 
          new Date(a.addedAt || a.createdAt) - new Date(b.addedAt || b.createdAt)
        );

        // Use first owner, fall back to legacy ownerId, then null
        let authorId = engagementOwners[0]?.teamMemberId || engagement.ownerId;
        
        if (!authorId) {
          results.errors.push({
            phaseId: phase.id,
            engagementId: phase.engagementId,
            error: 'No owner found for engagement'
          });
          continue;
        }

        // Determine creation date: phase.updatedAt or engagement.startDate
        const createdAt = phase.updatedAt || engagement.startDate || engagement.createdAt;

        const noteData = {
          engagementId: phase.engagementId,
          phaseType: phase.phaseType,
          text: phase.notes.trim(),
          authorId: authorId
        };

        if (dryRun) {
          results.migrated++;
          results.details.push({
            phaseId: phase.id,
            engagementId: phase.engagementId,
            phaseType: phase.phaseType,
            status: 'would_create',
            noteData
          });
        } else {
          // Create the PhaseNote
          const { data: newNote } = await client.models.PhaseNote.create(noteData);
          
          results.migrated++;
          results.details.push({
            phaseId: phase.id,
            engagementId: phase.engagementId,
            phaseType: phase.phaseType,
            status: 'created',
            noteId: newNote.id
          });
        }

        onProgress(`Migrated ${results.migrated}/${results.total}`);
      } catch (error) {
        results.errors.push({
          phaseId: phase.id,
          engagementId: phase.engagementId,
          error: error.message
        });
      }
    }

    return results;
  } catch (error) {
    results.errors.push({ error: error.message });
    return results;
  }
};

/**
 * Migration status check - see how many phases have legacy notes
 */
export const checkMigrationStatus = async () => {
  const [phasesResult, notesResult] = await Promise.all([
    client.models.Phase.list(),
    client.models.PhaseNote.list()
  ]);

  const phasesWithNotes = phasesResult.data.filter(p => p.notes && p.notes.trim());
  
  return {
    totalPhases: phasesResult.data.length,
    phasesWithLegacyNotes: phasesWithNotes.length,
    totalPhaseNotes: notesResult.data.length,
    needsMigration: phasesWithNotes.length > 0
  };
};

// If running standalone
if (typeof window === 'undefined' && process.argv[1]?.includes('migrate-phase-notes')) {
  console.log('Running phase notes migration...');
  
  // Configure Amplify first
  // Note: You'll need to configure Amplify with your backend before running
  
  migrateLegacyNotes({
    dryRun: process.argv.includes('--dry-run'),
    onProgress: console.log
  }).then(results => {
    console.log('\nMigration Results:');
    console.log(`  Total: ${results.total}`);
    console.log(`  Migrated: ${results.migrated}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach(e => console.log(`  - ${JSON.stringify(e)}`));
    }
  }).catch(console.error);
}

export default migrateLegacyNotes;
