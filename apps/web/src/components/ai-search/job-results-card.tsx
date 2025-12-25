'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Plus, Loader2, Building2, MapPin, Clock, DollarSign } from 'lucide-react'
import { JobResult } from '@/lib/types'

interface JobResultsCardProps {
  jobs: JobResult[]
  onImportJob?: (job: JobResult) => Promise<void>
  importingJobs?: Set<string>
}

export function JobResultsCard({ jobs, onImportJob, importingJobs = new Set() }: JobResultsCardProps) {
  const isJobImporting = (job: JobResult) => {
    return importingJobs.has(`${job.company}-${job.title}-${job.url}`)
  }

  return (
    <div className="space-y-3 w-full">
      {jobs.map((job, index) => (
        <Card
          key={`${job.url}-${index}`}
          className="hover:border-primary/40 transition-colors bg-card"
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{job.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      {job.company}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {job.source}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location}
                </span>
                {job.posted_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {job.posted_date}
                  </span>
                )}
                {job.salary_range && (
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <DollarSign className="h-3 w-3" />
                    {job.salary_range}
                  </span>
                )}
              </div>

              {/* Description */}
              {job.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {job.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="font-mono text-[10px] h-7 px-2"
                >
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </a>
                </Button>

                {onImportJob && (
                  <Button
                    size="sm"
                    onClick={() => onImportJob(job)}
                    disabled={isJobImporting(job)}
                    className="font-mono text-[10px] h-7 px-2"
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
  )
}
