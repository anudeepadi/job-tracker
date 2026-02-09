// =============================================================================
// Health Check Endpoint
// =============================================================================
// Used by Docker health checks and monitoring systems to verify service status
// Checks database connectivity and application availability

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma Client (with connection pooling)
const prisma = new PrismaClient({
  errorFormat: "minimal",
});

/**
 * Health check endpoint
 * Tests database connectivity and returns service status
 *
 * Returns:
 *   200 OK - Service is healthy
 *   503 Service Unavailable - Service is unhealthy
 *
 * Response format:
 * {
 *   "status": "healthy" | "unhealthy",
 *   "service": "next-web-app",
 *   "timestamp": "2025-02-06T...",
 *   "database": {
 *     "connected": true | false,
 *     "latency_ms": number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();

    // Test database connectivity
    let databaseHealthy = false;
    let dbLatency = 0;

    try {
      // Execute a simple query to verify database connection
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
      dbLatency = Date.now() - startTime;
    } catch (dbError) {
      console.error("[HEALTH] Database connection failed:", dbError);
      databaseHealthy = false;
      dbLatency = Date.now() - startTime;
    }

    // Determine overall health status
    const isHealthy = databaseHealthy;
    const statusCode = isHealthy ? 200 : 503;

    // Build response
    const response = {
      status: isHealthy ? "healthy" : "unhealthy",
      service: "next-web-app",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          connected: databaseHealthy,
          latency_ms: dbLatency,
        },
        node: {
          version: process.version,
          memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      },
    };

    return NextResponse.json(response, {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        // Cache-Control: don't cache health checks
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "true",
      },
    });
  } catch (error) {
    console.error("[HEALTH] Unexpected error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        service: "next-web-app",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "true",
        },
      }
    );
  } finally {
    // Don't disconnect Prisma on every request in production
    // Only disconnect during graceful shutdown
  }
}

/**
 * HEAD endpoint for basic connectivity check (lightweight)
 * Useful for simple monitoring that doesn't need response body
 */
export async function HEAD(request: NextRequest) {
  try {
    // Simple connectivity test without response body
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[HEALTH] HEAD check failed:", error);
    return new NextResponse(null, { status: 503 });
  }
}
