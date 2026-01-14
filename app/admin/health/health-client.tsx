'use client'

import { useEffect, useState } from 'react'

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; httpStatus: number; body: unknown }

async function fetchJson(path: string): Promise<{ httpStatus: number; body: unknown }> {
  const res = await fetch(path, { cache: 'no-store' })
  const body = await res.json()
  return { httpStatus: res.status, body }
}

export default function AdminHealthClient() {
  const [health, setHealth] = useState<FetchState>({ status: 'loading' })
  const [detailed, setDetailed] = useState<FetchState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    Promise.all([fetchJson('/api/health'), fetchJson('/api/health/detailed')])
      .then(([h, d]) => {
        if (cancelled) return
        setHealth({ status: 'ready', httpStatus: h.httpStatus, body: h.body })
        setDetailed({ status: 'ready', httpStatus: d.httpStatus, body: d.body })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : String(err)
        setHealth({ status: 'error', message: msg })
        setDetailed({ status: 'error', message: msg })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quick visibility into critical services and environment configuration.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">/api/health</div>
              <div className="font-mono">
                {health.status === 'ready' ? health.httpStatus : health.status}
              </div>
            </div>
            <div>
              <div className="text-gray-500">/api/health/detailed</div>
              <div className="font-mono">
                {detailed.status === 'ready' ? detailed.httpStatus : detailed.status}
              </div>
            </div>
          </div>
          {(health.status === 'error' || detailed.status === 'error') && (
            <div className="mt-4 text-sm text-red-700">
              {(health.status === 'error' && health.message) ||
                (detailed.status === 'error' && detailed.message) ||
                'Error loading health checks.'}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900">/api/health</h2>
          <pre className="mt-4 text-xs bg-gray-50 border border-gray-100 rounded p-4 overflow-auto">
            {health.status === 'ready' ? JSON.stringify(health.body, null, 2) : 'Loading...'}
          </pre>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900">/api/health/detailed</h2>
          <pre className="mt-4 text-xs bg-gray-50 border border-gray-100 rounded p-4 overflow-auto">
            {detailed.status === 'ready' ? JSON.stringify(detailed.body, null, 2) : 'Loading...'}
          </pre>
        </div>
      </div>
    </div>
  )
}

