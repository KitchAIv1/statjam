'use client';

import { supabase } from '@/lib/supabase';

class GameSubscriptionManager {
  private subscriptions = new Map<string, any>();
  private callbacks = new Map<string, Set<Function>>();

  subscribe(gameId: string, callback: Function) {
    console.log('🔌 SubscriptionManager: Setting up subscription for game:', gameId);
    
    // Add callback to the set
    if (!this.callbacks.has(gameId)) {
      this.callbacks.set(gameId, new Set());
    }
    this.callbacks.get(gameId)!.add(callback);
    
    console.log('🔌 SubscriptionManager: Total callbacks for game', gameId, ':', this.callbacks.get(gameId)?.size);

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
  }
}

export const gameSubscriptionManager = new GameSubscriptionManager();
