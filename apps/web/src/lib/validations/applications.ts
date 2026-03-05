import { z } from 'zod'

const applicationStatusEnum = z.enum([
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Withdrawn',
  'Pending',
])

const applicationPriorityEnum = z.enum(['High', 'Medium', 'Low'])

const locationTypeEnum = z.enum(['Remote', 'Hybrid', 'Onsite'])

export const createApplicationSchema = z.object({
  company: z.string().min(1),
  jobTitle: z.string().min(1),
  jobUrl: z.string().url().optional(),
  location: z.string().optional(),
  locationType: locationTypeEnum.optional(),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  currency: z.string().optional(),
  status: applicationStatusEnum.optional(),
  priority: applicationPriorityEnum.optional(),
  source: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  appliedDate: z.string().optional(),
  notes: z.string().optional(),
})

export const updateApplicationSchema = createApplicationSchema.partial()
