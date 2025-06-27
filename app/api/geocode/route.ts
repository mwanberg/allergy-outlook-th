import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

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

    // ============= SERVER-SIDE RATE LIMITING =============
    const rateLimit = await rateLimiter.checkRateLimit(
      request,
      "geocode",
      10, // 10 requests per user per day
      200, // 200 total requests per day across all users
    )

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: rateLimit.error,
          rateLimitInfo: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset: rateLimit.reset,
          },
        },
        {
          status: 429,
          headers: {
            ...headers,
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
          },
        },
      )
    }

    const body = await request.json()
    const { query } = body

    // Validate input
    const validation = validateGeocodingInput(query)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers })
    }

    // Check for required environment variable
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn("GOOGLE_MAPS_API_KEY missing – returning mock geocode data so the preview keeps working.")

      // Echo the input back as a fake location centred on 0,0
      return NextResponse.json(
        {
          suggestions: [{ name: query + " (preview)", lat: 0, lng: 0 }],
        },
        {
          headers: {
            ...headers,
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
          },
        },
      )
    }

    // Make request to Google Maps Geocoding API
    const googleUrl = "https://maps.googleapis.com/maps/api/geocode/json"
    const params = new URLSearchParams({
      address: query,
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

    // --- handle Google JSON status ---------------------------------
    if (data.status !== "OK") {
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
          {
            headers: {
              ...headers,
              "X-RateLimit-Limit": rateLimit.limit.toString(),
              "X-RateLimit-Remaining": rateLimit.remaining.toString(),
              "X-RateLimit-Reset": rateLimit.reset.toString(),
            },
          },
        )
      }

      // ZERO_RESULTS is a normal case – just return empty list.
      if (data.status === "ZERO_RESULTS") {
        return NextResponse.json(
          { suggestions: [] },
          {
            headers: {
              ...headers,
              "X-RateLimit-Limit": rateLimit.limit.toString(),
              "X-RateLimit-Remaining": rateLimit.remaining.toString(),
              "X-RateLimit-Reset": rateLimit.reset.toString(),
            },
          },
        )
      }

      // Any other unexpected status → error
      throw new Error(`Google Maps API error: ${data.status}`)
    }

    // Transform Google Maps response to our format
    const suggestions =
      data.results?.slice(0, 5).map((result: any) => ({
        name: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      })) || []

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          ...headers,
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      },
    )
  } catch (error) {
    console.error("Geocoding error:", error)
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
