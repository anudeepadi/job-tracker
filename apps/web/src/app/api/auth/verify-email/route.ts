import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Verify email with token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_token', request.url))
    }

    // Find verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verification) {
      return NextResponse.redirect(new URL('/dashboard?error=invalid_token', request.url))
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      })
      return NextResponse.redirect(new URL('/dashboard?error=token_expired', request.url))
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    })

    // Delete verification record
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    })

    return NextResponse.redirect(new URL('/dashboard?verified=true', request.url))
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.redirect(new URL('/dashboard?error=server_error', request.url))
  }
}
