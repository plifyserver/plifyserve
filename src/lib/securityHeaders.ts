export function createCspNonce() {
  return btoa(crypto.randomUUID())
}

export function buildContentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV !== 'production'
  return [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    isDev
      ? "connect-src 'self' http: https: ws: wss: blob:"
      : "connect-src 'self' https: wss: blob:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob: https://unpkg.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://accounts.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://accounts.google.com",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join('; ')
}

export function applyContentSecurityPolicy(response: Response, nonce: string) {
  response.headers.set('Content-Security-Policy', buildContentSecurityPolicy(nonce))
  return response
}
