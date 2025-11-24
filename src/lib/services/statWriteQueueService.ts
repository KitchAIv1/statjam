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
   * Check if an error is transient and should be retried
   * Transient errors: network failures, 5xx server errors
   * Non-transient: client errors (400, 401, 403, 404, 422)
   */
  private isTransientError(error: any): boolean {
    // Network errors (fetch failures, connection issues)
    if (error.message?.includes('fetch') || 
        error.message?.includes('network') || 
        error.message?.includes('Failed to fetch')) {
      return true;
    }
    
    // HTTP status codes that indicate transient failures
    const statusMatch = error.message?.match(/HTTP (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      // Retry on server errors (500, 502, 503, 504)
      return status === 500 || status === 502 || status === 503 || status === 504;
    }
    
    return false;
  }

  /**
   * Process the queue sequentially (one write at a time) with retry logic
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

      // Retry logic: 3 attempts max with exponential backoff
      const maxRetries = 3;
      let lastError: Error | null = null;
      let success = false;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const result = await operation.execute();
          operation.resolve(result);
          console.log(`✅ StatWriteQueue: Completed ${operation.statType} write${attempt > 0 ? ` (retry ${attempt})` : ''}`);
          success = true;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          // Check if error is transient and should be retried
          if (attempt < maxRetries - 1 && this.isTransientError(lastError)) {
            const backoffDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.warn(`⚠️ StatWriteQueue: Transient error on ${operation.statType} write (attempt ${attempt + 1}/${maxRetries}), retrying in ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }
          
          // Non-transient error or max retries reached - fail immediately
          break;
        }
      }

      // If all retries failed, reject the operation
      if (!success && lastError) {
        console.error(`❌ StatWriteQueue: Failed ${operation.statType} write after retries:`, lastError);
        operation.reject(lastError);
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

