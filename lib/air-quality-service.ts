// Air Quality Service - handles data fetching and caching
export interface AirQualityData {
  location: string
  lastUpdated: string
  airQuality: {
    level: string
    aqi: number
    color: string
    emoji: string
    description: string
  }
  pollen: {
    total: number
    level: string
    types: Array<{
      name: string
      value: number
      level: string
      icon: any
      color: string
    }>
  }
  weather: {
    temperature: number
    humidity: number
    windSpeed: number
  }
}

class AirQualityService {
  private cache: Map<string, { data: AirQualityData; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

  async getAirQualityData(location: string): Promise<AirQualityData> {
    // Check cache first
    const cached = this.cache.get(location)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }

    // In a real app, this would make API calls to services like:
    // - EPA AirNow API for air quality
    // - Weather API for weather data
    // - Pollen.com API for pollen data

    // For now, return mock data
    const mockData: AirQualityData = {
      location,
      lastUpdated: new Date().toLocaleTimeString(),
      airQuality: {
        level: "Good",
        aqi: Math.floor(Math.random() * 50) + 20,
        color: "bg-green-100 text-green-800",
        emoji: "😊",
        description: "Air quality is great for outdoor activities!",
      },
      pollen: {
        total: Math.round((Math.random() * 5 + 1) * 10) / 10,
        level: "Low",
        types: [
          {
            name: "Tree",
            value: Math.round(Math.random() * 2 * 10) / 10,
            level: "Low",
            icon: null,
            color: "text-green-600",
          },
          {
            name: "Grass",
            value: Math.round(Math.random() * 2 * 10) / 10,
            level: "Low",
            icon: null,
            color: "text-emerald-600",
          },
          {
            name: "Weed",
            value: Math.round(Math.random() * 1 * 10) / 10,
            level: "Very Low",
            icon: null,
            color: "text-pink-600",
          },
        ],
      },
      weather: {
        temperature: Math.floor(Math.random() * 30) + 60,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 15) + 5,
      },
    }

    // Cache the data
    this.cache.set(location, { data: mockData, timestamp: Date.now() })

    return mockData
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const airQualityService = new AirQualityService()
