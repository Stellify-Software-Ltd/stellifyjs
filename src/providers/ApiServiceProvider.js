import ServiceProvider from '../core/ServiceProvider.js';
import ApiService from '../services/ApiService.js';

class ApiServiceProvider extends ServiceProvider {
    register(app) {
        app.bind('api', () => new ApiService(app.config.apiBaseUrl));
    }
}

export default ApiServiceProvider;
