"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, Flower2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatUPI } from "@/lib/pollen-utils"
import type { CachedLocation } from "@/lib/location-cache"

interface LocationHistoryProps {
  recentLocations: CachedLocation[]
  currentLocation: CachedLocation | null
  onLocationSelect: (location: CachedLocation) => void
  className?: string
}

export function LocationHistory({
  recentLocations,
  currentLocation,
  onLocationSelect,
  className,
}: LocationHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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

  const getPollenSummary = (location: CachedLocation) => {
    if (!location.pollenData?.dailyInfo?.[0]?.pollenTypeInfo) {
      return { totalUPI: 0, category: "None" }
    }

    const pollenTypes = location.pollenData.dailyInfo[0].pollenTypeInfo
    const totalUPI = pollenTypes.reduce((sum: number, type: any) => sum + (type.indexInfo?.value ?? 0), 0)
    const averageUPI = Math.round((totalUPI / 3) * 10) / 10

    const getCategory = (upi: number) => {
      if (upi === 0) return "None"
      if (upi <= 1.0) return "Very Low"
      if (upi <= 2.0) return "Low"
      if (upi <= 3.0) return "Moderate"
      if (upi <= 4.0) return "High"
      return "Very High"
    }

    return { totalUPI: averageUPI, category: getCategory(averageUPI) }
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
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
    return `${monthNames[date.getMonth()]}, ${date.getDate()} ${date.getFullYear()}`
  }

  // Filter out current location from recent locations
  const otherLocations = recentLocations.filter((loc) => {
    if (!currentLocation) return true
    return !(Math.abs(loc.lat - currentLocation.lat) < 0.001 && Math.abs(loc.lng - currentLocation.lng) < 0.001)
  })

  if (otherLocations.length === 0) {
    return null
  }

  return (
    <Card className={cn("border-0 shadow-lg bg-white/80 backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-normal">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Locations
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="rounded-full"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 mb-3">Tap any location to view its cached pollen data.</p>

          {otherLocations.map((location, index) => {
            const pollenSummary = getPollenSummary(location)

            return (
              <button
                key={`${location.lat}-${location.lng}-${index}`}
                onClick={() => onLocationSelect(location)}
                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-gray-800 truncate">{location.name}</span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Flower2 className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">
                          {formatUPI(pollenSummary.totalUPI)} UPI
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border font-semibold border-transparent text-xs px-2 py-1 pointer-events-none",
                            getPollenLevelColor(pollenSummary.category),
                          )}
                        >
                          {pollenSummary.category}
                        </span>
                      </div>
                    </div>

                    {location.lastUpdated && (
                      <p className="text-xs text-gray-500">Updated {formatLastUpdated(location.lastUpdated)}</p>
                    )}
                  </div>

                  <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs text-blue-600">→</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">Cached data expires after 24 hours</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
