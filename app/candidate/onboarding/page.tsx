'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type JobLevel = 'C_SUITE' | 'VP' | 'DIRECTOR' | 'MANAGER' | 'OTHER_EXECUTIVE'

export default function CandidateOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    // Step 1: Basic identity
    fullName: '',
    currentTitle: '',
    currentOrg: '',
    primaryLocation: '',
    willingToRelocate: false,
    relocationRegions: [] as string[],
    
    // Step 2: Role preferences
    targetLevels: [] as JobLevel[],
    preferredSettings: [] as string[],
    preferredEmploymentType: '',
    
    // Step 3: Leadership scope
    budgetManagedMin: '',
    budgetManagedMax: '',
    teamSizeMin: '',
    teamSizeMax: '',
    primaryServiceLines: [] as string[],
    
    // Step 4: Experience
    ehrExperience: {} as Record<string, any>,
    regulatoryExperience: {} as Record<string, any>,
    
    // Step 5: Summary
    summary: '',
  })

  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setError('')
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      setCurrentStep(1)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          currentTitle: formData.currentTitle || null,
          currentOrg: formData.currentOrg || null,
          primaryLocation: formData.primaryLocation || null,
          willingToRelocate: formData.willingToRelocate,
          relocationRegionsJson: formData.relocationRegions.length > 0 
            ? JSON.stringify(formData.relocationRegions) 
            : null,
          preferredSettingsJson: formData.preferredSettings.length > 0
            ? JSON.stringify(formData.preferredSettings)
            : null,
          preferredEmploymentType: formData.preferredEmploymentType || null,
          targetLevelsJson: formData.targetLevels.length > 0
            ? JSON.stringify(formData.targetLevels)
            : null,
          budgetManagedMin: formData.budgetManagedMin ? parseInt(formData.budgetManagedMin) : null,
          budgetManagedMax: formData.budgetManagedMax ? parseInt(formData.budgetManagedMax) : null,
          teamSizeMin: formData.teamSizeMin ? parseInt(formData.teamSizeMin) : null,
          teamSizeMax: formData.teamSizeMax ? parseInt(formData.teamSizeMax) : null,
          primaryServiceLinesJson: formData.primaryServiceLines.length > 0
            ? JSON.stringify(formData.primaryServiceLines)
            : null,
          ehrExperienceJson: Object.keys(formData.ehrExperience).length > 0
            ? JSON.stringify(formData.ehrExperience)
            : null,
          regulatoryExperienceJson: Object.keys(formData.regulatoryExperience).length > 0
            ? JSON.stringify(formData.regulatoryExperience)
            : null,
          summary: formData.summary || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save profile')
        setLoading(false)
        return
      }

      router.push('/candidate/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Basic Information</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Title</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.currentTitle}
                onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Organization</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.currentOrg}
                onChange={(e) => setFormData({ ...formData, currentOrg: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Location</label>
              <input
                type="text"
                placeholder="City, State or Region"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.primaryLocation}
                onChange={(e) => setFormData({ ...formData, primaryLocation: e.target.value })}
              />
            </div>
            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="willingToRelocate"
                className="w-4 h-4 text-eeg-blue-600 border-gray-300 rounded focus:ring-eeg-blue-500"
                checked={formData.willingToRelocate}
                onChange={(e) => setFormData({ ...formData, willingToRelocate: e.target.checked })}
              />
              <label htmlFor="willingToRelocate" className="ml-2 text-sm font-medium text-gray-700">Willing to relocate</label>
            </div>
            {formData.willingToRelocate && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Relocation Regions (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., West Coast, Northeast, Remote"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.relocationRegions.join(', ')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    relocationRegions: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                  })}
                />
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Role Preferences</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Target Levels</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['C_SUITE', 'VP', 'DIRECTOR', 'MANAGER', 'OTHER_EXECUTIVE'] as JobLevel[]).map(level => (
                  <label key={level} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-eeg-blue-600 border-gray-300 rounded focus:ring-eeg-blue-500"
                      checked={formData.targetLevels.includes(level)}
                      onChange={() => setFormData({ 
                        ...formData, 
                        targetLevels: toggleArrayItem(formData.targetLevels, level) as JobLevel[]
                      })}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{level.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Settings</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {['Health System', 'Hospice', 'LTC', 'Home Care', 'Post-Acute', 'Other'].map(setting => (
                  <label key={setting} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-eeg-blue-600 border-gray-300 rounded focus:ring-eeg-blue-500"
                      checked={formData.preferredSettings.includes(setting)}
                      onChange={() => setFormData({ 
                        ...formData, 
                        preferredSettings: toggleArrayItem(formData.preferredSettings, setting)
                      })}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{setting}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Employment Type</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all bg-white"
                value={formData.preferredEmploymentType}
                onChange={(e) => setFormData({ ...formData, preferredEmploymentType: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="CONSULTING">Consulting</option>
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Leadership Scope</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Managed (Min $)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.budgetManagedMin}
                  onChange={(e) => setFormData({ ...formData, budgetManagedMin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Budget Managed (Max $)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.budgetManagedMax}
                  onChange={(e) => setFormData({ ...formData, budgetManagedMax: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Team Size (Min)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.teamSizeMin}
                  onChange={(e) => setFormData({ ...formData, teamSizeMin: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Team Size (Max)</label>
                <input
                  type="number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                  value={formData.teamSizeMax}
                  onChange={(e) => setFormData({ ...formData, teamSizeMax: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Service Lines (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g., Cardiology, Oncology, Emergency Medicine"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.primaryServiceLines.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  primaryServiceLines: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Experience</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">EHR Experience (JSON format or leave blank)</label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all font-mono text-sm"
                rows={4}
                placeholder='e.g., {"Epic": "5 years", "Cerner": "3 years"}'
                value={JSON.stringify(formData.ehrExperience, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setFormData({ ...formData, ehrExperience: parsed })
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Regulatory Experience (JSON format or leave blank)</label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all font-mono text-sm"
                rows={4}
                placeholder='e.g., {"CMS": "Expert", "Joint Commission": "5 years"}'
                value={JSON.stringify(formData.regulatoryExperience, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    setFormData({ ...formData, regulatoryExperience: parsed })
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-5">
            <h2 className="text-xl sm:text-2xl font-serif text-eeg-charcoal mb-6">Summary</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Summary</label>
              <textarea
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                rows={6}
                placeholder="Tell us about your background, achievements, and what you're looking for..."
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Please log in to continue onboarding.</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6">Complete Your Profile</h1>
            <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base font-semibold flex-shrink-0 ${
                    i + 1 <= currentStep 
                      ? 'bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                  {i < totalSteps - 1 && (
                    <div className={`flex-1 h-1 mx-1 sm:mx-2 min-w-[20px] ${
                      i + 1 < currentStep 
                        ? 'bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600' 
                        : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="mb-8">
            {renderStep()}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

