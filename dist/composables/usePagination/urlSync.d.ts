/**
 * Read pagination and params from URL query string
 */
export declare function readFromUrl(paramKeys: string[]): {
    page: number | null;
    perPage: number | null;
    params: Record<string, unknown>;
};
/**
 * Write pagination state to URL query string
 */
export declare function writeToUrl(state: {
    page: number;
    perPage: number;
    params: Record<string, unknown>;
}): void;
