'use client'

import React, { useState } from 'react'

interface InterviewQuestionsProps {
  onGenerated?: (data: any) => void
}

export function InterviewQuestions({ onGenerated }: InterviewQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<any>(null)
  const [formData, setFormData] = useState({
    jobId: '',
    candidateProfileId: '',
    questionCount: 8
  })

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    alert(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.jobId.trim() || !formData.candidateProfileId.trim()) {
      showAlert('Please provide both job ID and candidate profile ID', 'error')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/generate-interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: formData.jobId.trim(),
          candidateProfileId: formData.candidateProfileId.trim(),
          questionCount: formData.questionCount
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate interview questions')
      }

      const result = await response.json()
      setGeneratedQuestions(result.data)
      onGenerated?.(result.data)
      showAlert('Interview questions generated successfully!')
    } catch (error) {
      console.error('Error generating interview questions:', error)
      showAlert('Failed to generate interview questions. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const getQuestionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'behavioral':
        return 'text-blue-600 bg-blue-100'
      case 'technical':
        return 'text-green-600 bg-green-100'
      case 'situational':
        return 'text-purple-600 bg-purple-100'
      case 'experience':
        return 'text-orange-600 bg-orange-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const downloadQuestions = () => {
    if (!generatedQuestions) return

    const content = `# Interview Questions

Generated with AI on ${new Date().toLocaleDateString()}

## Questions

${generatedQuestions.questions?.map((q: any, index: number) => 
  `${index + 1}. **${q.type.toUpperCase()}:** ${q.question}\n   *Focus: ${q.focus}*\n${q.followUp ? `   *Follow-up: ${q.followUp}*\n` : ''}`
).join('\n\n')}

## Evaluation Criteria

${generatedQuestions.evaluationCriteria?.map((criteria: string, index: number) => 
  `- ${criteria}`
).join('\n')}

## Red Flags to Watch For

${generatedQuestions.redFlags?.map((flag: string, index: number) => 
  `- ${flag}`
).join('\n')}
`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'interview-questions.md'
    a.click()
    URL.revokeObjectURL(url)
    showAlert('Interview questions downloaded!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-600">❓</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Interview Question Generator</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate strategic interview questions tailored to specific candidates and roles</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <select
              value={formData.questionCount}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            >
              <option value={5}>5 Questions (Quick Interview)</option>
              <option value={8}>8 Questions (Standard Interview)</option>
              <option value={12}>12 Questions (Comprehensive Interview)</option>
              <option value={15}>15 Questions (Extended Interview)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating Questions...' : '❓ Generate Interview Questions'}
          </button>
        </form>
      </div>

      {generatedQuestions && (
        <div className="space-y-4">
          {/* Questions */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Questions</h3>
              <button
                onClick={downloadQuestions}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Download
              </button>
            </div>
            <div className="space-y-4">
              {generatedQuestions.questions?.map((question: any, index: number) => (
                <div key={index} className="border-l-4 border-orange-400 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">Q{index + 1}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.type)}`}>
                      {question.type}
                    </span>
                    <span className="text-sm text-gray-500">Focus: {question.focus}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{question.question}</p>
                  {question.followUp && (
                    <p className="text-sm text-gray-600 italic">
                      <strong>Follow-up:</strong> {question.followUp}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation Criteria */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Criteria</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {generatedQuestions.evaluationCriteria?.map((criteria: string, index: number) => (
                <li key={index}>{criteria}</li>
              ))}
            </ul>
          </div>

          {/* Red Flags */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Red Flags to Watch For</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {generatedQuestions.redFlags?.map((flag: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}