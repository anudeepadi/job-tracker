'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Search, Loader2, ExternalLink, Plus, MapPin, Building2, Clock, Sparkles } from 'lucide-react'
import { JobResult } from '@/lib/types'

interface JobSearchFormData {
  jobRole: string
  location: string
  numResults: number
}

interface JobSearchPanelProps {
  onImportJob?: (job: JobResult) => Promise<void>
}

export function JobSearchPanel({ onImportJob }: JobSearchPanelProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<JobResult[]>([])
  const [searchStats, setSearchStats] = useState<{
    totalFound: number
    searchTime?: number
  } | null>(null)
  const [importingJobs, setImportingJobs] = useState<Set<string>>(new Set())

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<JobSearchFormData>({
    defaultValues: {
      jobRole: '',
      location: '',
      numResults: 10,
    },
  })

  const onSubmit = useCallback(async (data: JobSearchFormData) => {
    setIsSearching(true)
    setResults([])
    setSearchStats(null)

    try {
      const response = await fetch('/api/job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: data.jobRole,
          location: data.location,
          num_results: data.numResults,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search for jobs')
      }

      const result = await response.json()

      if (result.status === 'error') {
        throw new Error(result.error || 'Search failed')
      }

      setResults(result.results || [])
      setSearchStats({
        totalFound: result.total_found || result.results?.length || 0,
        searchTime: result.search_time_seconds,
      })

      if (result.results?.length > 0) {
        toast.success(`Found ${result.results.length} job listings!`)
      } else {
        toast.info('No jobs found matching your criteria')
      }
    } catch (error) {
      console.error('Job search error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to search for jobs')
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleImportJob = useCallback(async (job: JobResult) => {
    if (!onImportJob) {
      toast.error('Import functionality not configured')
      return
    }

    const jobKey = `${job.company}-${job.title}-${job.url}`
    setImportingJobs(prev => new Set(prev).add(jobKey))

    try {
      await onImportJob(job)
      toast.success(`Imported "${job.title}" at ${job.company}`)
    } catch (error) {
      console.error('Failed to import job:', error)
      toast.error('Failed to import job to tracker')
    } finally {
      setImportingJobs(prev => {
        const next = new Set(prev)
        next.delete(jobKey)
        return next
      })
    }
  }, [onImportJob])

  const isJobImporting = (job: JobResult) => {
    return importingJobs.has(`${job.company}-${job.title}-${job.url}`)
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered Job Search</CardTitle>
          </div>
          <CardDescription>
            Use our intelligent agent to find relevant job listings across multiple sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role *</Label>
                <Input
                  id="jobRole"
                  {...register('jobRole', { required: 'Job role is required' })}
                  placeholder="e.g. Software Engineer, Product Manager"
                  disabled={isSearching}
                />
                {errors.jobRole && (
                  <p className="text-sm text-destructive">{errors.jobRole.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('location', { required: 'Location is required' })}
                  placeholder="e.g. San Francisco, CA or Remote"
                  disabled={isSearching}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numResults">Number of Results</Label>
                <Select
                  defaultValue="10"
                  onValueChange={(value) => setValue('numResults', parseInt(value))}
                  disabled={isSearching}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSearching}
                className="font-mono text-xs uppercase tracking-wider"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Jobs
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search Progress */}
      {isSearching && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">AI Agent is searching for jobs...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a moment as we scan multiple job boards
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Stats */}
      {searchStats && !isSearching && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Found {searchStats.totalFound} jobs</span>
          {searchStats.searchTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {searchStats.searchTime.toFixed(2)}s
            </span>
          )}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && !isSearching && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Search Results
          </h3>

          <div className="grid gap-4">
            {results.map((job, index) => (
              <Card key={`${job.url}-${index}`} className="hover:border-primary/40 transition-colors">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <h4 className="font-semibold text-lg">{job.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {job.source}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </span>
                        {job.posted_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.posted_date}
                          </span>
                        )}
                      </div>

                      {job.salary_range && (
                        <p className="text-sm font-medium text-primary">
                          {job.salary_range}
                        </p>
                      )}

                      {job.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="font-mono text-xs"
                      >
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </Button>

                      {onImportJob && (
                        <Button
                          size="sm"
                          onClick={() => handleImportJob(job)}
                          disabled={isJobImporting(job)}
                          className="font-mono text-xs"
                        >
                          {isJobImporting(job) ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          Import
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && searchStats === null && (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Ready to find your next opportunity</p>
              <p className="text-sm">
                Enter a job role and location above to start searching
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {!isSearching && results.length === 0 && searchStats !== null && (
        <Card className="border-dashed border-yellow-500/30">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-2">No jobs found</p>
              <p className="text-sm">
                Try adjusting your search criteria or broadening your location
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
