/**
 * 🏀 NBA-LEVEL HYBRID SUPABASE SERVICE
 * 
 * Enterprise-grade service that combines the best of both worlds:
 * - Raw HTTP for reliable queries (never hangs)
 * - Supabase Client for real-time WebSocket subscriptions
 * - Intelligent fallback from WebSocket to polling
 * - NBA.com-level performance and reliability
 * 
 * Architecture Pattern: Same as NBA.com, ESPN, Yahoo Sports
 */

import { supabase } from '@/lib/supabase';

interface HybridConfig {
  url: string;
  anonKey: string;
  enableRealtime: boolean;
  pollingInterval: number;
  queryTimeout: number;
  maxRetries: number;
}

interface QueryOptions {
  timeout?: number;
  retries?: number;
  useRealtime?: boolean;
}

interface SubscriptionOptions {
  fallbackToPolling?: boolean;
  pollingInterval?: number;
  maxReconnectAttempts?: number;
}

export class HybridSupabaseService {
  private config: HybridConfig;
  private subscriptions = new Map<string, any>();
  private pollingIntervals = new Map<string, NodeJS.Timeout>();
  private connectionStatus = new Map<string, 'connected' | 'disconnected' | 'error'>();

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error('❌ Missing Supabase configuration');
    }

    this.config = {
      url,
      anonKey,
      enableRealtime: true,
      pollingInterval: 2000, // 2 seconds (NBA-level frequency)
      queryTimeout: 10000,   // 10 seconds
      maxRetries: 3
    };

    console.log('🏀 HybridSupabaseService: NBA-level service initialized');
  }

  /**
   * 🚀 ENTERPRISE QUERY METHOD
   * Uses raw HTTP for 100% reliability (never hangs)
   * 
   * Filters should be in PostgREST format: { column: 'eq.value' } or { column: 'in.(val1,val2)' }
   */
  async query<T>(
    table: string, 
    select: string = '*',
    filters: Record<string, any> = {},
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { timeout = this.config.queryTimeout, retries = this.config.maxRetries } = options;
    
    // Build query string
    let queryString = `select=${select}`;
    Object.entries(filters).forEach(([key, value]) => {
      // Value should already have PostgREST operator (eq., in., etc.)
      // Just append it directly without modification
      queryString += `&${key}=${value}`;
    });

    const url = `${this.config.url}/rest/v1/${table}?${queryString}`;
    
    // Debug log to catch double-prefix issues
    if (url.includes('=eq.eq.') || url.includes('=in.in.')) {
      console.error('🚨 DOUBLE PREFIX DETECTED IN URL:', url);
      console.error('🚨 Filters passed:', filters);
    }
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.config.anonKey,
            'Authorization': `Bearer ${this.config.anonKey}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Try to get error details from response body
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let isTableNotFound = false;
          try {
            const errorData = await response.json().catch(() => null);
            if (errorData?.message) {
              errorMessage = `${errorMessage} - ${errorData.message}`;
              // Check if table doesn't exist (404 with "does not exist" message)
              if (response.status === 404 && (errorData.message.includes('does not exist') || errorData.message.includes('relation'))) {
                isTableNotFound = true;
              }
            } else if (errorData?.error) {
              errorMessage = `${errorMessage} - ${errorData.error}`;
              if (response.status === 404 && (errorData.error.includes('does not exist') || errorData.error.includes('relation'))) {
                isTableNotFound = true;
              }
            }
            // Only log non-404 errors for debugging (404s are expected for missing tables)
            if (!isTableNotFound) {
              console.error('🚨 HybridService: Query error details:', {
                url,
                status: response.status,
                statusText: response.statusText,
                errorData
              });
            }
          } catch {
            // If JSON parsing fails, use the status text
          }
          
          // For 404 table not found errors, mark for immediate throw (no retries)
          if (isTableNotFound) {
            const notFoundError = new Error(errorMessage);
            (notFoundError as any).isTableNotFound = true;
            throw notFoundError;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`✅ HybridService: Query successful - ${table} (${data.length} records)`);
        return data;

      } catch (error: any) {
        // Check if this is a "table doesn't exist" error - don't retry these
        const isTableNotFound = (error as any).isTableNotFound || error.message?.includes('does not exist') || error.message?.includes('404');
        
        if (isTableNotFound) {
          // For missing tables, throw immediately without retries or warnings
          throw error;
        }
        
        console.warn(`⚠️ HybridService: Query attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`❌ Query failed after ${retries + 1} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('❌ Query failed');
  }

  /**
   * 🔌 ENTERPRISE SUBSCRIPTION METHOD
   * NBA-level real-time with intelligent fallback
   */
  subscribe(
    table: string,
    filter: string,
    callback: (payload: any) => void,
    options: SubscriptionOptions = {}
  ): () => void {
    const {
      fallbackToPolling = true,
      pollingInterval = this.config.pollingInterval,
      maxReconnectAttempts = 3
    } = options;

    const subscriptionKey = `${table}-${filter}`;
    console.log(`🔌 HybridService: Setting up NBA-level subscription for ${subscriptionKey}`);

    // Try WebSocket first (NBA primary method)
    if (this.config.enableRealtime && supabase) {
      try {
        const channel = supabase
          .channel(`hybrid-${subscriptionKey}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter
          }, (payload) => {
            console.log(`🔔 HybridService: WebSocket event received for ${table}:`, payload);
            this.connectionStatus.set(subscriptionKey, 'connected');
            callback(payload);
          })
          .subscribe((status) => {
            console.log(`🔌 HybridService: WebSocket status for ${subscriptionKey}:`, status);
            
            if (status === 'SUBSCRIBED') {
              console.log(`✅ HybridService: WebSocket connected for ${subscriptionKey}`);
              this.connectionStatus.set(subscriptionKey, 'connected');
              // Clear any existing polling fallback
              this.clearPolling(subscriptionKey);
              
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn(`⚠️ HybridService: WebSocket failed for ${subscriptionKey}, status: ${status}`);
              this.connectionStatus.set(subscriptionKey, 'error');
              
              // NBA-level fallback: Switch to polling
              if (fallbackToPolling) {
                console.log(`🔄 HybridService: Switching to polling fallback for ${subscriptionKey}`);
                this.startPollingFallback(table, filter, callback, pollingInterval, subscriptionKey);
              }
            }
          });

        this.subscriptions.set(subscriptionKey, channel);

        // Return unsubscribe function
        return () => {
          console.log(`🔒 HybridService: Unsubscribing from ${subscriptionKey}`);
          if (channel) {
            supabase.removeChannel(channel);
          }
          this.subscriptions.delete(subscriptionKey);
          this.clearPolling(subscriptionKey);
          this.connectionStatus.delete(subscriptionKey);
        };

      } catch (error) {
        console.error(`❌ HybridService: WebSocket setup failed for ${subscriptionKey}:`, error);
        
        // Fallback to polling immediately
        if (fallbackToPolling) {
          console.log(`🔄 HybridService: WebSocket failed, using polling for ${subscriptionKey}`);
          this.startPollingFallback(table, filter, callback, pollingInterval, subscriptionKey);
        }
      }
    }

    // If WebSocket is disabled or failed, use polling
    if (!this.config.enableRealtime || !supabase) {
      console.log(`🔄 HybridService: WebSocket disabled, using polling for ${subscriptionKey}`);
      this.startPollingFallback(table, filter, callback, pollingInterval, subscriptionKey);
    }

    // Return cleanup function
    return () => {
      this.clearPolling(subscriptionKey);
      this.connectionStatus.delete(subscriptionKey);
    };
  }

  /**
   * 🔄 POLLING FALLBACK (NBA-level reliability)
   */
  private startPollingFallback(
    table: string,
    filter: string,
    callback: (payload: any) => void,
    interval: number,
    subscriptionKey: string
  ) {
    console.log(`🔄 HybridService: Starting polling fallback for ${subscriptionKey} (${interval}ms)`);
    
    let lastData: any[] = [];
    
    const poll = async () => {
      try {
        // Parse filter to extract conditions
        // Filter format: "key=eq.value" or "key=in.(val1,val2)"
        const firstEquals = filter.indexOf('=');
        if (firstEquals === -1) {
          console.warn(`⚠️ HybridService: Invalid filter format: ${filter}`);
          return;
        }
        
        const filterKey = filter.substring(0, firstEquals);
        const filterValue = filter.substring(firstEquals + 1); // Everything after first '='
        
        // ✅ Pass filter value as-is (already has operator like 'eq.value')
        const currentData = await this.query(table, '*', {
          [filterKey]: filterValue
        });

        // Simple change detection (in production, use timestamps)
        if (JSON.stringify(currentData) !== JSON.stringify(lastData)) {
          console.log(`🔔 HybridService: Polling detected changes in ${table}`);
          
          // Simulate WebSocket payload format
          const payload = {
            eventType: 'UPDATE',
            new: currentData[0] || null,
            old: lastData[0] || null,
            table: table
          };
          
          callback(payload);
          lastData = currentData;
        }

      } catch (error) {
        console.warn(`⚠️ HybridService: Polling error for ${subscriptionKey}:`, error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.pollingIntervals.set(subscriptionKey, intervalId);
  }

  /**
   * 🧹 CLEANUP POLLING
   */
  private clearPolling(subscriptionKey: string) {
    const intervalId = this.pollingIntervals.get(subscriptionKey);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(subscriptionKey);
      console.log(`🧹 HybridService: Cleared polling for ${subscriptionKey}`);
    }
  }

  /**
   * 📊 CONNECTION STATUS
   */
  getConnectionStatus(subscriptionKey: string): 'connected' | 'disconnected' | 'error' | 'unknown' {
    return this.connectionStatus.get(subscriptionKey) || 'unknown';
  }

  /**
   * 🔧 CONFIGURATION
   */
  updateConfig(updates: Partial<HybridConfig>) {
    this.config = { ...this.config, ...updates };
    console.log('🔧 HybridService: Configuration updated:', updates);
  }
}

// Export singleton instance
export const hybridSupabaseService = new HybridSupabaseService();
