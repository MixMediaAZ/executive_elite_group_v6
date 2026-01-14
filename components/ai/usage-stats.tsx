'use client'

import React, { useState, useEffect, useCallback } from 'react'

export function UsageStats() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('24h')

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message)
  }

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/usage-stats')
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats')
      }
      const result = await response.json()
      setStats(result.data)
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      showAlert('Failed to fetch usage statistics', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [timeRange, fetchStats])

  const getOperationIcon = (operationType: string) => {
    switch (operationType) {
      case 'job_description_generated':
        return '📝'
      case 'candidate_matching':
        return '🎯'
      case 'resume_analysis':
        return '📄'
      case 'interview_questions_generated':
        return '❓'
      case 'application_screening':
        return '🔍'
      case 'market_insights':
        return '📊'
      default:
        return '🤖'
    }
  }

  const getOperationName = (operationType: string) => {
    return operationType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1h':
        return 'Last Hour'
      case '24h':
        return 'Last 24 Hours'
      case '7d':
        return 'Last 7 Days'
      case '30d':
        return 'Last 30 Days'
      default:
        return 'Last 24 Hours'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📈</span>
            <h2 className="text-xl font-semibold text-gray-900">AI Usage Analytics</h2>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>
        </div>
        <p className="text-gray-600 mb-6">Monitor AI feature usage and platform performance metrics</p>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading usage statistics...</span>
          </div>
        )}

        {stats && !isLoading && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Operations</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalOperations}</p>
                  </div>
                  <span className="text-2xl">🤖</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active Features</p>
                    <p className="text-2xl font-bold text-green-900">
                      {Object.keys(stats.operationsByType || {}).length}
                    </p>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Unique Users</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {new Set(stats.recentActivity?.map((activity: any) => activity.userId).filter(Boolean)).size}
                    </p>
                  </div>
                  <span className="text-2xl">👥</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Avg per Hour</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {Math.round((stats.totalOperations || 0) / 24)}
                    </p>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            {/* Operations by Type */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Operations by Type</h3>
              {Object.keys(stats.operationsByType || {}).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.operationsByType).map(([operation, count]) => (
                    <div key={operation} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getOperationIcon(operation)}</span>
                        <span className="font-medium text-gray-900">{getOperationName(operation)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-blue-600">{count as number}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${((count as number) / (stats.totalOperations || 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No AI operations recorded yet</p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Activity</h3>
              {stats.recentActivity?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 10).map((activity: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getOperationIcon(activity.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{getOperationName(activity.type)}</p>
                          {activity.userId && (
                            <p className="text-sm text-gray-600">User: {activity.userId}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{formatTimestamp(activity.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent AI activity</p>
              )}
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2">Most Popular Feature</h4>
                  {Object.keys(stats.operationsByType || {}).length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getOperationIcon(Object.entries(stats.operationsByType).sort(([,a], [,b]) => (b as number) - (a as number))[0][0])}</span>
                      <span className="text-gray-700">
                        {getOperationName(Object.entries(stats.operationsByType).sort(([,a], [,b]) => (b as number) - (a as number))[0][0])}
                      </span>
                    </div>
                  ) : (
                    <p className="text-gray-500">No data available</p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium text-gray-900 mb-2">Usage Trend</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">📈</span>
                    <span className="text-gray-700">
                      {stats.totalOperations > 50 ? 'High Activity' : 
                       stats.totalOperations > 20 ? 'Moderate Activity' : 
                       stats.totalOperations > 0 ? 'Low Activity' : 'No Activity'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}