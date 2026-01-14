'use client'

import React, { useState } from 'react'

interface JobDescriptionGeneratorProps {
  onGenerated?: (data: any) => void
}

export function JobDescriptionGenerator({ onGenerated }: JobDescriptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    level: '',
    location: '',
    remoteAllowed: false,
    serviceLines: [] as string[],
    mustHaveSkills: [] as string[],
    cultureMandate: '',
    orgName: '',
    orgType: '',
    budgetManaged: '',
    teamSize: ''
  })

  const jobLevels = [
    { value: 'C_SUITE', label: 'C-Suite (CEO, CFO, COO, etc.)' },
    { value: 'VP', label: 'Vice President' },
    { value: 'DIRECTOR', label: 'Director' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'OTHER_EXECUTIVE', label: 'Other Executive' }
  ]

  const orgTypes = [
    { value: 'HEALTH_SYSTEM', label: 'Health System' },
    { value: 'HOSPICE', label: 'Hospice' },
    { value: 'LTC', label: 'Long Term Care' },
    { value: 'HOME_CARE', label: 'Home Care' },
    { value: 'POST_ACUTE', label: 'Post Acute' },
    { value: 'OTHER', label: 'Other Healthcare' }
  ]

  const serviceLineOptions = [
    'Operations', 'Clinical', 'Finance', 'Marketing', 'HR', 'IT', 'Quality',
    'Patient Experience', 'Business Development', 'Strategy', 'Compliance'
  ]

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple alert - in a real app you'd use a proper toast system
    alert(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/generate-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          budgetManaged: formData.budgetManaged ? parseInt(formData.budgetManaged) : undefined,
          teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate job description')
      }

      const result = await response.json()
      setGeneratedContent(result.data)
      onGenerated?.(result.data)
      showAlert('Job description generated successfully!')
    } catch (error) {
      console.error('Error generating job description:', error)
      showAlert('Failed to generate job description. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showAlert('Copied to clipboard!')
  }

  const downloadContent = () => {
    if (!generatedContent) return

    const content = `# ${formData.title} - Job Description

${generatedContent.jobDescription}

## Key Responsibilities
${generatedContent.keyResponsibilities.map((resp: string) => `- ${resp}`).join('\n')}

## Skills Analysis
${generatedContent.skillsAnalysis}

## Market Insights
${generatedContent.marketInsights}

---
Generated with AI on ${new Date().toLocaleDateString()}`

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.title.replace(/\s+/g, '-').toLowerCase()}-job-description.md`
    a.click()
    URL.revokeObjectURL(url)
    showAlert('Job description downloaded!')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-blue-600">✨</span>
          <h2 className="text-xl font-semibold text-gray-900">AI Job Description Generator</h2>
        </div>
        <p className="text-gray-600 mb-6">Generate compelling job descriptions and outreach content using AI</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Chief Operating Officer"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Level *
              </label>
              <select
                value={formData.level}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
                required
              >
                <option value="">Select job level</option>
                {jobLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Chicago, IL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type
              </label>
              <select
                value={formData.orgType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, orgType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              >
                <option value="">Select organization type</option>
                {orgTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.orgName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                placeholder="Your organization name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Managed (USD)
              </label>
              <input
                type="number"
                value={formData.budgetManaged}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, budgetManaged: e.target.value }))}
                placeholder="e.g., 5000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size
              </label>
              <input
                type="number"
                value={formData.teamSize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, teamSize: e.target.value }))}
                placeholder="e.g., 50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remoteAllowed"
                checked={formData.remoteAllowed}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, remoteAllowed: e.target.checked }))}
                className="h-4 w-4 text-eeg-blue-electric focus:ring-eeg-blue-electric border-gray-300 rounded"
              />
              <label htmlFor="remoteAllowed" className="ml-2 block text-sm text-gray-700">
                Remote Work Allowed
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Culture Focus
            </label>
            <input
              type="text"
              value={formData.cultureMandate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, cultureMandate: e.target.value }))}
              placeholder="e.g., turnaround, growth, stabilization, innovation"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              value={formData.mustHaveSkills.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
                ...prev, 
                mustHaveSkills: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              }))}
              placeholder="e.g., Healthcare Operations, Strategic Planning, Team Leadership"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Lines (comma-separated)
            </label>
            <input
              type="text"
              value={formData.serviceLines.join(', ')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ 
                ...prev, 
                serviceLines: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s)
              }))}
              placeholder={`e.g., ${serviceLineOptions.slice(0, 4).join(', ')}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating...' : '✨ Generate with AI'}
          </button>
        </form>
      </div>

      {generatedContent && (
        <div className="space-y-4">
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Job Description</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(generatedContent.jobDescription)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={downloadContent}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {generatedContent.jobDescription}
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Responsibilities</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {generatedContent.keyResponsibilities.map((responsibility: string, index: number) => (
                <li key={index}>{responsibility}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Analysis</h3>
            <p className="text-sm text-gray-600">{generatedContent.skillsAnalysis}</p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
            <p className="text-sm text-gray-600">{generatedContent.marketInsights}</p>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Outreach Message</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {generatedContent.outreachSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
