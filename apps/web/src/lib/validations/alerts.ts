import { z } from 'zod'

const alertFrequencyEnum = z.enum(['daily', 'weekly', 'realtime'])

const searchCriteriaSchema = z.object({
  role: z.string().min(1),
  location: z.string().optional(),
  filters: z.record(z.unknown()).optional(),
})

export const createAlertSchema = z.object({
  name: z.string().min(1),
  searchCriteria: searchCriteriaSchema,
  frequency: alertFrequencyEnum,
})

export const updateAlertSchema = z.object({
  name: z.string().min(1).optional(),
  searchCriteria: searchCriteriaSchema.optional(),
  frequency: alertFrequencyEnum.optional(),
  isActive: z.boolean().optional(),
})
