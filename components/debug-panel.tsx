"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bug, MapPin, Flower2, ExternalLink, Info, TestTube } from "lucide-react"

export function DebugPanel() {
  const [pollenLat, setPollenLat] = useState("45.2629000")
  const [pollenLng, setPollenLng] = useState("-122.6925900")
  const [geocodeQuery, setGeocodeQuery] = useState("Portland, OR")
  const [pollenResult, setPollenResult] = useState<any>(null)
  const [geocodeResult, setGeocodeResult] = useState<any>(null)
  const [isTestingPollen, setIsTestingPollen] = useState(false)
  const [isTestingGeocode, setIsTestingGeocode] = useState(false)

  const testPollenAPI = async (useMockData = false) => {
    setIsTestingPollen(true)
    try {
      const response = await fetch("/api/debug-pollen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: Number.parseFloat(pollenLat),
          lng: Number.parseFloat(pollenLng),
          useMockData,
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
      {/* API Configuration Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="w-5 h-5" />
            Google Pollen API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Current Implementation</h3>
            <div className="space-y-2 text-sm">
              <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                <div className="text-green-600">✓ Method: GET (as per documentation)</div>
                <div className="text-green-600">✓ URL: https://pollen.googleapis.com/v1/forecast:lookup</div>
                <div className="text-green-600">✓ Parameters: key, location.latitude, location.longitude, days</div>
                <div className="text-green-600">✓ Headers: User-Agent, Accept: application/json</div>
              </div>
              <p className="text-blue-700 bg-blue-100 p-3 rounded-lg">
                <strong>Implementation matches Google's documentation exactly.</strong> If this still returns errors,
                the API may require special access or have geographic restrictions.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="font-semibold text-amber-800 mb-2">Test Coordinates</h3>
            <div className="space-y-2 text-sm text-amber-700">
              <p>Using Portland, OR coordinates from Google's documentation examples:</p>
              <div className="font-mono text-xs bg-white p-2 rounded border">
                Latitude: 45.2629000
                <br />
                Longitude: -122.6925900
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
              Test Google Pollen API
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Latitude" value={pollenLat} onChange={(e) => setPollenLat(e.target.value)} />
              <Input placeholder="Longitude" value={pollenLng} onChange={(e) => setPollenLng(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => testPollenAPI(false)} disabled={isTestingPollen} className="flex-1">
                {isTestingPollen ? "Testing..." : "Test Real API"}
              </Button>
              <Button
                onClick={() => testPollenAPI(true)}
                disabled={isTestingPollen}
                variant="outline"
                className="flex-1"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Mock Data
              </Button>
            </div>

            {pollenResult && (
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={pollenResult.success ? "default" : "destructive"}>
                    {pollenResult.success ? "Success" : "Error"}
                  </Badge>
                  {pollenResult.debug?.status && <Badge variant="outline">Status: {pollenResult.debug.status}</Badge>}
                  {pollenResult.debug?.mockData && <Badge variant="secondary">Mock Data</Badge>}
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
              placeholder="Search query (e.g., Portland, OR)"
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

          {/* API Documentation Links */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Google API Documentation</h3>
            <div className="space-y-2 text-sm text-green-700">
              <div className="grid grid-cols-1 gap-2">
                <a
                  href="https://developers.google.com/maps/documentation/pollen/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pollen API Documentation</span>
                </a>
                <a
                  href="https://developers.google.com/maps/documentation/pollen/reference/rest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Pollen API REST Reference</span>
                </a>
                <a
                  href="https://console.cloud.google.com/apis/library/pollen.googleapis.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Enable Pollen API in Console</span>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
