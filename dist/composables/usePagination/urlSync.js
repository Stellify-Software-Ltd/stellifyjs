/**
 * Read pagination and params from URL query string
 */
export function readFromUrl(paramKeys) {
    if (typeof window === 'undefined') {
        return { page: null, perPage: null, params: {} };
    }
    const searchParams = new URLSearchParams(window.location.search);
    const params = {};
    // Read page and per_page
    const pageStr = searchParams.get('page');
    const perPageStr = searchParams.get('per_page');
    const page = pageStr ? parseInt(pageStr, 10) : null;
    const perPage = perPageStr ? parseInt(perPageStr, 10) : null;
    // Read any keys that match the provided param keys
    for (const key of paramKeys) {
        const value = searchParams.get(key);
        if (value !== null) {
            // Try to parse as number or boolean
            if (value === 'true') {
                params[key] = true;
            }
            else if (value === 'false') {
                params[key] = false;
            }
            else if (!isNaN(Number(value)) && value !== '') {
                params[key] = Number(value);
            }
            else {
                params[key] = value;
            }
        }
    }
    return {
        page: page && !isNaN(page) ? page : null,
        perPage: perPage && !isNaN(perPage) ? perPage : null,
        params,
    };
}
/**
 * Write pagination state to URL query string
 */
export function writeToUrl(state) {
    if (typeof window === 'undefined')
        return;
    const searchParams = new URLSearchParams();
    // Always include page and per_page
    searchParams.set('page', String(state.page));
    searchParams.set('per_page', String(state.perPage));
    // Add all params
    for (const [key, value] of Object.entries(state.params)) {
        if (value !== null && value !== undefined && value !== '') {
            searchParams.set(key, String(value));
        }
    }
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
}
