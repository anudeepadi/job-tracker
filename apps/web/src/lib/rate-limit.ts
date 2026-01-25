import { NextRequest } from 'next/server'

// =============================================================================
// In-Memory Rate Limiter
// =============================================================================
// Note: For production, consider using Redis or a database-backed solution
// for distributed rate limiting across multiple server instances.

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the window
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number // Timestamp when the limit resets
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store: identifier -> rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Lazy cleanup: clean up expired entries during rate limit checks
// This avoids issues with setInterval in serverless environments
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes

function cleanupIfNeeded() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }
  lastCleanup = now
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Get a unique identifier for the client making the request
 * Uses IP address, or falls back to a user ID if available
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP address from headers (common in production with proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  // Optionally include user ID if authenticated
  const userId = request.headers.get('x-user-id')
  
  // Combine IP and user ID for more accurate rate limiting
  // If user is authenticated, use user ID; otherwise use IP
  return userId ? `user:${userId}` : `ip:${ip}`
}

/**
 * Check if a request should be allowed based on rate limits
 * 
 * @param identifier - Unique identifier for the client (from getClientIdentifier)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining requests
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Perform lazy cleanup if needed
  cleanupIfNeeded()
  
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  // If no entry exists or the window has expired, create a new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(identifier, newEntry)
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Entry exists and window is still active
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Increment count and allow request
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

/**
 * Get current rate limit status for an identifier
 * Useful for debugging or status checks
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const entry = rateLimitStore.get(identifier)
  const now = Date.now()

  if (!entry || entry.resetTime < now) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    }
  }

  return {
    allowed: entry.count < config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  }
}

/**
 * Clear all rate limit entries
 * Useful for testing or maintenance
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear()
}
