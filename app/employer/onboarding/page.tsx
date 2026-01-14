'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type OrgType = 'HEALTH_SYSTEM' | 'HOSPICE' | 'LTC' | 'HOME_CARE' | 'POST_ACUTE' | 'OTHER'

export default function EmployerOnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    orgName: '',
    orgType: 'OTHER' as OrgType,
    hqLocation: '',
    website: '',
    about: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.orgName.trim()) {
      setError('Organization name is required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: formData.orgName,
          orgType: formData.orgType,
          hqLocation: formData.hqLocation || null,
          website: formData.website || null,
          about: formData.about || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save profile')
        setLoading(false)
        return
      }

      // Show pending approval message
      router.push('/employer/onboarding/pending')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please log in to continue onboarding.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-6">Complete Your Employer Profile</h1>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organization Type *
              </label>
              <select
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all bg-white"
                value={formData.orgType}
                onChange={(e) => setFormData({ ...formData, orgType: e.target.value as OrgType })}
              >
                <option value="HEALTH_SYSTEM">Health System</option>
                <option value="HOSPICE">Hospice</option>
                <option value="LTC">Long-Term Care (LTC)</option>
                <option value="HOME_CARE">Home Care</option>
                <option value="POST_ACUTE">Post-Acute</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Headquarters Location
              </label>
              <input
                type="text"
                placeholder="City, State"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.hqLocation}
                onChange={(e) => setFormData({ ...formData, hqLocation: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                About Your Organization
              </label>
              <textarea
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-eeg-blue-500 focus:border-transparent transition-all"
                placeholder="Tell us about your organization, mission, and values..."
                value={formData.about}
                onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Saving...' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

