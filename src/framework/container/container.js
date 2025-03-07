const diContainer = new Map();

export const container = {
    bind: (name, factory) => {
      diContainer.set(name, factory);
    },
    make: (name) => {
      if (!diContainer.has(name)) {
        throw new Error(`Service ${name} not found in container.`);
      }
      return diContainer.get(name)();
    },
    has: (name) => diContainer.has(name)
};
