import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'appliedDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (search) {
      where.OR = [
        { company: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          reminders: {
            where: { completed: false },
            orderBy: { dueDate: 'asc' },
            take: 3
          }
        }
      }),
      prisma.application.count({ where })
    ])

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const application = await prisma.application.create({
      data: {
        company: body.company,
        jobTitle: body.jobTitle,
        jobUrl: body.jobUrl,
        location: body.location,
        locationType: body.locationType,
        salaryMin: body.salaryMin,
        salaryMax: body.salaryMax,
        currency: body.currency || 'USD',
        status: body.status || 'Applied',
        priority: body.priority || 'Medium',
        source: body.source,
        contactPerson: body.contactPerson,
        contactEmail: body.contactEmail,
        appliedDate: new Date(body.appliedDate),
        notes: body.notes
      },
      include: {
        activities: true,
        reminders: true
      }
    })

    await prisma.activity.create({
      data: {
        applicationId: application.id,
        type: 'Status Change',
        description: `Application created with status: ${application.status}`,
        date: new Date()
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    )
  }
}