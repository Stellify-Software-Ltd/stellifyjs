import ServiceProvider from '../core/ServiceProvider.js';
import AuthService from '../services/ApiService.js';

class AuthServiceProvider extends ServiceProvider {
    register(app) {
        app.bind('auth', () => new AuthService(app.resolve('api')));
    }
}

export default AuthServiceProvider;
