// Simple in-memory rate limiter
// For production, use Redis or a proper rate limiting service

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 100 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now()
  const key = identifier

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k]
      }
    })
  }

  const entry = store[key]

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs
    }
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs
    }
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

export function getClientIdentifier(request: Request): string {
  // Try to get user ID from headers (set by middleware)
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `ip:${ip}`
}
