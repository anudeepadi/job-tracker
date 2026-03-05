import { describe, it, expect } from 'vitest'
import { logger, createRequestLogger } from '@/lib/logger'

describe('logger', () => {
  it('is defined and exposes standard log methods', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.fatal).toBe('function')
  })
})

describe('createRequestLogger', () => {
  it('returns a child logger with endpoint binding', () => {
    const child = createRequestLogger('/api/test')

    expect(child).toBeDefined()
    expect(typeof child.info).toBe('function')
    expect(typeof child.error).toBe('function')
    expect(typeof child.warn).toBe('function')

    // Pino child loggers expose their bindings
    const bindings = child.bindings()
    expect(bindings).toEqual(
      expect.objectContaining({ endpoint: '/api/test' })
    )
  })

  it('includes userId in bindings when provided', () => {
    const child = createRequestLogger('/api/applications', 'user-123')

    const bindings = child.bindings()
    expect(bindings).toEqual(
      expect.objectContaining({
        endpoint: '/api/applications',
        userId: 'user-123',
      })
    )
  })

  it('omits userId from bindings when not provided', () => {
    const child = createRequestLogger('/api/health')

    const bindings = child.bindings()
    expect(bindings.endpoint).toBe('/api/health')
    expect(bindings).not.toHaveProperty('userId')
  })
})
