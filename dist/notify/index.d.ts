type NotificationOptions = {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    silent?: boolean;
    data?: unknown;
    requireInteraction?: boolean;
};
type Permission = 'granted' | 'denied' | 'default';
export declare class Notify {
    private constructor();
    static request(): Promise<Permission>;
    static send(title: string, options?: NotificationOptions): Promise<Notification | null>;
    static getPermission(): Permission;
    static isSupported(): boolean;
    static isGranted(): boolean;
    static isDenied(): boolean;
}
export {};
