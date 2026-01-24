import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/job-results/bulk-import - Import multiple job results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobResultIds, skipDuplicates = true } = body

    if (!Array.isArray(jobResultIds) || jobResultIds.length === 0) {
      return NextResponse.json(
        { error: 'jobResultIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Fetch all job results
    const jobResults = await prisma.jobResult.findMany({
      where: {
        id: { in: jobResultIds }
      },
      include: { search: true }
    })

    if (jobResults.length === 0) {
      return NextResponse.json(
        { error: 'No job results found' },
        { status: 404 }
      )
    }

    const results = {
      imported: [] as string[],
      skipped: [] as string[],
      errors: [] as Array<{ id: string; error: string }>
    }

    for (const jobResult of jobResults) {
      try {
        // Skip if already imported and skipDuplicates is true
        if (skipDuplicates && jobResult.importedAsApplicationId) {
          results.skipped.push(jobResult.id)
          continue
        }

        // Check for duplicate by company and title
        if (skipDuplicates) {
          const existing = await prisma.application.findFirst({
            where: {
              company: jobResult.company,
              jobTitle: jobResult.title
            }
          })

          if (existing) {
            results.skipped.push(jobResult.id)
            continue
          }
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
            source: 'AI Search',
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
            type: 'Status Change',
            description: `Application imported from job search`,
            date: new Date(),
          },
        })

        results.imported.push(jobResult.id)
      } catch (error) {
        console.error(`Error importing job result ${jobResult.id}:`, error)
        results.errors.push({
          id: jobResult.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: jobResultIds.length,
        imported: results.imported.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      results
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { error: 'Failed to import job results' },
      { status: 500 }
    )
  }
}
