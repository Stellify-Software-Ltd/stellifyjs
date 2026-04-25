type RouteHandler = (params: Record<string, string>) => void;
type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};
/**
 * Return type for useRouter
 */
export interface RouterReturn {
    register: (path: string, handler: RouteHandler) => RouterReturn;
    navigate: (path: string, options?: NavigateOptions) => RouterReturn;
    push: (path: string, options?: NavigateOptions) => RouterReturn;
    back: () => RouterReturn;
    forward: () => RouterReturn;
    getParams: () => Record<string, string>;
    getQuery: () => Record<string, string>;
    getCurrent: () => string;
    getState: () => unknown;
    onNavigate: (callback: (path: string, params: Record<string, string>) => void) => RouterReturn;
    offNavigate: (callback: (path: string, params: Record<string, string>) => void) => RouterReturn;
    start: () => RouterReturn;
    currentPath: Readonly<import('vue').Ref<string>>;
    params: import('vue').ComputedRef<Record<string, string>>;
    query: import('vue').ComputedRef<Record<string, string>>;
    state: Readonly<import('vue').Ref<unknown>>;
}
/**
 * Vue composable for client-side routing.
 *
 * Provides reactive route state with parameter extraction and navigation.
 * Works with browser History API.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useRouter } from 'stellify-framework'
 *
 * const router = useRouter()
 *
 * // Register routes
 * router
 *   .register('/users/:id', (params) => {
 *     console.log('User ID:', params.id)
 *   })
 *   .register('/posts/:slug', (params) => {
 *     console.log('Post:', params.slug)
 *   })
 *   .start()
 *
 * // Navigate
 * router.navigate('/users/123')
 * </script>
 *
 * <template>
 *   <div>Current path: {{ router.currentPath }}</div>
 *   <div>Params: {{ router.params }}</div>
 * </template>
 * ```
 */
export declare function useRouter(): RouterReturn;
export {};
