// Location and pollen data caching utilities

export interface CachedLocation {
  name: string
  lat: number
  lng: number
  pollenData?: any
  lastUpdated?: string
  expiresAt?: string
}

export interface LocationCache {
  [key: string]: CachedLocation
}

class LocationCacheManager {
  private readonly CACHE_KEY = "airbuddy-locations"
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  private generateLocationKey(lat: number, lng: number): string {
    // Round to 3 decimal places to group nearby locations
    const roundedLat = Math.round(lat * 1000) / 1000
    const roundedLng = Math.round(lng * 1000) / 1000
    return `${roundedLat},${roundedLng}`
  }

  getCache(): LocationCache {
    if (typeof window === "undefined") return {}

    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      return cached ? JSON.parse(cached) : {}
    } catch (error) {
      console.error("Failed to load location cache:", error)
      return {}
    }
  }

  saveCache(cache: LocationCache): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error("Failed to save location cache:", error)
    }
  }

  getCachedLocation(lat: number, lng: number): CachedLocation | null {
    const cache = this.getCache()
    const key = this.generateLocationKey(lat, lng)
    const location = cache[key]

    if (!location) return null

    // Check if cache is expired
    if (location.expiresAt && new Date() > new Date(location.expiresAt)) {
      this.removeCachedLocation(lat, lng)
      return null
    }

    return location
  }

  setCachedLocation(location: CachedLocation): void {
    const cache = this.getCache()
    const key = this.generateLocationKey(location.lat, location.lng)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.CACHE_DURATION)

    cache[key] = {
      ...location,
      lastUpdated: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    this.saveCache(cache)
  }

  updatePollenData(lat: number, lng: number, pollenData: any): void {
    const cache = this.getCache()
    const key = this.generateLocationKey(lat, lng)

    if (cache[key]) {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + this.CACHE_DURATION)

      cache[key] = {
        ...cache[key],
        pollenData,
        lastUpdated: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      }

      this.saveCache(cache)
    }
  }

  removeCachedLocation(lat: number, lng: number): void {
    const cache = this.getCache()
    const key = this.generateLocationKey(lat, lng)
    delete cache[key]
    this.saveCache(cache)
  }

  getAllCachedLocations(): CachedLocation[] {
    const cache = this.getCache()
    return Object.values(cache).filter((location) => {
      // Filter out expired locations
      if (location.expiresAt && new Date() > new Date(location.expiresAt)) {
        this.removeCachedLocation(location.lat, location.lng)
        return false
      }
      return true
    })
  }

  clearExpiredCache(): void {
    const cache = this.getCache()
    const now = new Date()
    let hasExpired = false

    Object.keys(cache).forEach((key) => {
      const location = cache[key]
      if (location.expiresAt && now > new Date(location.expiresAt)) {
        delete cache[key]
        hasExpired = true
      }
    })

    if (hasExpired) {
      this.saveCache(cache)
    }
  }

  getCacheStats(): { totalLocations: number; oldestCache: string | null; newestCache: string | null } {
    const locations = this.getAllCachedLocations()

    if (locations.length === 0) {
      return { totalLocations: 0, oldestCache: null, newestCache: null }
    }

    const dates = locations
      .filter((loc) => loc.lastUpdated)
      .map((loc) => new Date(loc.lastUpdated!))
      .sort((a, b) => a.getTime() - b.getTime())

    return {
      totalLocations: locations.length,
      oldestCache: dates.length > 0 ? dates[0].toLocaleDateString() : null,
      newestCache: dates.length > 0 ? dates[dates.length - 1].toLocaleDateString() : null,
    }
  }
}

export const locationCache = new LocationCacheManager()
