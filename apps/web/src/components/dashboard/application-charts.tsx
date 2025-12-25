'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ResponsiveContainer
} from 'recharts'
import { ApplicationStats, STATUS_COLORS } from '@/lib/types'

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

  const timelineData = stats.timelineData.slice(-30)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2 border-primary/10 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            Application Timeline (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
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
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ea580c"
                strokeWidth={2}
                dot={{ r: 4, fill: '#ea580c', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#ea580c' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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

      {sourceData.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3 border-primary/10 bg-card/50 backdrop-blur-sm">
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