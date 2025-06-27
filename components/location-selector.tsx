"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Search, Navigation } from "lucide-react"

interface LocationSelectorProps {
  currentLocation: string
  onLocationChange: (location: string) => void
}

export function LocationSelector({ currentLocation, onLocationChange }: LocationSelectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const handleLocationUpdate = () => {
    if (searchValue.trim()) {
      onLocationChange(searchValue.trim())
      setIsEditing(false)
      setSearchValue("")
    }
  }

  const handleCurrentLocation = () => {
    // In a real app, this would use the Geolocation API
    onLocationChange("Current Location")
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Enter city or zip code..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLocationUpdate()}
              className="border-0 bg-gray-50 focus-visible:ring-1"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCurrentLocation} variant="outline" className="flex-1 bg-transparent">
              <Navigation className="w-3 h-3 mr-1" />
              Use Current
            </Button>
            <Button size="sm" onClick={handleLocationUpdate} disabled={!searchValue.trim()} className="flex-1">
              Update
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-xl transition-shadow">
      <CardContent className="p-4" onClick={() => setIsEditing(true)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-800">{currentLocation}</span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            Change
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
