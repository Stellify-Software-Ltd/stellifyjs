/**
 * Creates a throttled version of a function that limits execution frequency.
 *
 * Uses trailing edge: if calls come in faster than the throttle interval,
 * the last call will still execute after the interval.
 */
export function throttle<F extends (...args: Parameters<F>) => void>(
  fn: F,
  ms: number
): F {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let latestArgs: Parameters<F> | null = null
  let latestThis: unknown = null

  return function (this: unknown, ...args: Parameters<F>) {
    const now = Date.now()
    const remaining = ms - (now - last)

    // Always store the latest arguments for trailing edge execution
    latestArgs = args
    latestThis = this

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      latestArgs = null
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        if (latestArgs) {
          fn.apply(latestThis, latestArgs)
          latestArgs = null
        }
      }, remaining)
    }
  } as F
}

/**
 * Cancels any pending throttled execution
 */
export function cancelThrottle(throttledFn: { cancel?: () => void }): void {
  if (throttledFn.cancel) {
    throttledFn.cancel()
  }
}
