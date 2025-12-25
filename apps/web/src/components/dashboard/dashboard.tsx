'use client'

import { useEffect, useState, useCallback } from 'react'
import { StatsCards } from './stats-cards'
import { ApplicationCharts } from './application-charts'
import { ApplicationTable } from './application-table'
import { AddApplicationDialog } from './add-application-dialog'
import { JobSearchPanel } from '@/components/job-search/job-search-panel'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Sparkles, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Application, ApplicationStats, JobResult } from '@/lib/types'
import { toast } from 'sonner'

export function Dashboard() {
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/applications/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load dashboard statistics')
    }
  }

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications?limit=50')
      if (!response.ok) throw new Error('Failed to fetch applications')
      const data = await response.json()
      setApplications(data.applications || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchApplications()])
      setLoading(false)
    }

    loadData()
  }, [])

  const handleApplicationAdded = () => {
    fetchStats()
    fetchApplications()
    setIsAddDialogOpen(false)
    toast.success('Application added successfully')
  }

  const handleApplicationUpdated = () => {
    fetchStats()
    fetchApplications()
    toast.success('Application updated successfully')
  }

  const handleApplicationDeleted = () => {
    fetchStats()
    fetchApplications()
    toast.success('Application deleted successfully')
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/applications/export')
      if (!response.ok) throw new Error('Failed to export')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Applications exported successfully')
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Failed to export applications')
    }
  }

  // Handle importing a job from the AI search results into the application tracker
  const handleImportJob = useCallback(async (job: JobResult) => {
    // Parse salary range if available
    let salaryMin: number | undefined
    let salaryMax: number | undefined

    if (job.salary_range) {
      // Try to extract numbers from salary range like "$100,000 - $150,000"
      const numbers = job.salary_range.match(/[\d,]+/g)
      if (numbers && numbers.length >= 1) {
        salaryMin = parseInt(numbers[0].replace(/,/g, ''))
        if (numbers.length >= 2) {
          salaryMax = parseInt(numbers[1].replace(/,/g, ''))
        }
      }
    }

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: job.company,
        jobTitle: job.title,
        jobUrl: job.url,
        location: job.location,
        locationType: job.location.toLowerCase().includes('remote') ? 'Remote' : undefined,
        salaryMin,
        salaryMax,
        status: 'Applied',
        priority: 'Medium',
        source: job.source || 'AI Search',
        appliedDate: new Date().toISOString().split('T')[0],
        notes: job.description ? `Description: ${job.description}` : undefined,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to import job')
    }

    // Refresh data after import
    await Promise.all([fetchStats(), fetchApplications()])
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-12 pt-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-widest uppercase">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            System Status: Online
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
            Job Tracker<span className="text-primary">.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-light border-l-2 border-primary/20 pl-4">
            Track and manage your job applications with agent-native precision.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="lg" className="font-mono text-xs uppercase tracking-wider h-12 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all">
            <Link href="/ai-search">
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Chat
            </Link>
          </Button>
          <Button onClick={handleExport} variant="outline" size="lg" className="font-mono text-xs uppercase tracking-wider h-12 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="font-mono text-xs uppercase tracking-wider h-12 bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-[0_0_20px_-5px_var(--primary)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {stats && <StatsCards stats={stats} />}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-search" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Job Search
          </TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && <ApplicationCharts stats={stats} />}

          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <ApplicationTable
              applications={applications.slice(0, 10)}
              onUpdate={handleApplicationUpdated}
              onDelete={handleApplicationDeleted}
            />
          </Card>
        </TabsContent>

        <TabsContent value="ai-search" className="space-y-4">
          <JobSearchPanel onImportJob={handleImportJob} />
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
            </CardHeader>
            <ApplicationTable
              applications={applications}
              onUpdate={handleApplicationUpdated}
              onDelete={handleApplicationDeleted}
              showPagination={true}
            />
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {stats && <ApplicationCharts stats={stats} />}
        </TabsContent>
      </Tabs>

      <AddApplicationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onApplicationAdded={handleApplicationAdded}
      />
    </div>
  )
}