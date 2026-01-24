'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReminderDialog } from './reminder-dialog'
import { Reminder, Application } from '@/lib/types'
import { toast } from 'sonner'
import { Plus, Check, X, Calendar, Clock, AlertCircle } from 'lucide-react'

interface RemindersPanelProps {
  applicationId?: string
  application?: Application
  showApplicationInfo?: boolean
}

export function RemindersPanel({
  applicationId,
  application,
  showApplicationInfo = false
}: RemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all')

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const url = applicationId
        ? `/api/applications/${applicationId}/reminders`
        : filter === 'upcoming'
        ? '/api/reminders/upcoming'
        : '/api/reminders'
      
      const params = new URLSearchParams()
      if (!applicationId) {
        if (filter === 'completed') {
          params.append('completed', 'true')
        } else if (filter === 'overdue') {
          params.append('completed', 'false')
        }
      }
      
      const response = await fetch(`${url}?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch reminders')
      
      const data = await response.json()
      let fetchedReminders = data.reminders || []
      
      // Filter for overdue if needed
      if (filter === 'overdue' && !applicationId) {
        const now = new Date()
        fetchedReminders = fetchedReminders.filter((r: Reminder) => 
          !r.completed && new Date(r.dueDate) < now
        )
      }
      
      setReminders(fetchedReminders)
    } catch (error) {
      console.error('Error fetching reminders:', error)
      toast.error('Failed to load reminders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [applicationId, filter])

  const handleCreateReminder = () => {
    setEditingReminder(null)
    setIsDialogOpen(true)
  }

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder)
    setIsDialogOpen(true)
  }

  const handleReminderSaved = () => {
    fetchReminders()
  }

  const handleToggleComplete = async (reminder: Reminder) => {
    try {
      const response = await fetch(`/api/reminders/${reminder.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !reminder.completed })
      })

      if (!response.ok) throw new Error('Failed to update reminder')

      toast.success(reminder.completed ? 'Reminder marked as incomplete' : 'Reminder marked as complete')
      fetchReminders()
    } catch (error) {
      console.error('Error updating reminder:', error)
      toast.error('Failed to update reminder')
    }
  }

  const handleDeleteReminder = async (reminder: Reminder) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete reminder')

      toast.success('Reminder deleted successfully')
      fetchReminders()
    } catch (error) {
      console.error('Error deleting reminder:', error)
      toast.error('Failed to delete reminder')
    }
  }

  const getReminderStatus = (reminder: Reminder) => {
    if (reminder.completed) return 'completed'
    const now = new Date()
    const dueDate = new Date(reminder.dueDate)
    if (dueDate < now) return 'overdue'
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 1) return 'due-soon'
    return 'upcoming'
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const filteredReminders = reminders.filter((reminder) => {
    if (filter === 'completed') return reminder.completed
    if (filter === 'overdue') {
      return !reminder.completed && new Date(reminder.dueDate) < new Date()
    }
    if (filter === 'upcoming') {
      return !reminder.completed && new Date(reminder.dueDate) >= new Date()
    }
    return true
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>
              {showApplicationInfo && application
                ? `Reminders for ${application.company} - ${application.jobTitle}`
                : 'Manage your application reminders'}
            </CardDescription>
          </div>
          <Button onClick={handleCreateReminder} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
        {!applicationId && (
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              variant={filter === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reminders...</div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No reminders found. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => {
              const status = getReminderStatus(reminder)
              const reminderApplication = (reminder as any).application
              
              return (
                <div
                  key={reminder.id}
                  className={`p-4 border rounded-lg ${
                    reminder.completed ? 'opacity-60' : ''
                  } ${
                    status === 'overdue' ? 'border-destructive' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${reminder.completed ? 'line-through' : ''}`}>
                          {reminder.title}
                        </h4>
                        {status === 'overdue' && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        )}
                        {status === 'due-soon' && (
                          <Badge variant="default" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Due Soon
                          </Badge>
                        )}
                        {reminder.completed && (
                          <Badge variant="secondary" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {reminder.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(reminder.dueDate)}
                        </div>
                        {reminderApplication && (
                          <div>
                            {reminderApplication.company} - {reminderApplication.jobTitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(reminder)}
                        title={reminder.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {reminder.completed ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditReminder(reminder)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReminder(reminder)}
                        className="text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <ReminderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onReminderSaved={handleReminderSaved}
        applicationId={applicationId || application?.id || ''}
        reminder={editingReminder}
      />
    </Card>
  )
}
