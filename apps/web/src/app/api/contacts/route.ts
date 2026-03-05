import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createRequestLogger } from '@/lib/logger'
import { parseBody } from '@/lib/validations/common'
import { createContactSchema } from '@/lib/validations/contacts'

const ENDPOINT = '/api/contacts'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createRequestLogger(ENDPOINT, userId)
    log.info({ method: 'GET' }, 'Request received')

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { userId }

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { company: { contains: query } },
        { role: { contains: query } },
        { email: { contains: query } },
      ]
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const durationMs = Date.now() - startTime
    log.info(
      { method: 'GET', statusCode: 200, durationMs, total: contacts.length },
      'Response sent',
    )

    return NextResponse.json({ contacts })
  } catch (error) {
    const durationMs = Date.now() - startTime
    const log = createRequestLogger(ENDPOINT)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    log.error(
      { method: 'GET', statusCode: 500, durationMs, error: errorMessage },
      'Request failed',
    )

    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const log = createRequestLogger(ENDPOINT, userId)
    log.info({ method: 'POST' }, 'Request received')

    const parsed = await parseBody(request, createContactSchema)
    if ('error' in parsed) return parsed.error
    const body = parsed.data

    const contact = await prisma.contact.create({
      data: {
        userId,
        name: body.name,
        company: body.company,
        role: body.role,
        email: body.email || undefined,
        linkedinUrl: body.linkedinUrl || undefined,
        phone: body.phone,
        notes: body.notes,
        source: body.source,
      },
    })

    const durationMs = Date.now() - startTime
    log.info(
      { method: 'POST', statusCode: 201, durationMs, contactId: contact.id },
      'Response sent',
    )

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    const durationMs = Date.now() - startTime
    const log = createRequestLogger(ENDPOINT)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    log.error(
      { method: 'POST', statusCode: 500, durationMs, error: errorMessage },
      'Request failed',
    )

    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 },
    )
  }
}
