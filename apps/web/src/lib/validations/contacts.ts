import { z } from 'zod'

export const contactSourceEnum = z.enum([
  'manual',
  'referral',
  'networking',
  'cold',
  'event',
])

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  source: contactSourceEnum.default('manual'),
})

export const updateContactSchema = createContactSchema.partial()
