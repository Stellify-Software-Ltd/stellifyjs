export class Geo {
    static watchIds = new Map();
    static nextId = 1;
    constructor() { }
    static async getPosition(options = {}) {
        if (!Geo.isSupported()) {
            throw new GeoError(1, 'Geolocation is not supported');
        }
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((pos) => resolve(Geo.formatPosition(pos)), (err) => reject(new GeoError(err.code, err.message)), options);
        });
    }
    static watchPosition(callback, onError, options = {}) {
        if (!Geo.isSupported()) {
            throw new GeoError(1, 'Geolocation is not supported');
        }
        const watchId = navigator.geolocation.watchPosition((pos) => callback(Geo.formatPosition(pos)), onError, options);
        const id = Geo.nextId++;
        Geo.watchIds.set(id, watchId);
        return id;
    }
    static stopWatching(id) {
        const watchId = Geo.watchIds.get(id);
        if (watchId !== undefined) {
            navigator.geolocation.clearWatch(watchId);
            Geo.watchIds.delete(id);
        }
    }
    static stopAllWatching() {
        for (const [id, watchId] of Geo.watchIds) {
            navigator.geolocation.clearWatch(watchId);
        }
        Geo.watchIds.clear();
    }
    static isSupported() {
        return typeof navigator !== 'undefined' && 'geolocation' in navigator;
    }
    static distance(lat1, lon1, lat2, lon2) {
        // Haversine formula
        const R = 6371; // Earth's radius in km
        const dLat = Geo.toRadians(lat2 - lat1);
        const dLon = Geo.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(Geo.toRadians(lat1)) * Math.cos(Geo.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    static toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    static formatPosition(pos) {
        return {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
        };
    }
}
export class GeoError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'GeoError';
        this.code = code;
    }
}
