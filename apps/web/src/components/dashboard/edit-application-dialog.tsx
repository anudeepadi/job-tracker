'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Application,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  SOURCE_OPTIONS
} from '@/lib/types'
import { toast } from 'sonner'

interface EditApplicationDialogProps {
  application: Application | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplicationUpdated: () => void
}

interface ApplicationFormData {
  company: string
  jobTitle: string
  jobUrl?: string
  location?: string
  locationType?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  status?: string
  priority?: string
  source?: string
  contactPerson?: string
  contactEmail?: string
  appliedDate: string
  notes?: string
}

export function EditApplicationDialog({
  application,
  open,
  onOpenChange,
  onApplicationUpdated
}: EditApplicationDialogProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ApplicationFormData>()

  // Watch values for controlled selects
  const watchedLocationType = watch('locationType')
  const watchedStatus = watch('status')
  const watchedPriority = watch('priority')
  const watchedSource = watch('source')
  const watchedCurrency = watch('currency')

  // Populate form when application changes
  useEffect(() => {
    if (application) {
      reset({
        company: application.company,
        jobTitle: application.jobTitle,
        jobUrl: application.jobUrl || '',
        location: application.location || '',
        locationType: application.locationType || '',
        salaryMin: application.salaryMin || undefined,
        salaryMax: application.salaryMax || undefined,
        currency: application.currency || 'USD',
        status: application.status,
        priority: application.priority,
        source: application.source || '',
        contactPerson: application.contactPerson || '',
        contactEmail: application.contactEmail || '',
        appliedDate: new Date(application.appliedDate).toISOString().split('T')[0],
        notes: application.notes || '',
      })
    }
  }, [application, reset])

  const onSubmit = async (data: ApplicationFormData) => {
    if (!application) return

    setLoading(true)
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          salaryMin: data.salaryMin ? parseInt(data.salaryMin.toString()) : null,
          salaryMax: data.salaryMax ? parseInt(data.salaryMax.toString()) : null,
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update application')
      }

      toast.success('Application updated successfully')
      onOpenChange(false)
      onApplicationUpdated()
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono">Edit Application</DialogTitle>
          <DialogDescription>
            Update the details of this job application
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                {...register('company', { required: 'Company is required' })}
                placeholder="e.g. Google"
              />
              {errors.company && (
                <p className="text-sm text-destructive">{errors.company.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                {...register('jobTitle', { required: 'Job title is required' })}
                placeholder="e.g. Software Engineer"
              />
              {errors.jobTitle && (
                <p className="text-sm text-destructive">{errors.jobTitle.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobUrl">Job URL</Label>
            <Input
              id="jobUrl"
              {...register('jobUrl')}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g. San Francisco, CA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationType">Location Type</Label>
              <Select
                value={watchedLocationType || ''}
                onValueChange={(value) => setValue('locationType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salaryMin">Min Salary</Label>
              <Input
                id="salaryMin"
                {...register('salaryMin')}
                type="number"
                placeholder="80000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMax">Max Salary</Label>
              <Input
                id="salaryMax"
                {...register('salaryMax')}
                type="number"
                placeholder="120000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watchedCurrency || 'USD'}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watchedStatus || 'Applied'}
                onValueChange={(value) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={watchedPriority || 'Medium'}
                onValueChange={(value) => setValue('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={watchedSource || ''}
                onValueChange={(value) => setValue('source', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                {...register('contactPerson')}
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                {...register('contactEmail')}
                type="email"
                placeholder="john@company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appliedDate">Applied Date *</Label>
            <Input
              id="appliedDate"
              {...register('appliedDate', { required: 'Applied date is required' })}
              type="date"
            />
            {errors.appliedDate && (
              <p className="text-sm text-destructive">{errors.appliedDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this application..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
