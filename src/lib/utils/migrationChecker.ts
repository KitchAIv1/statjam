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

      const isComplete = hasTable && hasColumn;

      let message = '';
      if (!hasTable && !hasColumn) {
        message = 'Custom players migration not applied. Please run 005_custom_players_schema.sql';
      } else if (hasTable && !hasColumn) {
        message = 'Migration partially applied. Please run 005_fix_team_players_column.sql to add the missing custom_player_id column';
      } else if (!hasTable && hasColumn) {
        message = 'Migration partially applied. Missing custom_players table';
      }

      return {
        hasTable,
        hasColumn,
        isComplete,
        message: isComplete ? undefined : message
      };
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
      return {
        hasTable: false,
        hasColumn: false,
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
