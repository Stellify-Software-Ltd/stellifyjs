type User = Record<string, unknown>;
type Credentials = Record<string, unknown>;
type AuthCallback = (user: User | null) => void;
interface AuthConfig {
    loginUrl?: string;
    logoutUrl?: string;
    userUrl?: string;
    tokenKey?: string;
    storage?: 'local' | 'session';
}
export declare class Auth {
    private user;
    private token;
    private config;
    private listeners;
    private storage;
    private constructor();
    static create(config?: AuthConfig): Auth;
    private loadToken;
    private saveToken;
    private clearToken;
    login(credentials: Credentials): Promise<User>;
    logout(): Promise<void>;
    fetchUser(): Promise<User | null>;
    getUser(): User | null;
    getToken(): string | null;
    isAuthenticated(): boolean;
    setToken(token: string): Auth;
    setUser(user: User): Auth;
    refresh(): Promise<void>;
    onAuthChange(callback: AuthCallback): Auth;
    offAuthChange(callback: AuthCallback): Auth;
    private notifyListeners;
    getAuthHeader(): Record<string, string>;
}
export declare class AuthError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export {};
