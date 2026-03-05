/**
 * Structured logging module using pino.
 *
 * Provides JSON output in production and pretty-printed output in development.
 * Use `createRequestLogger` to create child loggers with request context.
 */

import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || 'info'

/**
 * Root application logger.
 *
 * - JSON output in production (for structured log ingestion)
 * - Pretty-printed output in development (for readability)
 */
export const logger = pino({
  level: logLevel,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
})

/**
 * Creates a child logger with request context bound to every log entry.
 *
 * @param endpoint - The API endpoint being handled (e.g. "/api/applications")
 * @param userId  - Optional authenticated user ID
 * @returns A pino child logger with endpoint and userId bindings
 */
export function createRequestLogger(endpoint: string, userId?: string) {
  return logger.child({
    endpoint,
    ...(userId ? { userId } : {}),
  })
}
