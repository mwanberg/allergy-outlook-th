"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Settings, Wind, Bug } from "lucide-react"
import { cn } from "@/lib/utils"
import { PollenAccordion } from "@/components/pollen-accordion"
import { processPollenData, formatUPI } from "@/lib/pollen-utils"
import { LocationPickerModal } from "@/components/location-picker-modal"
import { locationCache, type CachedLocation } from "@/lib/location-cache"
import Link from "next/link"

// Default location for initial load
const DEFAULT_LOCATION = {
  name: "San Francisco, CA",
  lat: 37.7749,
  lng: -122.4194,
}

export default function AirQualityApp() {
  const [currentLocation, setCurrentLocation] = useState<CachedLocation>(DEFAULT_LOCATION)
  const [pollenApiData, setPollenApiData] = useState<any>(null)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isLoadingPollen, setIsLoadingPollen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load cached location on mount
  useEffect(() => {
    const cachedLocations = locationCache.getAllCachedLocations()
    if (cachedLocations.length > 0) {
      // Use the most recently updated location
      const mostRecent = cachedLocations.sort(
        (a, b) => new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime(),
      )[0]
      setCurrentLocation(mostRecent)
      if (mostRecent.pollenData) {
        setPollenApiData(mostRecent.pollenData)
      }
    }

    // Clean up expired cache
    locationCache.clearExpiredCache()
  }, [])

  // Load pollen data for current location
  useEffect(() => {
    if (currentLocation && !currentLocation.pollenData) {
      loadPollenData(currentLocation.lat, currentLocation.lng)
    }
  }, [currentLocation])

  const loadPollenData = async (lat: number, lng: number) => {
    // Check cache first
    const cached = locationCache.getCachedLocation(lat, lng)
    if (cached?.pollenData) {
      setPollenApiData(cached.pollenData)
      return
    }

    setIsLoadingPollen(true)
    setError(null)

    try {
      const response = await fetch("/api/pollen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load pollen data")
      }

      const data = await response.json()
      setPollenApiData(data)

      // Update cache with pollen data
      locationCache.updatePollenData(lat, lng, data)
    } catch (err) {
      console.error("Failed to load pollen data:", err)
      setError(err instanceof Error ? err.message : "Failed to load pollen data")
    } finally {
      setIsLoadingPollen(false)
    }
  }

  const handleLocationSelect = (location: { name: string; lat: number; lng: number }) => {
    const newLocation: CachedLocation = {
      name: location.name,
      lat: location.lat,
      lng: location.lng,
    }

    setCurrentLocation(newLocation)
    setPollenApiData(null) // Clear current data while loading

    // Cache the location
    locationCache.setCachedLocation(newLocation)

    // Load pollen data
    loadPollenData(location.lat, location.lng)
  }

  const getPollenLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "none":
        return "bg-gray-100 text-gray-800"
      case "very low":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "very high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Format date from API data
  const formatDate = (dateObj: { year: number; month: number; day: number }) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
    return `${monthNames[dateObj.month - 1]} ${dateObj.day}, ${dateObj.year}`
  }

  // Process pollen data using utility functions
  const processedPollenData = pollenApiData ? processPollenData(pollenApiData) : null
  const dateFromAPI = pollenApiData?.dailyInfo?.[0]?.date

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-stone-50 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
                <Wind className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">AirBuddy</h1>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
            {process.env.NODE_ENV === "development" && (
              <Link href="/debug">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <Bug className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-800">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 bg-transparent"
                  onClick={() => loadPollenData(currentLocation.lat, currentLocation.lng)}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isLoadingPollen && (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4 animate-pulse">🌸</div>
                <div className="text-lg font-medium text-gray-600">Loading pollen data...</div>
              </CardContent>
            </Card>
          )}

          {/* Main Pollen Information */}
          {processedPollenData && !isLoadingPollen && (
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6 text-center">
                <div className="text-8xl mb-4">🌸</div>
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  Pollen count: {formatUPI(processedPollenData.totalUPI)} UPI{" "}
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border font-semibold border-transparent text-sm px-3 py-1 ml-2",
                      getPollenLevelColor(processedPollenData.totalCategory),
                    )}
                  >
                    {processedPollenData.totalCategory}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-3">Today's pollen levels for your area</p>
              </CardContent>
            </Card>
          )}

          {/* Pollen Breakdown with Accordions */}
          {processedPollenData && !isLoadingPollen && (
            <PollenAccordion pollenTypes={processedPollenData.pollenTypes} plants={processedPollenData.plants} />
          )}

          {/* Location */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-xl transition-shadow">
            <CardContent className="p-4" onClick={() => setIsLocationModalOpen(true)}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-800">{currentLocation.name}</span>
              </div>
              {dateFromAPI && <p className="text-xs text-gray-500 mt-1">Updated {formatDate(dateFromAPI)}</p>}
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="text-center space-y-2 pb-4">
            <div className="flex justify-center gap-4 text-xs">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-700 underline">
                Privacy Policy
              </Link>
              <Link href="/how-it-works" className="text-gray-500 hover:text-gray-700 underline">
                How This App Works
              </Link>
            </div>
            <div className="text-xs text-gray-500">Stay healthy and breathe easy! 🌸</div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation.name}
      />
    </>
  )
}
