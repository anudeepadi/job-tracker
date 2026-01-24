import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/applications/bulk - Bulk operations on applications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, applicationIds, data } = body

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: 'applicationIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!operation) {
      return NextResponse.json(
        { error: 'operation is required (update, delete, export)' },
        { status: 400 }
      )
    }

    switch (operation) {
      case 'update':
        if (!data) {
          return NextResponse.json(
            { error: 'data is required for update operation' },
            { status: 400 }
          )
        }

        const updateResults = await Promise.allSettled(
          applicationIds.map(id =>
            prisma.application.update({
              where: { id },
              data: {
                ...data,
                // Handle status changes - create activity
                ...(data.status && {
                  // Status update will be handled by the update logic
                })
              }
            })
          )
        )

        const updated = updateResults.filter(r => r.status === 'fulfilled').length
        const failed = updateResults.filter(r => r.status === 'rejected').length

        // Create activities for status changes
        if (data.status) {
          await Promise.all(
            applicationIds.map(id =>
              prisma.activity.create({
                data: {
                  applicationId: id,
                  type: 'Status Change',
                  description: `Bulk status update to: ${data.status}`,
                  date: new Date()
                }
              }).catch(() => {}) // Ignore errors
            )
          )
        }

        return NextResponse.json({
          success: true,
          updated,
          failed,
          total: applicationIds.length
        })

      case 'delete':
        const deleteResults = await Promise.allSettled(
          applicationIds.map(id =>
            prisma.application.delete({
              where: { id }
            })
          )
        )

        const deleted = deleteResults.filter(r => r.status === 'fulfilled').length
        const deleteFailed = deleteResults.filter(r => r.status === 'rejected').length

        return NextResponse.json({
          success: true,
          deleted,
          failed: deleteFailed,
          total: applicationIds.length
        })

      case 'export':
        const applications = await prisma.application.findMany({
          where: { id: { in: applicationIds } }
        })

        // Generate CSV
        const headers = ['Company', 'Job Title', 'Status', 'Priority', 'Location', 'Applied Date', 'Source', 'Notes']
        const rows = applications.map(app => [
          app.company,
          app.jobTitle,
          app.status,
          app.priority,
          app.location || '',
          new Date(app.appliedDate).toISOString().split('T')[0],
          app.source || '',
          (app.notes || '').replace(/"/g, '""')
        ])

        const csv = [
          headers.map(h => `"${h}"`).join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`
          }
        })

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    )
  }
}
