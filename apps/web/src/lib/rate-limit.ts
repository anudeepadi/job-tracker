import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// In-Memory Rate Limiter (Factory Pattern)
// =============================================================================
// Note: For production, consider using Redis or a database-backed solution
// for distributed rate limiting across multiple server instances.

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RateLimitOptions {
  readonly interval: number  // Time window in milliseconds
  readonly limit: number     // Maximum requests allowed in the window
}

interface RateLimitCheckResult {
  readonly success: boolean
  readonly remaining: number
  readonly retryAfter: number  // Seconds until the limit resets (0 if not limited)
}

interface RateLimiter {
  readonly check: (key: string) => RateLimitCheckResult
}

interface RateLimitEntry {
  readonly count: number
  readonly resetTime: number
}

// -----------------------------------------------------------------------------
// Factory: rateLimit
// -----------------------------------------------------------------------------

/**
 * Create a new rate limiter instance with the given options.
 *
 * Each limiter maintains its own Map of entries, keyed by an arbitrary string
 * (e.g. IP address or user ID). Expired entries are cleaned up lazily on each
 * `check()` call to prevent memory leaks.
 *
 * @example
 * ```ts
 * const authLimiter = rateLimit({ interval: 60_000, limit: 5 });
 * const { success, retryAfter } = authLimiter.check(ip);
 * if (!success) {
 *   return rateLimitResponse(retryAfter);
 * }
 * ```
 */
export function rateLimit(options: RateLimitOptions): RateLimiter {
  const { interval, limit } = options
  const entries = new Map<string, RateLimitEntry>()

  function cleanupExpired(now: number): void {
    for (const [key, entry] of entries) {
      if (entry.resetTime <= now) {
        entries.delete(key)
      }
    }
  }

  function check(key: string): RateLimitCheckResult {
    const now = Date.now()

    // Clean up expired entries to prevent memory leaks
    cleanupExpired(now)

    const existing = entries.get(key)

    // No entry or expired window — start fresh
    if (!existing || existing.resetTime <= now) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + interval,
      }
      entries.set(key, newEntry)

      return {
        success: true,
        remaining: limit - 1,
        retryAfter: 0,
      }
    }

    // Window still active — check if under the limit
    if (existing.count < limit) {
      const updatedEntry: RateLimitEntry = {
        count: existing.count + 1,
        resetTime: existing.resetTime,
      }
      entries.set(key, updatedEntry)

      return {
        success: true,
        remaining: limit - updatedEntry.count,
        retryAfter: 0,
      }
    }

    // Rate limit exceeded
    const retryAfterMs = existing.resetTime - now
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000)

    return {
      success: false,
      remaining: 0,
      retryAfter: retryAfterSeconds,
    }
  }

  return { check }
}

// -----------------------------------------------------------------------------
// Helper: rateLimitResponse
// -----------------------------------------------------------------------------

/**
 * Return a 429 Too Many Requests response with a Retry-After header.
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  )
}

// =============================================================================
// Legacy API (backward compatibility)
// =============================================================================
// The functions below preserve the original API used by middleware-rate-limit.ts
// and applications/route.ts. New code should prefer the factory API above.

interface LegacyRateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface LegacyRateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

interface LegacyRateLimitEntry {
  count: number
  resetTime: number
}

const legacyStore = new Map<string, LegacyRateLimitEntry>()

let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000

function legacyCleanupIfNeeded(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }
  lastCleanup = now

  for (const [key, entry] of legacyStore) {
    if (entry.resetTime < now) {
      legacyStore.delete(key)
    }
  }
}

/**
 * Legacy rate limit check — kept for backward compatibility.
 * New code should use the `rateLimit()` factory function instead.
 */
export async function checkRateLimit(
  identifier: string,
  config: LegacyRateLimitConfig
): Promise<LegacyRateLimitResult> {
  legacyCleanupIfNeeded()

  const now = Date.now()
  const entry = legacyStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    const newEntry: LegacyRateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    legacyStore.set(identifier, newEntry)

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    }
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  const updatedEntry: LegacyRateLimitEntry = {
    count: entry.count + 1,
    resetTime: entry.resetTime,
  }
  legacyStore.set(identifier, updatedEntry)

  return {
    allowed: true,
    remaining: config.maxRequests - updatedEntry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get a unique identifier for the client making the request.
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'

  const userId = request.headers.get('x-user-id')

  return userId ? `user:${userId}` : `ip:${ip}`
}

export function resetRateLimit(identifier: string): void {
  legacyStore.delete(identifier)
}

export function clearAllRateLimits(): void {
  legacyStore.clear()
}
