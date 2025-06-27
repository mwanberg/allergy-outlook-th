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

// Enhanced mock data generator based on location and season
const getMockPollenData = (lat: number, lng: number) => {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const isNorthernHemisphere = lat > 0

  // Seasonal adjustments
  let treeLevel = 0
  let grassLevel = 0
  let weedLevel = 0

  if (isNorthernHemisphere) {
    // Northern hemisphere seasons
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
      // Spring
      treeLevel = Math.random() * 3 + 1
      grassLevel = Math.random() * 1.5
      weedLevel = Math.random() * 0.5
    } else if (month >= 12 || month <= 2) {
      // Summer
      treeLevel = Math.random() * 1
      grassLevel = Math.random() * 3 + 1
      weedLevel = Math.random() * 1.5
    } else if (month >= 3 && month <= 5) {
      // Fall
      treeLevel = Math.random() * 0.5
      grassLevel = Math.random() * 1
      weedLevel = Math.random() * 3 + 1
    } else {
      // Winter
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

  const getColor = (category: string) => {
    switch (category) {
      case "None":
        return { red: 0.5, green: 0.5, blue: 0.5 }
      case "Very Low":
        return { red: 0.2, green: 0.6, blue: 0.9 }
      case "Low":
        return { red: 0.5176471, green: 0.8117647, blue: 0.2 }
      case "Moderate":
        return { red: 1.0, green: 0.8, blue: 0.0 }
      case "High":
        return { red: 1.0, green: 0.5, blue: 0.0 }
      case "Very High":
        return { red: 1.0, green: 0.2, blue: 0.2 }
      default:
        return { red: 0.5, green: 0.5, blue: 0.5 }
    }
  }

  const treeCategory = getCategory(treeLevel)
  const grassCategory = getCategory(grassLevel)
  const weedCategory = getCategory(weedLevel)

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
              category: treeCategory,
              indexDescription:
                treeLevel === 0
                  ? "No tree pollen detected"
                  : treeLevel <= 1.0
                    ? "Very low tree pollen levels"
                    : treeLevel <= 2.0
                      ? "Low tree pollen levels - minimal symptoms expected"
                      : treeLevel <= 3.0
                        ? "Moderate tree pollen levels - some people may experience symptoms"
                        : "High tree pollen levels - many people will experience symptoms",
              color: getColor(treeCategory),
            },
            healthRecommendations:
              treeLevel === 0
                ? ["No tree pollen detected today.", "Great weather for outdoor activities!"]
                : treeLevel <= 1.0
                  ? ["Tree pollen levels are very low today.", "Good day for outdoor activities."]
                  : treeLevel <= 2.0
                    ? [
                        "Tree pollen levels are low but present.",
                        "Most people can enjoy outdoor activities without issues.",
                      ]
                    : [
                        "Tree pollen levels are elevated.",
                        "People with tree pollen allergies should consider taking precautions.",
                        "Keep windows closed and shower after being outdoors.",
                      ],
          },
          {
            code: "GRASS",
            displayName: "Grass",
            inSeason: grassLevel > 1.0,
            indexInfo: {
              code: "UPI",
              displayName: "Universal Pollen Index",
              value: grassLevel,
              category: grassCategory,
              indexDescription:
                grassLevel === 0
                  ? "No grass pollen detected"
                  : grassLevel <= 1.0
                    ? "Very low grass pollen levels"
                    : grassLevel <= 2.0
                      ? "Low grass pollen levels - minimal symptoms expected"
                      : grassLevel <= 3.0
                        ? "Moderate grass pollen levels - some people may experience symptoms"
                        : "High grass pollen levels - many people will experience symptoms",
              color: getColor(grassCategory),
            },
            healthRecommendations:
              grassLevel === 0
                ? ["No grass pollen detected today."]
                : grassLevel <= 1.0
                  ? ["Grass pollen levels are very low today.", "Good day for outdoor activities."]
                  : grassLevel <= 2.0
                    ? [
                        "Grass pollen levels are low but present.",
                        "Most people can enjoy outdoor activities without issues.",
                      ]
                    : [
                        "Grass pollen levels are elevated.",
                        "People with grass pollen allergies should consider taking precautions.",
                        "Avoid mowing the lawn or limit time in grassy areas.",
                      ],
          },
          {
            code: "WEED",
            displayName: "Weed",
            inSeason: weedLevel > 1.0,
            indexInfo: {
              code: "UPI",
              displayName: "Universal Pollen Index",
              value: weedLevel,
              category: weedCategory,
              indexDescription:
                weedLevel === 0
                  ? "No weed pollen detected"
                  : weedLevel <= 1.0
                    ? "Very low weed pollen levels"
                    : weedLevel <= 2.0
                      ? "Low weed pollen levels - minimal symptoms expected"
                      : weedLevel <= 3.0
                        ? "Moderate weed pollen levels - some people may experience symptoms"
                        : "High weed pollen levels - many people will experience symptoms",
              color: getColor(weedCategory),
            },
            healthRecommendations:
              weedLevel === 0
                ? ["No weed pollen detected today."]
                : weedLevel <= 1.0
                  ? ["Weed pollen levels are very low today.", "Good day for outdoor activities."]
                  : weedLevel <= 2.0
                    ? [
                        "Weed pollen levels are low but present.",
                        "Most people can enjoy outdoor activities without issues.",
                      ]
                    : [
                        "Weed pollen levels are elevated.",
                        "People with weed pollen allergies should consider taking precautions.",
                        "Ragweed season may be active - check local forecasts.",
                      ],
          },
        ],
        plantInfo: [
          {
            code: "MAPLE",
            displayName: "Maple",
            inSeason: treeLevel > 1.0 && month >= 3 && month <= 5,
          },
          {
            code: "OAK",
            displayName: "Oak",
            inSeason: treeLevel > 1.0 && month >= 3 && month <= 5,
          },
          {
            code: "BIRCH",
            displayName: "Birch",
            inSeason: treeLevel > 1.0 && month >= 3 && month <= 5,
          },
          {
            code: "GRAMINALES",
            displayName: "Grasses",
            inSeason: grassLevel > 1.0,
            indexInfo: {
              code: "UPI",
              displayName: "Universal Pollen Index",
              value: grassLevel,
              category: grassCategory,
              indexDescription:
                grassLevel <= 1.0
                  ? "Low grass pollen levels"
                  : "People with high allergy to pollen are likely to experience symptoms",
              color: getColor(grassCategory),
            },
            plantDescription: {
              type: "GRASS",
              family: "Poaceae",
              season: "Late spring, summer",
              specialColors: "None",
              specialShapes: "The leaves are alternate, long and narrow and the leaf margin is smooth.",
              crossReaction:
                "Plantain (Plantago) pollen. In addition, there may be a higher risk for food allergies like melons, oranges, tomatoes, peanuts, soy, potato, and other legumes.",
              picture: "https://storage.googleapis.com/pollen-pictures/graminales_full.jpg",
              pictureCloseup: "https://storage.googleapis.com/pollen-pictures/graminales_closeup.jpg",
            },
          },
          {
            code: "RAGWEED",
            displayName: "Ragweed",
            inSeason: weedLevel > 1.0 && month >= 8 && month <= 10,
          },
        ],
      },
    ],
    _mockData: true,
    _reason: "Google Pollen API not available",
    _location: { lat, lng },
    _generated: now.toISOString(),
  }
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
    const { lat, lng } = body

    // Validate input
    const validation = validateCoordinates(lat, lng)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400, headers })
    }

    // --------------------------- KEY CHECK & FALLBACK ---------------------------
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn("GOOGLE_MAPS_API_KEY missing – returning mock pollen data")
      return NextResponse.json(getMockPollenData(lat, lng), {
        headers: {
          ...headers,
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      })
    }

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

    console.log("🌸 Attempting Google Pollen API request...")

    const response = await fetch(`${googleUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AirBuddy/1.0",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("🌸 Pollen API response status:", response.status)

    /* ------------------------------------------------------------------
       GRACEFUL 404 HANDLING - POLLEN API NOT AVAILABLE
       ------------------------------------------------------------------ */
    if (response.status === 404) {
      console.warn(
        "Google Pollen API returned 404 – API may not be publicly available yet. " +
          "Returning enhanced mock data based on location and season.",
      )
      return NextResponse.json(getMockPollenData(lat, lng), {
        headers: {
          ...headers,
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
          "X-Pollen-Data-Source": "mock-seasonal",
        },
      })
    }

    /* ------------------------------------------------------------------
       HANDLE OTHER API ERRORS
       ------------------------------------------------------------------ */
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google Pollen API error:", response.status, errorText)

      // Check if it's an HTML error page (like 404)
      if (errorText.includes("<!DOCTYPE html>") || errorText.includes("<html")) {
        console.warn("Received HTML error page from Pollen API - falling back to mock data")
        return NextResponse.json(getMockPollenData(lat, lng), {
          headers: {
            ...headers,
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.toString(),
            "X-Pollen-Data-Source": "mock-api-error",
          },
        })
      }

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Google API limit reached. Please try again tomorrow." },
          { status: 429, headers },
        )
      }

      // For other errors, also fall back to mock data
      console.warn("Pollen API error - falling back to mock data")
      return NextResponse.json(getMockPollenData(lat, lng), {
        headers: {
          ...headers,
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
          "X-Pollen-Data-Source": "mock-fallback",
        },
      })
    }

    const data = await response.json()
    console.log("🌸 Successfully received real pollen data")

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
    console.error("Pollen API error:", error)

    // Even on error, provide mock data so the app keeps working
    const body = await request.json().catch(() => ({ lat: 37.7749, lng: -122.4194 }))
    const { lat = 37.7749, lng = -122.4194 } = body

    return NextResponse.json(getMockPollenData(lat, lng), {
      status: 200, // Return 200 with mock data instead of 500 error
      headers: {
        "X-Pollen-Data-Source": "mock-error-fallback",
      },
    })
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
