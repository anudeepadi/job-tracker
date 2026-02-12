import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/job-results/bulk-import - Import multiple job results
export async function POST(request: NextRequest) {
  try {
    // Auth: userId injected by middleware via x-user-id header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobResultIds, skipDuplicates = true } = body

    if (!Array.isArray(jobResultIds) || jobResultIds.length === 0) {
      return NextResponse.json(
        { error: 'jobResultIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // Fetch all job results in one query
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

    // Batch duplicate check: fetch all existing applications matching any
    // (company, jobTitle) pair in a single query instead of N individual lookups
    const existingApps = skipDuplicates
      ? await prisma.application.findMany({
          where: {
            OR: jobResults.map((jr) => ({
              company: jr.company,
              jobTitle: jr.title,
            })),
          },
          select: { company: true, jobTitle: true },
        })
      : []

    const existingSet = new Set(
      existingApps.map((a) => `${a.company}::${a.jobTitle}`)
    )

    // Separate into importable vs skipped before entering the transaction
    const toImport: typeof jobResults = []
    const skippedIds: string[] = []

    for (const jobResult of jobResults) {
      if (skipDuplicates && jobResult.importedAsApplicationId) {
        skippedIds.push(jobResult.id)
        continue
      }
      if (skipDuplicates && existingSet.has(`${jobResult.company}::${jobResult.title}`)) {
        skippedIds.push(jobResult.id)
        continue
      }
      toImport.push(jobResult)
    }

    // Run all writes in a single transaction for atomicity
    const importedJobResultIds: string[] = []
    const createdApplicationIds: string[] = []
    const errors: Array<{ id: string; error: string }> = []

    if (toImport.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          for (const jobResult of toImport) {
            const application = await tx.application.create({
              data: {
                userId,
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
              select: { id: true },
            })

            // Link job result back to the created application
            await tx.jobResult.update({
              where: { id: jobResult.id },
              data: {
                importedAsApplicationId: application.id,
                importedAt: new Date(),
              },
            })

            importedJobResultIds.push(jobResult.id)
            createdApplicationIds.push(application.id)
          }

          // Batch create all activity records at once using application IDs
          await tx.activity.createMany({
            data: createdApplicationIds.map((appId) => ({
              applicationId: appId,
              type: 'Status Change',
              description: 'Application imported from job search',
              date: new Date(),
            })),
          })
        })
      } catch (txError) {
        // Transaction failed — all writes rolled back
        console.error('Bulk import transaction failed:', txError)
        for (const jr of toImport) {
          errors.push({
            id: jr.id,
            error: txError instanceof Error ? txError.message : 'Transaction failed',
          })
        }
        importedJobResultIds.length = 0
        createdApplicationIds.length = 0
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: jobResultIds.length,
        imported: importedJobResultIds.length,
        skipped: skippedIds.length,
        errors: errors.length,
      },
      results: {
        imported: importedJobResultIds,
        skipped: skippedIds,
        errors,
      },
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { error: 'Failed to import job results' },
      { status: 500 }
    )
  }
}
