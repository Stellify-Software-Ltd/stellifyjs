class ServiceProvider {
  constructor(app) {
      this.app = app; // The application instance (which contains the container)
  }

  /**
   * This method will be overridden in individual service providers
   * to bind services into the container.
   */
  register() {
      throw new Error('The register method must be implemented');
  }

  boot() {
    throw new Error("Method 'boot' must be implemented.");
  }
}

export default ServiceProvider;