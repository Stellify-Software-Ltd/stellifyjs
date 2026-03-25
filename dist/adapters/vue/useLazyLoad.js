import { ref, onMounted, onUnmounted, watch } from 'vue';
/**
 * Lazy load composable for Vue 3
 *
 * Defers data fetching until an element enters the viewport.
 * Uses IntersectionObserver for efficient visibility detection.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useLazyLoad } from 'stellify-framework'
 * import { Http } from 'stellify-framework'
 *
 * // Basic usage
 * const { data, loading, visible, targetRef } = useLazyLoad(
 *   () => Http.get('/api/heavy-data')
 * )
 *
 * // Pre-load when 200px away from viewport
 * const { data: comments } = useLazyLoad(
 *   () => Http.get('/api/comments'),
 *   { rootMargin: '200px' }
 * )
 *
 * // Manual loading control
 * const { data, load, visible } = useLazyLoad(
 *   () => Http.get('/api/data'),
 *   { immediate: false }
 * )
 * </script>
 *
 * <template>
 *   <div ref="targetRef">
 *     <template v-if="visible">
 *       <div v-if="loading">Loading...</div>
 *       <div v-else-if="data">{{ data }}</div>
 *     </template>
 *     <div v-else class="placeholder">
 *       <!-- Placeholder content -->
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export function useLazyLoad(fetcher, options = {}) {
    const { rootMargin = '0px', threshold = 0, immediate = true, once = true, root, } = options;
    // State
    const data = ref(null);
    const visible = ref(false);
    const loading = ref(false);
    const loaded = ref(false);
    const error = ref(null);
    const targetRef = ref(null);
    // Observer instance
    let observer = null;
    /**
     * Get the root element for IntersectionObserver
     */
    const getRootElement = () => {
        if (!root)
            return null;
        if (typeof root === 'function')
            return root();
        return root.value;
    };
    /**
     * Load data
     */
    const load = async () => {
        if (loading.value)
            return;
        loading.value = true;
        error.value = null;
        try {
            const result = await fetcher();
            data.value = result;
            loaded.value = true;
        }
        catch (e) {
            error.value = e instanceof Error ? e : new Error(String(e));
        }
        finally {
            loading.value = false;
        }
    };
    /**
     * Reset state
     */
    const reset = () => {
        data.value = null;
        loading.value = false;
        loaded.value = false;
        error.value = null;
        // Re-observe if element exists
        if (targetRef.value && observer) {
            observer.observe(targetRef.value);
        }
    };
    /**
     * Handle intersection changes
     */
    const handleIntersection = (entries) => {
        const [entry] = entries;
        visible.value = entry.isIntersecting;
        if (entry.isIntersecting) {
            // Load data if configured to do so immediately
            if (immediate && !loaded.value && !loading.value) {
                load();
            }
            // Stop observing if once mode
            if (once && loaded.value && observer && targetRef.value) {
                observer.unobserve(targetRef.value);
            }
        }
    };
    /**
     * Set up the IntersectionObserver
     */
    const setupObserver = () => {
        if (observer) {
            observer.disconnect();
        }
        observer = new IntersectionObserver(handleIntersection, {
            root: getRootElement(),
            rootMargin,
            threshold,
        });
        if (targetRef.value) {
            observer.observe(targetRef.value);
        }
    };
    // Watch for target element changes
    watch(targetRef, (el, oldEl) => {
        if (observer) {
            if (oldEl) {
                observer.unobserve(oldEl);
            }
            if (el) {
                observer.observe(el);
            }
        }
    });
    // Watch for loaded state to stop observing in once mode
    watch(loaded, (isLoaded) => {
        if (once && isLoaded && observer && targetRef.value) {
            observer.unobserve(targetRef.value);
        }
    });
    // Lifecycle
    onMounted(() => {
        setupObserver();
    });
    onUnmounted(() => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
    });
    return {
        data,
        visible,
        loading,
        loaded,
        error,
        targetRef,
        load,
        reset,
    };
}
