// ============================================================================
// MIGRATION CHECKER UTILITY
// ============================================================================
// Purpose: Check if database migrations have been applied
// Usage: Graceful feature degradation when migrations are missing
// ============================================================================

import { supabase } from '../supabase';

export class MigrationChecker {
  /**
   * Check if custom players migration (005) has been applied
   */
  static async hasCustomPlayersMigration(): Promise<{
    hasTable: boolean;
    hasColumn: boolean;
    hasIdColumn: boolean;
    isComplete: boolean;
    message?: string;
  }> {
    try {
      // Check if custom_players table exists
      let hasTable = false;
      try {
        await supabase.from('custom_players').select('id').limit(1);
        hasTable = true;
      } catch (error) {
        hasTable = false;
      }

      // Check if custom_player_id column exists in team_players
      let hasColumn = false;
      try {
        const result = await supabase.from('team_players').select('custom_player_id').limit(1);
        hasColumn = !result.error;
      } catch (error) {
        hasColumn = false;
      }

      // Check if team_players.id column exists (this was the main issue)
      let hasIdColumn = false;
      try {
        const result = await supabase.from('team_players').select('id').limit(1);
        hasIdColumn = !result.error;
      } catch (error) {
        hasIdColumn = false;
      }

      const isComplete = hasTable && hasColumn && hasIdColumn;

      let message = '';
      if (!isComplete) {
        const missing = [];
        if (!hasTable) missing.push('custom_players table');
        if (!hasColumn) missing.push('team_players.custom_player_id column');
        if (!hasIdColumn) missing.push('team_players.id column');
        
        message = `Migration incomplete. Missing: ${missing.join(', ')}. Please run migration 006_fix_team_players_rls.sql`;
      }

      return {
        hasTable,
        hasColumn,
        hasIdColumn,
        isComplete,
        message: isComplete ? undefined : message
      };
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
      return {
        hasTable: false,
        hasColumn: false,
        hasIdColumn: false,
        isComplete: false,
        message: 'Unable to check migration status'
      };
    }
  }

  /**
   * Check if coach role migration (004) has been applied
   */
  static async hasCoachRoleMigration(): Promise<boolean> {
    try {
      // Try to query for a coach user
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'coach')
        .limit(1);

      return !error;
    } catch (error) {
      return false;
    }
  }
}
