import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, clearSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (session) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: {
          userId: session.userId,
          token: (await request.cookies.get('session-token'))?.value || ''
        }
      })
    }

    await clearSession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging out:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
