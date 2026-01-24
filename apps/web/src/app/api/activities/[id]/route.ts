import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/activities/[id] - Get a specific activity
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const activity = await prisma.activity.findUnique({
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

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    )
  }
}

// PUT /api/activities/[id] - Update an activity
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const body = await request.json()

    const activity = await prisma.activity.findUnique({
      where: { id: params.id }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.activity.update({
      where: { id: params.id },
      data: {
        type: body.type !== undefined ? body.type : activity.type,
        description: body.description !== undefined ? body.description : activity.description,
        date: body.date ? new Date(body.date) : activity.date
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
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities/[id] - Delete an activity
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: params.id }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }

    await prisma.activity.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}
