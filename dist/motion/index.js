export class Motion {
    static tween(from, to, options = {}) {
        return new Tween(from, to, options);
    }
    static spring(from, to, options = {}) {
        return new Spring(from, to, options);
    }
    // Common easing functions
    static easing = {
        linear: (t) => t,
        easeIn: (t) => t * t,
        easeOut: (t) => t * (2 - t),
        easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: (t) => t * t * t,
        easeOutCubic: (t) => (--t) * t * t + 1,
        easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        bounce: (t) => {
            const n1 = 7.5625;
            const d1 = 2.75;
            if (t < 1 / d1)
                return n1 * t * t;
            if (t < 2 / d1)
                return n1 * (t -= 1.5 / d1) * t + 0.75;
            if (t < 2.5 / d1)
                return n1 * (t -= 2.25 / d1) * t + 0.9375;
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    };
}
class Tween {
    from;
    to;
    duration;
    easing;
    delay;
    startTime = null;
    animationId = null;
    updateCallback = null;
    completeCallback = null;
    _isRunning = false;
    constructor(from, to, options = {}) {
        this.from = from;
        this.to = to;
        this.duration = options.duration ?? 300;
        this.easing = options.easing ?? Motion.easing.easeInOut;
        this.delay = options.delay ?? 0;
    }
    onUpdate(callback) {
        this.updateCallback = callback;
        return this;
    }
    onComplete(callback) {
        this.completeCallback = callback;
        return this;
    }
    start() {
        this._isRunning = true;
        setTimeout(() => {
            this.startTime = performance.now();
            this.tick();
        }, this.delay);
        return this;
    }
    stop() {
        this._isRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        return this;
    }
    isRunning() {
        return this._isRunning;
    }
    tick() {
        if (!this._isRunning || this.startTime === null)
            return;
        const elapsed = performance.now() - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        const easedProgress = this.easing(progress);
        const value = this.from + (this.to - this.from) * easedProgress;
        if (this.updateCallback) {
            this.updateCallback(value);
        }
        if (progress < 1) {
            this.animationId = requestAnimationFrame(() => this.tick());
        }
        else {
            this._isRunning = false;
            if (this.completeCallback) {
                this.completeCallback();
            }
        }
    }
    // Get value at specific progress (0-1) without running animation
    valueAt(progress) {
        const easedProgress = this.easing(Math.max(0, Math.min(1, progress)));
        return this.from + (this.to - this.from) * easedProgress;
    }
}
class Spring {
    from;
    to;
    stiffness;
    damping;
    mass;
    velocity = 0;
    position;
    animationId = null;
    updateCallback = null;
    completeCallback = null;
    _isRunning = false;
    lastTime = null;
    constructor(from, to, options = {}) {
        this.from = from;
        this.to = to;
        this.position = from;
        this.stiffness = options.stiffness ?? 100;
        this.damping = options.damping ?? 10;
        this.mass = options.mass ?? 1;
    }
    onUpdate(callback) {
        this.updateCallback = callback;
        return this;
    }
    onComplete(callback) {
        this.completeCallback = callback;
        return this;
    }
    start() {
        this._isRunning = true;
        this.lastTime = performance.now();
        this.tick();
        return this;
    }
    stop() {
        this._isRunning = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        return this;
    }
    isRunning() {
        return this._isRunning;
    }
    tick() {
        if (!this._isRunning || this.lastTime === null)
            return;
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.064); // Cap delta time
        this.lastTime = now;
        // Spring physics
        const displacement = this.position - this.to;
        const springForce = -this.stiffness * displacement;
        const dampingForce = -this.damping * this.velocity;
        const acceleration = (springForce + dampingForce) / this.mass;
        this.velocity += acceleration * dt;
        this.position += this.velocity * dt;
        if (this.updateCallback) {
            this.updateCallback(this.position);
        }
        // Check if spring has settled
        const isSettled = Math.abs(this.velocity) < 0.01 && Math.abs(displacement) < 0.01;
        if (isSettled) {
            this._isRunning = false;
            this.position = this.to;
            if (this.updateCallback) {
                this.updateCallback(this.position);
            }
            if (this.completeCallback) {
                this.completeCallback();
            }
        }
        else {
            this.animationId = requestAnimationFrame(() => this.tick());
        }
    }
}
