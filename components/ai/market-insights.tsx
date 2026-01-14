'use client'

import React, { useState } from 'react'

interface MarketInsightsProps {
  onGenerated?: (data: any) => void
}

export function MarketInsights({ onGenerated }: MarketInsightsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [insightsResult, setInsightsResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    orgType: '',
    jobLevel: '',
    location: ''
  })

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/market-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orgType: formData.orgType || undefined,
          jobLevel: formData.jobLevel || undefined,
          location: formData.location || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get market insights')
      }

      const result = await response.json()
      setInsightsResult(result.data)
      onGenerated?.(result.data)
      showAlert('Market insights generated successfully!')
    } catch (error) {
      console.error('Error getting market insights:', error)
      showAlert('Failed to get market insights. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const orgTypes = [
    { value: '', label: 'All Organization Types' },
    { value: 'HEALTH_SYSTEM', label: 'Health System' },
    { value: 'HOSPICE', label: 'Hospice' },
    { value: 'LTC', label: 'Long Term Care' },
    { value: 'HOME_CARE', label: 'Home Care' },
    { value: 'POST_ACUTE', label: 'Post Acute' },
    { value: 'OTHER', label: 'Other Healthcare' }
  ]

  const jobLevels = [
    { value: '', label: 'All Job Levels' },
    { value: 'C_SUITE', label: 'C-Suite (CEO, CFO, COO, etc.)' },
    { value: 'VP', label: 'Vice President' },
    { value: 'DIRECTOR', label: 'Director' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'OTHER_EXECUTIVE', label: 'Other Executive' }
  ]

  const getCompetitionColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'high':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const downloadInsights = () => {
    if (!insightsResult) return

    const content = `# Healthcare Executive Market Insights

Generated with AI on ${new Date().toLocaleDateString()}

## Search Parameters
- Organization Type: ${formData.orgType || 'All'}
- Job Level: ${formData.jobLevel || 'All'}
- Location: ${formData.location || 'United States'}

## Salary Range
- Minimum: ${formatCurrency(insightsResult.salaryRange?.min || 0)}
- Maximum: ${formatCurrency(insightsResult.salaryRange?.max || 0)}
- Currency: ${insightsResult.salaryRange?.currency || 'USD'}

## Market Trends
${insightsResult.marketTrends?.map((trend: string, index: number) => 
  `${index + 1}. ${trend}`
).join('\n')}

## In-Demand Skills
${insightsResult.inDemandSkills?.map((skill: string, index: number) => 
  `- ${skill}`
).join('\n')}

## Competition Level
${insightsResult.competitionLevel}

## Hiring Tips
${insightsResult.hiringTips?.map((tip: string, index: number) => 
  `${index + 1}. ${tip}`
).join('\n')}
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'market-insights.md'
    a.click()
    URL.revokeObjectURL(url)
    showAlert('Market insights downloaded!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-indigo-600">📊</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Market Insights</h2>
        </div>
        <p className="text-gray-600 mb-6">Get real-time market analysis, salary insights, and hiring trends for healthcare executive positions</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type
              </label>
              <select
                value={formData.orgType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, orgType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              >
                {orgTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Level
              </label>
              <select
                value={formData.jobLevel}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, jobLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              >
                {jobLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Chicago, IL or United States"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing Market...' : '📊 Get Market Insights'}
          </button>
        </form>
      </div>

      {insightsResult && (
        <div className="space-y-4">
          {/* Salary Range */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Salary Range</h3>
              <button
                onClick={downloadInsights}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Download Report
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Minimum</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(insightsResult.salaryRange?.min || 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Median Range</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(Math.round(((insightsResult.salaryRange?.min || 0) + (insightsResult.salaryRange?.max || 0)) / 2))}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Maximum</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(insightsResult.salaryRange?.max || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Competition Level */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Competition Level</h3>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-lg font-medium ${getCompetitionColor(insightsResult.competitionLevel)}`}>
                {insightsResult.competitionLevel}
              </span>
              <span className="text-gray-600">
                {insightsResult.competitionLevel === 'Low' && 'Good opportunity for qualified candidates'}
                {insightsResult.competitionLevel === 'Medium' && 'Moderate competition - strong candidates will succeed'}
                {insightsResult.competitionLevel === 'High' && 'Highly competitive market - exceptional candidates needed'}
              </span>
            </div>
          </div>

          {/* Market Trends */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Trends</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {insightsResult.marketTrends?.map((trend: string, index: number) => (
                <li key={index}>{trend}</li>
              ))}
            </ul>
          </div>

          {/* In-Demand Skills */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">In-Demand Skills</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {insightsResult.inDemandSkills?.map((skill: string, index: number) => (
                <span key={index} className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium text-center">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Hiring Tips */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiring Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insightsResult.hiringTips?.map((tip: string, index: number) => (
                <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                  <span className="text-indigo-600 mr-2 mt-1">💡</span>
                  <p className="text-gray-700 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Market Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Executive Summary</h3>
            <div className="text-indigo-800">
              <p className="mb-2">
                <strong>Current Market Conditions:</strong> The {formData.jobLevel?.toLowerCase() || 'healthcare executive'} market shows {insightsResult.competitionLevel?.toLowerCase()} competition.
              </p>
              <p className="mb-2">
                <strong>Salary Expectations:</strong> Candidates can expect {formatCurrency(insightsResult.salaryRange?.min || 0)} to {formatCurrency(insightsResult.salaryRange?.max || 0)} based on experience and organization type.
              </p>
              <p>
                <strong>Key Opportunities:</strong> Focus on {insightsResult.inDemandSkills?.slice(0, 3).join(', ')} skills to remain competitive in this market.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}