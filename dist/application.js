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

class ValidatorContract {
    constructor() {
      if (new.target === ValidatorContract) {
        throw new Error("Cannot instantiate an abstract class.");
      }
    }
  
    validate(data, rules) {
      throw new Error("Method 'validate' must be implemented.");
    }
  
    async validateAsync(data, rules) {
      throw new Error("Method 'validateAsync' must be implemented.");
    }
  }

class Validation extends ValidatorContract {
    constructor({ rules, container = null, locale = "en", apiBaseUrl = "" } = {}) {
      super(); 
      this.rules = rules;
      this.errors = {};
      this.container = container; // Dependency Injection support
      this.debounceTimers = {}; // Store debounced function calls
      this.apiBaseUrl = apiBaseUrl;
    }

    /**
     * Check if any rule is async (i.e. requires an API call)
     * @param {Object} data - Form data to validate.
     * @returns {Boolean} - Returns true if validation passes, false otherwise.
     */
    async validate(data) {
      const hasAsyncRules = Object.keys(this.rules).some((field) =>
        this.rules[field].split("|").some((rule) => this.isAsyncRule(rule))
      );
    
      return hasAsyncRules ? await this.validateAsync(data) : this.validateSync(data);
    }
  
    /**
     * Validate the given data synchronously.
     * @param {Object} data - Form data to validate.
     * @returns {Boolean} - Returns true if validation passes, false otherwise.
     */
    validateSync(data) {
      this.errors = {}; // Reset errors
  
      for (const field in this.rules) {
        const rulesArray = this.rules[field].split("|");
  
        for (const rule of rulesArray) {
          let [ruleName, param, customMessage] = rule.split(":");
          [param, customMessage] = param ? param.split(",") : [null, null];
  
          const ruleFunc = this.getRuleFunction(ruleName);
          if (!ruleFunc) {
            throw new Error(`Validation rule "${ruleName}" is not defined.`);
          }
  
          const error = ruleFunc(data[field], param);
          if (error) {
            this.addError(field, customMessage || error);
          }
        }
      }
  
      return Object.keys(this.errors).length === 0;
    }
  
    /**
     * Validate the given data asynchronously with debouncing.
     * @param {Object} data - Form data to validate.
     * @returns {Promise<Boolean>} - Resolves to true if validation passes, false otherwise.
     */
    async validateAsync(data) {
      this.errors = {}; // Reset errors
      const validationPromises = [];
  
      for (const field in this.rules) {
        const rulesArray = this.rules[field].split("|");
  
        for (const rule of rulesArray) {
          let [ruleName, param, customMessage] = rule.split(":");
          [param, customMessage] = param ? param.split(",") : [null, null];
  
          const ruleFunc = this.getRuleFunction(ruleName);
          if (!ruleFunc) {
            throw new Error(`Validation rule "${ruleName}" is not defined.`);
          }
  
          if (ruleFunc instanceof Function) {
            const validatePromise = this.debounce(async () => {
              let error = ruleFunc(data[field], param);
              if (error instanceof Promise) {
                error = await error;
              }
              if (error) {
                this.addError(field, customMessage || error);
              }
            }, 300); // 300ms debounce
  
            validationPromises.push(validatePromise());
          }
        }
      }
  
      await Promise.all(validationPromises);
      return Object.keys(this.errors).length === 0;
    }
  
    /**
     * Retrieve validation rule function, either from this class or DI container.
     * @param {String} ruleName - The validation rule name.
     * @returns {Function|null} - The validation function.
     */
    getRuleFunction(ruleName) {
      return this[ruleName] || (this.container ? this.container.resolve(ruleName) : null);
    }

    /**
     * Check to see if a validation rule is asynchronous.
     * @param {String} rule - The validation rule name.
     * @returns {Boolean} - True if is async.
     */
    isAsyncRule(rule) {
      const asyncRules = ["uniqueEmail", "existsInDB"];
      return asyncRules.includes(rule.split(":")[0]); // Extract rule name before ":"
    }
  
    /**
     * Debounce function execution to prevent excessive API calls.
     * @param {Function} func - The function to debounce.
     * @param {Number} wait - Delay in milliseconds.
     * @returns {Function} - Debounced function.
     */
    debounce(func, wait) {
      return (...args) => {
        clearTimeout(this.debounceTimers[func]);
        return new Promise((resolve) => {
          this.debounceTimers[func] = setTimeout(() => resolve(func(...args)), wait);
        });
      };
    }
  
    /**
     * Add an error message for a field.
     * @param {String} field - The field name.
     * @param {String} message - The error message.
     */
    addError(field, message) {
      if (!this.errors[field]) {
        this.errors[field] = [];
      }
      this.errors[field].push(message);
    }
  
