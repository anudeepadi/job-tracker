import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reminders/[id] - Get a specific reminder
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
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

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(reminder)
  } catch (error) {
    console.error('Error fetching reminder:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminder' },
      { status: 500 }
    )
  }
}

// PUT /api/reminders/[id] - Update a reminder
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()

    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id }
    })

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.reminder.update({
      where: { id: params.id },
      data: {
        title: body.title !== undefined ? body.title : reminder.title,
        description: body.description !== undefined ? body.description : reminder.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : reminder.dueDate,
        completed: body.completed !== undefined ? body.completed : reminder.completed
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders/[id] - Delete a reminder
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id }
    })

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      )
    }

    await prisma.reminder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}
