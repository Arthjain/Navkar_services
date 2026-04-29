let _secret: Uint8Array | null = null

export function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV === 'development') {
    return 'fallback-dev-secret-change-in-production'
  }

  throw new Error('SESSION_SECRET must be set outside local development')
}

/** Lazily resolved — safe to call at request time, not module load time */
export function getSecretKey(): Uint8Array {
  if (!_secret) {
    _secret = new TextEncoder().encode(getSessionSecret())
  }
  return _secret
}