'use client';

import { supabase } from '@/lib/supabase';

class GameSubscriptionManager {
  private subscriptions = new Map<string, any>();
  private callbacks = new Map<string, Set<Function>>();

  subscribe(gameId: string, callback: Function) {
    // Add callback to the set
    if (!this.callbacks.has(gameId)) {
      this.callbacks.set(gameId, new Set());
    }
    this.callbacks.get(gameId)!.add(callback);

    // Create subscription only if it doesn't exist
    if (!this.subscriptions.has(gameId)) {
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
            this.callbacks.get(gameId)?.forEach(cb => cb('game_stats', payload));
          }
        )
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'game_substitutions', filter: `game_id=eq.${gameId}` },
          (payload) => {
            this.callbacks.get(gameId)?.forEach(cb => cb('game_substitutions', payload));
          }
        )
        .subscribe();

      this.subscriptions.set(gameId, channel);
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
  }
}

export const gameSubscriptionManager = new GameSubscriptionManager();
