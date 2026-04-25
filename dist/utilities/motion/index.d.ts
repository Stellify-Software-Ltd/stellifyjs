type EasingFunction = (t: number) => number;
interface TweenOptions {
    duration?: number;
    easing?: EasingFunction;
    delay?: number;
}
interface SpringOptions {
    stiffness?: number;
    damping?: number;
    mass?: number;
}
export declare class Motion {
    static tween(from: number, to: number, options?: TweenOptions): Tween;
    static spring(from: number, to: number, options?: SpringOptions): Spring;
    static easing: {
        linear: (t: number) => number;
        easeIn: (t: number) => number;
        easeOut: (t: number) => number;
        easeInOut: (t: number) => number;
        easeInCubic: (t: number) => number;
        easeOutCubic: (t: number) => number;
        easeInOutCubic: (t: number) => number;
        bounce: (t: number) => number;
    };
}
declare class Tween {
    private from;
    private to;
    private duration;
    private easing;
    private delay;
    private startTime;
    private animationId;
    private updateCallback;
    private completeCallback;
    private _isRunning;
    constructor(from: number, to: number, options?: TweenOptions);
    onUpdate(callback: (value: number) => void): Tween;
    onComplete(callback: () => void): Tween;
    start(): Tween;
    stop(): Tween;
    isRunning(): boolean;
    private tick;
    valueAt(progress: number): number;
}
declare class Spring {
    private from;
    private to;
    private stiffness;
    private damping;
    private mass;
    private velocity;
    private position;
    private animationId;
    private updateCallback;
    private completeCallback;
    private _isRunning;
    private lastTime;
    constructor(from: number, to: number, options?: SpringOptions);
    onUpdate(callback: (value: number) => void): Spring;
    onComplete(callback: () => void): Spring;
    start(): Spring;
    stop(): Spring;
    isRunning(): boolean;
    private tick;
}
export {};
