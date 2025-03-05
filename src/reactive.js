export function reactive(state) {
    return new Proxy(state, {
        set(target, key, value) {
            console.log(`State changed: ${key} = ${value}`);
            target[key] = value;
            return true;
        },
        get(target, key) {
            return target[key];
        }
    });
}
  