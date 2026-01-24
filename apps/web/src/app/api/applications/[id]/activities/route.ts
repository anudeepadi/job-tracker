import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/applications/[id]/activities - List activities for a specific application
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const type = searchParams.get('type')

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: params.id }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { applicationId: params.id }
    if (type) {
      where.type = type
    }

    const activities = await prisma.activity.findMany({
      where,
      take: limit,
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// POST /api/applications/[id]/activities - Manually create an activity
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()

    if (!body.type || !body.description || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, description, date' },
        { status: 400 }
      )
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: params.id }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const activity = await prisma.activity.create({
      data: {
        applicationId: params.id,
        type: body.type,
        description: body.description,
        date: new Date(body.date)
      }
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
