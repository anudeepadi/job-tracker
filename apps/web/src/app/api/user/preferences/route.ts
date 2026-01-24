import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/user/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const preferences = await prisma.userPreference.findMany({
      where: { userId: session.userId }
    })

    // Convert to object
    const prefs: Record<string, string> = {}
    preferences.forEach(p => {
      prefs[p.key] = p.value
    })

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// POST /api/user/preferences - Save user preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const preferences = body.preferences || body

    // Upsert each preference
    await Promise.all(
      Object.entries(preferences).map(([key, value]) =>
        prisma.userPreference.upsert({
          where: {
            userId_key: {
              userId: session.userId,
              key
            }
          },
          update: {
            value: JSON.stringify(value)
          },
          create: {
            userId: session.userId,
            key,
            value: JSON.stringify(value)
          }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving preferences:', error)
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    )
  }
}
