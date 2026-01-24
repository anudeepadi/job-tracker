import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const jobResult = await prisma.jobResult.findUnique({
      where: { id: params.id },
      include: { search: true },
    })

    if (!jobResult) {
      return NextResponse.json({ error: 'Job result not found' }, { status: 404 })
    }

    if (jobResult.importedAsApplicationId) {
      return NextResponse.json(
        { error: 'Job result already imported', applicationId: jobResult.importedAsApplicationId },
        { status: 409 }
      )
    }

    const application = await prisma.application.create({
      data: {
        company: jobResult.company,
        jobTitle: jobResult.title,
        jobUrl: jobResult.applyUrl || jobResult.sourceUrl || null,
        location: jobResult.location || null,
        locationType: jobResult.remote ? 'Remote' : null,
        salaryMin: null,
        salaryMax: null,
        currency: 'USD',
        status: 'Saved',
        priority: 'Medium',
        source: 'LinkedIn',
        contactPerson: null,
        contactEmail: null,
        appliedDate: new Date(),
        notes: [
          jobResult.postedDate ? `Posted: ${jobResult.postedDate}` : null,
          jobResult.jobType ? `Type: ${jobResult.jobType}` : null,
          jobResult.salary ? `Salary: ${jobResult.salary}` : null,
          jobResult.description ? `Description:\n${jobResult.description}` : null,
          jobResult.sourceUrl ? `Source URL: ${jobResult.sourceUrl}` : null,
        ]
          .filter(Boolean)
          .join('\n\n'),
        aiSearchId: jobResult.searchId,
      },
      select: { id: true, status: true },
    })

    await prisma.jobResult.update({
      where: { id: jobResult.id },
      data: {
        importedAsApplicationId: application.id,
        importedAt: new Date(),
      },
    })

    await prisma.activity.create({
      data: {
        applicationId: application.id,
        type: 'Import',
        description: `Imported from search "${jobResult.search.role}" (${jobResult.search.location ?? 'no location'})`,
        date: new Date(),
      },
    })

    return NextResponse.json({ applicationId: application.id }, { status: 201 })
  } catch (error) {
    console.error('Error importing job result:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

