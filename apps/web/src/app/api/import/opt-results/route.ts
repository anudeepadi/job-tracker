import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

type ParsedOptJob = {
  jobTitle: string
  jobUrl: string | null
  notes: string
}

function extractFirstUrl(text: string): string | null {
  // Very small URL detector; keeps this importer deterministic and dependency-free.
  const match = text.match(/https?:\/\/\S+/i)
  if (!match) return null
  // Trim trailing punctuation that commonly appears in markdown
  return match[0].replace(/[),.]+$/g, '')
}

function parseOptMarkdown(markdown: string): ParsedOptJob[] {
  const lines = markdown.split(/\r?\n/)
  const jobs: ParsedOptJob[] = []

  // We treat numbered lines that contain "**Title**" as job starts:
  // e.g. `1. **Entry Level - Data Scientist** ⭐`
  const titleRe = /^\s*\d+\.\s+\*\*(.+?)\*\*/

  let currentTitle: string | null = null
  let currentBlock: string[] = []

  function flush() {
    if (!currentTitle) return
    const block = currentBlock.join('\n').trim()
    const url = extractFirstUrl(block)
    jobs.push({
      jobTitle: currentTitle,
      jobUrl: url,
      notes: block,
    })
    currentTitle = null
    currentBlock = []
  }

  for (const line of lines) {
    const m = line.match(titleRe)
    if (m) {
      flush()
      currentTitle = m[1].trim()
      currentBlock = [line]
      continue
    }

    if (currentTitle) {
      // Keep a reasonably sized block to avoid huge notes if user pastes other sections.
      if (currentBlock.length < 40) currentBlock.push(line)
    }
  }

  flush()

  // De-dupe by (title + url)
  const seen = new Set<string>()
  return jobs.filter((j) => {
    const key = `${j.jobTitle}::${j.jobUrl ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// POST /api/import/opt-results - Import OPT markdown list into Applications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const markdown = typeof body?.markdown === 'string' ? body.markdown : ''

    if (!markdown.trim()) {
      return NextResponse.json({ error: 'Missing markdown' }, { status: 400 })
    }

    // Auth is optional in development (middleware may allow unauth access).
    const session = await getSession()
    const userId = session?.userId ?? null

    const parsed = parseOptMarkdown(markdown)
    if (parsed.length === 0) {
      return NextResponse.json(
        { error: 'No jobs found in markdown. Expected numbered lines like `1. **Job Title**`.' },
        { status: 400 }
      )
    }

    const createdIds: string[] = []
    let skipped = 0

    await prisma.$transaction(async (tx) => {
      for (const job of parsed) {
        // Skip duplicates: prefer URL match if present; otherwise title match for same user.
        const existing = await tx.application.findFirst({
          where: job.jobUrl
            ? { jobUrl: job.jobUrl, userId }
            : { jobTitle: job.jobTitle, userId },
          select: { id: true },
        })

        if (existing) {
          skipped++
          continue
        }

        const app = await tx.application.create({
          data: {
            company: 'Unknown',
            jobTitle: job.jobTitle,
            jobUrl: job.jobUrl,
            location: null,
            locationType: null,
            salaryMin: null,
            salaryMax: null,
            currency: 'USD',
            status: 'Saved',
            priority: 'Medium',
            source: 'OPT_Job_Search_Results.md',
            contactPerson: null,
            contactEmail: null,
            appliedDate: new Date(),
            notes: `Imported from OPT_Job_Search_Results.md\n\n${job.notes}`,
            userId,
          },
          select: { id: true },
        })

        createdIds.push(app.id)

        await tx.activity.create({
          data: {
            applicationId: app.id,
            type: 'Import',
            description: 'Imported from OPT_Job_Search_Results.md',
            date: new Date(),
          },
        })
      }
    })

    return NextResponse.json({
      ok: true,
      parsed: parsed.length,
      created: createdIds.length,
      skipped,
      createdIds,
    })
  } catch (error) {
    console.error('OPT import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import OPT results' },
      { status: 500 }
    )
  }
}

