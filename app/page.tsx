"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Settings, Wind, Bug, Search, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PollenAccordion } from "@/components/pollen-accordion"
import { processPollenData, formatUPI } from "@/lib/pollen-utils"
import { locationCache, type CachedLocation } from "@/lib/location-cache"
import Link from "next/link"
import { LocationHistory } from "@/components/location-history"

export default function AirQualityApp() {
  const [currentLocation, setCurrentLocation] = useState<CachedLocation | null>(null)
  const [pollenApiData, setPollenApiData] = useState<any>(null)
  const [isLoadingPollen, setIsLoadingPollen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string | null>(null)

  // Location search state
  const [searchValue, setSearchValue] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const [recentLocations, setRecentLocations] = useState<CachedLocation[]>([])

  // Load cached location on mount
  useEffect(() => {
    // Clean up expired cache first
    locationCache.cleanupExpiredLocations()

    // Load recent locations
    const recent = locationCache.getRecentLocations()
    setRecentLocations(recent)

    // Get the most recent location with pollen data
    const mostRecent = locationCache.getMostRecentLocation()
    if (mostRecent && mostRecent.pollenData) {
      console.log("Loading cached location:", mostRecent.name)
      setCurrentLocation(mostRecent)
      setPollenApiData(mostRecent.pollenData)
      setDataSource("cache")
    } else {
      console.log("No cached location found")
    }
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

      // Check data source from headers
      const source = response.headers.get("X-Pollen-Data-Source")
      setDataSource(source)

      // Update cache with pollen data
      locationCache.updatePollenData(lat, lng, data)

      // Get the updated location with pollen data and add to recent locations
      const updatedLocation = locationCache.getCachedLocation(lat, lng)
      if (updatedLocation) {
        locationCache.addToRecentLocations(updatedLocation)
        setRecentLocations(locationCache.getRecentLocations())
      }
    } catch (err) {
      console.error("Failed to load pollen data:", err)
      setError(err instanceof Error ? err.message : "Failed to load pollen data")
    } finally {
      setIsLoadingPollen(false)
    }
  }

  const handleSearch = async () => {
    if (!searchValue.trim()) return

    setIsSearching(true)
    setSearchError(null)

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchValue.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Search failed")
      }

      const data = await response.json()
      setSuggestions(data.suggestions || [])

      if (data.suggestions?.length === 0) {
        setSearchError("No locations found. Try a different search term.")
      }

      if (data.warning) {
        setSearchError(`Warning: ${data.warning}`)
      }
    } catch (err) {
      setSearchError("Search failed. Please try again.")
      setSuggestions([])
    } finally {
      setIsSearching(false)
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
    setSuggestions([]) // Clear search results
    setSearchValue("") // Clear search input

    // Check if we have cached pollen data for this location
    const cachedLocation = locationCache.getLocationWithPollenData(location.lat, location.lng)
    if (cachedLocation && cachedLocation.pollenData) {
      // Use cached data
      setPollenApiData(cachedLocation.pollenData)
      setDataSource("cache")
      setCurrentLocation(cachedLocation)

      // Update recent locations
      locationCache.addToRecentLocations(cachedLocation)
      setRecentLocations(locationCache.getRecentLocations())
    } else {
      // Cache the location and load fresh pollen data
      locationCache.setCachedLocation(newLocation)
      loadPollenData(location.lat, location.lng)
    }
  }

  const handleRecentLocationSelect = (location: CachedLocation) => {
    setCurrentLocation(location)
    setPollenApiData(location.pollenData)
    setDataSource("cache")

    // Move to front of recent locations
    locationCache.addToRecentLocations(location)
    setRecentLocations(locationCache.getRecentLocations())
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

  // Show location setup if no location is set
  if (!currentLocation) {
    return (
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
            <Link href="/debug">
              <Button variant="ghost" size="sm" className="rounded-full">
                <Bug className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Location Setup */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-gray-800">Welcome to AirBuddy!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">🌸</div>
                <p className="text-gray-600 mb-6">
                  To get started, we need to know your location so we can provide accurate pollen information for your
                  area.
                </p>
              </div>

              {/* Error Display */}
              {searchError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{searchError}</p>
                </div>
              )}

              {/* Manual Search */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 text-center">Search for your location:</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter city, address, or zip code..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    disabled={isSearching}
                  />
                  <Button onClick={handleSearch} disabled={isSearching || !searchValue.trim()} size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search Results */}
                {suggestions.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700">Select a location:</p>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleLocationSelect(suggestion)}
                        className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <span className="text-sm">{suggestion.name}</span>
                            <p className="text-xs text-gray-500">
                              Lat: {suggestion.lat.toFixed(4)}, Lng: {suggestion.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Settings className="w-4 h-4" />
            </Button>
            <Link href="/debug">
              <Button variant="ghost" size="sm" className="rounded-full">
                <Bug className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 bg-transparent"
                    onClick={() => loadPollenData(currentLocation.lat, currentLocation.lng)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
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

        {/* Location History */}
        {recentLocations.length > 0 && (
          <LocationHistory
            recentLocations={recentLocations}
            currentLocation={currentLocation}
            onLocationSelect={handleRecentLocationSelect}
          />
        )}

        {/* Pollen Breakdown with Accordions */}
        {processedPollenData && !isLoadingPollen && (
          <PollenAccordion pollenTypes={processedPollenData.pollenTypes} plants={processedPollenData.plants} />
        )}

        {/* Location */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-xl transition-shadow">
          <CardContent className="p-4" onClick={() => setCurrentLocation(null)}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-800">{currentLocation.name}</span>
            </div>
            {dateFromAPI && <p className="text-xs text-gray-500 mt-1">Updated {formatDate(dateFromAPI)}</p>}
            <p className="text-xs text-blue-600 mt-1">Tap to change location</p>
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
  )
}
