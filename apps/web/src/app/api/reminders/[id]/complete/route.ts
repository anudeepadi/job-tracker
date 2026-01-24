import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/reminders/[id]/complete - Mark reminder as completed
export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()
    const completed = body.completed !== undefined ? body.completed : true

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
      data: { completed },
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
