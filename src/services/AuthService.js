class AuthService {
    constructor(apiService) {
        this.api = apiService;
    }

    async login(email, password) {
        return this.api.post('/login', { email, password });
    }

    async logout() {
        return this.api.post('/logout', {});
    }

    async user() {
        return this.api.get('/user');
    }
}

export default AuthService;
