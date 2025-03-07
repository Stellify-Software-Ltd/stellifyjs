const container = new Map();

export const di = {
    bind: (name, factory) => {
      container.set(name, factory);
    },
    make: (name) => {
      if (!container.has(name)) {
        throw new Error(`Service ${name} not found in container.`);
      }
      return container.get(name)();
    },
    has: (name) => container.has(name)
};
