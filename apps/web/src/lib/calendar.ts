/**
 * Calendar integration utilities for generating Google Calendar, Outlook,
 * and ICS (.ics) calendar links/files. Uses URL-based approach — no OAuth needed.
 */

export interface CalendarEvent {
  readonly title: string
  readonly description?: string
  readonly location?: string
  readonly startDate: Date
  readonly endDate?: Date
}

const DEFAULT_DURATION_MS = 60 * 60 * 1000 // 1 hour

/**
 * Formats a Date into the compact ISO format used by Google Calendar URLs:
 * YYYYMMDDTHHMMSSZ
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/**
 * Computes the effective end date, defaulting to 1 hour after start.
 */
function resolveEndDate(event: CalendarEvent): Date {
  return event.endDate ?? new Date(event.startDate.getTime() + DEFAULT_DURATION_MS)
}

/**
 * Generates a Google Calendar "create event" URL.
 * Opens in the user's browser — they click "Save" to add it.
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams()
  params.set('action', 'TEMPLATE')
  params.set('text', event.title)

  const start = formatGoogleDate(event.startDate)
  const end = formatGoogleDate(resolveEndDate(event))
  params.set('dates', `${start}/${end}`)

  if (event.description) params.set('details', event.description)
  if (event.location) params.set('location', event.location)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generates an Outlook Web "compose event" URL.
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams()
  params.set('rru', 'addevent')
  params.set('subject', event.title)
  params.set('startdt', event.startDate.toISOString())
  params.set('enddt', resolveEndDate(event).toISOString())

  if (event.description) params.set('body', event.description)
  if (event.location) params.set('location', event.location)

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generates the text content of an ICS (iCalendar) file.
 */
export function generateICSContent(event: CalendarEvent): string {
  const start = formatGoogleDate(event.startDate)
  const end = formatGoogleDate(resolveEndDate(event))

  const lines: readonly string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HireAgent//Calendar//EN',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    ...(event.description ? [`DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`] : []),
    ...(event.location ? [`LOCATION:${event.location}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

/**
 * Triggers a browser download of an .ics file for the given event.
 * Only call from client-side code.
 */
export function downloadICSFile(event: CalendarEvent): void {
  const content = generateICSContent(event)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.ics`
  anchor.click()

  URL.revokeObjectURL(url)
}
