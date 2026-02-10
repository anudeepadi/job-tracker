import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cron job to cleanup expired sessions
 * This should be called periodically (e.g., daily) by a cron service
 *
 * Authorization: Requires CRON_SECRET environment variable
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Delete expired sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    })

    // Delete expired email verifications
    const deletedVerifications = await prisma.emailVerification.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    })

    // Delete expired password resets
    const deletedResets = await prisma.passwordReset.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: now,
            },
          },
          {
            used: true,
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days old
            },
          },
        ],
      },
    })

    return NextResponse.json({
      success: true,
      cleaned: {
        sessions: deletedSessions.count,
        emailVerifications: deletedVerifications.count,
        passwordResets: deletedResets.count,
      },
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for manual testing (only in development)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  // In development, allow GET without auth for testing
  return POST(request)
}
