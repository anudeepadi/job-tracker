'use client'

import { useEffect, useState, useCallback } from 'react'
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from '@/lib/keyboard-shortcuts'
import { CommandPalette } from '@/components/command-palette'
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help'
import { StatsCards } from './stats-cards'
import { ApplicationCharts } from './application-charts'
import { ApplicationTable } from './application-table'
import { AddApplicationDialog } from './add-application-dialog'
import { EditApplicationDialog } from './edit-application-dialog'
import { RemindersPanel } from './reminders-panel'
import { ActivityTimeline } from './activity-timeline'
import { JobSearchPanel } from '@/components/job-search/job-search-panel'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Sparkles, MessageSquare, Database, Keyboard } from 'lucide-react'
import Link from 'next/link'
import { Application, ApplicationStats, JobResult } from '@/lib/types'
import { toast } from 'sonner'

export function Dashboard() {
  const [stats, setStats] = useState<ApplicationStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState<Application | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Setup keyboard shortcuts
  useKeyboardShortcuts([
    ...DEFAULT_SHORTCUTS.map(s => ({
      ...s,
      action: s.key === 'n' ? () => setIsAddDialogOpen(true) : s.action
    }))
  ])

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
      const response = await fetch('/api/applications?limit=500')
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

  // Listen for custom events
  useEffect(() => {
    const handleNewApplication = () => setIsAddDialogOpen(true)
    window.addEventListener('open:new-application', handleNewApplication)
    return () => window.removeEventListener('open:new-application', handleNewApplication)
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
    setIsEditDialogOpen(false)
    setEditingApplication(null)
  }

  const handleApplicationDeleted = () => {
    fetchStats()
    fetchApplications()
    toast.success('Application deleted successfully')
  }

  const handleEdit = (application: Application) => {
    setEditingApplication(application)
    setIsEditDialogOpen(true)
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-mono text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between mb-8 pt-4">
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
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="outline" size="lg" className="font-mono text-xs uppercase tracking-wider h-12 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all">
            <Link href="/searches">
              <Database className="h-4 w-4 mr-2" />
              Searches
            </Link>
          </Button>
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
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowShortcutsHelp(true)}
            className="font-mono text-xs uppercase tracking-wider h-12 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowShortcutsHelp(true)}
            className="font-mono text-xs uppercase tracking-wider h-12 border-primary/20 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} size="lg" className="font-mono text-xs uppercase tracking-wider h-12 bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-[0_0_20px_-5px_hsl(var(--primary))]">
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      {/* Stats Cards - Show on Overview */}
      {activeTab === 'overview' && stats && <StatsCards stats={stats} />}

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="ai-search" className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI Job Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-mono">Recent Applications</CardTitle>
                  <CardDescription>Your latest job applications</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs"
                  onClick={() => setActiveTab('applications')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ApplicationTable
                applications={applications.slice(0, 15)}
                onUpdate={handleApplicationUpdated}
                onDelete={handleApplicationDeleted}
                onEdit={handleEdit}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono">All Applications</CardTitle>
              <CardDescription>
                {applications.length} total applications tracked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationTable
                applications={applications}
                onUpdate={handleApplicationUpdated}
                onDelete={handleApplicationDeleted}
                onEdit={handleEdit}
                showPagination={true}
                showFilters={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {stats && (
            <>
              <StatsCards stats={stats} />
              <ApplicationCharts stats={stats} />
            </>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <RemindersPanel />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {editingApplication && (
            <ActivityTimeline
              applicationId={editingApplication.id}
              application={{
                company: editingApplication.company,
                jobTitle: editingApplication.jobTitle
              }}
            />
          )}
          {!editingApplication && (
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>
                  Select an application to view its activity timeline
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <RemindersPanel />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {editingApplication ? (
            <ActivityTimeline
              applicationId={editingApplication.id}
              application={{
                company: editingApplication.company,
                jobTitle: editingApplication.jobTitle
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>
                  Select an application to view its activity timeline, or use the Activities tab when viewing an application
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-search" className="space-y-4">
          <JobSearchPanel onImportJob={handleImportJob} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddApplicationDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onApplicationAdded={handleApplicationAdded}
      />

      <EditApplicationDialog
        application={editingApplication}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onApplicationUpdated={handleApplicationUpdated}
      />

      <CommandPalette />
      <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
    </div>
  )
}
