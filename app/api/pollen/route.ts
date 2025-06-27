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

// Mock data based on your original Google Maps Pollen API structure
const getMockPollenData = () => ({
  regionCode: "US",
  dailyInfo: [
    {
      date: {
        year: 2025,
        month: 6,
        day: 27,
      },
      pollenTypeInfo: [
        {
          code: "GRASS",
          displayName: "Grass",
          inSeason: true,
          indexInfo: {
            code: "UPI",
            displayName: "Universal Pollen Index",
            value: 2,
            category: "Low",
            indexDescription: "People with high allergy to pollen are likely to experience symptoms",
            color: {
              red: 0.5176471,
              green: 0.8117647,
              blue: 0.2,
            },
          },
          healthRecommendations: [
            "It's a good day for outdoor activities since pollen levels are low.",
            "Do you know which plants cause your pollen allergy? Check out the pollen data to be prepared.",
          ],
        },
        {
          code: "TREE",
          displayName: "Tree",
          inSeason: false,
          indexInfo: {
            code: "UPI",
            displayName: "Universal Pollen Index",
            value: 1,
            category: "Very Low",
            indexDescription: "Minimal pollen detected",
            color: {
              red: 0.2,
              green: 0.6,
              blue: 0.9,
            },
          },
          healthRecommendations: ["Tree pollen levels are very low today.", "Great weather for outdoor activities!"],
        },
        {
          code: "WEED",
          displayName: "Weed",
          inSeason: false,
          indexInfo: {
            code: "UPI",
            displayName: "Universal Pollen Index",
            value: 0,
            category: "None",
            indexDescription: "No pollen detected",
            color: {
              red: 0.5,
              green: 0.5,
              blue: 0.5,
            },
          },
          healthRecommendations: ["No weed pollen detected today."],
        },
      ],
      plantInfo: [
        {
          code: "MAPLE",
          displayName: "Maple",
        },
        {
          code: "ELM",
          displayName: "Elm",
        },
        {
          code: "COTTONWOOD",
          displayName: "Cottonwood",
        },
        {
          code: "ALDER",
          displayName: "Alder",
        },
        {
          code: "BIRCH",
          displayName: "Birch",
        },
        {
          code: "ASH",
          displayName: "Ash",
        },
        {
          code: "PINE",
          displayName: "Pine",
        },
        {
          code: "OAK",
          displayName: "Oak",
        },
        {
          code: "JUNIPER",
          displayName: "Juniper",
        },
        {
          code: "GRAMINALES",
          displayName: "Grasses",
          inSeason: true,
          indexInfo: {
            code: "UPI",
            displayName: "Universal Pollen Index",
            value: 2,
            category: "Low",
            indexDescription: "People with high allergy to pollen are likely to experience symptoms",
            color: {
              red: 0.5176471,
              green: 0.8117647,
              blue: 0.2,
            },
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
        },
      ],
    },
  ],
})

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
      // In local/preview we don't have real secrets; respond with mock data
      console.warn("GOOGLE_MAPS_API_KEY missing – returning mock pollen data so the preview keeps working.")
      return NextResponse.json(getMockPollenData(), {
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

    const response = await fetch(`${googleUrl}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AirBuddy/1.0",
      },
      body: JSON.stringify(requestBody),
    })

    /* ------------------------------------------------------------------
       GRACEFUL 404 HANDLING
       ------------------------------------------------------------------ */
    if (response.status === 404) {
      console.warn(
        "Google Pollen API returned 404 – API may be disabled or not whitelisted. " +
          "Returning mock data so the preview keeps working.",
      )
      return NextResponse.json(getMockPollenData(), {
        headers: {
          ...headers,
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.reset.toString(),
        },
      })
    }

    /* ------------------------------------------------------------------ */
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google Pollen API error:", response.status, errorText)

      if (response.status === 429) {
        return NextResponse.json(
          { error: "Google API limit reached. Please try again tomorrow." },
          { status: 429, headers },
        )
      }

      throw new Error(`Google Pollen API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data, {
      headers: {
        ...headers,
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        "X-RateLimit-Reset": rateLimit.reset.toString(),
      },
    })
  } catch (error) {
    console.error("Pollen API error:", error)
    return NextResponse.json({ error: "Failed to fetch pollen data" }, { status: 500 })
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
