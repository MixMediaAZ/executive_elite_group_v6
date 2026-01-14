'use client'

import React, { useState, useEffect } from 'react'

interface MatchResult {
  candidateId: string
  jobId: string
  matchScore: number
  matchingFactors: string[]
  missingRequirements: string[]
  recommendation: string
}

interface CandidateMatcherProps {
  candidateProfileId?: string
  jobId?: string
}

export function CandidateMatcher({ candidateProfileId, jobId }: CandidateMatcherProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState(candidateProfileId || '')
  const [selectedJobId, setSelectedJobId] = useState(jobId || '')

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message)
  }

  const findMatches = async () => {
    if (!selectedProfileId && !selectedJobId) {
      showAlert('Please provide either a candidate profile ID or job ID', 'error')
      return
    }

    setIsLoading(true)
    try {
      const endpoint = selectedProfileId ? '/api/ai/match-candidate' : '/api/ai/match-job'
      const body = selectedProfileId 
        ? { candidateProfileId: selectedProfileId, limit: 10 }
        : { jobId: selectedJobId, limit: 10 }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Failed to find matches')
      }

      const result = await response.json()
      setMatches(result.data)
      showAlert(`Found ${result.data.length} matches!`)
    } catch (error) {
      console.error('Error finding matches:', error)
      showAlert('Failed to find matches. Please try again.', 'error')
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

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-purple-600">🎯</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Candidate Matcher</h2>
        </div>
        <p className="text-gray-600 mb-6">Find the best matches between candidates and jobs using AI analysis</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate Profile ID
            </label>
            <input
              type="text"
              value={selectedProfileId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedProfileId(e.target.value)}
              placeholder="Enter candidate profile ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job ID
            </label>
            <input
              type="text"
              value={selectedJobId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedJobId(e.target.value)}
              placeholder="Enter job ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            />
          </div>
        </div>

        <button
          onClick={findMatches}
          disabled={isLoading}
          className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Finding Matches...' : '🎯 Find Matches'}
        </button>
      </div>

      {matches.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Found {matches.length} Matches
            </h3>
            
            <div className="space-y-4">
              {matches.map((match, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">
                        Match #{index + 1}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(match.matchScore)}`}>
                        {match.matchScore}% Match
                      </span>
                      <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getRecommendationColor(match.recommendation)}`}>
                        {match.recommendation.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">✅ Matching Factors</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {match.matchingFactors.map((factor, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {match.missingRequirements.length > 0 && (
                      <div>
                        <h4 className="font-medium text-orange-700 mb-2">⚠️ Missing Requirements</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {match.missingRequirements.map((req, i) => (
                            <li key={i} className="flex items-start">
                              <span className="text-orange-500 mr-2">•</span>
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium text-gray-700 mb-2">AI Recommendation</h4>
                    <p className="text-sm text-gray-600">{match.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
