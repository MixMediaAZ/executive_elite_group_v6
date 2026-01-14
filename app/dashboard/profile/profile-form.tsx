'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CandidateProfile, EmployerProfile } from '@prisma/client'
import ResumeUpload from '@/components/resume-upload'
import ResumeList from '@/components/resume-list'

interface ProfileFormProps {
  role: string
  profile: CandidateProfile | EmployerProfile | null
}

interface CandidateFormData {
  firstName: string
  lastName: string
  phone: string
  locationCity: string
  locationState: string
  locationCountry: string
  currentTitle: string
  currentOrg: string
  yearsExperience: number | ''
  summary: string
  narrativeAchievements: string
  videoIntroUrl: string
  leadershipMetrics: string
}

interface EmployerFormData {
  organizationName: string
  websiteUrl: string
  orgType: string
  headquartersCity: string
  headquartersState: string
  headquartersCountry: string
  description: string
}

function CandidateProfileForm({ profile }: { profile: CandidateProfile | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<CandidateFormData>({
    // CandidateProfile schema stores fullName + primaryLocation; keep legacy UI fields derived from those.
    firstName: profile?.fullName?.split(' ')[0] ?? '',
    lastName: profile?.fullName?.split(' ').slice(1).join(' ') ?? '',
    phone: '',
    locationCity: profile?.primaryLocation?.split(',')[0]?.trim() ?? '',
    locationState: profile?.primaryLocation?.split(',')[1]?.trim() ?? '',
    locationCountry: '',
    currentTitle: profile?.currentTitle ?? '',
    currentOrg: profile?.currentOrg ?? '',
    yearsExperience: '',
    summary: profile?.summary ?? '',
    narrativeAchievements: '',
    videoIntroUrl: '',
    leadershipMetrics: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Profile updated successfully!
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.locationCity}
              onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.locationState}
              onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              value={formData.locationCountry}
              onChange={(e) => setFormData({ ...formData, locationCountry: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Title</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.currentTitle}
            onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Organization</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.currentOrg}
            onChange={(e) => setFormData({ ...formData, currentOrg: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
          <input
            type="number"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.yearsExperience}
            onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Professional Summary</label>
          <textarea
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          />
        </div>
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Narrative Achievements
              </label>
              <textarea
                rows={6}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Describe your key achievements, leadership impact, and career highlights..."
                value={formData.narrativeAchievements}
                onChange={(e) => setFormData({ ...formData, narrativeAchievements: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Share your most impactful achievements and leadership stories
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video Introduction URL
              </label>
              <input
                type="url"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="https://youtube.com/... or https://vimeo.com/..."
                value={formData.videoIntroUrl}
                onChange={(e) => setFormData({ ...formData, videoIntroUrl: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Link to a professional video introduction
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leadership Metrics
              </label>
              <textarea
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Team size managed, budget responsibility, outcomes achieved..."
                value={formData.leadershipMetrics}
                onChange={(e) => setFormData({ ...formData, leadershipMetrics: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Quantify your leadership impact (e.g., &quot;Managed team of 50+, $10M budget, 30% efficiency improvement&quot;)
              </p>
            </div>
          </div>
        </div>
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resume</h3>
          <ResumeUploadSection />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
  )
}

function ResumeUploadSection() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadSuccess = () => {
    // Trigger refresh of resume list
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div>
      <ResumeUpload onUploadSuccess={handleUploadSuccess} />
      <ResumeList key={refreshKey} />
    </div>
  )
}

function EmployerProfileForm({ profile }: { profile: EmployerProfile | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<EmployerFormData>({
    // EmployerProfile schema stores orgName + hqLocation + website + about; keep legacy UI fields derived from those.
    organizationName: profile?.orgName ?? '',
    websiteUrl: profile?.website ?? '',
    orgType: profile?.orgType ?? 'OTHER',
    headquartersCity: profile?.hqLocation?.split(',')[0]?.trim() ?? '',
    headquartersState: profile?.hqLocation?.split(',')[1]?.trim() ?? '',
    headquartersCountry: '',
    description: profile?.about ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Profile updated successfully!
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">Organization Name</label>
        <input
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          value={formData.organizationName}
          onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Website URL</label>
        <input
          type="url"
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          value={formData.websiteUrl}
          onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Organization Type</label>
        <select
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          value={formData.orgType}
          onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
        >
          <option value="HEALTH_SYSTEM">Health System</option>
          <option value="HOSPICE">Hospice</option>
          <option value="LTC">Long-Term Care</option>
          <option value="HOME_CARE">Home Care</option>
          <option value="POST_ACUTE">Post-Acute</option>
          <option value="OTHER">Other</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.headquartersCity}
            onChange={(e) => setFormData({ ...formData, headquartersCity: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.headquartersState}
            onChange={(e) => setFormData({ ...formData, headquartersState: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.headquartersCountry}
            onChange={(e) => setFormData({ ...formData, headquartersCountry: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          rows={4}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  )
}

export default function ProfileForm({ role, profile }: ProfileFormProps) {
  if (role === 'CANDIDATE') {
    return <CandidateProfileForm profile={profile as CandidateProfile | null} />
  }

  return <EmployerProfileForm profile={profile as EmployerProfile | null} />
}

