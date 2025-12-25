import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      totalApplications,
      statusCounts,
      weeklyStats,
      monthlyStats,
      sourceStats
    ] = await Promise.all([
      prisma.application.count(),
      
      prisma.application.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      
      prisma.application.count({
        where: {
          appliedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      prisma.application.count({
        where: {
          appliedDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      prisma.application.groupBy({
        by: ['source'],
        _count: { id: true },
        where: {
          source: { not: null }
        }
      })
    ])

    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    const responseRate = totalApplications > 0 
      ? ((statusMap['Phone Screen'] || 0) + (statusMap['Technical Interview'] || 0) + 
         (statusMap['Final Interview'] || 0) + (statusMap['Offer'] || 0)) / totalApplications * 100 
      : 0

    const recentApplications = await prisma.application.findMany({
      orderBy: { appliedDate: 'desc' },
      take: 30,
      select: {
        appliedDate: true,
        status: true
      }
    })

    const timelineData = recentApplications.reduce((acc, app) => {
      const date = app.appliedDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date]++
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      totalApplications,
      statusCounts: statusMap,
      weeklyApplications: weeklyStats,
      monthlyApplications: monthlyStats,
      responseRate: Math.round(responseRate * 100) / 100,
      sourceStats: sourceStats.reduce((acc, item) => {
        if (item.source) {
          acc[item.source] = item._count.id
        }
        return acc
      }, {} as Record<string, number>),
      timelineData: Object.entries(timelineData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}