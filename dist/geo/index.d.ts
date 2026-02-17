interface Position {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    timestamp: number;
}
type GeoOptions = {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
};
type WatchCallback = (position: Position) => void;
type ErrorCallback = (error: GeolocationPositionError) => void;
export declare class Geo {
    private static watchIds;
    private static nextId;
    private constructor();
    static getPosition(options?: GeoOptions): Promise<Position>;
    static watchPosition(callback: WatchCallback, onError?: ErrorCallback, options?: GeoOptions): number;
    static stopWatching(id: number): void;
    static stopAllWatching(): void;
    static isSupported(): boolean;
    static distance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    private static toRadians;
    private static formatPosition;
}
export declare class GeoError extends Error {
    code: number;
    constructor(code: number, message: string);
}
export {};
