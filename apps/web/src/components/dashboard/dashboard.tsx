'use client'

import { useEffect, useState, useCallback } from 'react'
import { StatsCards } from './stats-cards'
import { ApplicationCharts } from './application-charts'
import { ApplicationTable } from './application-table'
import { AddApplicationDialog } from './add-application-dialog'
import { EditApplicationDialog } from './edit-application-dialog'
import { JobSearchPanel } from '@/components/job-search/job-search-panel'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Sparkles, MessageSquare, LayoutDashboard, Briefcase, BarChart3, Bot } from 'lucide-react'
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
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">JobTracker</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
                size="sm"
                className="font-mono text-xs"
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Overview
              </Button>
              <Button
                variant={activeTab === 'applications' ? 'secondary' : 'ghost'}
                size="sm"
                className="font-mono text-xs"
                onClick={() => setActiveTab('applications')}
              >
                <Briefcase className="h-4 w-4 mr-1.5" />
                Applications
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
                size="sm"
                className="font-mono text-xs"
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Analytics
              </Button>
              <Button
                variant={activeTab === 'ai-search' ? 'secondary' : 'ghost'}
                size="sm"
                className="font-mono text-xs"
                onClick={() => setActiveTab('ai-search')}
              >
                <Bot className="h-4 w-4 mr-1.5" />
                AI Search
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="font-mono text-xs hidden sm:flex">
              <Link href="/ai-search">
                <MessageSquare className="h-4 w-4 mr-1.5" />
                AI Chat
              </Link>
            </Button>
            <ThemeToggle />
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="font-mono text-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b border-primary/10 bg-muted/30">
        <div className="container px-4 py-2 flex gap-1 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
            size="sm"
            className="font-mono text-xs shrink-0"
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === 'applications' ? 'secondary' : 'ghost'}
            size="sm"
            className="font-mono text-xs shrink-0"
            onClick={() => setActiveTab('applications')}
          >
            <Briefcase className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
            size="sm"
            className="font-mono text-xs shrink-0"
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant={activeTab === 'ai-search' ? 'secondary' : 'ghost'}
            size="sm"
            className="font-mono text-xs shrink-0"
            onClick={() => setActiveTab('ai-search')}
          >
            <Bot className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="container px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'applications' && 'Applications'}
              {activeTab === 'analytics' && 'Analytics'}
              {activeTab === 'ai-search' && 'AI Job Search'}
            </h1>
            <p className="text-muted-foreground">
              {activeTab === 'overview' && 'Overview of your job search progress'}
              {activeTab === 'applications' && 'Manage and track all your job applications'}
              {activeTab === 'analytics' && 'Visualize your application statistics'}
              {activeTab === 'ai-search' && 'Search for jobs with AI-powered assistance'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(activeTab === 'overview' || activeTab === 'applications') && (
              <>
                <Button onClick={handleExport} variant="outline" size="sm" className="font-mono text-xs">
                  <Download className="h-4 w-4 mr-1.5" />
                  Export CSV
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="font-mono text-xs">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Application
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards - Show on Overview */}
        {activeTab === 'overview' && stats && <StatsCards stats={stats} />}

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="sr-only">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="ai-search">AI Search</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0">
            {stats && <ApplicationCharts stats={stats} />}

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">Recent Applications</CardTitle>
                    <CardDescription>Your latest 10 job applications</CardDescription>
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
                  applications={applications.slice(0, 10)}
                  onUpdate={handleApplicationUpdated}
                  onDelete={handleApplicationDeleted}
                  onEdit={handleEdit}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications" className="mt-0">
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

          <TabsContent value="analytics" className="space-y-6 mt-0">
            {stats && (
              <>
                <StatsCards stats={stats} />
                <ApplicationCharts stats={stats} />
              </>
            )}
          </TabsContent>

          <TabsContent value="ai-search" className="mt-0">
            <JobSearchPanel onImportJob={handleImportJob} />
          </TabsContent>
        </Tabs>
      </main>

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
    </div>
  )
}
