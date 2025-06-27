import { type NextRequest, NextResponse } from "next/server"

// Input validation
function validateGeocodingInput(query: string): { isValid: boolean; error?: string } {
  if (!query || typeof query !== "string") {
    return { isValid: false, error: "Query is required and must be a string" }
  }

  if (query.length < 2) {
    return { isValid: false, error: "Query must be at least 2 characters long" }
  }

  if (query.length > 200) {
    return { isValid: false, error: "Query is too long" }
  }

  // Basic sanitization - remove potentially harmful characters
  const sanitized = query.replace(/[<>"'%;()&+]/g, "")
  if (sanitized !== query) {
    return { isValid: false, error: "Query contains invalid characters" }
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
    const { query } = body

    console.log("🔍 Geocoding request for:", query)

    // Validate input
    const validation = validateGeocodingInput(query)
    if (!validation.isValid) {
      console.error("❌ Invalid query:", validation.error)
      return NextResponse.json({ error: validation.error }, { status: 400, headers })
    }

    // Check for required environment variable
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn("⚠️ GOOGLE_MAPS_API_KEY missing – returning mock geocode data")

      // Echo the input back as a fake location centred on 0,0
      return NextResponse.json(
        {
          suggestions: [{ name: query + " (preview)", lat: 0, lng: 0 }],
          warning: "API key not configured",
        },
        { headers },
      )
    }

    // Make request to Google Maps Geocoding API
    const googleUrl = "https://maps.googleapis.com/maps/api/geocode/json"
    const params = new URLSearchParams({
      address: query,
      key: apiKey,
    })

    const fullUrl = `${googleUrl}?${params}`
    console.log("📤 Making request to Google Geocoding API")
    console.log("📤 Query being sent:", query)

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "AirBuddy/1.0",
      },
    })

    console.log("📥 Google API response status:", response.status)

    if (!response.ok) {
      console.error("❌ Google API HTTP error:", response.status)
      throw new Error(`Google Maps API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("📥 Google API response status field:", data.status)
    console.log("📥 Google API results count:", data.results?.length || 0)

    // Log first result for debugging
    if (data.results && data.results.length > 0) {
      console.log("📥 First result:", {
        formatted_address: data.results[0].formatted_address,
        location: data.results[0].geometry?.location,
      })
    }

    // --- handle Google JSON status ---------------------------------
    if (data.status !== "OK") {
      console.warn("⚠️ Google API returned non-OK status:", data.status)

      // If the key is restricted / API disabled we get REQUEST_DENIED.
      // For preview we emit mock data instead of throwing.
      if (
        data.status === "REQUEST_DENIED" ||
        data.status === "OVER_DAILY_LIMIT" ||
        data.status === "API_KEY_INVALID" ||
        data.status === "API_KEY_EXPIRED"
      ) {
        console.warn(
          `Google Geocoding API returned ${data.status} – returning mock suggestion so preview keeps working.`,
        )
        return NextResponse.json(
          {
            suggestions: [{ name: query + " (preview)", lat: 0, lng: 0 }],
            warning: data.error_message ?? data.status,
          },
          { headers },
        )
      }

      // ZERO_RESULTS is a normal case – just return empty list.
      if (data.status === "ZERO_RESULTS") {
        console.log("ℹ️ No results found for query:", query)
        return NextResponse.json({ suggestions: [] }, { headers })
      }

      // Any other unexpected status → error
      throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || "Unknown error"}`)
    }

    // Transform Google Maps response to our format
    const suggestions =
      data.results?.slice(0, 5).map((result: any) => ({
        name: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      })) || []

    console.log("✅ Successfully processed", suggestions.length, "suggestions")
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion.name} (${suggestion.lat}, ${suggestion.lng})`)
    })

    return NextResponse.json({ suggestions }, { headers })
  } catch (error) {
    console.error("🚨 Geocoding error:", error)
    return NextResponse.json({ error: "Failed to search locations" }, { status: 500 })
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
