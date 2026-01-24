'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RemindersPanel } from './reminders-panel'
import { ActivityTimeline } from './activity-timeline'
import { EditApplicationDialog } from './edit-application-dialog'
import { Application } from '@/lib/types'
import { toast } from 'sonner'
import { Edit, Trash2, ExternalLink, Calendar, MapPin, DollarSign, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ApplicationDetailClientProps {
  application: Application & {
    activities?: any[]
    reminders?: any[]
  }
}

export function ApplicationDetailClient({ application: initialApplication }: ApplicationDetailClientProps) {
  const [application, setApplication] = useState(initialApplication)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const router = useRouter()

  const handleApplicationUpdated = async () => {
    try {
      const response = await fetch(`/api/applications/${application.id}`)
      if (!response.ok) throw new Error('Failed to fetch application')
      const updated = await response.json()
      setApplication(updated)
      toast.success('Application updated successfully')
    } catch (error) {
      console.error('Error fetching updated application:', error)
      toast.error('Failed to refresh application')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete application')

      toast.success('Application deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Application Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{application.jobTitle}</CardTitle>
                <Badge variant="outline">{application.status}</Badge>
                <Badge variant="secondary">{application.priority}</Badge>
              </div>
              <CardDescription className="text-lg">{application.company}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {application.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{application.location}</span>
                {application.locationType && (
                  <Badge variant="outline" className="ml-2">{application.locationType}</Badge>
                )}
              </div>
            )}
            {(application.salaryMin || application.salaryMax) && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>
                  {application.salaryMin && application.salaryMax
                    ? `${application.salaryMin.toLocaleString()} - ${application.salaryMax.toLocaleString()} ${application.currency || 'USD'}`
                    : application.salaryMin
                    ? `${application.salaryMin.toLocaleString()}+ ${application.currency || 'USD'}`
                    : `Up to ${application.salaryMax?.toLocaleString()} ${application.currency || 'USD'}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Applied: {formatDate(application.appliedDate)}</span>
            </div>
            {application.source && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Source:</span>
                <span>{application.source}</span>
              </div>
            )}
            {application.contactPerson && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{application.contactPerson}</span>
              </div>
            )}
            {application.contactEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${application.contactEmail}`} className="text-primary hover:underline">
                  {application.contactEmail}
                </a>
              </div>
            )}
            {application.jobUrl && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={application.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Job Posting
                  </a>
                </Button>
              </div>
            )}
          </div>
          {application.notes && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities and Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityTimeline
          applicationId={application.id}
          application={{
            company: application.company,
            jobTitle: application.jobTitle
          }}
        />
        <RemindersPanel
          applicationId={application.id}
          application={application}
          showApplicationInfo={false}
        />
      </div>

      <EditApplicationDialog
        application={application}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onApplicationUpdated={handleApplicationUpdated}
      />
    </div>
  )
}
