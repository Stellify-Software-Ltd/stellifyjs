export class Auth {
    user = null;
    token = null;
    config;
    listeners = new Set();
    storage = null;
    constructor(config = {}) {
        this.config = {
            loginUrl: '/api/auth/login',
            logoutUrl: '/api/auth/logout',
            userUrl: '/api/auth/user',
            tokenKey: 'auth_token',
            storage: 'local',
            ...config
        };
        if (typeof window !== 'undefined') {
            this.storage = this.config.storage === 'session'
                ? window.sessionStorage
                : window.localStorage;
            this.loadToken();
        }
    }
    static create(config = {}) {
        return new Auth(config);
    }
    loadToken() {
        if (!this.storage)
            return;
        this.token = this.storage.getItem(this.config.tokenKey);
    }
    saveToken(token) {
        if (!this.storage)
            return;
        this.token = token;
        this.storage.setItem(this.config.tokenKey, token);
    }
    clearToken() {
        if (!this.storage)
            return;
        this.token = null;
        this.storage.removeItem(this.config.tokenKey);
    }
    async login(credentials) {
        const response = await fetch(this.config.loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        if (!response.ok) {
            throw new AuthError(response.status, 'Login failed');
        }
        const data = await response.json();
        if (data.token) {
            this.saveToken(data.token);
        }
        this.user = data.user || data;
        this.notifyListeners();
        return this.user;
    }
    async logout() {
        if (this.token) {
            try {
                await fetch(this.config.logoutUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            catch {
                // Logout request failed, but clear local state anyway
            }
        }
        this.clearToken();
        this.user = null;
        this.notifyListeners();
    }
    async fetchUser() {
        if (!this.token)
            return null;
        try {
            const response = await fetch(this.config.userUrl, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            if (!response.ok) {
                this.clearToken();
                this.user = null;
                this.notifyListeners();
                return null;
            }
            this.user = await response.json();
            this.notifyListeners();
            return this.user;
        }
        catch {
            return null;
        }
    }
    getUser() {
        return this.user;
    }
    getToken() {
        return this.token;
    }
    isAuthenticated() {
        return this.token !== null;
    }
    setToken(token) {
        this.saveToken(token);
        return this;
    }
    setUser(user) {
        this.user = user;
        this.notifyListeners();
        return this;
    }
    async refresh() {
        await this.fetchUser();
    }
    onAuthChange(callback) {
        this.listeners.add(callback);
        return this;
    }
    offAuthChange(callback) {
        this.listeners.delete(callback);
        return this;
    }
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.user);
        }
    }
    getAuthHeader() {
        if (!this.token)
            return {};
        return { 'Authorization': `Bearer ${this.token}` };
    }
}
export class AuthError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}
