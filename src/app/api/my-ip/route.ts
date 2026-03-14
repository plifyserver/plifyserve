import { NextRequest, NextResponse } from 'next/server'

function getClientIp(request: NextRequest): string | null {
  const headers = request.headers
  const forwarded = headers.get('x-forwarded-for') || headers.get('x-vercel-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-client-ip') ||
    null
  )
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  return NextResponse.json({ ip: ip ?? null })
}
