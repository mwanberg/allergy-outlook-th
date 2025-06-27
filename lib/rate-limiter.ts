// Server-side rate limiting using Vercel KV (Redis)
// This provides a backup layer of protection for your API quotas

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  error?: string
}

class RateLimiter {
  private kv: any

  constructor() {
    // Initialize KV store if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      this.kv = {
        get: async (key: string) => {
          const response = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
          })
          if (!response.ok) return null
          const data = await response.json()
          return data.result
        },
        set: async (key: string, value: any, options?: { ex?: number }) => {
          const body: any = { value }
          if (options?.ex) body.ex = options.ex

          const response = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          })
          return response.ok
        },
        incr: async (key: string) => {
          const response = await fetch(`${process.env.KV_REST_API_URL}/incr/${key}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
          })
          if (!response.ok) return 1
          const data = await response.json()
          return data.result
        },
        expire: async (key: string, seconds: number) => {
          const response = await fetch(`${process.env.KV_REST_API_URL}/expire/${key}/${seconds}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
          })
          return response.ok
        },
      }
    }
  }

  private getClientId(request: Request): string {
    // Use IP address as client identifier
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
    return ip
  }

  private getDayKey(clientId: string, type: "pollen" | "geocode"): string {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    return `ratelimit:${type}:${today}:${clientId}`
  }

  private getGlobalDayKey(type: "pollen" | "geocode"): string {
    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD
    return `ratelimit:global:${type}:${today}`
  }

  async checkRateLimit(
    request: Request,
    type: "pollen" | "geocode",
    perUserLimit: number,
    globalDailyLimit: number,
  ): Promise<RateLimitResult> {
    // If KV is not available, use in-memory fallback (less reliable but better than nothing)
    if (!this.kv) {
      return this.checkRateLimitMemory(request, type, perUserLimit, globalDailyLimit)
    }

    const clientId = this.getClientId(request)
    const userKey = this.getDayKey(clientId, type)
    const globalKey = this.getGlobalDayKey(type)

    try {
      // Check global daily limit first
      const globalCount = (await this.kv.get(globalKey)) || 0
      if (globalCount >= globalDailyLimit) {
        return {
          success: false,
          limit: globalDailyLimit,
          remaining: 0,
          reset: this.getSecondsUntilMidnight(),
          error: "Global daily API limit reached. Please try again tomorrow.",
        }
      }

      // Check per-user limit
      const userCount = (await this.kv.get(userKey)) || 0
      if (userCount >= perUserLimit) {
        return {
          success: false,
          limit: perUserLimit,
          remaining: 0,
          reset: this.getSecondsUntilMidnight(),
          error: "Daily limit reached for your location. Please try again tomorrow.",
        }
      }

      // Increment counters
      const newUserCount = await this.kv.incr(userKey)
      const newGlobalCount = await this.kv.incr(globalKey)

      // Set expiration for keys (24 hours from now)
      const secondsUntilMidnight = this.getSecondsUntilMidnight()
      await this.kv.expire(userKey, secondsUntilMidnight)
      await this.kv.expire(globalKey, secondsUntilMidnight)

      return {
        success: true,
        limit: perUserLimit,
        remaining: Math.max(0, perUserLimit - newUserCount),
        reset: secondsUntilMidnight,
      }
    } catch (error) {
      console.error("Rate limiting error:", error)
      // If rate limiting fails, allow the request but log the error
      return {
        success: true,
        limit: perUserLimit,
        remaining: perUserLimit - 1,
        reset: this.getSecondsUntilMidnight(),
      }
    }
  }

  // Fallback in-memory rate limiting (resets on server restart)
  private memoryStore = new Map<string, { count: number; resetTime: number }>()

  private checkRateLimitMemory(
    request: Request,
    type: "pollen" | "geocode",
    perUserLimit: number,
    globalDailyLimit: number,
  ): RateLimitResult {
    const clientId = this.getClientId(request)
    const userKey = this.getDayKey(clientId, type)
    const globalKey = this.getGlobalDayKey(type)
    const now = Date.now()
    const midnightTonight = this.getMidnightTonight()

    // Clean up expired entries
    for (const [key, value] of this.memoryStore.entries()) {
      if (now > value.resetTime) {
        this.memoryStore.delete(key)
      }
    }

    // Check global limit
    const globalEntry = this.memoryStore.get(globalKey) || { count: 0, resetTime: midnightTonight }
    if (globalEntry.count >= globalDailyLimit) {
      return {
        success: false,
        limit: globalDailyLimit,
        remaining: 0,
        reset: Math.floor((globalEntry.resetTime - now) / 1000),
        error: "Global daily API limit reached. Please try again tomorrow.",
      }
    }

    // Check user limit
    const userEntry = this.memoryStore.get(userKey) || { count: 0, resetTime: midnightTonight }
    if (userEntry.count >= perUserLimit) {
      return {
        success: false,
        limit: perUserLimit,
        remaining: 0,
        reset: Math.floor((userEntry.resetTime - now) / 1000),
        error: "Daily limit reached for your location. Please try again tomorrow.",
      }
    }

    // Increment counters
    this.memoryStore.set(userKey, { count: userEntry.count + 1, resetTime: midnightTonight })
    this.memoryStore.set(globalKey, { count: globalEntry.count + 1, resetTime: midnightTonight })

    return {
      success: true,
      limit: perUserLimit,
      remaining: Math.max(0, perUserLimit - userEntry.count - 1),
      reset: Math.floor((midnightTonight - now) / 1000),
    }
  }

  private getSecondsUntilMidnight(): number {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return Math.floor((midnight.getTime() - now.getTime()) / 1000)
  }

  private getMidnightTonight(): number {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(24, 0, 0, 0)
    return midnight.getTime()
  }
}

export const rateLimiter = new RateLimiter()
