import { type NextRequest, NextResponse } from 'next/server'
import { isLocalDevHost, isPalhaWeddingsHost } from '@/lib/hosts'

export function palhaApiAllowed(request: NextRequest) {
  return isPalhaWeddingsHost(request) || isLocalDevHost(request)
}

export function palhaApiForbidden() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
