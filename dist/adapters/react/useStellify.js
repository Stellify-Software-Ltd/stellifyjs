import { useState, useCallback, useMemo } from 'react';
export function useStellify(module) {
    const [, forceUpdate] = useState(0);
    const rerender = useCallback(() => {
        forceUpdate(n => n + 1);
    }, []);
    const proxy = useMemo(() => {
        const handler = {
            get(target, prop) {
                const value = target[prop];
                if (typeof value === 'function') {
                    return (...args) => {
                        const result = value.apply(target, args);
                        // If method returns the module (chainable), rerender
                        if (result === target) {
                            rerender();
                        }
                        return result;
                    };
                }
                return value;
            }
        };
        return new Proxy(module, handler);
    }, [module, rerender]);
    return proxy;
}
