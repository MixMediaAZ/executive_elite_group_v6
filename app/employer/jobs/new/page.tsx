'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { generateJobDescriptionAndOutreach } from '@/lib/ai'
import type { JobLevel } from '@/lib/domain-types'

export default function NewJobWizardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Step 1: Basic details
    title: '',
    level: 'VP' as JobLevel,
    location: '',
    remoteAllowed: false,
    orgNameOverride: '',
    serviceLines: [] as string[],
    mustHaveSkills: [] as string[],
    cultureMandate: '',
    
    // Step 2: AI-generated content (editable)
    descriptionRich: '',
    keyResponsibilities: [] as string[],
    outreachSnippet: '',
    
    // Step 3: Additional details
    compensationMin: '',
    compensationMax: '',
    compensationCurrency: 'USD',
    requiredExperienceYears: '',
    requiredLicenses: [] as string[],
    requiredCertifications: [] as string[],
    requiredEhrExperience: [] as string[],
    requiredSettingExperience: [] as string[],
  })

  const [defaultTierId, setDefaultTierId] = useState('')

  useEffect(() => {
    // Fetch default tier
    fetch('/api/jobs')
      .then(res => res.json())
      .then(data => {
        if (data.defaultTierId) {
          setDefaultTierId(data.defaultTierId)
        }
      })
      .catch(() => {})
  }, [])

  const handleGenerateAI = async () => {
    if (!formData.title || !formData.location) {
      setError('Please fill in job title and location first')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const result = await generateJobDescriptionAndOutreach({
        title: formData.title,
        level: formData.level,
        location: formData.location,
        remoteAllowed: formData.remoteAllowed,
        serviceLines: formData.serviceLines,
        mustHaveSkills: formData.mustHaveSkills,
        cultureMandate: formData.cultureMandate,
        orgName: formData.orgNameOverride,
      })

      setFormData({
        ...formData,
        descriptionRich: result.jobDescription,
        keyResponsibilities: result.keyResponsibilities,
        outreachSnippet: result.outreachSnippet,
      })

      setCurrentStep(2)
    } catch (err) {
      console.error('AI generation error:', err)
      setError('Failed to generate content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.descriptionRich.trim()) {
      setError('Job description is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          level: formData.level,
          orgNameOverride: formData.orgNameOverride || null,
          location: formData.location,
          remoteAllowed: formData.remoteAllowed,
          compensationMin: formData.compensationMin ? parseInt(formData.compensationMin) : null,
          compensationMax: formData.compensationMax ? parseInt(formData.compensationMax) : null,
          compensationCurrency: formData.compensationCurrency,
          descriptionRich: formData.descriptionRich,
          keyResponsibilitiesJson: JSON.stringify(formData.keyResponsibilities),
          requiredExperienceYears: formData.requiredExperienceYears ? parseInt(formData.requiredExperienceYears) : null,
          requiredLicensesJson: formData.requiredLicenses.length > 0 ? JSON.stringify(formData.requiredLicenses) : null,
          requiredCertificationsJson: formData.requiredCertifications.length > 0 ? JSON.stringify(formData.requiredCertifications) : null,
          requiredEhrExperienceJson: formData.requiredEhrExperience.length > 0 ? JSON.stringify(formData.requiredEhrExperience) : null,
          requiredSettingExperienceJson: formData.requiredSettingExperience.length > 0 ? JSON.stringify(formData.requiredSettingExperience) : null,
          tierId: defaultTierId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create job')
        setLoading(false)
        return
      }

      router.push(`/employer/jobs/${data.jobId}`)
    } catch (err) {
      console.error('Job creation error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  if (!session || session.user.role !== 'EMPLOYER') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in as an employer to create jobs.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6 sm:mb-8">Create New Job Posting</h1>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Step 1: Job Details</h2>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Level *</label>
                  <select
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all bg-white"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as JobLevel })}
                  >
                    <option value="C_SUITE">C-Suite</option>
                    <option value="VP">VP</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="MANAGER">Manager</option>
                    <option value="OTHER_EXECUTIVE">Other Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="remoteAllowed"
                  className="w-4 h-4 text-eeg-blue-600 border-gray-300 rounded focus:ring-eeg-blue-500"
                  checked={formData.remoteAllowed}
                  onChange={(e) => setFormData({ ...formData, remoteAllowed: e.target.checked })}
                />
                <label htmlFor="remoteAllowed" className="ml-2 text-sm font-medium text-gray-700">Remote allowed</label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name Override (optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.orgNameOverride}
                  onChange={(e) => setFormData({ ...formData, orgNameOverride: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Service Lines (comma-separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Cardiology, Oncology, Emergency Medicine"
                  value={formData.serviceLines.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    serviceLines: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Must-Have Skills (comma-separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., P&L management, Regulatory compliance, Team leadership"
                  value={formData.mustHaveSkills.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    mustHaveSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Culture / Mandate</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all bg-white"
                  value={formData.cultureMandate}
                  onChange={(e) => setFormData({ ...formData, cultureMandate: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="turnaround">Turnaround</option>
                  <option value="growth">Growth</option>
                  <option value="stabilization">Stabilization</option>
                  <option value="transformation">Transformation</option>
                </select>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating || !formData.title || !formData.location}
                  className="px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {generating ? 'Generating...' : 'Generate with AI →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review & Edit AI-Generated Content */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-6">
                <p className="font-semibold text-yellow-900">AI-assisted draft – please review before publishing.</p>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Step 2: Review & Edit Generated Content</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description *</label>
                <textarea
                  required
                  rows={12}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.descriptionRich}
                  onChange={(e) => setFormData({ ...formData, descriptionRich: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Key Responsibilities</label>
                <div className="space-y-2">
                  {formData.keyResponsibilities.map((resp, idx) => (
                    <div key={idx} className="flex items-center">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 border rounded-lg"
                        value={resp}
                        onChange={(e) => {
                          const newResp = [...formData.keyResponsibilities]
                          newResp[idx] = e.target.value
                          setFormData({ ...formData, keyResponsibilities: newResp })
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            keyResponsibilities: formData.keyResponsibilities.filter((_, i) => i !== idx),
                          })
                        }}
                        className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        keyResponsibilities: [...formData.keyResponsibilities, ''],
                      })
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add responsibility
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Outreach Snippet (for LinkedIn/Email)</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.outreachSnippet}
                  onChange={(e) => setFormData({ ...formData, outreachSnippet: e.target.value })}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Step 3: Additional Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Compensation Min ($)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                    value={formData.compensationMin}
                    onChange={(e) => setFormData({ ...formData, compensationMin: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Compensation Max ($)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                    value={formData.compensationMax}
                    onChange={(e) => setFormData({ ...formData, compensationMax: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Required Experience (years)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.requiredExperienceYears}
                  onChange={(e) => setFormData({ ...formData, requiredExperienceYears: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Required Licenses (comma-separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.requiredLicenses.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    requiredLicenses: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Required Certifications (comma-separated)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.requiredCertifications.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    requiredCertifications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

