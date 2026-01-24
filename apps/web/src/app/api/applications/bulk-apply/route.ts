import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/applications/bulk-apply - Apply to multiple jobs using saved data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationIds, templateId } = body

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: 'applicationIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Fetch applications
    const applications = await prisma.application.findMany({
      where: { id: { in: applicationIds } }
    })

    if (applications.length === 0) {
      return NextResponse.json(
        { error: 'No applications found' },
        { status: 404 }
      )
    }

    // If template is provided, fetch it
    let template = null
    if (templateId) {
      template = await prisma.applyTemplate.findUnique({
        where: { id: templateId }
      })
    }

    const results = {
      applied: [] as string[],
      errors: [] as Array<{ id: string; error: string }>
    }

    for (const application of applications) {
      try {
        // Update application status to "Applied"
        await prisma.application.update({
          where: { id: application.id },
          data: { status: 'Applied' }
        })

        // Create activity
        await prisma.activity.create({
          data: {
            applicationId: application.id,
            type: 'Status Change',
            description: template
              ? `Applied using template: ${template.name}`
              : 'Bulk applied to job',
            date: new Date()
          }
        })

        results.applied.push(application.id)
      } catch (error) {
        console.error(`Error applying to ${application.id}:`, error)
        results.errors.push({
          id: application.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: applicationIds.length,
        applied: results.applied.length,
        errors: results.errors.length
      },
      results
    })
  } catch (error) {
    console.error('Error in bulk apply:', error)
    return NextResponse.json(
      { error: 'Failed to apply to jobs' },
      { status: 500 }
    )
  }
}
