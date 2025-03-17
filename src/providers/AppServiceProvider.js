import ServiceProvider from "../contracts/ServiceProvider.js";
import app from "../core/container/ServiceContainer.js";

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

export default AppServiceProvider;