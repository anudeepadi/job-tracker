import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import { prisma } from '@/lib/prisma'
import { buildResumeFilename, generateOnePageResume } from '@/lib/resume'
import { getSession } from '@/lib/auth'
import { tailorResumeToJob, type ResumeInventoryV1 } from '@/lib/resume-tailor'

export const runtime = 'nodejs'

const TEMPLATE_DIR =
  process.env.RESUME_TEMPLATE_DIR ||
  path.resolve(process.cwd(), '..', '..', 'data', 'resume-template')

const GENERATED_ROOT =
  process.env.RESUME_OUTPUT_DIR ||
  path.resolve(process.cwd(), '..', '..', 'data', 'generated-resumes')

function extractJobDescriptionFromNotes(notes: string | null | undefined): string {
  if (!notes) return ''
  const marker = '---JOB_DESCRIPTION---'
  const idx = notes.indexOf(marker)
  if (idx === -1) return ''
  return notes.slice(idx + marker.length).trim()
}

async function loadResumeInventory(userId: string): Promise<ResumeInventoryV1 | null> {
  const pref = await prisma.userPreference.findFirst({
    where: { userId, key: 'resume_inventory_v1' },
    select: { value: true },
  })
  if (!pref?.value) return null
  try {
    return JSON.parse(pref.value) as ResumeInventoryV1
  } catch {
    return null
  }
}

export async function POST(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      select: { id: true, company: true, jobTitle: true, notes: true, userId: true },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const session = await getSession()
    const effectiveUserId = session?.userId ?? application.userId ?? null
    const inventory = effectiveUserId ? await loadResumeInventory(effectiveUserId) : null

    if (!inventory) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Resume inventory is not configured. Go to Settings → (Resume Inventory) and paste your curated inventory JSON first.',
        },
        { status: 400 }
      )
    }

    const jobDescription = extractJobDescriptionFromNotes(application.notes)
    const tailored = tailorResumeToJob({
      jobTitle: application.jobTitle,
      jobDescription,
      inventory,
    })

    const dateISO = new Date().toISOString().slice(0, 10)
    const fileName = buildResumeFilename({
      company: application.company,
      role: application.jobTitle,
      dateISO,
    })

    const outDir = path.join(GENERATED_ROOT, application.id)
    const result = await generateOnePageResume({
      templateDir: TEMPLATE_DIR,
      outDir,
      outFileName: fileName,
      entryTexFile: 'tailored.tex',
      tex: tailored.tex,
    })

    await prisma.activity.create({
      data: {
        applicationId: application.id,
        type: 'Resume',
        description: `Generated 1-page ATS resume (${tailored.roleTrack}): ${fileName} (removed ${result.removedItems} bullet(s))`,
        date: new Date(),
      },
    })

    return NextResponse.json({
      ok: true,
      fileName,
      pages: result.pages,
      removedItems: result.removedItems,
      roleTrack: tailored.roleTrack,
      topKeywords: tailored.debug.topKeywords,
      downloadUrl: `/api/applications/${application.id}/resume/download?file=${encodeURIComponent(fileName)}`,
    })
  } catch (error) {
    console.error('Resume generation error:', error)
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate resume. Ensure latexmk is installed and template exists.',
      },
      { status: 500 }
    )
  }
}

