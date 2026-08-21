import type { NextRequest } from 'next/server'

const PALHA_HOSTS = new Set([
  'palhaweddings.plify360.com.br',
  'www.palhaweddings.plify360.com.br',
  'palhaweddings.localhost',
  'www.palhaweddings.localhost',
])

export function hostnameFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const hostHeader = forwarded || request.headers.get('host')?.trim() || ''
  return hostHeader.split(':')[0].toLowerCase()
}

export function isLocalDevHost(request: NextRequest): boolean {
  const host = hostnameFromRequest(request)
  return host === 'localhost' || host === '127.0.0.1'
}

export function isPalhaWeddingsHost(request: NextRequest): boolean {
  return PALHA_HOSTS.has(hostnameFromRequest(request))
}
