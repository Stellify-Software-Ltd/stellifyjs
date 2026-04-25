export class Worker {
    worker = null;
    tasks = new Map();
    messageHandler = null;
    errorHandler = null;
    isTerminated = false;
    constructor() { }
    static create(scriptUrl) {
        const instance = new Worker();
        instance.worker = new globalThis.Worker(scriptUrl);
        instance.setupListeners();
        return instance;
    }
    static fromFunction(fn) {
        const instance = new Worker();
        // Create a self-contained worker script
        const workerCode = `
      const handler = ${fn.toString()};

      self.onmessage = async (event) => {
        const { id, data } = event.data;
        try {
          const result = await handler(data);
          self.postMessage({ id, result });
        } catch (error) {
          self.postMessage({ id, error: error.message });
        }
      };
    `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        instance.worker = new globalThis.Worker(url);
        instance.setupListeners();
        // Clean up blob URL
        URL.revokeObjectURL(url);
        return instance;
    }
    static fromCode(code) {
        const instance = new Worker();
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        instance.worker = new globalThis.Worker(url);
        instance.setupListeners();
        URL.revokeObjectURL(url);
        return instance;
    }
    setupListeners() {
        if (!this.worker)
            return;
        this.worker.onmessage = (event) => {
            const { id, result, error } = event.data;
            if (id) {
                const task = this.tasks.get(id);
                if (task) {
                    this.tasks.delete(id);
                    if (error) {
                        task.reject(new WorkerError(error));
                    }
                    else {
                        task.resolve(result);
                    }
                }
            }
            else {
                this.messageHandler?.(event.data);
            }
        };
        this.worker.onerror = (event) => {
            const error = new WorkerError(event.message);
            this.errorHandler?.(error);
            // Reject all pending tasks
            this.tasks.forEach(task => task.reject(error));
            this.tasks.clear();
        };
    }
    run(data) {
        if (this.isTerminated || !this.worker) {
            return Promise.reject(new WorkerError('Worker is terminated'));
        }
        return new Promise((resolve, reject) => {
            const id = this.generateId();
            this.tasks.set(id, { id, resolve: resolve, reject });
            this.worker.postMessage({ id, data });
        });
    }
    post(data) {
        if (this.isTerminated || !this.worker) {
            throw new WorkerError('Worker is terminated');
        }
        this.worker.postMessage(data);
        return this;
    }
    onMessage(handler) {
        this.messageHandler = handler;
        return this;
    }
    onError(handler) {
        this.errorHandler = handler;
        return this;
    }
    terminate() {
        this.worker?.terminate();
        this.worker = null;
        this.isTerminated = true;
        this.tasks.clear();
        return this;
    }
    isRunning() {
        return !this.isTerminated && this.worker !== null;
    }
    getPendingCount() {
        return this.tasks.size;
    }
    generateId() {
        return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
}
// Pool for managing multiple workers
export class WorkerPool {
    size;
    createWorker;
    workers = [];
    queue = [];
    activeCount = 0;
    constructor(size, createWorker) {
        this.size = size;
        this.createWorker = createWorker;
        for (let i = 0; i < size; i++) {
            this.workers.push(createWorker());
        }
    }
    static create(size, scriptUrl) {
        return new WorkerPool(size, () => Worker.create(scriptUrl));
    }
    static fromFunction(size, fn) {
        return new WorkerPool(size, () => Worker.fromFunction(fn));
    }
    async run(data) {
        return new Promise((resolve, reject) => {
            this.queue.push({ data, resolve: resolve, reject });
            this.processQueue();
        });
    }
    processQueue() {
        if (this.queue.length === 0 || this.activeCount >= this.size) {
            return;
        }
        const worker = this.workers[this.activeCount];
        const task = this.queue.shift();
        if (!worker || !task)
            return;
        this.activeCount++;
        worker.run(task.data)
            .then(result => {
            task.resolve(result);
            this.activeCount--;
            this.processQueue();
        })
            .catch(error => {
            task.reject(error);
            this.activeCount--;
            this.processQueue();
        });
    }
    async map(items) {
        return Promise.all(items.map(item => this.run(item)));
    }
    terminate() {
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.queue = [];
        return this;
    }
    getSize() {
        return this.size;
    }
    getActiveCount() {
        return this.activeCount;
    }
    getQueueLength() {
        return this.queue.length;
    }
}
export class WorkerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'WorkerError';
    }
}
