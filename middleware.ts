import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// IMPORTANT:
// Next.js `middleware` always runs in the Edge Runtime.
// Do NOT import Node-only auth code (e.g. NextAuth Credentials + bcrypt/prisma) here.
// Instead, read the NextAuth JWT via `getToken()`.
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const debug = process.env.DEBUG_MW_AUTH === '1'
  if (debug) {
    // Avoid logging the full token (could contain sensitive data)
    console.log('[middleware]', {
      pathname,
      authenticated: Boolean(token),
      role: (token as any)?.role,
    })
  }
  
  // Protect candidate routes
  if (pathname.startsWith('/candidate')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if ((token as any)?.role !== 'CANDIDATE') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Protect employer routes
  if (pathname.startsWith('/employer')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if ((token as any)?.role !== 'EMPLOYER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if ((token as any)?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  // Also protect dashboard routes (for backward compatibility)
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/candidate/:path*', '/employer/:path*', '/admin/:path*', '/dashboard/:path*'],
}
