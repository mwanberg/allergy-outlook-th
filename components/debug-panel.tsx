"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, MapPin, Flower2, ExternalLink, Info } from "lucide-react"

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
      {/* Pollen API Status */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Info className="w-5 h-5" />
            Google Pollen API Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">Current Status: Not Publicly Available</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Google Pollen API: Returns 404 (Not Found)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Google Geocoding API: Working ✓</span>
              </div>
              <p className="text-amber-700 bg-amber-100 p-3 rounded-lg mt-3">
                <strong>Good news:</strong> The app automatically falls back to seasonal pollen estimates when the
                Google Pollen API isn't available. Your users will still get useful pollen information!
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">About the Google Pollen API</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p>The Google Pollen API appears to be:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Still in development or limited beta</li>
                <li>Not yet publicly available</li>
                <li>May require special access or whitelisting</li>
                <li>Could have geographic restrictions</li>
              </ul>
              <p className="mt-3">
                <strong>Our solution:</strong> We've implemented intelligent seasonal fallback data that provides
                realistic pollen estimates based on location and time of year.
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Alternative Data Sources</h3>
            <div className="space-y-2 text-sm text-green-700">
              <p>Consider these alternatives for real pollen data:</p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <a
                  href="https://www.airnow.gov/developers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>AirNow API (EPA) - Air Quality Data</span>
                </a>
                <a
                  href="https://openweathermap.org/api/air-pollution"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>OpenWeatherMap - Air Pollution API</span>
                </a>
                <a
                  href="https://www.weatherapi.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>WeatherAPI - Includes pollen data</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Test Pollen API (Expected to fail with 404)
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
                    {pollenResult.success ? "Success" : "Expected Error"}
                  </Badge>
                  {pollenResult.debug?.status && <Badge variant="outline">Status: {pollenResult.debug.status}</Badge>}
                  {pollenResult.debug?.status === 404 && <Badge variant="secondary">API Not Available</Badge>}
                </div>
                <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-64">{formatJSON(pollenResult)}</pre>
              </div>
            )}
          </div>

          {/* Geocoding API Test */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Test Geocoding API (Should work)
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
