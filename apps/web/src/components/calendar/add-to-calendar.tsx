'use client'

import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICSFile,
  type CalendarEvent,
} from '@/lib/calendar'

interface AddToCalendarProps {
  readonly title: string
  readonly description?: string
  readonly location?: string
  readonly startDate: Date
  readonly endDate?: Date
  /** Render as a compact icon-only button (default: false) */
  readonly compact?: boolean
}

export function AddToCalendar({
  title,
  description,
  location,
  startDate,
  endDate,
  compact = false,
}: AddToCalendarProps) {
  const event: CalendarEvent = {
    title,
    description,
    location,
    startDate,
    endDate,
  }

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadICS = () => {
    downloadICSFile(event)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Add to calendar"
          >
            <CalendarPlus className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Add to Calendar
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar}>
          Outlook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          Download .ics (Apple / other)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
