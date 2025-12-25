'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Briefcase,
  TrendingUp,
  Calendar,
  Target,
  Users,
} from 'lucide-react'
import { ApplicationStats } from '@/lib/types'

interface StatsCardsProps {
  stats: ApplicationStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            Total Applications
          </CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-mono tracking-tighter">{stats.totalApplications}</div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            <span className="text-primary">+</span> {stats.monthlyApplications} this month
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            Response Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-mono tracking-tighter">{stats.responseRate}%</div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Of total applications
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            This Week
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-mono tracking-tighter">{stats.weeklyApplications}</div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            Applications submitted
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            Active Status
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold font-mono tracking-tighter">
            {(stats.statusCounts['Phone Screen'] || 0) +
              (stats.statusCounts['Technical Interview'] || 0) +
              (stats.statusCounts['Final Interview'] || 0)}
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            In interview process
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4 border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Applications by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <Badge
                key={status}
                variant="outline"
                className="flex items-center gap-2 py-2 px-3 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <span className="text-xs font-mono uppercase text-muted-foreground">{status}</span>
                <span className="font-bold font-mono text-primary">{count}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}