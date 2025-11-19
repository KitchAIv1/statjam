/**
 * Player Jersey Service
 * Handles jersey number updates for both regular and custom players
 */

import { supabase } from '@/lib/supabase/client';
import { CoachPlayerService } from './coachPlayerService';
import { TeamService } from './tournamentService';

export interface UpdateJerseyRequest {
  playerId: string;
  jerseyNumber: number;
  isCustomPlayer: boolean;
}

export class PlayerJerseyService {
  /**
   * Update jersey number for a player (regular or custom)
   * Persists immediately to database and returns updated player data
   */
  static async updateJerseyNumber(
    playerId: string,
    jerseyNumber: number,
    isCustomPlayer: boolean
  ): Promise<{ success: boolean; message?: string }> {
    try {
      if (isCustomPlayer) {
        // Update custom player jersey number
        const response = await CoachPlayerService.updateCustomPlayer(playerId, {
          jersey_number: jerseyNumber
        });

        if (!response.success) {
          return {
            success: false,
            message: response.message || 'Failed to update custom player jersey number'
          };
        }

        return { success: true };
      } else {
        // Update regular player jersey number (in users table)
        const success = await TeamService.updatePlayer(playerId, {
          jerseyNumber
        });

        if (!success) {
          return {
            success: false,
            message: 'Failed to update player jersey number'
          };
        }

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error updating jersey number:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating jersey number'
      };
    }
  }
}

