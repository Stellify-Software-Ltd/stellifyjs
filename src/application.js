// Application.js
import ServiceContainer from './core/container/ServiceContainer';
import ServiceProvider from './contracts/ServiceProvider'; // Import base service provider
export { default as AppServiceProvider } from "./providers/AppServiceProvider.js";
export { default as ValidationServiceProvider } from "./providers/ValidationServiceProvider.js";

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
            for (const providerName of this.config.providers) {
                try {
                    const { default: Provider } = await import(`/node_modules/stellifyjs/dist/${providerName}.js`);
                    // Register the provider
                    this.registerProvider(Provider);
                } catch (error) {
                    console.error(`Failed to load provider at ${providerName}:`, error);
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
        console.log('exposeServices')
        this.exposeServices();
    }

    exposeServices() {
        console.log('exposeServices', this.config.expose)
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

export default Application;
