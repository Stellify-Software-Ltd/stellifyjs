export class Notify {
    constructor() { }
    static async request() {
        if (!Notify.isSupported()) {
            return 'denied';
        }
        try {
            const permission = await Notification.requestPermission();
            return permission;
        }
        catch {
            return 'denied';
        }
    }
    static async send(title, options = {}) {
        if (!Notify.isSupported()) {
            return null;
        }
        const permission = Notify.getPermission();
        if (permission !== 'granted') {
            const newPermission = await Notify.request();
            if (newPermission !== 'granted') {
                return null;
            }
        }
        try {
            return new Notification(title, options);
        }
        catch {
            return null;
        }
    }
    static getPermission() {
        if (!Notify.isSupported()) {
            return 'denied';
        }
        return Notification.permission;
    }
    static isSupported() {
        return typeof window !== 'undefined' && 'Notification' in window;
    }
    static isGranted() {
        return Notify.getPermission() === 'granted';
    }
    static isDenied() {
        return Notify.getPermission() === 'denied';
    }
}
