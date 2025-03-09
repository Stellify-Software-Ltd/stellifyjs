export class Container {
  constructor() {
    this.services = new Map();
  }

  /**
   * Binds a service or value to the container.
   * @param {string} key - The unique identifier for the service.
   * @param {*} value - The instance, factory function, or value to bind.
   */
  bind(key, value) {
    this.services.set(key, value);
  }

  /**
   * Resolves a dependency by key.
   * @param {string} key - The service identifier.
   * @returns {*} - The resolved service or undefined if not found.
   */
  resolve(key) {
    if (!this.services.has(key)) {
      console.warn(`[DI WARNING]: Service "${key}" is not registered.`);
      return null;
    }

    const service = this.services.get(key);
    
    // If the service is a factory function, execute it to get the instance
    return typeof service === "function" ? service(this) : service;
  }

  /**
   * Checks if a service is registered.
   * @param {string} key - The service key.
   * @returns {boolean} - True if the service exists, false otherwise.
   */
  has(key) {
    return this.services.has(key);
  }

  /**
   * Unbinds a service from the container.
   * @param {string} key - The service key.
   */
  unbind(key) {
    this.services.delete(key);
  }

  /**
   * Clears all services from the container.
   */
  clear() {
    this.services.clear();
  }
}
