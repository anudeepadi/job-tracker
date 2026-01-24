import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Dev-only safety: prevents accidental nukes in prod.
function assertDev() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Admin clear is disabled in production')
  }
}

export async function POST() {
  try {
    assertDev()

    // Delete in FK-safe order
    const result = await prisma.$transaction(async (tx) => {
      const reminders = await tx.reminder.deleteMany({})
      const activities = await tx.activity.deleteMany({})
      const applications = await tx.application.deleteMany({})
      const jobResults = await tx.jobResult.deleteMany({})
      const agentOutputs = await tx.agentOutput.deleteMany({})
      const jobSearches = await tx.jobSearch.deleteMany({})

      return { reminders, activities, applications, jobResults, agentOutputs, jobSearches }
    })

    return NextResponse.json({
      ok: true,
      deleted: {
        reminders: result.reminders.count,
        activities: result.activities.count,
        applications: result.applications.count,
        jobResults: result.jobResults.count,
        agentOutputs: result.agentOutputs.count,
        jobSearches: result.jobSearches.count,
      },
    })
  } catch (error) {
    console.error('Admin clear error:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

