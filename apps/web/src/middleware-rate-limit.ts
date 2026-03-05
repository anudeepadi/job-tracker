import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

// Rate limit configuration per endpoint
const rateLimitConfig: Record<
  string,
  { windowMs: number; maxRequests: number }
> = {
  "/api/applications": { windowMs: 60000, maxRequests: 100 }, // 100 per minute
  "/api/job-search": { windowMs: 60000, maxRequests: 20 }, // 20 per minute
  "/api/job-results/bulk-import": { windowMs: 60000, maxRequests: 10 }, // 10 per minute
  default: { windowMs: 60000, maxRequests: 100 }, // Default: 100 per minute
};

export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Find matching rate limit config
  const config =
    Object.entries(rateLimitConfig).find(([path]) =>
      pathname.startsWith(path),
    )?.[1] || rateLimitConfig.default;

  const identifier = getClientIdentifier(request);
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Please try again after ${new Date(result.resetTime).toISOString()}`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.resetTime.toString(),
          "Retry-After": Math.ceil(
            (result.resetTime - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  // Add rate limit headers to response
  const response = await handler();
  response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

  return response;
}
