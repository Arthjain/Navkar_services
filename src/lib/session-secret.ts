const FALLBACK_SESSION_SECRET = 'fallback-dev-secret-change-in-production'

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV === 'development') {
    return FALLBACK_SESSION_SECRET
  }

  throw new Error('SESSION_SECRET must be set outside local development')
}