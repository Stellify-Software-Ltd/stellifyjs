type EasingFunction = (t: number) => number

interface TweenOptions {
  duration?: number
  easing?: EasingFunction
  delay?: number
}

interface SpringOptions {
  stiffness?: number
  damping?: number
  mass?: number
}

export class Motion {
  static tween(from: number, to: number, options: TweenOptions = {}): Tween {
    return new Tween(from, to, options)
  }

  static spring(from: number, to: number, options: SpringOptions = {}): Spring {
    return new Spring(from, to, options)
  }

  // Common easing functions
  static easing = {
    linear: (t: number) => t,
    easeIn: (t: number) => t * t,
    easeOut: (t: number) => t * (2 - t),
    easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number) => t * t * t,
    easeOutCubic: (t: number) => (--t) * t * t + 1,
    easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    bounce: (t: number) => {
      const n1 = 7.5625
      const d1 = 2.75
      if (t < 1 / d1) return n1 * t * t
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }
}

class Tween {
  private from: number
  private to: number
  private duration: number
  private easing: EasingFunction
  private delay: number
  private startTime: number | null = null
  private animationId: number | null = null
  private updateCallback: ((value: number) => void) | null = null
  private completeCallback: (() => void) | null = null
  private _isRunning: boolean = false

  constructor(from: number, to: number, options: TweenOptions = {}) {
    this.from = from
    this.to = to
    this.duration = options.duration ?? 300
    this.easing = options.easing ?? Motion.easing.easeInOut
    this.delay = options.delay ?? 0
  }

  onUpdate(callback: (value: number) => void): Tween {
    this.updateCallback = callback
    return this
  }

  onComplete(callback: () => void): Tween {
    this.completeCallback = callback
    return this
  }

  start(): Tween {
    this._isRunning = true

    setTimeout(() => {
      this.startTime = performance.now()
      this.tick()
    }, this.delay)

    return this
  }

  stop(): Tween {
    this._isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    return this
  }

  isRunning(): boolean {
    return this._isRunning
  }

  private tick(): void {
    if (!this._isRunning || this.startTime === null) return

    const elapsed = performance.now() - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)
    const easedProgress = this.easing(progress)
    const value = this.from + (this.to - this.from) * easedProgress

    if (this.updateCallback) {
      this.updateCallback(value)
    }

    if (progress < 1) {
      this.animationId = requestAnimationFrame(() => this.tick())
    } else {
      this._isRunning = false
      if (this.completeCallback) {
        this.completeCallback()
      }
    }
  }

  // Get value at specific progress (0-1) without running animation
  valueAt(progress: number): number {
    const easedProgress = this.easing(Math.max(0, Math.min(1, progress)))
    return this.from + (this.to - this.from) * easedProgress
  }
}

class Spring {
  private from: number
  private to: number
  private stiffness: number
  private damping: number
  private mass: number
  private velocity: number = 0
  private position: number
  private animationId: number | null = null
  private updateCallback: ((value: number) => void) | null = null
  private completeCallback: (() => void) | null = null
  private _isRunning: boolean = false
  private lastTime: number | null = null

  constructor(from: number, to: number, options: SpringOptions = {}) {
    this.from = from
    this.to = to
    this.position = from
    this.stiffness = options.stiffness ?? 100
    this.damping = options.damping ?? 10
    this.mass = options.mass ?? 1
  }

  onUpdate(callback: (value: number) => void): Spring {
    this.updateCallback = callback
    return this
  }

  onComplete(callback: () => void): Spring {
    this.completeCallback = callback
    return this
  }

  start(): Spring {
    this._isRunning = true
    this.lastTime = performance.now()
    this.tick()
    return this
  }

  stop(): Spring {
    this._isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    return this
  }

  isRunning(): boolean {
    return this._isRunning
  }

  private tick(): void {
    if (!this._isRunning || this.lastTime === null) return

    const now = performance.now()
    const dt = Math.min((now - this.lastTime) / 1000, 0.064) // Cap delta time
    this.lastTime = now

    // Spring physics
    const displacement = this.position - this.to
    const springForce = -this.stiffness * displacement
    const dampingForce = -this.damping * this.velocity
    const acceleration = (springForce + dampingForce) / this.mass

    this.velocity += acceleration * dt
    this.position += this.velocity * dt

    if (this.updateCallback) {
      this.updateCallback(this.position)
    }

    // Check if spring has settled
    const isSettled = Math.abs(this.velocity) < 0.01 && Math.abs(displacement) < 0.01

    if (isSettled) {
      this._isRunning = false
      this.position = this.to
      if (this.updateCallback) {
        this.updateCallback(this.position)
      }
      if (this.completeCallback) {
        this.completeCallback()
      }
    } else {
      this.animationId = requestAnimationFrame(() => this.tick())
    }
  }
}
