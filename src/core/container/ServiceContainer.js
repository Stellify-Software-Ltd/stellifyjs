class ServiceContainer {
  constructor() {
      this.services = {}; // Stores bindings to services
      this.instances = {}; // Stores singleton instances
  }

  /**
   * Bind a service to the container.
   * 
   * @param {string} name - The name or key of the service.
   * @param {Function|Object} service - The service to bind. Can be a class or a closure.
   * @param {boolean} isSingleton - Whether the service should be a singleton.
   */
  bind(name, service, isSingleton = false) {
      this.services[name] = { service, isSingleton };
  }

  /**
     * Resolve a service from the container.
     * @param {string} name - The service key.
     * @returns {any} - The instantiated service.
     */
  resolve(name) {
      const entry = this.services[name];

      if (!entry) {
          throw new Error(`Service ${name} is not registered.`);
      }

      // If singleton, return the same instance
      if (entry.isSingleton) {
          if (!this.instances[name]) {
              this.instances[name] = typeof entry.service === 'function'
                  ? entry.service() // Instantiate the service
                  : entry.service;
          }
          return this.instances[name];
      }

      // Otherwise, return a fresh instance
      return typeof entry.service === 'function' ? entry.service() : entry.service;
  }
}

export default ServiceContainer;