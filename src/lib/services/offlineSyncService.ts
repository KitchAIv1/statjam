import { GameService } from './gameService';

interface OfflineAction {
  id: string;
  type: 'stat_recorded' | 'substitution' | 'clock_update' | 'game_start';
  data: any;
  timestamp: number;
  synced: boolean;
}

export class OfflineSyncService {
  private static readonly OFFLINE_QUEUE_KEY = 'statjam_offline_queue';
  private static readonly GAME_DATA_KEY = 'statjam_game_data';

  // Check if online
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Add action to offline queue
  static addToOfflineQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): void {
    try {
      const queue = this.getOfflineQueue();
      const newAction: OfflineAction = {
        ...action,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        synced: false
      };
      
      queue.push(newAction);
      this.saveOfflineQueue(queue);
      
      console.log('Action added to offline queue:', newAction);
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  }

  // Get offline queue
  static getOfflineQueue(): OfflineAction[] {
    try {
      const queue = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  // Save offline queue
  static saveOfflineQueue(queue: OfflineAction[]): void {
    try {
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Sync offline actions when back online
  static async syncOfflineActions(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Still offline, skipping sync');
      return;
    }

    const queue = this.getOfflineQueue();
    const unsyncedActions = queue.filter(action => !action.synced);

    if (unsyncedActions.length === 0) {
      console.log('No offline actions to sync');
      return;
    }

    console.log(`Syncing ${unsyncedActions.length} offline actions...`);

    for (const action of unsyncedActions) {
      try {
        let success = false;

        switch (action.type) {
          case 'stat_recorded':
            success = await GameService.recordStat(action.data);
            break;
          case 'substitution':
            success = await GameService.recordSubstitution(action.data);
            break;
          case 'clock_update':
            success = await GameService.updateGameClock(action.data.gameId, action.data.clockData);
            break;
          case 'game_start':
            success = await GameService.startGame(action.data.gameId);
            break;
        }

        if (success) {
          action.synced = true;
          console.log(`Synced action: ${action.type}`);
        } else {
          console.error(`Failed to sync action: ${action.type}`);
        }
      } catch (error) {
        console.error(`Error syncing action ${action.type}:`, error);
      }
    }

    // Save updated queue
    this.saveOfflineQueue(queue);

    // Remove synced actions
    const remainingActions = queue.filter(action => !action.synced);
    this.saveOfflineQueue(remainingActions);

    console.log(`Sync complete. ${remainingActions.length} actions remaining.`);
  }

  // Save game data locally
  static saveGameData(gameId: string, data: any): void {
    try {
      const key = `${this.GAME_DATA_KEY}_${gameId}`;
      localStorage.setItem(key, JSON.stringify({
        ...data,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  }

  // Get game data locally
  static getGameData(gameId: string): any {
    try {
      const key = `${this.GAME_DATA_KEY}_${gameId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting game data:', error);
      return null;
    }
  }

  // Clear game data
  static clearGameData(gameId: string): void {
    try {
      const key = `${this.GAME_DATA_KEY}_${gameId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing game data:', error);
    }
  }

  // Initialize offline sync listeners
  static initializeOfflineSync(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Back online, syncing offline actions...');
      this.syncOfflineActions();
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline, actions will be queued');
    });

    // Try to sync any pending actions on startup
    if (this.isOnline()) {
      this.syncOfflineActions();
    }
  }

  // Get offline queue status
  static getOfflineQueueStatus(): { pending: number; total: number } {
    const queue = this.getOfflineQueue();
    const pending = queue.filter(action => !action.synced).length;
    return { pending, total: queue.length };
  }
} 