import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/health',
  '/login',
  '/register',
  '/_next',
  '/favicon.ico'
]

// Routes that require authentication (redirect to login if not authenticated)
const protectedPageRoutes = [
  '/dashboard',
  '/applications',
  '/ai-search',
  '/searches',
  '/profile',
  '/settings'
]

// Environment check - enforce auth in production
const isDevelopment = process.env.NODE_ENV === 'development'
const ENFORCE_AUTH = process.env.ENFORCE_AUTH === 'true' || !isDevelopment

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session-token')?.value
  let payload = null

  if (token) {
    payload = await verifyToken(token)
  }

  // Check authentication for protected page routes
  if (protectedPageRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (ENFORCE_AUTH && !payload) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Check authentication for API routes (except auth routes)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // In development without ENFORCE_AUTH, allow unauthenticated access
    if (!ENFORCE_AUTH && !token) {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!payload) {
      // In development without ENFORCE_AUTH, allow invalid tokens
      if (!ENFORCE_AUTH) {
        return NextResponse.next()
      }
      return NextResponse.json(
        { error: 'Invalid or expired token', message: 'Please login again' },
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
