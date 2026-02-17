export class Router {
    routes = [];
    currentPath = '';
    listeners = [];
    constructor() {
        if (typeof window !== 'undefined') {
            this.currentPath = window.location.pathname;
            window.addEventListener('popstate', () => this.handlePopState());
        }
    }
    static create() {
        return new Router();
    }
    pathToRegex(path) {
        const paramNames = [];
        const pattern = path
            .replace(/\//g, '\\/')
            .replace(/:(\w+)/g, (_, name) => {
            paramNames.push(name);
            return '([^\\/]+)';
        });
        return {
            pattern: new RegExp(`^${pattern}$`),
            paramNames
        };
    }
    register(path, handler) {
        const { pattern, paramNames } = this.pathToRegex(path);
        this.routes.push({ path, pattern, paramNames, handler });
        return this;
    }
    navigate(path, options = {}) {
        if (typeof window === 'undefined')
            return this;
        if (options.replace) {
            window.history.replaceState(options.state || null, '', path);
        }
        else {
            window.history.pushState(options.state || null, '', path);
        }
        this.currentPath = path;
        this.resolve();
        return this;
    }
    back() {
        if (typeof window !== 'undefined') {
            window.history.back();
        }
        return this;
    }
    forward() {
        if (typeof window !== 'undefined') {
            window.history.forward();
        }
        return this;
    }
    handlePopState() {
        if (typeof window !== 'undefined') {
            this.currentPath = window.location.pathname;
            this.resolve();
        }
    }
    resolve() {
        const path = this.currentPath;
        for (const route of this.routes) {
            const match = path.match(route.pattern);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                route.handler(params);
                this.notifyListeners(path, params);
                return;
            }
        }
    }
    getParams() {
        const path = this.currentPath;
        for (const route of this.routes) {
            const match = path.match(route.pattern);
            if (match) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = match[i + 1];
                });
                return params;
            }
        }
        return {};
    }
    getQuery() {
        if (typeof window === 'undefined')
            return {};
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        return params;
    }
    getCurrent() {
        return this.currentPath;
    }
    getState() {
        if (typeof window === 'undefined')
            return null;
        return window.history.state;
    }
    onNavigate(callback) {
        this.listeners.push(callback);
        return this;
    }
    offNavigate(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
        return this;
    }
    notifyListeners(path, params) {
        for (const listener of this.listeners) {
            listener(path, params);
        }
    }
    start() {
        this.resolve();
        return this;
    }
}
