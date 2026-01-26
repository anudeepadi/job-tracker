export interface Activity {
  id: string
  applicationId: string
  type: string
  description: string
  date: string | Date
  createdAt: string | Date
}

export interface Reminder {
  id: string
  applicationId: string
  title: string
  description?: string | null
  dueDate: string | Date
  completed: boolean
  createdAt: string | Date
  application?: {
    id: string
    company: string
    jobTitle: string
    status: string
  }
}

export interface Application {
  id: string
  company: string
  jobTitle: string
  jobUrl?: string | null
  location?: string | null
  locationType?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  currency?: string | null
  status: string
  priority: string
  source?: string | null
  contactPerson?: string | null
  contactEmail?: string | null
  appliedDate: string | Date
  notes?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  aiSearchId?: string | null
  activities?: Activity[]
  reminders?: Reminder[]
}

export interface ApplicationStats {
  totalApplications: number
  responseRate: number
  weeklyApplications: number
  monthlyApplications: number
  statusCounts: Record<string, number>
  sourceCounts: Record<string, number>
  averageResponseTime?: number
}

// Matches the shape used by UI components + `/api/job-search`
export interface JobResult {
  title: string
  company: string
  location: string
  url: string
  description?: string
  salary_range?: string
  posted_date?: string
  source: string
}

export interface ParsedJobParams {
  jobRole: string
  location: string
  numResults: number
  additionalPreferences?: string[]
  confidence: number
}

export interface GeminiParseResponse {
  success: boolean
  parsedParams?: ParsedJobParams
  interpretation?: string
  error?: string
}

export interface JobSearchResponse {
  status: 'searching' | 'completed' | 'error'
  results: JobResult[]
  total_found: number
  search_time_seconds?: number
  error?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isLoading?: boolean
  error?: string
  parsedParams?: ParsedJobParams
  jobResults?: JobResult[]
}

export const STATUS_OPTIONS = [
  'Saved',
  'Applied',
  'Phone Screen',
  'Technical Interview',
  'Final Interview',
  'Offer',
  'Rejected',
] as const

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'] as const

export const LOCATION_TYPE_OPTIONS = ['Remote', 'Hybrid', 'Onsite'] as const

export const SOURCE_OPTIONS = [
  'LinkedIn',
  'Company Website',
  'Referral',
  'Glassdoor',
  'Indeed',
  'AngelList',
  'AI Search',
  'Other',
] as const

export const STATUS_COLORS: Record<string, string> = {
  Saved: '#3b82f6',
  Applied: '#a855f7',
  'Phone Screen': '#f59e0b',
  'Technical Interview': '#f97316',
  'Final Interview': '#fb7185',
  Offer: '#22c55e',
  Rejected: '#ef4444',
}

