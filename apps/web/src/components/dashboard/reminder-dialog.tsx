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
import { toast } from 'sonner'
import { Reminder } from '@/lib/types'

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReminderSaved: () => void
  applicationId: string
  reminder?: Reminder | null
}

interface ReminderFormData {
  title: string
  description?: string
  dueDate: string
}

export function ReminderDialog({
  open,
  onOpenChange,
  onReminderSaved,
  applicationId,
  reminder
}: ReminderDialogProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!reminder

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReminderFormData>({
    defaultValues: {
      title: reminder?.title || '',
      description: reminder?.description || '',
      dueDate: reminder?.dueDate 
        ? new Date(reminder.dueDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    if (reminder) {
      reset({
        title: reminder.title,
        description: reminder.description || '',
        dueDate: new Date(reminder.dueDate).toISOString().split('T')[0]
      })
    } else {
      reset({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0]
      })
    }
  }, [reminder, reset, open])

  const onSubmit = async (data: ReminderFormData) => {
    setLoading(true)
    try {
      const url = isEditing
        ? `/api/reminders/${reminder.id}`
        : `/api/applications/${applicationId}/reminders`
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          dueDate: data.dueDate
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save reminder')
      }

      toast.success(isEditing ? 'Reminder updated successfully' : 'Reminder created successfully')
      onReminderSaved()
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Error saving reminder:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save reminder')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Reminder' : 'Create Reminder'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update reminder details' : 'Set a reminder for this application'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="e.g., Follow up on application"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional notes about this reminder..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate', { required: 'Due date is required' })}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
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
