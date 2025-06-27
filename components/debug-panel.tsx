"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, MapPin, Flower2, AlertTriangle, ExternalLink } from "lucide-react"

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
      {/* Environment Status */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" />
            Environment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">API Key Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">GOOGLE_MAPS_API_KEY: Not found</span>
              </div>
              <p className="text-amber-700 bg-amber-100 p-3 rounded-lg">
                <strong>This is expected in the v0 preview environment!</strong> The API key you've configured in your
                Vercel project won't be available here. The app will work properly once deployed to Vercel.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
              <li>Deploy this code to your Vercel project</li>
              <li>Ensure your Google Maps API key is set in Vercel environment variables</li>
              <li>Enable the required APIs in Google Cloud Console:</li>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Maps JavaScript API</li>
                <li>Geocoding API</li>
                <li>Pollen API (if available in your region)</li>
              </ul>
              <li>Test the deployed version</li>
            </ol>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Google Cloud Console Setup</h3>
            <div className="space-y-2 text-sm text-green-700">
              <p>Make sure your API key has these APIs enabled:</p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <a
                  href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Maps JavaScript API</span>
                </a>
                <a
                  href="https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Geocoding API</span>
                </a>
                <a
                  href="https://console.cloud.google.com/apis/library/pollen.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pollen API</span>
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
          <div className="bg-orange-100 rounded-lg p-3 border border-orange-200">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> These tests will show "API key not found" in the v0 preview. They'll work once
              deployed to Vercel with proper environment variables.
            </p>
          </div>

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
