import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs/promises'

export const runtime = 'nodejs'

const GENERATED_ROOT =
  process.env.RESUME_OUTPUT_DIR ||
  path.resolve(process.cwd(), '..', '..', 'data', 'generated-resumes')

function safeFileName(name: string) {
  // Prevent path traversal
  const base = path.basename(name)
  if (base !== name) return null
  if (!base.toLowerCase().endsWith('.pdf')) return null
  if (base.length > 200) return null
  return base
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { searchParams } = new URL(request.url)
  const file = searchParams.get('file') || ''
  const safe = safeFileName(file)
  if (!safe) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 })
  }

  try {
    const pdfPath = path.join(GENERATED_ROOT, params.id, safe)
    const pdf = await fs.readFile(pdfPath)
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safe}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Resume download error:', error)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}

