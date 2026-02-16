interface Position {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
  timestamp: number
}

type GeoOptions = {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

type WatchCallback = (position: Position) => void
type ErrorCallback = (error: GeolocationPositionError) => void

export class Geo {
  private static watchIds: Map<number, number> = new Map()
  private static nextId = 1

  private constructor() {}

  static async getPosition(options: GeoOptions = {}): Promise<Position> {
    if (!Geo.isSupported()) {
      throw new GeoError(1, 'Geolocation is not supported')
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(Geo.formatPosition(pos)),
        (err) => reject(new GeoError(err.code, err.message)),
        options
      )
    })
  }

  static watchPosition(callback: WatchCallback, onError?: ErrorCallback, options: GeoOptions = {}): number {
    if (!Geo.isSupported()) {
      throw new GeoError(1, 'Geolocation is not supported')
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => callback(Geo.formatPosition(pos)),
      onError,
      options
    )

    const id = Geo.nextId++
    Geo.watchIds.set(id, watchId)

    return id
  }

  static stopWatching(id: number): void {
    const watchId = Geo.watchIds.get(id)
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId)
      Geo.watchIds.delete(id)
    }
  }

  static stopAllWatching(): void {
    for (const [id, watchId] of Geo.watchIds) {
      navigator.geolocation.clearWatch(watchId)
    }
    Geo.watchIds.clear()
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator
  }

  static distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371 // Earth's radius in km
    const dLat = Geo.toRadians(lat2 - lat1)
    const dLon = Geo.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Geo.toRadians(lat1)) * Math.cos(Geo.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private static formatPosition(pos: GeolocationPosition): Position {
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp
    }
  }
}

export class GeoError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'GeoError'
    this.code = code
  }
}