    /**
     * Retrieve validation errors.
     * @returns {Object} - Object containing field errors.
     */
    getErrors() {
      return this.errors;
    }
  
    // === Validation Rules ===
  
    required(value) {
      return !value ? "This field is required." : null;
    }
  
    email(value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value && !emailRegex.test(value) ? "Invalid email address." : null;
    }
  
    min(value, param) {
      return value.length < param ? `Must be at least ${param} characters.` : null;
    }
  
    max(value, param) {
      return value.length > param ? `Must be no more than ${param} characters.` : null;
    }
  
    numeric(value) {
      return isNaN(value) ? "This field must be a number." : null;
    }
  
    async uniqueEmail(value) {
      try {
        const response = await fetch(`https://api.example.com/check-email?email=${encodeURIComponent(value)}`);
        const result = await response.json();
        return result.exists ? "This email is already taken." : null;
      } catch (error) {
        return "Error validating email.";
      }
    }
  
    async usernameExists(value) {
      try {
        const response = await fetch(`https://api.example.com/check-username?username=${encodeURIComponent(value)}`);
        const result = await response.json();
        return result.exists ? "This username is already in use." : null;
      } catch (error) {
        return "Error checking username.";
      }
    }
  }

class ValidationServiceProvider extends ServiceProvider {
  /**
     * Register services in the container.
     * 
     * This method will be called to bind services into the container.
     */
  register() {
    this.app.container.bind('validation', () => new Validation(), true);
  }

  /**
   * Boot the services.
   * 
   * This method will be called after all providers have been registered.
   * It's where you can perform additional initialization tasks.
   */
  async boot() {
      console.log('ValidationServiceProvider booted!');
  }
}

// Application.js

class Application {
    constructor(config = {}) {
        // Initialize the container
        this.container = new ServiceContainer();
        this.config = config; // Store configuration
        this.providers = []; // Store service providers
    }

    /**
     * Dynamically load and register service providers from the config.
     */
    async registerServiceProviders() {
        if (this.config.providers && Array.isArray(this.config.providers)) {
            // Dynamically load and register each provider listed in the config
            for (const providerPath of this.config.providers) {
                try {
                    const { default: Provider } = await import(providerPath);
                    this.registerProvider(Provider);
                } catch (error) {
                    console.error(`Failed to load provider at ${providerPath}:`, error);
                }
            }
        }
    }

    /**
     * Bind a service to the container.
     * 
     * @param {string} name - The name of the service.
     * @param {Function|Object} service - The service to bind.
     * @param {boolean} isSingleton - Whether to bind as a singleton.
     */
    bind(name, service, isSingleton = false) {
        this.container.bind(name, service, isSingleton);
    }

    /**
     * Resolve a service from the container.
     * 
     * @param {string} name - The name of the service.
     * @returns {Object} - The resolved service.
     */
    resolve(name) {
        return this.container.resolve(name);
    }

    /**
     * Register a service provider.
     * 
     * @param {ServiceProvider} provider - The service provider class.
     */
    registerProvider(provider) {
        const providerInstance = new provider(this);
        providerInstance.register();
        this.providers.push(providerInstance);
    }

    /**
     * Boot the application, loading configurations and services.
     * This can be used to trigger the booting process of all registered providers.
     */
    async boot() {
        console.log('Booting application...');
        await this.registerServiceProviders();
        // Trigger boot method of each provider, if available
        for (const provider of this.providers) {
            if (typeof provider.boot === 'function') {
                await provider.boot();
            }
        }
        this.exposeServices();
    }

    exposeServices() {
        if (!this.config.expose) return;

        for (const [serviceName, exposeOption] of Object.entries(this.config.expose)) {
            if (this.container.services[serviceName]) {
                const serviceInstance = this.container.resolve(serviceName);

                if (exposeOption === 'class') {
                    // ✅ Expose the class itself so it can be instantiated
                    window[serviceName] = serviceInstance.constructor;
                } else if (exposeOption === 'full') {
                    // ✅ Expose entire service instance
                    window[serviceName] = serviceInstance;
                } else if (Array.isArray(exposeOption)) {
                    // ✅ Expose only specified methods
                    window[serviceName] = exposeOption.reduce((exposedMethods, method) => {
                        if (typeof serviceInstance[method] === 'function') {
                            exposedMethods[method] = serviceInstance[method].bind(serviceInstance);
                        }
                        return exposedMethods;
                    }, {});
                }
            }
        }
    }
}

export { AppServiceProvider, ValidationServiceProvider, Application as default };
