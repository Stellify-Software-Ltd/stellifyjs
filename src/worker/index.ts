type MessageHandler<T = unknown, R = unknown> = (data: T) => R | Promise<R>

interface WorkerTask<T = unknown> {
  id: string
  resolve: (value: T) => void
  reject: (error: Error) => void
}

export class Worker {
  private worker: globalThis.Worker | null = null
  private tasks: Map<string, WorkerTask> = new Map()
  private messageHandler: MessageHandler | null = null
  private errorHandler: ((error: Error) => void) | null = null
  private isTerminated: boolean = false

  private constructor() {}

  static create(scriptUrl: string): Worker {
    const instance = new Worker()
    instance.worker = new globalThis.Worker(scriptUrl)
    instance.setupListeners()
    return instance
  }

  static fromFunction(fn: Function): Worker {
    const instance = new Worker()

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
    `

    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)

    instance.worker = new globalThis.Worker(url)
    instance.setupListeners()

    // Clean up blob URL
    URL.revokeObjectURL(url)

    return instance
  }

  static fromCode(code: string): Worker {
    const instance = new Worker()

    const blob = new Blob([code], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)

    instance.worker = new globalThis.Worker(url)
    instance.setupListeners()

    URL.revokeObjectURL(url)

    return instance
  }

  private setupListeners(): void {
    if (!this.worker) return

    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data

      if (id) {
        const task = this.tasks.get(id)
        if (task) {
          this.tasks.delete(id)
          if (error) {
            task.reject(new WorkerError(error))
          } else {
            task.resolve(result)
          }
        }
      } else {
        this.messageHandler?.(event.data)
      }
    }

    this.worker.onerror = (event) => {
      const error = new WorkerError(event.message)
      this.errorHandler?.(error)

      // Reject all pending tasks
      this.tasks.forEach(task => task.reject(error))
      this.tasks.clear()
    }
  }

  run<T = unknown, R = unknown>(data: T): Promise<R> {
    if (this.isTerminated || !this.worker) {
      return Promise.reject(new WorkerError('Worker is terminated'))
    }

    return new Promise((resolve, reject) => {
      const id = this.generateId()
      this.tasks.set(id, { id, resolve: resolve as (value: unknown) => void, reject })
      this.worker!.postMessage({ id, data })
    })
  }

  post(data: unknown): this {
    if (this.isTerminated || !this.worker) {
      throw new WorkerError('Worker is terminated')
    }
    this.worker.postMessage(data)
    return this
  }

  onMessage<T = unknown>(handler: MessageHandler<T>): this {
    this.messageHandler = handler as MessageHandler
    return this
  }

  onError(handler: (error: Error) => void): this {
    this.errorHandler = handler
    return this
  }

  terminate(): this {
    this.worker?.terminate()
    this.worker = null
    this.isTerminated = true
    this.tasks.clear()
    return this
  }

  isRunning(): boolean {
    return !this.isTerminated && this.worker !== null
  }

  getPendingCount(): number {
    return this.tasks.size
  }

  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}

// Pool for managing multiple workers
export class WorkerPool {
  private workers: Worker[] = []
  private queue: Array<{ data: unknown; resolve: (value: unknown) => void; reject: (error: Error) => void }> = []
  private activeCount: number = 0

  private constructor(private size: number, private createWorker: () => Worker) {
    for (let i = 0; i < size; i++) {
      this.workers.push(createWorker())
    }
  }

  static create(size: number, scriptUrl: string): WorkerPool {
    return new WorkerPool(size, () => Worker.create(scriptUrl))
  }

  static fromFunction(size: number, fn: Function): WorkerPool {
    return new WorkerPool(size, () => Worker.fromFunction(fn))
  }

  async run<T = unknown, R = unknown>(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve: resolve as (value: unknown) => void, reject })
      this.processQueue()
    })
  }

  private processQueue(): void {
    if (this.queue.length === 0 || this.activeCount >= this.size) {
      return
    }

    const worker = this.workers[this.activeCount]
    const task = this.queue.shift()

    if (!worker || !task) return

    this.activeCount++

    worker.run(task.data)
      .then(result => {
        task.resolve(result)
        this.activeCount--
        this.processQueue()
      })
      .catch(error => {
        task.reject(error)
        this.activeCount--
        this.processQueue()
      })
  }

  async map<T, R>(items: T[]): Promise<R[]> {
    return Promise.all(items.map(item => this.run<T, R>(item)))
  }

  terminate(): this {
    this.workers.forEach(w => w.terminate())
    this.workers = []
    this.queue = []
    return this
  }

  getSize(): number {
    return this.size
  }

  getActiveCount(): number {
    return this.activeCount
  }

  getQueueLength(): number {
    return this.queue.length
  }
}

export class WorkerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkerError'
  }
}
