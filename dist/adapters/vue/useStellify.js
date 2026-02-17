import { shallowRef, triggerRef } from 'vue';
export function useStellify(module) {
    const moduleRef = shallowRef(module);
    const handler = {
        get(target, prop) {
            const value = target[prop];
            if (typeof value === 'function') {
                return (...args) => {
                    const result = value.apply(target, args);
                    // If method returns the module (chainable), trigger reactivity
                    if (result === target) {
                        triggerRef(moduleRef);
                    }
                    return result;
                };
            }
            return value;
        }
    };
    return new Proxy(module, handler);
}
