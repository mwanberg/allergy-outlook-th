"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, MapPin, Flower2 } from "lucide-react"

export function DebugPanel() {
  const [pollenLat, setPollenLat] = useState("37.7749")
  const [pollenLng, setPollenLng] = useState("-122.4194")
  const [geocodeQuery, setGeocodeQuery] = useState("San Francisco, CA")
  const [pollenResult, setPollenResult] = useState<any>(null)
  const [geocodeResult, setGeocodeResult] = useState<any>(null)
  const [isTestingPollen, setIsTestingPollen] = useState(false)
  const [isTestingGeocode, setIsTestingGeocode] = useState(false)

  const testPollenAPI = async () => {
    setIsTestingPollen(true)
    try {
      const response = await fetch("/api/debug-pollen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: Number.parseFloat(pollenLat),
          lng: Number.parseFloat(pollenLng),
        }),
      })
      const data = await response.json()
      setPollenResult(data)
    } catch (error) {
      setPollenResult({ error: error.message })
    } finally {
      setIsTestingPollen(false)
    }
  }

  const testGeocodeAPI = async () => {
    setIsTestingGeocode(true)
    try {
      const response = await fetch("/api/debug-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: geocodeQuery }),
      })
      const data = await response.json()
      setGeocodeResult(data)
    } catch (error) {
      setGeocodeResult({ error: error.message })
    } finally {
      setIsTestingGeocode(false)
    }
  }

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2)
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Bug className="w-5 h-5" />
            API Debug Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pollen API Test */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Flower2 className="w-4 h-4" />
              Test Pollen API
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Latitude" value={pollenLat} onChange={(e) => setPollenLat(e.target.value)} />
              <Input placeholder="Longitude" value={pollenLng} onChange={(e) => setPollenLng(e.target.value)} />
            </div>
            <Button onClick={testPollenAPI} disabled={isTestingPollen} className="w-full">
              {isTestingPollen ? "Testing..." : "Test Pollen API"}
            </Button>

            {pollenResult && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={pollenResult.success ? "default" : "destructive"}>
                    {pollenResult.success ? "Success" : "Error"}
                  </Badge>
                  {pollenResult.debug?.status && <Badge variant="outline">Status: {pollenResult.debug.status}</Badge>}
                </div>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">{formatJSON(pollenResult)}</pre>
              </div>
            )}
          </div>

          {/* Geocoding API Test */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Test Geocoding API
            </h3>
            <Input
              placeholder="Search query (e.g., San Francisco, CA)"
              value={geocodeQuery}
              onChange={(e) => setGeocodeQuery(e.target.value)}
            />
            <Button onClick={testGeocodeAPI} disabled={isTestingGeocode} className="w-full">
              {isTestingGeocode ? "Testing..." : "Test Geocoding API"}
            </Button>

            {geocodeResult && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={geocodeResult.success ? "default" : "destructive"}>
                    {geocodeResult.success ? "Success" : "Error"}
                  </Badge>
                  {geocodeResult.debug?.status && <Badge variant="outline">Status: {geocodeResult.debug.status}</Badge>}
                </div>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">{formatJSON(geocodeResult)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
