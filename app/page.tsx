"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Settings, Wind, Bug, Navigation, Search, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PollenAccordion } from "@/components/pollen-accordion"
import { processPollenData, formatUPI } from "@/lib/pollen-utils"
import { locationCache, type CachedLocation } from "@/lib/location-cache"
import Link from "next/link"

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
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

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

      // Check data source from headers
      const source = response.headers.get("X-Pollen-Data-Source")
      setDataSource(source)

      // Update cache with pollen data
      locationCache.updatePollenData(lat, lng, data)
    } catch (err) {
      console.error("Failed to load pollen data:", err)
      setError(err instanceof Error ? err.message : "Failed to load pollen data")
    } finally {
      setIsLoadingPollen(false)
    }
  }

  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    setSearchError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Reverse geocode to get location name
          const response = await fetch("/api/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          })

          if (!response.ok) {
            throw new Error("Failed to get location name")
          }

          const data = await response.json()

          const newLocation: CachedLocation = {
            name: data.name,
            lat: latitude,
            lng: longitude,
          }

          setCurrentLocation(newLocation)
          locationCache.setCachedLocation(newLocation)
          loadPollenData(latitude, longitude)
        } catch (err) {
          setSearchError("Failed to get your location name. Please try searching manually.")
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        setIsGettingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setSearchError("Location access denied. Please enable location permissions or search manually.")
            break
          case error.POSITION_UNAVAILABLE:
            setSearchError("Location information unavailable. Please try searching manually.")
            break
          case error.TIMEOUT:
            setSearchError("Location request timed out. Please try again or search manually.")
            break
          default:
            setSearchError("An unknown error occurred. Please try searching manually.")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      },
    )
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

              {/* Browser Location Option */}
              <div className="space-y-3">
                <Button
                  onClick={handleGeolocation}
                  disabled={isGettingLocation}
                  className="w-full bg-transparent"
                  variant="outline"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {isGettingLocation ? "Getting Location..." : "Use My Current Location"}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  We'll use your device's location to find pollen data for your area
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or search manually</span>
                </div>
              </div>

              {/* Manual Search */}
              <div className="space-y-3">
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
