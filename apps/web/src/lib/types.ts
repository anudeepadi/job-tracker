// =============================================================================
// Type Definitions for Job Search Platform
// =============================================================================

// =============================================================================
// Application Types
// =============================================================================

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
  userId?: string | null
  aiSearchId?: string | null
}

export interface ApplicationStats {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  bySource: Record<string, number>
  averageSalary?: number
  recentCount: number
}

// =============================================================================
// Job Search Types
// =============================================================================

export interface JobResult {
  id: string
  searchId: string
  title: string
  company: string
  location?: string | null
  salary?: string | null
  salary_range?: string // Alternative field name
  description?: string | null
  applyUrl?: string | null
  url?: string // Alternative field name
  sourceUrl?: string | null
  postedDate?: string | null
  jobType?: string | null
  remote?: boolean | null
  createdAt?: string | Date
  importedAsApplicationId?: string | null
  importedAt?: string | Date | null
  source?: string // For AI search results
}

// =============================================================================
// Activity & Reminder Types
// =============================================================================

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
  application?: Application
}

// =============================================================================
// AI Chat Types
// =============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  jobResults?: JobResult[]
}

export interface GeminiParseResponse {
  role: string
  location?: string
  numResults?: number
  filters?: {
    salaryMin?: number
    salaryMax?: number
    remote?: boolean
    jobType?: string
  }
}

export interface JobSearchResponse {
  success: boolean
  message?: string
  jobResults?: JobResult[]
  error?: string
}

// =============================================================================
// Option Constants
// =============================================================================

export const STATUS_OPTIONS = [
  { value: 'Applied', label: 'Applied' },
  { value: 'Interviewing', label: 'Interviewing' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Withdrawn', label: 'Withdrawn' },
  { value: 'Pending', label: 'Pending' },
] as const

export const PRIORITY_OPTIONS = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
] as const

export const LOCATION_TYPE_OPTIONS = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Onsite', label: 'Onsite' },
] as const

export const SOURCE_OPTIONS = [
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Indeed', label: 'Indeed' },
  { value: 'Company Website', label: 'Company Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Recruiter', label: 'Recruiter' },
  { value: 'AI Search', label: 'AI Search' },
  { value: 'Other', label: 'Other' },
] as const

// =============================================================================
// Status Color Mapping
// =============================================================================

export const STATUS_COLORS: Record<string, string> = {
  Applied: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  Interviewing: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Offer: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  Rejected: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  Withdrawn: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
  Pending: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
}

export const PRIORITY_COLORS: Record<string, string> = {
  High: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Low: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
}

// =============================================================================
// Type Guards & Helpers
// =============================================================================

export function isApplication(obj: any): obj is Application {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.company === 'string' &&
    typeof obj.jobTitle === 'string' &&
    typeof obj.status === 'string'
  )
}

export function isJobResult(obj: any): obj is JobResult {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.company === 'string'
  )
}
