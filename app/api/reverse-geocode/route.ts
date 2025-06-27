import { type NextRequest, NextResponse } from "next/server"

// Input validation for coordinates
function validateCoordinates(lat: number, lng: number): { isValid: boolean; error?: string } {
  if (typeof lat !== "number" || typeof lng !== "number") {
    return { isValid: false, error: "Latitude and longitude must be numbers" }
  }

  if (lat < -90 || lat > 90) {
    return { isValid: false, error: "Latitude must be between -90 and 90" }
  }

  if (lng < -180 || lng > 180) {
    return { isValid: false, error: "Longitude must be between -180 and 180" }
  }

  return { isValid: true }
}

export async function POST(request: NextRequest) {
  try {
    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin":
        process.env.NODE_ENV === "production" ? "https://your-domain.vercel.app" : "http://localhost:3000",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    }

    const body = await request.json()
    const { lat, lng } = body

    // Validate input
    const validation = validateCoordinates(lat, lng)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers })
    }

    // Check for required environment variable
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error("GOOGLE_MAPS_API_KEY is not configured")
      return NextResponse.json({ error: "Reverse geocoding service is not available" }, { status: 500, headers })
    }

    // Make request to Google Maps Reverse Geocoding API
    const googleUrl = "https://maps.googleapis.com/maps/api/geocode/json"
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: process.env.GOOGLE_MAPS_API_KEY,
    })

    const response = await fetch(`${googleUrl}?${params}`, {
      method: "GET",
      headers: {
        "User-Agent": "AirBuddy/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status !== "OK") {
      if (data.status === "ZERO_RESULTS") {
        return NextResponse.json({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }, { headers })
      }
      throw new Error(`Google Maps API error: ${data.status}`)
    }

    // Get the most relevant place name (usually the first result)
    const placeName = data.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

    return NextResponse.json({ name: placeName }, { headers })
  } catch (error) {
    console.error("Reverse geocoding error:", error)
    return NextResponse.json({ error: "Failed to get location name" }, { status: 500 })
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin":
        process.env.NODE_ENV === "production" ? "https://your-domain.vercel.app" : "http://localhost:3000",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
