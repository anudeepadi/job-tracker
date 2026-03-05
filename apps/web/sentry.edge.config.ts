/**
 * Sentry edge runtime configuration for Next.js.
 *
 * Initializes Sentry in edge runtime environments (middleware, edge API routes).
 * Only activates when NEXT_PUBLIC_SENTRY_DSN is set in the environment.
 */

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  })
}
