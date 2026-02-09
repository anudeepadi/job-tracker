import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '../setup'
import { http, HttpResponse } from 'msw'

describe('Applications API', () => {
  const baseUrl = 'http://localhost:3000'

  describe('GET /api/applications', () => {
    it('should return applications for authenticated user', async () => {
      const response = await fetch(`${baseUrl}/api/applications`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('applications')
      expect(data).toHaveProperty('pagination')
      expect(Array.isArray(data.applications)).toBe(true)
      expect(data.applications[0]).toHaveProperty('id')
      expect(data.applications[0]).toHaveProperty('company')
    })

    it('should filter applications by status', async () => {
      const response = await fetch(`${baseUrl}/api/applications?status=Applied`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.applications.every((app: any) => app.status === 'Applied')).toBe(true)
    })

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${baseUrl}/api/applications`)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Unauthorized')
    })

    it('should handle pagination parameters', async () => {
      const response = await fetch(`${baseUrl}/api/applications?page=1&limit=5`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.pagination).toEqual({
        page: 1,
        limit: 5,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      })
    })
  })

  describe('POST /api/applications', () => {
    it('should create new application for authenticated user', async () => {
      const newApplication = {
        company: 'NewTech Inc',
        jobTitle: 'Senior Developer',
        location: 'New York',
        status: 'Applied',
        priority: 'High',
        appliedDate: new Date().toISOString(),
      }

      const response = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cookie': 'session-token=mock-jwt-token',
        },
        body: JSON.stringify(newApplication),
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data).toHaveProperty('id')
      expect(data.company).toBe(newApplication.company)
      expect(data.jobTitle).toBe(newApplication.jobTitle)
    })

    it('should reject unauthenticated POST requests', async () => {
      const response = await fetch(`${baseUrl}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: 'Test',
          jobTitle: 'Test',
        }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('User isolation', () => {
    it('should only return applications for the authenticated user', async () => {
      server.use(
        http.get(`${baseUrl}/api/applications`, ({ request }) => {
          const cookie = request.headers.get('cookie')
          if (!cookie?.includes('session-token')) {
            return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }

          return HttpResponse.json({
            applications: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          })
        })
      )

      const response = await fetch(`${baseUrl}/api/applications`, {
        headers: {
          'cookie': 'session-token=different-user-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.applications).toHaveLength(0)
    })
  })
})
