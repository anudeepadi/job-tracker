'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  ArrowUpRight,
} from 'lucide-react'
import { ApplicationStats } from '@/lib/types'

interface StatsCardsProps {
  stats: ApplicationStats
  onViewDetails?: (tab: string) => void
}

const CARDS = [
  {
    key: 'total',
    label: 'Total Applications',
    icon: Briefcase,
    color: '#3b82f6',
    getValue: (s: ApplicationStats) => s.totalApplications,
    getTrend: (s: ApplicationStats) => ({
      value: s.monthlyApplications,
      label: 'this month',
      positive: s.monthlyApplications > 0,
    }),
  },
  {
    key: 'response',
    label: 'Response Rate',
    icon: TrendingUp,
    color: '#8b5cf6',
    getValue: (s: ApplicationStats) => `${s.responseRate}%`,
    getTrend: (s: ApplicationStats) => ({
      value: s.totalApplications > 0 ? s.responseRate : 0,
      label: 'of applications',
      positive: s.responseRate >= 20,
    }),
  },
  {
    key: 'interviews',
    label: 'Active Interviews',
    icon: Target,
    color: '#ec4899',
    getValue: (s: ApplicationStats) =>
      (s.statusCounts['Phone Screen'] || 0) +
      (s.statusCounts['Technical Interview'] || 0) +
      (s.statusCounts['Final Interview'] || 0) +
      (s.statusCounts['Interviewing'] || 0),
    getTrend: (s: ApplicationStats) => {
      const total =
        (s.statusCounts['Phone Screen'] || 0) +
        (s.statusCounts['Technical Interview'] || 0) +
        (s.statusCounts['Final Interview'] || 0) +
        (s.statusCounts['Interviewing'] || 0)
      return {
        value: total,
        label: 'in pipeline',
        positive: total > 0,
      }
    },
  },
  {
    key: 'weekly',
    label: 'This Week',
    icon: Calendar,
    color: '#10b981',
    getValue: (s: ApplicationStats) => s.weeklyApplications,
    getTrend: (s: ApplicationStats) => ({
      value: s.weeklyApplications,
      label: 'submitted',
      positive: s.weeklyApplications > 0,
    }),
  },
] as const

export function StatsCards({ stats, onViewDetails }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        const value = card.getValue(stats)
        const trend = card.getTrend(stats)

        return (
          <Card
            key={card.key}
            className="border-border/50 bg-card hover:shadow-md transition-all duration-200 group"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}12` }}
                >
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
              </div>

              <div className="text-3xl font-bold tracking-tight mb-2">
                {value}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  {trend.positive ? (
                    <div className="flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">+{trend.value}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-red-500/10 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                      <TrendingDown className="h-3 w-3" />
                      <span className="font-medium">{trend.value}</span>
                    </div>
                  )}
                  <span className="text-muted-foreground">{trend.label}</span>
                </div>

                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails('analytics')}
                    className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
