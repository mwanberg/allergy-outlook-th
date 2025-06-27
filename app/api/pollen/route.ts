import { type NextRequest, NextResponse } from "next/server"
import { rateLimiter } from "@/lib/rate-limiter"

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

    // ============= SERVER-SIDE RATE LIMITING =============
    const rateLimit = await rateLimiter.checkRateLimit(
      request,
      "pollen",
      5, // 5 requests per user per day
      100, // 100 total requests per day across all users
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
    const { lat, lng, enableMockData = false } = body

    console.log("🌸 Pollen API request:", { lat, lng, enableMockData })

    // Validate input
    const validation = validateCoordinates(lat, lng)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers })
    }

    // Check for required environment variable
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error("❌ GOOGLE_MAPS_API_KEY is not configured")
      return NextResponse.json(
        {
          error: "Pollen service is temporarily unavailable. We're working on a fix.",
          technical: "API key not configured",
        },
        { status: 503, headers },
      )
    }

    console.log("✅ API Key found, constructing request...")

    // Construct the URL exactly as shown in Google's documentation
    const baseUrl = "https://pollen.googleapis.com/v1/forecast:lookup"
    const params = new URLSearchParams({
      key: apiKey,
      "location.latitude": lat.toString(),
      "location.longitude": lng.toString(),
      days: "1",
    })

    const fullUrl = `${baseUrl}?${params.toString()}`

    // Log the URL structure (without the actual API key)
    const safeUrl = fullUrl.replace(apiKey, "API_KEY_HIDDEN")
    console.log("📤 Request URL structure:", safeUrl)
    console.log("📤 Request method: GET")

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "AirBuddy/1.0",
        Accept: "application/json",
      },
    })

    console.log("📥 Response status:", response.status)
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const responseText = await response.text()
      console.error("❌ Google Pollen API error:", {
        status: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 500),
      })

      // Check if it's an HTML error page (404, 403, etc.)
      if (responseText.includes("<!DOCTYPE html>") || responseText.includes("<html")) {
        console.error("❌ Received HTML error page from Pollen API")

        if (response.status === 404) {
          return NextResponse.json(
            {
              error: "Pollen service is temporarily unavailable. We're working on a fix.",
              technical: "API endpoint not found (404)",
            },
            { status: 503, headers },
          )
        }

        if (response.status === 403) {
          return NextResponse.json(
            {
              error: "Pollen service is temporarily unavailable. We're working on a fix.",
              technical: "API access forbidden (403)",
            },
            { status: 503, headers },
          )
        }
      }

      if (response.status === 429) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers })
      }

      // For any other error, return a generic message
      return NextResponse.json(
        {
          error: "Pollen service is temporarily unavailable. We're working on a fix.",
          technical: `HTTP ${response.status}: ${response.statusText}`,
        },
        { status: 503, headers },
      )
    }

    const responseText = await response.text()
    console.log("📥 Raw response length:", responseText.length)
    console.log("📥 Response preview:", responseText.substring(0, 200))

    let data
    try {
      data = JSON.parse(responseText)
      console.log("✅ Successfully parsed JSON response")
      console.log("📊 Response structure:", {
        hasRegionCode: !!data.regionCode,
        hasDailyInfo: !!data.dailyInfo,
        dailyInfoLength: data.dailyInfo?.length || 0,
        firstDayPollenTypes: data.dailyInfo?.[0]?.pollenTypeInfo?.length || 0,
        firstDayPlants: data.dailyInfo?.[0]?.plantInfo?.length || 0,
      })
    } catch (parseError) {
      console.error("❌ Failed to parse JSON response:", parseError)
      return NextResponse.json(
        {
          error: "Pollen service returned invalid data. We're working on a fix.",
          technical: "JSON parse error",
        },
        { status: 503, headers },
      )
    }

    return NextResponse.json(data, {
      headers: {
        ...headers,
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.reset.toString(),
        "X-Pollen-Data-Source": "google-api",
      },
    })
  } catch (error) {
    console.error("🚨 Pollen API error:", error)
    return NextResponse.json(
      {
        error: "Pollen service is temporarily unavailable. We're working on a fix.",
        technical: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    )
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
