import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type IngestJobResult = {
  title: string
  company: string
  location?: string
  sourceUrl?: string
  applyUrl?: string
  postedDate?: string
  description?: string
  salary?: string
  jobType?: string
  remote?: boolean
}

type IngestRequest = {
  role: string
  location?: string
  numResults?: number
  source?: string // e.g. "LinkedIn"
  filters?: Record<string, unknown>
  results: IngestJobResult[]
}

function normalizeUrl(url?: string) {
  if (!url) return undefined
  const trimmed = url.trim()
  return trimmed.length ? trimmed : undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IngestRequest

    if (!body?.role || typeof body.role !== 'string') {
      return NextResponse.json({ error: 'role is required' }, { status: 400 })
    }
    if (!Array.isArray(body.results)) {
      return NextResponse.json({ error: 'results must be an array' }, { status: 400 })
    }

    const search = await prisma.jobSearch.create({
      data: {
        role: body.role,
        location: body.location || null,
        numResults: body.numResults ?? body.results.length ?? 10,
        status: 'completed',
        completedAt: new Date(),
        agentOutputs: {
          create: {
            agentType: 'playwriter_linkedin',
            prompt: `role=${body.role} location=${body.location ?? ''}`,
            output: `Ingested ${body.results.length} results`,
            metadata: JSON.stringify({
              source: body.source ?? 'LinkedIn',
              filters: body.filters ?? {},
            }),
          },
        },
      },
      select: { id: true },
    })

    // Dedupe within this ingest call by URL-ish identity
    const seen = new Set<string>()
    const toInsert: IngestJobResult[] = []

    for (const r of body.results) {
      const sourceUrl = normalizeUrl(r.sourceUrl)
      const applyUrl = normalizeUrl(r.applyUrl)
      const key = (sourceUrl || applyUrl || `${r.company}::${r.title}::${r.location ?? ''}`).toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      toInsert.push(r)
    }

    const existing = await prisma.jobResult.findMany({
      where: {
        searchId: search.id,
      },
      select: {
        sourceUrl: true,
        applyUrl: true,
        company: true,
        title: true,
        location: true,
      },
    })

    const existingKeys = new Set(
      existing.map((e) =>
        (normalizeUrl(e.sourceUrl) ||
          normalizeUrl(e.applyUrl) ||
          `${e.company}::${e.title}::${e.location ?? ''}`).toLowerCase()
      )
    )

    const createData = toInsert
      .filter((r) => {
        const key = (
          normalizeUrl(r.sourceUrl) ||
          normalizeUrl(r.applyUrl) ||
          `${r.company}::${r.title}::${r.location ?? ''}`
        ).toLowerCase()
        return !existingKeys.has(key)
      })
      .map((r) => ({
        searchId: search.id,
        title: r.title,
        company: r.company,
        location: r.location ?? null,
        salary: r.salary ?? null,
        description: r.description ?? null,
        applyUrl: normalizeUrl(r.applyUrl) ?? null,
        sourceUrl: normalizeUrl(r.sourceUrl) ?? null,
        postedDate: r.postedDate ?? null,
        jobType: r.jobType ?? null,
        remote: typeof r.remote === 'boolean' ? r.remote : null,
      }))

    if (createData.length) {
      // createMany skips duplicates only on unique constraints; we don't have one here,
      // so we pre-filtered above.
      await prisma.jobResult.createMany({ data: createData })
    }

    return NextResponse.json({
      searchId: search.id,
      insertedCount: createData.length,
      dedupedCount: body.results.length - createData.length,
    })
  } catch (error) {
    console.error('Error ingesting agent job search:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

