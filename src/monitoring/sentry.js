import * as Sentry from '@sentry/react'

const dsn = String(import.meta.env.VITE_SENTRY_DSN || '').trim()
let initialized = false

export function isSentryEnabled() {
  return import.meta.env.PROD && Boolean(dsn) && initialized
}

export function initSentry() {
  if (!import.meta.env.PROD || !dsn || initialized) return false

  const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1)

  Sentry.init({
    dsn,
    environment: String(import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'production').trim(),
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.authorization
      }
      return event
    },
  })

  initialized = true
  return true
}

export function captureException(error, context = {}) {
  if (!isSentryEnabled()) return
  Sentry.withScope((scope) => {
    if (context.tags) scope.setTags(context.tags)
    if (context.extra) scope.setExtras(context.extra)
    if (context.contexts) scope.setContext('details', context.contexts)
    Sentry.captureException(error)
  })
}

/** Report unexpected API failures (5xx / network) — not routine 4xx auth/validation errors. */
export function reportApiError(error, { path, method, status } = {}) {
  if (!isSentryEnabled()) return
  if (status != null && status < 500) return
  captureException(error, {
    tags: { source: 'api', api_path: path || 'unknown' },
    extra: { method, status },
  })
}

export { Sentry }
