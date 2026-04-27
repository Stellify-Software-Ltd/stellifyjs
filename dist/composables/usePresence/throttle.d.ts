/**
 * Creates a throttled version of a function that limits execution frequency.
 *
 * Uses trailing edge: if calls come in faster than the throttle interval,
 * the last call will still execute after the interval.
 */
export declare function throttle<F extends (...args: Parameters<F>) => void>(fn: F, ms: number): F;
/**
 * Cancels any pending throttled execution
 */
export declare function cancelThrottle(throttledFn: {
    cancel?: () => void;
}): void;
