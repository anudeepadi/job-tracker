import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import { createApplicationSchema, updateApplicationSchema } from '@/lib/validations/applications'
import { createAlertSchema, updateAlertSchema } from '@/lib/validations/alerts'
import { paginationSchema, idParamSchema, parseBody } from '@/lib/validations/common'

// =============================================================================
// Auth Schemas
// =============================================================================

describe('loginSchema', () => {
  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid input', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ email: 'test@example.com', password: 'password123' })
    }
  })
})

describe('registerSchema', () => {
  it('rejects password shorter than 8 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects password longer than 128 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'a'.repeat(129),
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 chars', () => {
    const result = registerSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'bad-email',
      password: 'password123',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid input', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
    }
  })
})

// =============================================================================
// Application Schemas
// =============================================================================

describe('createApplicationSchema', () => {
  it('rejects missing company', () => {
    const result = createApplicationSchema.safeParse({
      jobTitle: 'Engineer',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing jobTitle', () => {
    const result = createApplicationSchema.safeParse({
      company: 'TechCorp',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid input with only required fields', () => {
    const result = createApplicationSchema.safeParse({
      company: 'TechCorp',
      jobTitle: 'Software Engineer',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBe('TechCorp')
      expect(result.data.jobTitle).toBe('Software Engineer')
    }
  })

  it('accepts valid input with all optional fields', () => {
    const result = createApplicationSchema.safeParse({
      company: 'TechCorp',
      jobTitle: 'Software Engineer',
      status: 'Applied',
      priority: 'High',
      jobUrl: 'https://example.com/job',
      location: 'San Francisco',
      notes: 'Great opportunity',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status enum', () => {
    const result = createApplicationSchema.safeParse({
      company: 'TechCorp',
      jobTitle: 'Engineer',
      status: 'InvalidStatus',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid priority enum', () => {
    const result = createApplicationSchema.safeParse({
      company: 'TechCorp',
      jobTitle: 'Engineer',
      priority: 'SuperHigh',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateApplicationSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateApplicationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with single field', () => {
    const result = updateApplicationSchema.safeParse({ status: 'Interviewing' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('Interviewing')
    }
  })
})

// =============================================================================
// Alert Schemas
// =============================================================================

describe('createAlertSchema', () => {
  it('rejects missing name', () => {
    const result = createAlertSchema.safeParse({
      searchCriteria: { role: 'Engineer' },
      frequency: 'daily',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing searchCriteria', () => {
    const result = createAlertSchema.safeParse({
      name: 'My Alert',
      frequency: 'daily',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid frequency', () => {
    const result = createAlertSchema.safeParse({
      name: 'My Alert',
      searchCriteria: { role: 'Engineer' },
      frequency: 'monthly',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid input', () => {
    const result = createAlertSchema.safeParse({
      name: 'My Alert',
      searchCriteria: { role: 'Engineer', location: 'NYC' },
      frequency: 'weekly',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('My Alert')
      expect(result.data.frequency).toBe('weekly')
    }
  })

  it('accepts input without optional location in searchCriteria', () => {
    const result = createAlertSchema.safeParse({
      name: 'My Alert',
      searchCriteria: { role: 'Engineer' },
      frequency: 'realtime',
    })
    expect(result.success).toBe(true)
  })
})

describe('updateAlertSchema', () => {
  it('accepts empty object (all fields optional)', () => {
    const result = updateAlertSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update', () => {
    const result = updateAlertSchema.safeParse({ name: 'Updated Alert', isActive: false })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// Common Schemas
// =============================================================================

describe('paginationSchema', () => {
  it('defaults page to 1 and limit to 20', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
    }
  })

  it('rejects limit greater than 100', () => {
    const result = paginationSchema.safeParse({ page: 1, limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects non-positive page', () => {
    const result = paginationSchema.safeParse({ page: 0, limit: 20 })
    expect(result.success).toBe(false)
  })

  it('accepts valid pagination', () => {
    const result = paginationSchema.safeParse({ page: 3, limit: 50 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.limit).toBe(50)
    }
  })
})

describe('idParamSchema', () => {
  it('rejects empty id', () => {
    const result = idParamSchema.safeParse({ id: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid id', () => {
    const result = idParamSchema.safeParse({ id: 'cuid123abc' })
    expect(result.success).toBe(true)
  })
})

// =============================================================================
// parseBody helper
// =============================================================================

describe('parseBody', () => {
  it('returns parsed data on valid input', async () => {
    const mockRequest = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'pass123' }),
    })

    const result = await parseBody(mockRequest, loginSchema)
    expect('data' in result).toBe(true)
    if ('data' in result) {
      expect(result.data.email).toBe('test@example.com')
    }
  })

  it('returns error response on invalid input', async () => {
    const mockRequest = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    })

    const result = await parseBody(mockRequest, loginSchema)
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(400)
      const body = await result.error.json()
      expect(body.error).toBe('Validation failed')
      expect(body.details).toBeDefined()
    }
  })

  it('returns error response on malformed JSON', async () => {
    const mockRequest = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{',
    })

    const result = await parseBody(mockRequest, loginSchema)
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.status).toBe(400)
      const body = await result.error.json()
      expect(body.error).toBe('Invalid JSON body')
    }
  })
})
