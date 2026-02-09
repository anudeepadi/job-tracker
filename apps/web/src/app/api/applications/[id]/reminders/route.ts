import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/applications/[id]/reminders - List reminders for a specific application
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify application exists and user owns it
    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        userId // Verify ownership
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const reminders = await prisma.reminder.findMany({
      where: { applicationId: params.id },
      orderBy: { dueDate: 'asc' }
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

// POST /api/applications/[id]/reminders - Create a reminder for a specific application
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.title || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, dueDate' },
        { status: 400 }
      )
    }

    // Verify application exists and user owns it
    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        userId // Verify ownership
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const reminder = await prisma.reminder.create({
      data: {
        applicationId: params.id,
        title: body.title,
        description: body.description || null,
        dueDate: new Date(body.dueDate),
        completed: false
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
