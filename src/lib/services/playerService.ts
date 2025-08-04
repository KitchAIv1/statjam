import { supabase } from '@/lib/supabase';
import { Player } from '@/lib/types/tournament';

export class PlayerService {
  // Create a new player
  static async createPlayer(playerData: {
    name: string;
    email: string;
    position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
    jerseyNumber: number;
    isPremium: boolean;
    country: string;
  }): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .insert({
          name: playerData.name,
          email: playerData.email,
          position: playerData.position,
          jersey_number: playerData.jerseyNumber,
          is_premium: playerData.isPremium,
          country: playerData.country
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating player:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        position: data.position,
        jerseyNumber: data.jersey_number,
        isPremium: data.is_premium,
        country: data.country,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error in createPlayer:', error);
      return null;
    }
  }

  // Get player by ID
  static async getPlayer(playerId: string): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) {
        console.error('Error getting player:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        position: data.position,
        jerseyNumber: data.jersey_number,
        isPremium: data.is_premium,
        country: data.country,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error in getPlayer:', error);
      return null;
    }
  }

  // Get all players
  static async getAllPlayers(): Promise<Player[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error getting players:', error);
        return [];
      }

      return data.map(player => ({
        id: player.id,
        name: player.name,
        email: player.email,
        position: player.position,
        jerseyNumber: player.jersey_number,
        isPremium: player.is_premium,
        country: player.country,
        createdAt: player.created_at
      }));
    } catch (error) {
      console.error('Error in getAllPlayers:', error);
      return [];
    }
  }

  // Search players by name or email
  static async searchPlayers(query: string): Promise<Player[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');

      if (error) {
        console.error('Error searching players:', error);
        return [];
      }

      return data.map(player => ({
        id: player.id,
        name: player.name,
        email: player.email,
        position: player.position,
        jerseyNumber: player.jersey_number,
        isPremium: player.is_premium,
        country: player.country,
        createdAt: player.created_at
      }));
    } catch (error) {
      console.error('Error in searchPlayers:', error);
      return [];
    }
  }

  // Update player
  static async updatePlayer(playerId: string, updates: Partial<Player>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.position) updateData.position = updates.position;
      if (updates.jerseyNumber !== undefined) updateData.jersey_number = updates.jerseyNumber;
      if (updates.isPremium !== undefined) updateData.is_premium = updates.isPremium;
      if (updates.country) updateData.country = updates.country;

      const { error } = await supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId);

      if (error) {
        console.error('Error updating player:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePlayer:', error);
      return false;
    }
  }

  // Delete player
  static async deletePlayer(playerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) {
        console.error('Error deleting player:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePlayer:', error);
      return false;
    }
  }
} 