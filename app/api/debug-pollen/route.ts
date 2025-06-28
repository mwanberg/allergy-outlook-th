import { type NextRequest, NextResponse } from "next/server"

// Enhanced mock data generator for debugging only
const getMockPollenData = (lat: number, lng: number) => {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const isNorthernHemisphere = lat > 0

  // Seasonal adjustments
  let treeLevel = 0
  let grassLevel = 0
  let weedLevel = 0

  if (isNorthernHemisphere) {
    if (month >= 3 && month <= 5) {
      // Spring - high tree pollen
      treeLevel = Math.random() * 3 + 1 // 1-4
      grassLevel = Math.random() * 1.5 // 0-1.5
      weedLevel = Math.random() * 0.5 // 0-0.5
    } else if (month >= 6 && month <= 8) {
      // Summer - high grass pollen
      treeLevel = Math.random() * 1 // 0-1
      grassLevel = Math.random() * 3 + 1 // 1-4
      weedLevel = Math.random() * 1.5 // 0-1.5
    } else if (month >= 9 && month <= 11) {
      // Fall - high weed pollen
      treeLevel = Math.random() * 0.5 // 0-0.5
      grassLevel = Math.random() * 1 // 0-1
      weedLevel = Math.random() * 3 + 1 // 1-4
    } else {
      // Winter - low everything
      treeLevel = Math.random() * 0.5 // 0-0.5
      grassLevel = Math.random() * 0.5 // 0-0.5
      weedLevel = Math.random() * 0.5 // 0-0.5
    }
  } else {
    // Southern hemisphere - reverse seasons
    if (month >= 9 && month <= 11) {
      treeLevel = Math.random() * 3 + 1
      grassLevel = Math.random() * 1.5
      weedLevel = Math.random() * 0.5
    } else if (month >= 12 || month <= 2) {
      treeLevel = Math.random() * 1
      grassLevel = Math.random() * 3 + 1
      weedLevel = Math.random() * 1.5
    } else if (month >= 3 && month <= 5) {
      treeLevel = Math.random() * 0.5
      grassLevel = Math.random() * 1
      weedLevel = Math.random() * 3 + 1
    } else {
      treeLevel = Math.random() * 0.5
      grassLevel = Math.random() * 0.5
      weedLevel = Math.random() * 0.5
    }
  }

  // Round to 1 decimal place
  treeLevel = Math.round(treeLevel * 10) / 10
  grassLevel = Math.round(grassLevel * 10) / 10
  weedLevel = Math.round(weedLevel * 10) / 10

  const getCategory = (level: number) => {
    if (level === 0) return "None"
    if (level <= 1.0) return "Very Low"
    if (level <= 2.0) return "Low"
    if (level <= 3.0) return "Moderate"
    if (level <= 4.0) return "High"
    return "Very High"
  }

  return {
    regionCode: "US",
    dailyInfo: [
      {
        date: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
        },
        pollenTypeInfo: [
          {
            code: "TREE",
            displayName: "Tree",
            inSeason: treeLevel > 1.0,
            indexInfo: {
              code: "UPI",
              displayName: "Universal Pollen Index",
              value: treeLevel,
              category: getCategory(treeLevel),
              indexDescription: "Mock data for debugging",
              color: { red: 0.5, green: 0.8, blue: 0.2 },
            },
            healthRecommendations: ["This is mock data for debugging purposes only."],
          },
          {
            code: "GRASS",
            displayName: "Grass",
            inSeason: grassLevel > 1.0,
            indexInfo: {
              code: "UPI",
              displayName: "Universal Pollen Index",
              value: grassLevel,
              category: getCategory(grassLevel),
              indexDescription: "Mock data for debugging",
              color: { red: 0.5, green: 0.8, blue: 0.2 },
            },
            healthRecommendations: ["This is mock data for debugging purposes only."],
          },
          {
            code: "WEED",
            displayName: "Weed",
            inSeason: weedLevel > 1.0,
            indexInfo: {
              code: "UPI",
              displayName: "Universal Pollen Index",
              value: weedLevel,
              category: getCategory(weedLevel),
              indexDescription: "Mock data for debugging",
              color: { red: 0.5, green: 0.8, blue: 0.2 },
            },
            healthRecommendations: ["This is mock data for debugging purposes only."],
          },
        ],
        plantInfo: [],
      },
    ],
    _mockData: true,
    _debugOnly: true,
    _location: { lat, lng },
    _generated: now.toISOString(),
  }
}

// Debug endpoint to test Google Pollen API and see raw responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lat, lng, useMockData = false } = body

    console.log("🔍 Debug Pollen API Request:", { lat, lng, useMockData })

    // If mock data is requested, return it immediately
    if (useMockData) {
      console.log("🎭 Returning mock data for debugging")
      return NextResponse.json({
        success: true,
        debug: {
          mockData: true,
          message: "Mock data generated for debugging purposes",
        },
        data: getMockPollenData(lat, lng),
      })
    }

    // Check if API key is available
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        error: "GOOGLE_MAPS_API_KEY not found",
        debug: {
          hasApiKey: false,
          envVars: Object.keys(process.env).filter((key) => key.includes("GOOGLE")),
          message: "API key is required for real API testing",
        },
      })
    }

    console.log("✅ API Key found, making request to Google Pollen API...")

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

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "User-Agent": "AirBuddy/1.0",
        Accept: "application/json",
      },
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
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError)
      return NextResponse.json({
        error: "Failed to parse API response",
        debug: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          rawResponse: responseText.substring(0, 1000), // First 1000 chars
          parseError: parseError.message,
          urlUsed: safeUrl,
        },
      })
    }

    return NextResponse.json({
      success: response.ok,
      debug: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        hasApiKey: true,
        urlUsed: safeUrl,
        responseSize: responseText.length,
        method: "GET",
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
