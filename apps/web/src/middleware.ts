import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/login',
  '/register'
]

// In development, allow unauthenticated access to API routes
// In production, these should require authentication
const isDevelopment = process.env.NODE_ENV === 'development'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check authentication for API routes (except auth routes)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const token = request.cookies.get('session-token')?.value

    // In development, allow unauthenticated access but still try to extract user info if token exists
    if (isDevelopment && !token) {
      // Allow request to proceed without authentication in development
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)

    if (!payload) {
      // In development, allow request to proceed even with invalid token
      if (isDevelopment) {
        return NextResponse.next()
      }
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Add user info to request headers for API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId)
    requestHeaders.set('x-user-email', payload.email)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
