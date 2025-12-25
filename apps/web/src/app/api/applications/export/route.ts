import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: { appliedDate: 'desc' }
    })

    const csvHeaders = [
      'Company',
      'Job Title',
      'Status',
      'Priority',
      'Location',
      'Location Type',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Source',
      'Contact Person',
      'Contact Email',
      'Applied Date',
      'Job URL',
      'Notes'
    ].join(',')

    const csvRows = applications.map(app => [
      `"${app.company}"`,
      `"${app.jobTitle}"`,
      `"${app.status}"`,
      `"${app.priority}"`,
      `"${app.location || ''}"`,
      `"${app.locationType || ''}"`,
      app.salaryMin || '',
      app.salaryMax || '',
      `"${app.currency || 'USD'}"`,
      `"${app.source || ''}"`,
      `"${app.contactPerson || ''}"`,
      `"${app.contactEmail || ''}"`,
      app.appliedDate.toISOString().split('T')[0],
      `"${app.jobUrl || ''}"`,
      `"${(app.notes || '').replace(/"/g, '""')}"`
    ].join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="job-applications-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting applications:', error)
    return NextResponse.json(
      { error: 'Failed to export applications' },
      { status: 500 }
    )
  }
}