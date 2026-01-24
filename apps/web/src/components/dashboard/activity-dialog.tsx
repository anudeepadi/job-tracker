'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Activity } from '@/lib/types'

interface ActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onActivitySaved: () => void
  applicationId: string
  activity?: Activity | null
}

interface ActivityFormData {
  type: string
  description: string
  date: string
}

const ACTIVITY_TYPES = [
  'Status Change',
  'Interview',
  'Email',
  'Note',
  'Resume'
]

export function ActivityDialog({
  open,
  onOpenChange,
  onActivitySaved,
  applicationId,
  activity
}: ActivityDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!activity

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ActivityFormData>({
    defaultValues: {
      type: activity?.type || 'Note',
      description: activity?.description || '',
      date: activity?.date
        ? new Date(activity.date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16)
    }
  })

  const typeValue = watch('type')

  useEffect(() => {
    if (activity) {
      reset({
        type: activity.type,
        description: activity.description,
        date: new Date(activity.date).toISOString().slice(0, 16)
      })
    } else {
      reset({
        type: 'Note',
        description: '',
        date: new Date().toISOString().slice(0, 16)
      })
    }
  }, [activity, reset, open])

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true)
    try {
      const url = isEditing
        ? `/api/activities/${activity.id}`
        : `/api/applications/${applicationId}/activities`
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: data.type,
          description: data.description,
          date: data.date
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save activity')
      }

      toast.success(isEditing ? 'Activity updated successfully' : 'Activity created successfully')
      onActivitySaved()
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Error saving activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save activity')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Activity' : 'Create Activity'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update activity details' : 'Add a new activity to track'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={typeValue} onValueChange={(value) => setValue('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Describe the activity..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date', { required: 'Date is required' })}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
