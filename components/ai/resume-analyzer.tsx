'use client'

import React, { useState } from 'react'

interface ResumeAnalyzerProps {
  onAnalyzed?: (data: any) => void
}

export function ResumeAnalyzer({ onAnalyzed }: ResumeAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [resumeText, setResumeText] = useState('')
  const [candidateProfileId, setCandidateProfileId] = useState('')

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message)
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resumeText.trim() || !candidateProfileId.trim()) {
      showAlert('Please provide both resume text and candidate profile ID', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          candidateProfileId: candidateProfileId.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze resume')
      }

      const result = await response.json()
      setAnalysisResult(result.data)
      onAnalyzed?.(result.data)
      showAlert('Resume analyzed successfully!')
    } catch (error) {
      console.error('Error analyzing resume:', error)
      showAlert('Failed to analyze resume. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'c-suite':
      case 'executive':
        return 'text-purple-600 bg-purple-100'
      case 'senior':
        return 'text-blue-600 bg-blue-100'
      case 'mid':
        return 'text-green-600 bg-green-100'
      case 'junior':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-green-600">📄</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Resume Analyzer</h2>
        </div>
        <p className="text-gray-600 mb-6">Get comprehensive insights about your resume with AI-powered analysis</p>

        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate Profile ID *
            </label>
            <input
              type="text"
              value={candidateProfileId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCandidateProfileId(e.target.value)}
              placeholder="Enter your candidate profile ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resume Text *
            </label>
            <textarea
              value={resumeText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : '📄 Analyze Resume'}
          </button>
        </form>
      </div>

      {analysisResult && (
        <div className="space-y-4">
          {/* AI Summary */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Summary</h3>
            <p className="text-gray-700">{analysisResult.aiSummary}</p>
          </div>

          {/* Experience Level */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Level</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExperienceColor(analysisResult.experienceLevel)}`}>
              {analysisResult.experienceLevel}
            </span>
          </div>

          {/* Extracted Skills */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Skills</h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.extractedSkills?.map((skill: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Industry Focus */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Focus</h3>
            <p className="text-gray-700">{analysisResult.industryFocus}</p>
          </div>

          {/* Certifications */}
          {analysisResult.certifications?.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {analysisResult.certifications.map((cert: string, index: number) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Leadership Experience */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Leadership Experience</h3>
            <p className="text-gray-700">{analysisResult.leadershipExperience}</p>
          </div>

          {/* Career Trajectory */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Trajectory</h3>
            <p className="text-gray-700">{analysisResult.careerTrajectory}</p>
          </div>

          {/* Suggested Job Levels */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Job Levels</h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.suggestedJobLevels?.map((level: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {level.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended Service Lines */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Service Lines</h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.recommendedServiceLines?.map((line: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}