"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Navigation, Search, X, AlertTriangle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: { name: string; lat: number; lng: number }) => void
  currentLocation: string
}

interface LocationSuggestion {
  name: string
  lat: number
  lng: number
}

export function LocationPickerModal({ isOpen, onClose, onLocationSelect, currentLocation }: LocationPickerModalProps) {
  const [searchValue, setSearchValue] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dailyUsage, setDailyUsage] = useState({ searches: 0, pollenRequests: 0 })
  const [geolocationStatus, setGeolocationStatus] = useState<string>("unknown")

  // Check geolocation availability on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!navigator.geolocation) {
        setGeolocationStatus("not_supported")
      } else {
        // Test if we can access geolocation
        navigator.permissions
          ?.query({ name: "geolocation" })
          .then((result) => {
            setGeolocationStatus(result.state)
            console.log("🌍 Geolocation permission status:", result.state)
          })
          .catch(() => {
            setGeolocationStatus("unknown")
          })
      }
    }
  }, [])

  // Load daily usage from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const today = new Date().toDateString()
      const stored = localStorage.getItem("airbuddy-daily-usage")
      if (stored) {
        const usage = JSON.parse(stored)
        if (usage.date === today) {
          setDailyUsage(usage)
        } else {
          // Reset for new day
          const newUsage = { date: today, searches: 0, pollenRequests: 0 }
          localStorage.setItem("airbuddy-daily-usage", JSON.stringify(newUsage))
          setDailyUsage(newUsage)
        }
      }
    } catch (error) {
      console.error("Failed to load daily usage:", error)
    }
  }, [])

  const updateDailyUsage = (type: "searches" | "pollenRequests") => {
    const today = new Date().toDateString()
    const newUsage = {
      date: today,
      searches: type === "searches" ? dailyUsage.searches + 1 : dailyUsage.searches,
      pollenRequests: type === "pollenRequests" ? dailyUsage.pollenRequests + 1 : dailyUsage.pollenRequests,
    }
    setDailyUsage(newUsage)
    localStorage.setItem("airbuddy-daily-usage", JSON.stringify(newUsage))
  }

  const handleGeolocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    if (dailyUsage.pollenRequests >= 5) {
      setError("Daily limit of 5 pollen requests reached. Try again tomorrow.")
      return
    }

    setIsGettingLocation(true)
    setError(null)

    console.log("🌍 Requesting geolocation...")

    // First, let's check if we have permission
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" })
        console.log("🌍 Current permission state:", permission.state)

        if (permission.state === "denied") {
          setError(
            "Location access is blocked. Please enable location permissions in your browser settings and refresh the page.",
          )
          setIsGettingLocation(false)
          return
        }
      } catch (permError) {
        console.log("🌍 Could not check permissions:", permError)
      }
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 300000, // 5 minutes
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("🌍 Got position:", position.coords)

        try {
          const { latitude, longitude } = position.coords

          console.log("🌍 Reverse geocoding coordinates:", { latitude, longitude })

          // Reverse geocode to get location name
          const response = await fetch("/api/reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          })

          console.log("🌍 Reverse geocode response status:", response.status)

          if (!response.ok) {
            const errorData = await response.json()
            console.error("🌍 Reverse geocode error:", errorData)
            throw new Error(errorData.error || "Failed to get location name")
          }

          const data = await response.json()
          console.log("🌍 Reverse geocode result:", data)

          updateDailyUsage("pollenRequests")

          onLocationSelect({
            name: data.name,
            lat: latitude,
            lng: longitude,
          })
          onClose()
        } catch (err) {
          console.error("🌍 Error processing location:", err)
          setError("Failed to get your location name. Please try searching manually.")
        } finally {
          setIsGettingLocation(false)
        }
      },
      (error) => {
        console.error("🌍 Geolocation error:", error)
        setIsGettingLocation(false)

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "Location access denied. Please enable location permissions in your browser settings and try again.",
            )
            break
          case error.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please try searching manually.")
            break
          case error.TIMEOUT:
            setError("Location request timed out. Please try again or search manually.")
            break
          default:
            setError(`Location error (${error.code}): ${error.message}. Please try searching manually.`)
            break
        }
      },
      options,
    )
  }

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    if (dailyUsage.searches >= 10) {
      setError("Daily search limit of 10 reached. Try again tomorrow.")
      return
    }

    setIsSearching(true)
    setError(null)

    console.log("🔍 Searching for:", searchValue.trim())

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchValue.trim() }),
      })

      console.log("🔍 Geocode response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("🔍 Geocode error:", errorData)
        throw new Error(errorData.error || "Search failed")
      }

      const data = await response.json()
      console.log("🔍 Geocode result:", data)

      setSuggestions(data.suggestions || [])
      updateDailyUsage("searches")

      if (data.suggestions?.length === 0) {
        setError("No locations found. Try a different search term.")
      }

      // Show warning if we got preview data
      if (data.warning) {
        setError(`API Warning: ${data.warning}. Showing preview data.`)
      }
    } catch (err) {
      console.error("🔍 Search error:", err)
      setError("Search failed. Please try again.")
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleLocationSelect = (location: LocationSuggestion) => {
    if (dailyUsage.pollenRequests >= 5) {
      setError("Daily limit of 5 pollen requests reached. Try again tomorrow.")
      return
    }

    console.log("📍 Selected location:", location)
    updateDailyUsage("pollenRequests")
    onLocationSelect(location)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Choose Location</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Current Location Display */}
          <div className="text-sm text-gray-600">
            Current: <span className="font-medium">{currentLocation}</span>
          </div>

          {/* Geolocation Status */}
          {geolocationStatus !== "unknown" && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">Location Status</span>
              </div>
              <div className="text-blue-700">
                {geolocationStatus === "granted" && "✅ Location access granted"}
                {geolocationStatus === "denied" && "❌ Location access denied"}
                {geolocationStatus === "prompt" && "❓ Location access will be requested"}
                {geolocationStatus === "not_supported" && "❌ Geolocation not supported"}
              </div>
            </div>
          )}

          {/* Usage Limits Display */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Daily Limits</span>
            </div>
            <div className="space-y-1 text-blue-700">
              <div>Pollen requests: {dailyUsage.pollenRequests}/5</div>
              <div>Location searches: {dailyUsage.searches}/10</div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Limits reset daily at midnight. Pollen data updates once per day, so multiple requests for the same
              location aren't needed.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Browser Location Option */}
          <div className="space-y-3">
            <Button
              onClick={handleGeolocation}
              disabled={isGettingLocation || dailyUsage.pollenRequests >= 5 || geolocationStatus === "denied"}
              className="w-full"
              variant="outline"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isGettingLocation ? "Getting Location..." : "Use My Current Location"}
            </Button>
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Note:</strong> Using a VPN may result in an inaccurate location.
              </p>
              <p>
                <strong>Tip:</strong> If location access is denied, check your browser's location settings (usually in
                the address bar or browser settings).
              </p>
            </div>
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
                disabled={isSearching || dailyUsage.searches >= 10}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim() || dailyUsage.searches >= 10}
                size="sm"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Help */}
            <div className="text-xs text-gray-500">
              <p>
                <strong>Search examples:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>City: "Portland, OR" or "Portland, Oregon"</li>
                <li>ZIP code: "97230" or "97230, USA"</li>
                <li>Address: "123 Main St, Portland, OR"</li>
              </ul>
            </div>

            {/* Search Results */}
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700">Select a location:</p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(suggestion)}
                    disabled={dailyUsage.pollenRequests >= 5}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors",
                      dailyUsage.pollenRequests >= 5 && "opacity-50 cursor-not-allowed",
                      suggestion.name.includes("(preview)") && "border-orange-200 bg-orange-50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="text-sm">{suggestion.name}</span>
                        {suggestion.name.includes("(preview)") && (
                          <p className="text-xs text-orange-600 mt-1">Preview mode - API key may not be configured</p>
                        )}
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

          {/* Privacy Policy Link */}
          <div className="pt-4 border-t">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Privacy Policy - How we handle your location data
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
