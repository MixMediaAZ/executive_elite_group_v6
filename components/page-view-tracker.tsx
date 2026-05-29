'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SESSION_KEY = 'eeg_sid'

// In-memory fallback for when sessionStorage is unavailable (privacy mode,
// blocked storage, embedded contexts) — accessing it there throws SecurityError.
let memorySid = ''

function newSid(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = newSid()
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    if (!memorySid) memorySid = newSid()
    return memorySid
  }
}

export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef<string | null>(null)
  const pageStart = useRef<number>(Date.now())
  const currentPath = useRef<string>('')

  useEffect(() => {
    if (!pathname) return
    // Skip admin pages — don't pollute traffic stats with admin browsing
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) return

    const fullPath = pathname + (searchParams?.toString() ? '?' + searchParams.toString() : '')
    if (lastPath.current === fullPath) return

    // Flush duration for previous page before recording new one
    if (lastPath.current && currentPath.current) {
      const elapsed = Date.now() - pageStart.current
      try {
        const payload = JSON.stringify({
          sessionId: getSessionId(),
          path: currentPath.current,
          durationMs: elapsed,
        })
        navigator.sendBeacon?.('/api/track/heartbeat', new Blob([payload], { type: 'application/json' }))
      } catch { /* noop */ }
    }

    lastPath.current = fullPath
    currentPath.current = fullPath
    pageStart.current = Date.now()

    const utm = {
      source: searchParams?.get('utm_source') || undefined,
      medium: searchParams?.get('utm_medium') || undefined,
      campaign: searchParams?.get('utm_campaign') || undefined,
    }
    const referrer = typeof document !== 'undefined' ? document.referrer || undefined : undefined

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: getSessionId(), path: fullPath, referrer, utm }),
      keepalive: true,
    }).catch(() => { /* swallow */ })
  }, [pathname, searchParams])

  useEffect(() => {
    const flush = () => {
      if (!currentPath.current) return
      const elapsed = Date.now() - pageStart.current
      try {
        const payload = JSON.stringify({
          sessionId: getSessionId(),
          path: currentPath.current,
          durationMs: elapsed,
        })
        navigator.sendBeacon?.('/api/track/heartbeat', new Blob([payload], { type: 'application/json' }))
      } catch { /* noop */ }
    }
    const onVis = () => { if (document.visibilityState === 'hidden') flush() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', flush)
    }
  }, [])

  return null
}
