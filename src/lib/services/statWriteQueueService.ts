/**
 * StatWriteQueueService - Sequential Write Queue Manager
 * 
 * PURPOSE:
 * - Prevents concurrent database writes that cause lock contention
 * - Maintains write order for data integrity
 * - Provides optimistic UI updates while writes process sequentially
 * - Reusable across all stat tracking operations
 * 
 * ARCHITECTURE:
 * - Singleton pattern for shared queue state
 * - FIFO queue ensures correct write order
 * - Processes writes one at a time to prevent database timeouts
 * 
 * Follows .cursorrules: <200 lines, single responsibility, PascalCase naming
 */

interface WriteOperation {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  statType: string;
  timestamp: number;
}

class StatWriteQueueService {
  private queue: WriteOperation[] = [];
  private isProcessing: boolean = false;
  private operationCounter: number = 0;

  /**
   * Add a write operation to the queue
   * @param execute - Function that performs the database write
   * @param statType - Type of stat being written (for logging)
   * @returns Promise that resolves when the write completes
   */
  async enqueue(
    execute: () => Promise<any>,
    statType: string = 'unknown'
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const operation: WriteOperation = {
        id: `write-${++this.operationCounter}-${Date.now()}`,
        execute,
        resolve,
        reject,
        statType,
        timestamp: Date.now()
      };

      this.queue.push(operation);
      console.log(`📝 StatWriteQueue: Enqueued ${statType} write (queue size: ${this.queue.length})`);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue sequentially (one write at a time)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 StatWriteQueue: Starting queue processing (${this.queue.length} operations)`);

    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (!operation) break;

      const queueTime = Date.now() - operation.timestamp;
      console.log(`⏳ StatWriteQueue: Processing ${operation.statType} write (waited ${queueTime}ms)`);

      try {
        const result = await operation.execute();
        operation.resolve(result);
        console.log(`✅ StatWriteQueue: Completed ${operation.statType} write`);
      } catch (error) {
        console.error(`❌ StatWriteQueue: Failed ${operation.statType} write:`, error);
        operation.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessing = false;
    console.log(`✅ StatWriteQueue: Queue processing complete`);
  }

  /**
   * Get current queue status (for debugging/monitoring)
   */
  getStatus(): {
    queueSize: number;
    isProcessing: boolean;
    nextOperationType?: string;
  } {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      nextOperationType: this.queue[0]?.statType
    };
  }

  /**
   * Clear the queue (emergency use only)
   */
  clear(): void {
    console.warn('⚠️ StatWriteQueue: Clearing queue (emergency)');
    this.queue.forEach(op => {
      op.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.isProcessing = false;
  }
}

// Export singleton instance
export const statWriteQueueService = new StatWriteQueueService();

