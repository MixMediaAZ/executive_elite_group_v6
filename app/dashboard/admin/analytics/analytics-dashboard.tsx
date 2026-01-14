'use client'

import { useState, useEffect } from 'react'

interface Metrics {
  totalJobs: number
  liveJobs: number
  totalApplications: number
  totalUsers: number
  candidates: number
  employers: number
  totalRevenue: { amountCents: number | null }
  eventCounts: {
    jobViews: number
    jobApplies: number
    profileViews: number
  }
}

interface AnalyticsData {
  metrics: Metrics
  eventsByDay: Record<string, number>
  period: string
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const response = await fetch(`/api/analytics?period=${period}`)
        const analyticsData: AnalyticsData = await response.json()
        if (response.ok) {
          setData(analyticsData)
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Failed to load analytics. Please try refreshing the page.
      </div>
    )
  }

  const revenue = data.metrics.totalRevenue.amountCents
    ? (data.metrics.totalRevenue.amountCents / 100).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod('7d')}
          className={`px-4 py-2 rounded-md ${
            period === '7d'
              ? 'bg-eeg-blue-electric text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-md ${
            period === '30d'
              ? 'bg-eeg-blue-electric text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setPeriod('90d')}
          className={`px-4 py-2 rounded-md ${
            period === '90d'
              ? 'bg-eeg-blue-electric text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Last 90 Days
        </button>
        <button
          onClick={() => setPeriod('all')}
          className={`px-4 py-2 rounded-md ${
            period === 'all'
              ? 'bg-eeg-blue-electric text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Time
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Jobs" value={data.metrics.totalJobs.toString()} />
        <MetricCard title="Live Jobs" value={data.metrics.liveJobs.toString()} />
        <MetricCard title="Applications" value={data.metrics.totalApplications.toString()} />
        <MetricCard title="Total Users" value={data.metrics.totalUsers.toString()} />
        <MetricCard title="Candidates" value={data.metrics.candidates.toString()} />
        <MetricCard title="Employers" value={data.metrics.employers.toString()} />
        <MetricCard title="Revenue" value={`$${revenue}`} />
        <MetricCard title="Job Views" value={data.metrics.eventCounts.jobViews.toString()} />
      </div>

      {/* Event Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity Over Time</h2>
        {Object.keys(data.eventsByDay).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No activity data available for this period.
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(data.eventsByDay)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-14)
              .map(([day, count]) => {
                const maxCount = Math.max(...Object.values(data.eventsByDay), 1)
                const percentage = (count / maxCount) * 100
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">
                      {new Date(day).toLocaleDateString()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-eeg-blue-electric h-6 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        >
                          <span className="text-xs text-white font-medium">{count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
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

