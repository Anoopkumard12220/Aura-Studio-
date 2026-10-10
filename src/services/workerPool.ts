interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  payload: T;
  resolve: (result: R) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface WorkerPoolConfig {
  maxWorkers: number;
  workerScript: string;
  idleTimeoutMs: number;
}

class WorkerWrapper {
  worker: Worker;
  busy = false;
  currentTask: WorkerTask | null = null;
  lastActive = Date.now();

  constructor(
    private script: string,
    private onMessage: (data: any) => void,
    private onError: (error: Error) => void
  ) {
    this.worker = new Worker(script, { type: 'module' });
    this.worker.onmessage = (e) => onMessage(e.data);
    this.worker.onerror = (e) => onError(new Error(e.message));
  }

  postMessage(data: any): void {
    this.worker.postMessage(data);
  }

  terminate(): void {
    this.worker.terminate();
  }
}

export class WorkerPool {
  private workers: WorkerWrapper[] = [];
  private taskQueue: WorkerTask[] = [];
  private config: WorkerPoolConfig;
  private workerIdCounter = 0;

  constructor(config: WorkerPoolConfig) {
    this.config = config;
    this.initializeWorkers(Math.min(2, config.maxWorkers));
  }

  private initializeWorkers(count: number): void {
    for (let i = 0; i < count; i++) {
      this.createWorker();
    }
  }

  private createWorker(): WorkerWrapper {
    const wrapper = new WorkerWrapper(
      this.config.workerScript,
      (data) => this.handleWorkerMessage(wrapper, data),
      (error) => this.handleWorkerError(wrapper, error)
    );
    this.workers.push(wrapper);
    return wrapper;
  }

  private handleWorkerMessage(wrapper: WorkerWrapper, data: any): void {
    const task = wrapper.currentTask;
    wrapper.busy = false;
    wrapper.currentTask = null;
    wrapper.lastActive = Date.now();

    if (task) {
      if (data.error) {
        task.reject(new Error(data.error));
      } else {
        task.resolve(data.result);
      }
    }

    this.processQueue();
    this.maybeScaleDown();
  }

  private handleWorkerError(wrapper: WorkerWrapper, error: Error): void {
    const task = wrapper.currentTask;
    wrapper.busy = false;
    wrapper.currentTask = null;

    if (task) {
      task.reject(error);
    }

    this.processQueue();
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const task = this.taskQueue.shift()!;
    availableWorker.busy = true;
    availableWorker.currentTask = task;
    availableWorker.postMessage({ id: task.id, type: task.type, payload: task.payload });
  }

  private maybeScaleDown(): void {
    if (this.workers.length <= 2) return;

    const idleWorkers = this.workers.filter(
      w => !w.busy && Date.now() - w.lastActive > this.config.idleTimeoutMs
    );

    if (idleWorkers.length > 0) {
      const workerToRemove = idleWorkers[0];
      workerToRemove.terminate();
      this.workers = this.workers.filter(w => w !== workerToRemove);
    }
  }

  private maybeScaleUp(): void {
    if (this.workers.length >= this.config.maxWorkers) return;
    if (this.taskQueue.length > this.workers.length) {
      this.createWorker();
    }
  }

  execute<T, R>(type: string, payload: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: `task_${++this.workerIdCounter}_${Date.now()}`,
        type,
        payload,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.taskQueue.push(task);
      this.maybeScaleUp();
      this.processQueue();
    });
  }

  getStats(): { totalWorkers: number; busyWorkers: number; queuedTasks: number } {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      queuedTasks: this.taskQueue.length,
    };
  }

  terminateAll(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.taskQueue.forEach(t => t.reject(new Error('Pool terminated')));
    this.taskQueue = [];
  }
}

export const createPrettierWorkerPool = (): WorkerPool => {
  return new WorkerPool({
    maxWorkers: navigator.hardwareConcurrency || 4,
    workerScript: new URL('./workers/prettierWorker.ts', import.meta.url).href,
    idleTimeoutMs: 30000,
  });
};

export const createSearchWorkerPool = (): WorkerPool => {
  return new WorkerPool({
    maxWorkers: navigator.hardwareConcurrency || 4,
    workerScript: new URL('./workers/searchWorker.ts', import.meta.url).href,
    idleTimeoutMs: 30000,
  });
};

export const createLintWorkerPool = (): WorkerPool => {
  return new WorkerPool({
    maxWorkers: navigator.hardwareConcurrency || 4,
    workerScript: new URL('./workers/lintWorker.ts', import.meta.url).href,
    idleTimeoutMs: 30000,
  });
};

let prettierPool: WorkerPool | null = null;
let searchPool: WorkerPool | null = null;
let lintPool: WorkerPool | null = null;

export function getPrettierPool(): WorkerPool {
  if (!prettierPool) prettierPool = createPrettierWorkerPool();
  return prettierPool;
}

export function getSearchPool(): WorkerPool {
  if (!searchPool) searchPool = createSearchWorkerPool();
  return searchPool;
}

export function getLintPool(): WorkerPool {
  if (!lintPool) lintPool = createLintWorkerPool();
  return lintPool;
}

export function terminateAllPools(): void {
  prettierPool?.terminateAll();
  searchPool?.terminateAll();
  lintPool?.terminateAll();
  prettierPool = searchPool = lintPool = null;
}