'use client'

import { useEffect, useState } from 'react'

type Stats = {
  windowDays: number
  totals: {
    today: { views: number; uniques: number }
    window: { views: number; uniques: number; jobsBoardViews: number }
    allTime: { views: number; uniques: number }
  }
  sessions: { count: number; avgPagesPerSession: number; bounceRate: number }
  series: Array<{ day: string; views: number; uniques: number; registrations: number }>
  topPages: Array<{ path: string; views: number; uniques: number; avgMs: number | null }>
  topReferrers: Array<{ host: string; views: number }>
  utms: Array<{ source: string; medium: string; campaign: string; views: number }>
  topJobs: Array<{ jobId: string; title: string | null; company: string | null; views: number; uniques: number }>
  countries: Array<{ country: string; views: number }>
  authSplit: Array<{ kind: string; views: number }>
}

function fmt(n: number) { return n.toLocaleString() }
function fmtMs(ms: number | null) {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}
function fmtPct(x: number) { return `${(x * 100).toFixed(1)}%` }

export default function TrafficClient() {
  const [days, setDays] = useState(14)
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null)
    fetch(`/api/admin/traffic?days=${days}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [days])

  if (loading && !data) return <div className="text-neutral-600">Loading traffic…</div>
  if (error) return <div className="text-red-600">Failed to load: {error}</div>
  if (!data) return null

  const maxBar = Math.max(1, ...data.series.map(d => Math.max(d.views, d.uniques)))

  return (
    <div className="space-y-8">
      {/* Window selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-600">Window:</span>
        {[7, 14, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-md text-sm border ${days === d ? 'bg-eeg-charcoal text-white border-eeg-charcoal' : 'bg-white border-neutral-300 hover:bg-neutral-50'}`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Today — pageviews" value={fmt(data.totals.today.views)} sub={`${fmt(data.totals.today.uniques)} unique visitors`} />
        <Kpi label={`${days}d — pageviews`} value={fmt(data.totals.window.views)} sub={`${fmt(data.totals.window.uniques)} unique`} />
        <Kpi label={`${days}d — jobs board`} value={fmt(data.totals.window.jobsBoardViews)} sub={`${fmt(data.sessions.count)} sessions`} />
        <Kpi label="All-time" value={fmt(data.totals.allTime.views)} sub={`${fmt(data.totals.allTime.uniques)} unique visitors`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Sessions" value={fmt(data.sessions.count)} />
        <Kpi label="Avg pages / session" value={data.sessions.avgPagesPerSession?.toFixed(2) ?? '0'} />
        <Kpi label="Bounce rate" value={fmtPct(data.sessions.bounceRate ?? 0)} sub="single-page sessions" />
        <Kpi label="Auth split" value={(() => {
          const a = data.authSplit.find(x => x.kind === 'authenticated')?.views ?? 0
          const total = data.authSplit.reduce((s, x) => s + x.views, 0) || 1
          return `${fmtPct(a / total)} logged in`
        })()} />
      </div>

      {/* Daily chart */}
      <Card title={`Daily traffic (last ${days} days)`}>
        <div className="space-y-1">
          {data.series.map(d => (
            <div key={d.day} className="flex items-center gap-3 text-xs">
              <div className="w-20 text-neutral-500">{d.day.slice(5)}</div>
              <div className="flex-1 relative h-5 bg-neutral-100 rounded">
                <div
                  className="absolute inset-y-0 left-0 bg-eeg-blue-electric/30 rounded"
                  style={{ width: `${(d.views / maxBar) * 100}%` }}
                  title={`${d.views} views`}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-eeg-blue-electric rounded"
                  style={{ width: `${(d.uniques / maxBar) * 100}%` }}
                  title={`${d.uniques} unique`}
                />
              </div>
              <div className="w-32 text-right tabular-nums text-neutral-700">
                {fmt(d.views)} <span className="text-neutral-400">/ {fmt(d.uniques)}</span>
              </div>
              <div className="w-20 text-right tabular-nums text-neutral-500">
                +{d.registrations}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2 border-t mt-2">
            <span><span className="inline-block w-3 h-3 bg-eeg-blue-electric rounded-sm mr-1" />unique</span>
            <span><span className="inline-block w-3 h-3 bg-eeg-blue-electric/30 rounded-sm mr-1" />pageviews</span>
            <span className="ml-auto">right column = new registrations</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top pages">
          <Table
            head={['Path', 'Views', 'Unique', 'Avg time']}
            rows={data.topPages.map(p => [p.path, fmt(p.views), fmt(p.uniques), fmtMs(p.avgMs)])}
          />
        </Card>

        <Card title="Top referrers">
          <Table
            head={['Source', 'Views']}
            rows={data.topReferrers.map(r => [r.host, fmt(r.views)])}
          />
        </Card>

        <Card title="Top jobs viewed">
          {data.topJobs.length === 0 ? (
            <div className="text-sm text-neutral-500">No job views yet in this window.</div>
          ) : (
            <Table
              head={['Job', 'Views', 'Unique']}
              rows={data.topJobs.map(j => [
                j.title ? `${j.title}${j.company ? ' — ' + j.company : ''}` : j.jobId,
                fmt(j.views),
                fmt(j.uniques),
              ])}
            />
          )}
        </Card>

        <Card title="UTM campaigns">
          {data.utms.length === 0 ? (
            <div className="text-sm text-neutral-500">No tagged traffic yet. Add <code>?utm_source=…&utm_medium=…&utm_campaign=…</code> to campaign links.</div>
          ) : (
            <Table
              head={['Source', 'Medium', 'Campaign', 'Views']}
              rows={data.utms.map(u => [u.source, u.medium, u.campaign, fmt(u.views)])}
            />
          )}
        </Card>

        <Card title="Countries">
          <Table
            head={['Country', 'Views']}
            rows={data.countries.map(c => [c.country, fmt(c.views)])}
          />
        </Card>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold text-eeg-charcoal mt-1">{value}</div>
      {sub && <div className="text-xs text-neutral-500 mt-1">{sub}</div>}
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <h3 className="font-semibold text-eeg-charcoal mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (rows.length === 0) return <div className="text-sm text-neutral-500">No data.</div>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b">
            {head.map(h => <th key={h} className="py-2 pr-3">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-3 ${j === 0 ? 'font-medium text-eeg-charcoal' : 'tabular-nums text-neutral-700'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
