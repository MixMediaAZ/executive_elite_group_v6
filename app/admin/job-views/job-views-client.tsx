'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface JobRow {
  jobId: string
  title: string | null
  company: string | null
  status: string | null
  views: number
  uniques: number
  applications: number
  conversion: number
}

interface JobViewsData {
  period: string
  totals: {
    views: number
    uniques: number
    listingsWithViews: number
    applications: number
  }
  jobs: JobRow[]
}

type SortKey = 'title' | 'company' | 'status' | 'views' | 'uniques' | 'applications' | 'conversion'

const PERIODS: { key: string; label: string }[] = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'all', label: 'All Time' },
]

export default function JobViewsClient() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState<JobViewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('views')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/job-views?period=${period}`)
        const json: JobViewsData = await res.json()
        if (!cancelled && res.ok) setData(json)
        else if (!cancelled) setData(null)
      } catch (err) {
        console.error('Failed to fetch job views:', err)
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => {
      cancelled = true
    }
  }, [period])

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      // Text columns default to ascending, numeric columns to descending.
      setSortDir(key === 'title' || key === 'company' || key === 'status' ? 'asc' : 'desc')
    }
  }

  const sortedJobs = data
    ? [...data.jobs].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        let cmp: number
        if (typeof av === 'number' && typeof bv === 'number') {
          cmp = av - bv
        } else {
          cmp = String(av ?? '').localeCompare(String(bv ?? ''))
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading job views...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Failed to load job views. Please try refreshing the page.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-md ${
              period === p.key
                ? 'bg-eeg-blue-electric text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Job Views" value={data.totals.views.toLocaleString()} />
        <MetricCard title="Unique Viewers" value={data.totals.uniques.toLocaleString()} />
        <MetricCard title="Listings With Views" value={data.totals.listingsWithViews.toLocaleString()} />
        <MetricCard title="Total Applications" value={data.totals.applications.toLocaleString()} />
      </div>

      {/* Per-job table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortableTh label="Job" col="title" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left" />
                <SortableTh label="Company" col="company" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left" />
                <SortableTh label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="left" />
                <SortableTh label="Views" col="views" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortableTh label="Unique" col="uniques" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortableTh label="Applications" col="applications" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                <SortableTh label="Conv. %" col="conversion" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No job postings found.
                  </td>
                </tr>
              ) : (
                sortedJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-eeg-charcoal">
                      <Link href={`/jobs/${job.jobId}`} className="hover:text-eeg-blue-electric hover:underline">
                        {job.title || '(untitled)'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.company || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{job.status || '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{job.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{job.uniques.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{job.applications.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {(job.conversion * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SortableTh({
  label,
  col,
  sortKey,
  sortDir,
  onClick,
  align,
}: {
  label: string
  col: SortKey
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onClick: (key: SortKey) => void
  align: 'left' | 'right'
}) {
  const active = sortKey === col
  return (
    <th
      onClick={() => onClick(col)}
      className={`px-4 py-3 font-semibold text-gray-600 uppercase tracking-wide text-xs cursor-pointer select-none whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {label}
      <span className="ml-1 text-gray-400">{active ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
    </th>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-eeg-charcoal">{value}</p>
    </div>
  )
}
