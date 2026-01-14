'use client'
 
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { JobLevel } from '@/lib/domain-types'
 
interface JobPostFormProps {
  defaultTierId: string
}
 
interface JobFormState {
  title: string
  level: JobLevel
  department: string
  locationCity: string
  locationState: string
  locationCountry: string
  remoteAllowed: boolean
  hybridAllowed: boolean
  salaryMin: string
  salaryMax: string
  descriptionRich: string
  tierId: string
}

export default function JobPostForm({ defaultTierId }: JobPostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<JobFormState>({
    title: '',
    level: 'C_SUITE',
    department: '',
    locationCity: '',
    locationState: '',
    locationCountry: '',
    remoteAllowed: false,
    hybridAllowed: false,
    salaryMin: '',
    salaryMax: '',
    descriptionRich: '',
    tierId: defaultTierId,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create job posting')
        setLoading(false)
        return
      }

      setSuccess(true)
      // Redirect to payment page
      setTimeout(() => {
        router.push(`/dashboard/jobs/${data.jobId}/payment`)
      }, 1500)
    } catch {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Job posted successfully! It will be reviewed by an administrator.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Job Title *</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Level *</label>
          <select
            required
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Department</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">City</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.locationCity}
            onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">State</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.locationState}
            onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Country</label>
          <input
            type="text"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.locationCountry}
            onChange={(e) => setFormData({ ...formData, locationCountry: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={formData.remoteAllowed}
            onChange={(e) => setFormData({ ...formData, remoteAllowed: e.target.checked })}
          />
          <span className="text-sm text-gray-700">Remote Allowed</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={formData.hybridAllowed}
            onChange={(e) => setFormData({ ...formData, hybridAllowed: e.target.checked })}
          />
          <span className="text-sm text-gray-700">Hybrid Allowed</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Salary Min ($)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.salaryMin}
            onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Salary Max ($)</label>
          <input
            type="number"
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={formData.salaryMax}
            onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Job Description *</label>
        <textarea
          required
          rows={10}
          className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          value={formData.descriptionRich}
          onChange={(e) => setFormData({ ...formData, descriptionRich: e.target.value })}
          placeholder="Enter detailed job description..."
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </form>
  )
}

