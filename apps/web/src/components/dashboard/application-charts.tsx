'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'
import { ApplicationStats, STATUS_COLORS } from '@/lib/types'
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react'

interface ApplicationChartsProps {
  stats: ApplicationStats
}

export function ApplicationCharts({ stats }: ApplicationChartsProps) {
  const statusData = Object.entries(stats.statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#27272a'
  }))

  const sourceData = Object.entries(stats.sourceStats).map(([source, count]) => ({
    name: source,
    value: count
  }))

  // Funnel data for conversion analysis
  const funnelData = [
    { name: 'Applied', value: stats.funnelData.applied, fill: '#3b82f6' },
    { name: 'Screen', value: stats.funnelData.screen, fill: '#8b5cf6' },
    { name: 'Interview', value: stats.funnelData.interview, fill: '#ec4899' },
    { name: 'Offer', value: stats.funnelData.offer, fill: '#10b981' }
  ].filter(stage => stage.value > 0)

  // Response rate by source data
  const sourceResponseData = Object.entries(stats.sourceResponseRate)
    .map(([source, data]) => ({
      name: source,
      rate: data.rate,
      total: data.total,
      responded: data.responded
    }))
    .sort((a, b) => b.rate - a.rate)

  // Weekly timeline data (last 12 weeks)
  const weeklyData = stats.weeklyTimelineData.slice(-12)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Application Funnel */}
      <Card className="lg:col-span-2 border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" />
            Application Funnel
          </CardTitle>
          <CardDescription className="text-xs">
            Conversion rate through hiring stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {funnelData.length > 0 ? (
            <div className="space-y-4">
              {funnelData.map((stage, idx) => {
                const percentage = stats.funnelData.applied > 0
                  ? Math.round((stage.value / stats.funnelData.applied) * 100)
                  : 0
                const prevStage = idx > 0 ? funnelData[idx - 1].value : stage.value
                const conversionRate = prevStage > 0
                  ? Math.round((stage.value / prevStage) * 100)
                  : 100

                return (
                  <div key={stage.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.name}</span>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{stage.value} apps</span>
                        <span>{percentage}% of total</span>
                        {idx > 0 && (
                          <span className="flex items-center gap-1">
                            {conversionRate >= 50 ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            {conversionRate}% conversion
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-8 relative overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: stage.fill
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No funnel data available yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fafafa' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-bold text-foreground">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Applications Timeline */}
      <Card className="md:col-span-2 lg:col-span-3 border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Applications per Week (Last 12 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#a1a1aa' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                stroke="#27272a"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#a1a1aa' }}
                stroke="#27272a"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fafafa' }}
                labelFormatter={(value) => `Week of ${new Date(value).toLocaleDateString()}`}
              />
              <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Rate by Source */}
      {sourceResponseData.length > 0 && (
        <Card className="md:col-span-2 border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Response Rate by Source
            </CardTitle>
            <CardDescription className="text-xs">
              Percentage of applications that received a response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceResponseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#a1a1aa' }} stroke="#27272a" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                  stroke="#27272a"
                  width={100}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fafafa' }}
                  formatter={(value: any, name: string, props: any) => [
                    `${value}% (${props.payload.responded}/${props.payload.total})`,
                    'Response Rate'
                  ]}
                />
                <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Salary Analysis */}
      {stats.salaryAnalysis && (
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salary Analysis
            </CardTitle>
            <CardDescription className="text-xs">
              Based on {stats.salaryAnalysis.count} applications with salary data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Average Range</p>
                  <p className="text-lg font-bold">
                    ${(stats.salaryAnalysis.avgMin / 1000).toFixed(0)}k - ${(stats.salaryAnalysis.avgMax / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Average Mid</p>
                  <p className="text-lg font-bold">
                    ${(stats.salaryAnalysis.avgMid / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Minimum</p>
                  <p className="text-sm font-medium">
                    ${(stats.salaryAnalysis.min / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Maximum</p>
                  <p className="text-sm font-medium">
                    ${(stats.salaryAnalysis.max / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Currency</span>
                  <span className="font-mono">{stats.salaryAnalysis.currency}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications by Source (existing chart) */}
      {sourceData.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-1 border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Applications by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                  stroke="#27272a"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#a1a1aa' }}
                  stroke="#27272a"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#fafafa' }}
                  cursor={{ fill: '#27272a', opacity: 0.4 }}
                />
                <Bar dataKey="value" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}