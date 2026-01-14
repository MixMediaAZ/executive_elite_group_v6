'use client'

import React, { useState } from 'react'

interface ApplicationScreeningProps {
  onScreened?: (data: any) => void
}

export function ApplicationScreening({ onScreened }: ApplicationScreeningProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [screeningResult, setScreeningResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    candidateProfileId: '',
    jobId: '',
    applicationText: ''
  })

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.candidateProfileId.trim() || !formData.jobId.trim()) {
      showAlert('Please provide both candidate profile ID and job ID', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/screen-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateProfileId: formData.candidateProfileId.trim(),
          jobId: formData.jobId.trim(),
          applicationText: formData.applicationText.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to screen application')
      }

      const result = await response.json()
      setScreeningResult(result.data)
      onScreened?.(result.data)
      showAlert('Application screened successfully!')
    } catch (error) {
      console.error('Error screening application:', error)
      showAlert('Failed to screen application. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case 'STRONG_HIRE':
        return 'text-green-700 bg-green-50 border-green-200'
      case 'HIRE':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'MAYBE':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'PASS':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case 'STRONG_HIRE':
        return '🌟'
      case 'HIRE':
        return '✅'
      case 'MAYBE':
        return '🤔'
      case 'PASS':
        return '❌'
      default:
        return '❓'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-red-600">🔍</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Application Screener</h2>
        </div>
        <p className="text-gray-600 mb-6">Automatically screen and evaluate job applications with AI-powered analysis</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Profile ID *
              </label>
              <input
                type="text"
                value={formData.candidateProfileId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, candidateProfileId: e.target.value }))}
                placeholder="Enter candidate profile ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job ID *
              </label>
              <input
                type="text"
                value={formData.jobId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, jobId: e.target.value }))}
                placeholder="Enter job ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Note (Optional)
            </label>
            <textarea
              value={formData.applicationText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, applicationText: e.target.value }))}
              placeholder="Any additional note from the candidate's application..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Screening...' : '🔍 Screen Application'}
          </button>
        </form>
      </div>

      {screeningResult && (
        <div className="space-y-4">
          {/* Overall Score & Recommendation */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Screening Result</h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(screeningResult.fitScore)}`}>
                  {screeningResult.fitScore}% Match
                </span>
                <span className={`px-4 py-2 rounded-lg text-lg font-medium border ${getRecommendationColor(screeningResult.recommendation)}`}>
                  {getRecommendationIcon(screeningResult.recommendation)} {screeningResult.recommendation.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Key Reasons */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Assessment Reasons</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {screeningResult.keyReasons?.map((reason: string, index: number) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>

          {/* Strengths */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              Candidate Strengths
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {screeningResult.strengths?.map((strength: string, index: number) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>

          {/* Concerns */}
          {screeningResult.concerns?.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-orange-500 mr-2">⚠️</span>
                Areas of Concern
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {screeningResult.concerns?.map((concern: string, index: number) => (
                  <li key={index}>{concern}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interview Focus Areas */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Interview Focus Areas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {screeningResult.suggestedInterviewFocus?.map((focus: string, index: number) => (
                <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-600 mr-2">🎯</span>
                  <span className="text-blue-800 text-sm font-medium">{focus}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps Recommendation</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                {screeningResult.recommendation === 'STRONG_HIRE' && '✅ Strong candidate - proceed with interview scheduling immediately.'}
                {screeningResult.recommendation === 'HIRE' && '✅ Good candidate - schedule interview and prepare targeted questions.'}
                {screeningResult.recommendation === 'MAYBE' && '⚠️ Conditional candidate - conduct thorough interview focusing on the identified concerns.'}
                {screeningResult.recommendation === 'PASS' && '❌ Consider passing on this candidate - significant gaps identified.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}