import ServiceProvider from '../contracts/ServiceProvider.js';
import Validation from '../core/validation/validation.js';

class ValidationServiceProvider extends ServiceProvider {
  /**
     * Register services in the container.
     * 
     * This method will be called to bind services into the container.
     */
  register() {
    this.app.container.bind("validation", () => new Validation(), true);
  }
  /**
   * Boot the services.
   * 
   * This method will be called after all providers have been registered.
   * It's where you can perform additional initialization tasks.
   */
  async boot() {
    console.log("ValidationServiceProvider booted!");
  }
}

export { ValidationServiceProvider as default };
