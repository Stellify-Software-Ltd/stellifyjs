type RouteHandler = (params: Record<string, string>) => void;
type NavigateOptions = {
    replace?: boolean;
    state?: unknown;
};
export declare class Router {
    private routes;
    private currentPath;
    private listeners;
    private constructor();
    static create(): Router;
    private pathToRegex;
    register(path: string, handler: RouteHandler): Router;
    navigate(path: string, options?: NavigateOptions): Router;
    back(): Router;
    forward(): Router;
    private handlePopState;
    private resolve;
    getParams(): Record<string, string>;
    getQuery(): Record<string, string>;
    getCurrent(): string;
    getState(): unknown;
    onNavigate(callback: (path: string, params: Record<string, string>) => void): Router;
    offNavigate(callback: (path: string, params: Record<string, string>) => void): Router;
    private notifyListeners;
    start(): Router;
}
export {};
