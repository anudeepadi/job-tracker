import { describe, it, expect } from 'vitest'

describe('Contacts API', () => {
  const baseUrl = 'http://localhost:3000'

  describe('GET /api/contacts', () => {
    it('should return contacts for authenticated user', async () => {
      const response = await fetch(`${baseUrl}/api/contacts`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('contacts')
      expect(Array.isArray(data.contacts)).toBe(true)
      expect(data.contacts.length).toBeGreaterThan(0)
      expect(data.contacts[0]).toHaveProperty('id')
      expect(data.contacts[0]).toHaveProperty('name')
      expect(data.contacts[0]).toHaveProperty('source')
    })

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`${baseUrl}/api/contacts`)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Unauthorized')
    })

    it('should filter contacts by search query', async () => {
      const response = await fetch(`${baseUrl}/api/contacts?q=Jane`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.contacts.length).toBe(1)
      expect(data.contacts[0].name).toBe('Jane Smith')
    })
  })

  describe('POST /api/contacts', () => {
    it('should create contact with valid data', async () => {
      const newContact = {
        name: 'Alice Williams',
        company: 'Amazon',
        role: 'Tech Lead',
        email: 'alice@amazon.com',
        source: 'networking',
      }

      const response = await fetch(`${baseUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cookie': 'session-token=mock-jwt-token',
        },
        body: JSON.stringify(newContact),
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data).toHaveProperty('id')
      expect(data.name).toBe(newContact.name)
      expect(data.company).toBe(newContact.company)
      expect(data.source).toBe(newContact.source)
    })

    it('should return 400 for missing name', async () => {
      const invalidContact = {
        company: 'Amazon',
        role: 'Tech Lead',
      }

      const response = await fetch(`${baseUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cookie': 'session-token=mock-jwt-token',
        },
        body: JSON.stringify(invalidContact),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
    })

    it('should reject unauthenticated POST requests', async () => {
      const response = await fetch(`${baseUrl}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Contact',
        }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('DELETE /api/contacts/:id', () => {
    it('should delete contact for authenticated user', async () => {
      const response = await fetch(`${baseUrl}/api/contacts/contact-1`, {
        method: 'DELETE',
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('message')
    })

    it('should reject unauthenticated DELETE requests', async () => {
      const response = await fetch(`${baseUrl}/api/contacts/contact-1`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(401)
    })
  })
})
