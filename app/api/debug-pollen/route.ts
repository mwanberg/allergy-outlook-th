import { type NextRequest, NextResponse } from "next/server"

// Debug endpoint to test Google Pollen API and see raw responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng } = body

    console.log("🔍 Debug Pollen API Request:", { lat, lng })

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

    console.log("✅ API Key found, making request to Google Pollen API...")

    // Make request to Google Maps Pollen API
    const googleUrl = "https://pollen.googleapis.com/v1/forecast:lookup"
    const requestBody = {
      location: {
        longitude: lng,
        latitude: lat,
      },
      days: 1,
      languageCode: "en",
    }

    console.log("📤 Request body:", JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${googleUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AirBuddy/1.0",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📥 Response status:", response.status)
    console.log("📥 Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("📥 Raw response length:", responseText.length)
    console.log("📥 Raw response preview:", responseText.substring(0, 500))

    let parsedData
    try {
      parsedData = JSON.parse(responseText)
      console.log("✅ Successfully parsed JSON response")

      // Log key parts of the structure
      if (parsedData.dailyInfo) {
        console.log("📊 Daily info entries:", parsedData.dailyInfo.length)
        if (parsedData.dailyInfo[0]) {
          console.log("📊 First day pollen types:", parsedData.dailyInfo[0].pollenTypeInfo?.length || 0)
          console.log("📊 First day plants:", parsedData.dailyInfo[0].plantInfo?.length || 0)
        }
      }
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError)
      return NextResponse.json({
        error: "Failed to parse API response",
        debug: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          rawResponse: responseText.substring(0, 1000), // First 1000 chars
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
        requestSent: requestBody,
        responseSize: responseText.length,
      },
      data: parsedData,
    })
  } catch (error) {
    console.error("🚨 Debug Pollen API Error:", error)
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
