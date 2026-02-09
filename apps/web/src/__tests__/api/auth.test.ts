import { describe, it, expect } from 'vitest'

describe('Auth API', () => {
  const baseUrl = 'http://localhost:3000'

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('token')
      expect(data.user.email).toBe('test@example.com')
      expect(data.token).toBe('mock-jwt-token')
    })

    it('should reject invalid credentials', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data.error).toBe('Invalid email or password')
    })
  })

  describe('POST /api/auth/register', () => {
    it('should register new user with valid data', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'securepassword123',
          name: 'New User',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('token')
      expect(data.user.email).toBe('newuser@example.com')
      expect(data.user.name).toBe('New User')
    })

    it('should reject registration with existing email', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'password123',
          name: 'Existing User',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Email already exists')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user with valid session', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('user')
      expect(data.user.email).toBe('test@example.com')
    })

    it('should reject requests without session token', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Protected route access', () => {
    it('should allow authenticated users to access protected routes', async () => {
      const response = await fetch(`${baseUrl}/api/applications`, {
        headers: {
          'cookie': 'session-token=mock-jwt-token',
        },
      })

      expect(response.status).toBe(200)
    })

    it('should reject unauthenticated users from protected routes', async () => {
      const response = await fetch(`${baseUrl}/api/applications`)

      expect(response.status).toBe(401)
    })
  })
})
