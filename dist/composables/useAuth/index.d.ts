type User = Record<string, unknown>;
type Credentials = Record<string, unknown>;
/**
 * Options for useAuth
 */
export interface AuthOptions {
    loginUrl?: string;
    logoutUrl?: string;
    userUrl?: string;
    tokenKey?: string;
    storage?: 'local' | 'session';
}
/**
 * Return type for useAuth
 */
export interface AuthReturn {
    login: (credentials: Credentials) => Promise<User>;
    logout: () => Promise<void>;
    fetchUser: () => Promise<User | null>;
    getUser: () => User | null;
    getToken: () => string | null;
    setToken: (token: string) => AuthReturn;
    setUser: (user: User) => AuthReturn;
    refresh: () => Promise<void>;
    getAuthHeader: () => Record<string, string>;
    user: Readonly<import('vue').Ref<User | null>>;
    token: Readonly<import('vue').Ref<string | null>>;
    isAuthenticated: import('vue').ComputedRef<boolean>;
}
export declare class AuthError extends Error {
    status: number;
    constructor(status: number, message: string);
}
/**
 * Vue composable for authentication state management.
 *
 * Provides reactive auth state with login, logout, and user management.
 * Works with Laravel Sanctum/Passport out of the box.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAuth } from 'stellify-framework'
 *
 * const auth = useAuth({
 *   loginUrl: '/api/auth/login',
 *   userUrl: '/api/auth/user',
 * })
 *
 * // Reactive state
 * const { user, isAuthenticated, token } = auth
 *
 * // Methods
 * await auth.login({ email, password })
 * await auth.logout()
 * </script>
 *
 * <template>
 *   <div v-if="isAuthenticated">
 *     Welcome, {{ user?.name }}
 *     <button @click="auth.logout()">Logout</button>
 *   </div>
 * </template>
 * ```
 */
export declare function useAuth(config?: AuthOptions): AuthReturn;
export {};
