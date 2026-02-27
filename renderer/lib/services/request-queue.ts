type QueuedRequest<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  retries: number;
};

interface QueueConfig {
  maxRequestsPerSecond: number;
  maxRetries: number;
  retryDelayMs: number;
}

const API_CONFIGS: Record<string, QueueConfig> = {
  musicbrainz: { maxRequestsPerSecond: 1, maxRetries: 3, retryDelayMs: 2000 },
  coverart: { maxRequestsPerSecond: 5, maxRetries: 2, retryDelayMs: 1000 },
  fanart: { maxRequestsPerSecond: 5, maxRetries: 2, retryDelayMs: 1000 },
  audiodb: { maxRequestsPerSecond: 3, maxRetries: 2, retryDelayMs: 1000 },
  deezer: { maxRequestsPerSecond: 10, maxRetries: 2, retryDelayMs: 500 },
  lrclib: { maxRequestsPerSecond: 5, maxRetries: 2, retryDelayMs: 1000 },
  wikipedia: { maxRequestsPerSecond: 10, maxRetries: 2, retryDelayMs: 500 },
};

class ApiQueue {
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private completed = 0;
  private failed = 0;

  constructor(
    private name: string,
    private config: QueueConfig
  ) {}

  enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: execute as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        retries: 0,
      });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    const item = this.queue.shift()!;
    const minInterval = 1000 / this.config.maxRequestsPerSecond;
    const elapsed = Date.now() - this.lastRequestTime;
    const delay = Math.max(0, minInterval - elapsed);

    if (delay > 0) {
      await sleep(delay);
    }

    try {
      this.lastRequestTime = Date.now();
      const result = await item.execute();
      this.completed++;
      item.resolve(result);
    } catch (error: unknown) {
      const isRetryable = isRetryableError(error);

      if (isRetryable && item.retries < this.config.maxRetries) {
        item.retries++;
        const backoff = this.config.retryDelayMs * item.retries;
        console.warn(
          `[RequestQueue:${this.name}] Retry ${item.retries}/${this.config.maxRetries} after ${backoff}ms`
        );
        await sleep(backoff);
        this.queue.unshift(item);
      } else {
        this.failed++;
        item.reject(error);
      }
    } finally {
      this.processing = false;
      if (this.queue.length > 0) {
        this.processNext();
      }
    }
  }

  getStatus() {
    return {
      pending: this.queue.length,
      active: this.processing ? 1 : 0,
      completed: this.completed,
      failed: this.failed,
    };
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Response) {
    return error.status === 429 || error.status === 503 || error.status >= 500;
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 429 || status === 503 || status >= 500;
  }
  // Network errors are retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Singleton Instance ──
class RequestQueue {
  private queues: Map<string, ApiQueue> = new Map();

  private getQueue(api: string): ApiQueue {
    if (!this.queues.has(api)) {
      const config = API_CONFIGS[api];
      if (!config) {
        throw new Error(`Unknown API: ${api}. Known APIs: ${Object.keys(API_CONFIGS).join(', ')}`);
      }
      this.queues.set(api, new ApiQueue(api, config));
    }
    return this.queues.get(api)!;
  }

  enqueue<T>(api: string, execute: () => Promise<T>): Promise<T> {
    return this.getQueue(api).enqueue(execute);
  }

  getQueueStatus() {
    const status: Record<string, ReturnType<ApiQueue['getStatus']>> = {};
    for (const [name, queue] of this.queues) {
      status[name] = queue.getStatus();
    }
    return status;
  }

  getTotalStatus() {
    const all = Object.values(this.getQueueStatus());
    return {
      pending: all.reduce((sum, s) => sum + s.pending, 0),
      active: all.reduce((sum, s) => sum + s.active, 0),
      completed: all.reduce((sum, s) => sum + s.completed, 0),
      failed: all.reduce((sum, s) => sum + s.failed, 0),
    };
  }
}

export const requestQueue = new RequestQueue();
