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

class AppServiceProvider extends ServiceProvider {
  /**
     * Register services in the container.
     * 
     * This method will be called to bind services into the container.
     */
  register() {
      // Register the Logger as a singleton service
      //this.app.bind('logger', Logger, true);

      // Register any other services you may need
      // For example, register a mock Database service, or other services.
      // this.app.bind('database', DatabaseService);
  }

  /**
   * Boot the services.
   * 
   * This method will be called after all providers have been registered.
   * It's where you can perform additional initialization tasks.
   */
  async boot() {
      console.log('AppServiceProvider booted!');
  }
}

export { AppServiceProvider as A, ServiceProvider as S };
