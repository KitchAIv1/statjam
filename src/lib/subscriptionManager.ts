'use client';

import { hybridSupabaseService } from '@/lib/services/hybridSupabaseService';

class GameSubscriptionManager {
  private subscriptions = new Map<string, () => void>();
  private callbacks = new Map<string, Set<Function>>();

  subscribe(gameId: string, callback: Function) {
    console.log('🏀 SubscriptionManager: NBA-level subscription setup for game:', gameId);
    
    // Add callback to the set
    if (!this.callbacks.has(gameId)) {
      this.callbacks.set(gameId, new Set());
    }
    this.callbacks.get(gameId)!.add(callback);

    // Create consolidated subscription if it doesn't exist
    if (!this.subscriptions.has(gameId)) {
      console.log('🔌 SubscriptionManager: Creating NBA-level hybrid subscription for game:', gameId);
      
      // Set up multiple subscriptions for different tables
      const unsubscribeFunctions: (() => void)[] = [];

      // 1. Game updates (score, clock, status) - WebSocket primary, 30s polling fallback
      const gameUnsub = hybridSupabaseService.subscribe(
        'games',
        `id=eq.${gameId}`,
        (payload) => {
          console.log('🔄 SubscriptionManager: Game updated via WebSocket');
          this.callbacks.get(gameId)?.forEach(cb => cb('games', payload));
        },
        { fallbackToPolling: true, pollingInterval: 30000 } // 30s fallback
      );
      unsubscribeFunctions.push(gameUnsub);

      // 2. Game stats (points, fouls, etc.) - WebSocket primary, 30s polling fallback
      const statsUnsub = hybridSupabaseService.subscribe(
        'game_stats',
        `game_id=eq.${gameId}`,
        (payload) => {
          console.log('🔔 SubscriptionManager: New stat via WebSocket');
          this.callbacks.get(gameId)?.forEach(cb => cb('game_stats', payload));
        },
        { fallbackToPolling: true, pollingInterval: 30000 } // 30s fallback
      );
      unsubscribeFunctions.push(statsUnsub);

      // 3. Game substitutions - WebSocket primary, 30s polling fallback
      const subsUnsub = hybridSupabaseService.subscribe(
        'game_substitutions',
        `game_id=eq.${gameId}`,
        (payload) => {
          console.log('🔄 SubscriptionManager: Substitution via WebSocket');
          this.callbacks.get(gameId)?.forEach(cb => cb('game_substitutions', payload));
        },
        { fallbackToPolling: true, pollingInterval: 30000 } // 30s fallback
      );
      unsubscribeFunctions.push(subsUnsub);

      // Store combined unsubscribe function
      this.subscriptions.set(gameId, () => {
        console.log('🔒 SubscriptionManager: Cleaning up all subscriptions for game:', gameId);
        unsubscribeFunctions.forEach(unsub => unsub());
      });

      console.log('✅ SubscriptionManager: NBA-level subscription active for game:', gameId);
    } else {
      console.log('🔌 SubscriptionManager: Reusing existing subscription for game:', gameId);
    }

    // Return unsubscribe function
    return () => {
      console.log('🔌 SubscriptionManager: Unsubscribing callback for game:', gameId);
      this.callbacks.get(gameId)?.delete(callback);
      
      // If no more callbacks, remove subscription
      if (this.callbacks.get(gameId)?.size === 0) {
        const unsubscribe = this.subscriptions.get(gameId);
        if (unsubscribe) {
          unsubscribe();
          this.subscriptions.delete(gameId);
          this.callbacks.delete(gameId);
          console.log('🧹 SubscriptionManager: Cleaned up subscription for game:', gameId);
        }
      }
    };
  }

  /**
   * Subscribe to custom player photo updates for a game
   * Filters by team IDs to only receive updates for players in the game
   */
  subscribeToCustomPlayers(gameId: string, teamAId: string, teamBId: string, callback: Function): () => void {
    if (!teamAId || !teamBId) {
      console.warn('⚠️ SubscriptionManager: Cannot subscribe to custom players without team IDs');
      return () => {}; // Return no-op unsubscribe
    }

    console.log('📸 SubscriptionManager: Setting up custom players photo subscription for game:', gameId, 'teams:', teamAId, teamBId);
    
    // Add callback to the set
    if (!this.callbacks.has(gameId)) {
      this.callbacks.set(gameId, new Set());
    }
    this.callbacks.get(gameId)!.add(callback);

    // Subscribe to custom_players table filtered by team IDs
    const customPlayersUnsub = hybridSupabaseService.subscribe(
      'custom_players',
      `team_id=in.(${teamAId},${teamBId})`, // Filter by both team IDs
      (payload) => {
        console.log('📸 SubscriptionManager: Custom player photo updated:', payload);
        this.callbacks.get(gameId)?.forEach(cb => cb('custom_players', payload));
      },
      { fallbackToPolling: false } // Photos update rarely, no need for polling fallback
    );

    // Return unsubscribe function
    return () => {
      console.log('📸 SubscriptionManager: Unsubscribing from custom players for game:', gameId);
      this.callbacks.get(gameId)?.delete(callback);
      customPlayersUnsub();
    };
  }

    // ❌ DISABLED CODE BELOW - CAUSING WEBSOCKET SPAM
    /*
    // Create subscription only if it doesn't exist
    if (!this.subscriptions.has(gameId)) {
      console.log('🔌 SubscriptionManager: Creating new subscription channel for game:', gameId);
      const channel = supabase
        .channel(`consolidated-game-${gameId}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
          (payload) => {
            console.log('🔄 SubscriptionManager: Game updated:', payload);
            this.callbacks.get(gameId)?.forEach(cb => cb('games', payload));
          }
        )
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'game_stats', filter: `game_id=eq.${gameId}` },
          (payload) => {
            console.log('🔔 SubscriptionManager: New game_stats INSERT detected:', payload);
            console.log('🔔 SubscriptionManager: Notifying', this.callbacks.get(gameId)?.size, 'callbacks');
            this.callbacks.get(gameId)?.forEach(cb => cb('game_stats', payload));
          }
        )
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'game_substitutions', filter: `game_id=eq.${gameId}` },
          (payload) => {
            this.callbacks.get(gameId)?.forEach(cb => cb('game_substitutions', payload));
          }
        )
        .subscribe((status) => {
          console.log('🔌 SubscriptionManager: Channel status for game', gameId, ':', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ SubscriptionManager: Successfully subscribed to real-time updates for game', gameId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ SubscriptionManager: Channel error for game', gameId);
          } else if (status === 'TIMED_OUT') {
            console.error('⏰ SubscriptionManager: Subscription timed out for game', gameId);
          } else if (status === 'CLOSED') {
            console.log('🔒 SubscriptionManager: Channel closed for game', gameId);
          }
        });

      this.subscriptions.set(gameId, channel);
      
      // Test if real-time is working at all
      console.log('🔌 SubscriptionManager: Testing Supabase real-time connection...');
      console.log('🔌 SubscriptionManager: Supabase URL:', supabase.supabaseUrl);
      console.log('🔌 SubscriptionManager: Channel created:', channel);
    } else {
      console.log('🔌 SubscriptionManager: Reusing existing subscription for game:', gameId);
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.get(gameId)?.delete(callback);
      
      // If no more callbacks, remove subscription
      if (this.callbacks.get(gameId)?.size === 0) {
        const channel = this.subscriptions.get(gameId);
        if (channel) {
          supabase.removeChannel(channel);
          this.subscriptions.delete(gameId);
          this.callbacks.delete(gameId);
        }
      }
    };
    */
}

export const gameSubscriptionManager = new GameSubscriptionManager();
