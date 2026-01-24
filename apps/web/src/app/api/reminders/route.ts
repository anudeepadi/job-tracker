import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reminders - List all reminders with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const completed = searchParams.get('completed')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (applicationId) {
      where.applicationId = applicationId
    }

    if (completed !== null) {
      where.completed = completed === 'true'
    }

    if (upcoming) {
      where.dueDate = { gte: new Date() }
      where.completed = false
    }

    const reminders = await prisma.reminder.findMany({
      where,
      take: limit,
      orderBy: { dueDate: 'asc' },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.applicationId || !body.title || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, title, dueDate' },
        { status: 400 }
      )
    }

    // Verify application exists
    const application = await prisma.application.findUnique({
      where: { id: body.applicationId }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const reminder = await prisma.reminder.create({
      data: {
        applicationId: body.applicationId,
        title: body.title,
        description: body.description || null,
        dueDate: new Date(body.dueDate),
        completed: false
      },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}
