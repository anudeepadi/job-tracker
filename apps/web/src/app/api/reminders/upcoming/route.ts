import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reminders/upcoming - Get upcoming reminders across all applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '50')

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    const reminders = await prisma.reminder.findMany({
      where: {
        completed: false,
        dueDate: {
          gte: startDate,
          lte: endDate
        }
      },
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

    return NextResponse.json({ reminders, count: reminders.length })
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming reminders' },
      { status: 500 }
    )
  }
}
