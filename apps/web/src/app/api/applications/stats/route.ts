import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get userId from middleware-injected header
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const [
      totalApplications,
      statusCounts,
      weeklyStats,
      monthlyStats,
      sourceStats
    ] = await Promise.all([
      prisma.application.count({
        where: { userId }
      }),

      prisma.application.groupBy({
        by: ['status'],
        _count: { id: true },
        where: { userId }
      }),

      prisma.application.count({
        where: {
          userId,
          appliedDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      prisma.application.count({
        where: {
          userId,
          appliedDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      prisma.application.groupBy({
        by: ['source'],
        _count: { id: true },
        where: {
          userId,
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

    // Get applications for the last 90 days for better analytics
    const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const recentApplications = await prisma.application.findMany({
      where: {
        userId,
        appliedDate: { gte: threeMonthsAgo }
      },
      orderBy: { appliedDate: 'desc' },
      select: {
        appliedDate: true,
        status: true,
        source: true,
        salaryMin: true,
        salaryMax: true,
        currency: true
      }
    })

    // Timeline data by day
    const timelineData = recentApplications.reduce((acc, app) => {
      const date = app.appliedDate.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date]++
      return acc
    }, {} as Record<string, number>)

    // Weekly aggregated data for last 12 weeks
    const weeklyData = recentApplications.reduce((acc, app) => {
      const weekStart = new Date(app.appliedDate)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0]
      if (!acc[weekKey]) {
        acc[weekKey] = 0
      }
      acc[weekKey]++
      return acc
    }, {} as Record<string, number>)

    // Funnel data: Applied → Screen → Interview → Offer
    const funnelData = {
      applied: totalApplications,
      screen: (statusMap['Phone Screen'] || 0) + (statusMap['Online Assessment'] || 0),
      interview: (statusMap['Technical Interview'] || 0) + (statusMap['Final Interview'] || 0),
      offer: statusMap['Offer'] || 0
    }

    // Response rate by source
    const sourceResponseRate: Record<string, { total: number; responded: number; rate: number }> = {}
    recentApplications.forEach(app => {
      if (app.source) {
        if (!sourceResponseRate[app.source]) {
          sourceResponseRate[app.source] = { total: 0, responded: 0, rate: 0 }
        }
        sourceResponseRate[app.source].total++

        // Count as "responded" if not in Applied or Rejected status
        if (!['Applied', 'Rejected', 'Withdrawn'].includes(app.status)) {
          sourceResponseRate[app.source].responded++
        }
      }
    })

    // Calculate response rates
    Object.keys(sourceResponseRate).forEach(source => {
      const data = sourceResponseRate[source]
      data.rate = data.total > 0 ? Math.round((data.responded / data.total) * 100 * 100) / 100 : 0
    })

    // Salary analysis
    const salaryData = recentApplications
      .filter(app => app.salaryMin || app.salaryMax)
      .map(app => ({
        min: app.salaryMin || 0,
        max: app.salaryMax || 0,
        mid: ((app.salaryMin || 0) + (app.salaryMax || 0)) / 2,
        currency: app.currency || 'USD'
      }))

    const salaryAnalysis = salaryData.length > 0 ? {
      count: salaryData.length,
      avgMin: Math.round(salaryData.reduce((sum, s) => sum + s.min, 0) / salaryData.length),
      avgMax: Math.round(salaryData.reduce((sum, s) => sum + s.max, 0) / salaryData.length),
      avgMid: Math.round(salaryData.reduce((sum, s) => sum + s.mid, 0) / salaryData.length),
      min: Math.min(...salaryData.map(s => s.min).filter(v => v > 0)),
      max: Math.max(...salaryData.map(s => s.max)),
      currency: salaryData[0].currency
    } : null

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
        .sort((a, b) => a.date.localeCompare(b.date)),
      weeklyTimelineData: Object.entries(weeklyData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      funnelData,
      sourceResponseRate,
      salaryAnalysis
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: errorMessage },
      { status: 500 }
    )
  }
}