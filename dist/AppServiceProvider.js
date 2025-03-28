import ServiceProvider from './contracts/ServiceProvider.js';

class AppServiceProvider extends ServiceProvider {
  /**
     * Register services in the container.
     * 
     * This method will be called to bind services into the container.
     */
  register() {
  }
  /**
   * Boot the services.
   * 
   * This method will be called after all providers have been registered.
   * It's where you can perform additional initialization tasks.
   */
  async boot() {
    console.log("AppServiceProvider booted!");
  }
}

export { AppServiceProvider as default };
