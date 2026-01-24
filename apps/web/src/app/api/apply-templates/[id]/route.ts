import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/apply-templates/[id] - Get a specific template
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const template = await prisma.applyTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (template.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    )
  }
}

// PUT /api/apply-templates/[id] - Update a template
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const template = await prisma.applyTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template || template.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Template not found or unauthorized' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const updated = await prisma.applyTemplate.update({
      where: { id: params.id },
      data: {
        name: body.name !== undefined ? body.name : template.name,
        personalInfo: body.personalInfo !== undefined ? JSON.stringify(body.personalInfo) : template.personalInfo,
        coverLetter: body.coverLetter !== undefined ? body.coverLetter : template.coverLetter,
        resumePath: body.resumePath !== undefined ? body.resumePath : template.resumePath
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE /api/apply-templates/[id] - Delete a template
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const template = await prisma.applyTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template || template.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Template not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.applyTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
