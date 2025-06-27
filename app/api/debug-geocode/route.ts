import { type NextRequest, NextResponse } from "next/server"

// Debug endpoint to test Google Geocoding API and see raw responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    console.log("🔍 Debug Geocoding API Request:", { query })

    // Check if API key is available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: "GOOGLE_MAPS_API_KEY not found",
        debug: {
          hasApiKey: false,
          envVars: Object.keys(process.env).filter((key) => key.includes("GOOGLE")),
        },
      })
    }

    console.log("✅ API Key found, making request to Google Geocoding API...")

    // Make request to Google Maps Geocoding API
    const googleUrl = "https://maps.googleapis.com/maps/api/geocode/json"
    const params = new URLSearchParams({
      address: query,
      key: apiKey,
    })

    const fullUrl = `${googleUrl}?${params}`
    console.log("📤 Request URL:", fullUrl.replace(apiKey, "API_KEY_HIDDEN"))

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "AirBuddy/1.0",
      },
    })

    console.log("📥 Response status:", response.status)
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("📥 Raw response:", responseText)

    let parsedData
    try {
      parsedData = JSON.parse(responseText)
      console.log("✅ Successfully parsed JSON response")
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError)
      return NextResponse.json({
        error: "Failed to parse API response",
        debug: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          rawResponse: responseText,
          parseError: parseError.message,
        },
      })
    }

    return NextResponse.json({
      success: true,
      debug: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        hasApiKey: true,
        queryUsed: query,
      },
      data: parsedData,
    })
  } catch (error) {
    console.error("🚨 Debug Geocoding API Error:", error)
    return NextResponse.json(
      {
        error: error.message,
        debug: {
          errorType: error.constructor.name,
          stack: error.stack,
        },
      },
      { status: 500 },
    )
  }
}
