'use client'

import { useState } from 'react'

type TemplateOption = {
  key: string
  label: string
}

type EmployerOption = {
  id: string
  organizationName: string
  approved: boolean
  userEmail: string
}

type TierOption = {
  id: string
  name: string
  priceCents: number
  durationDays: number
}

type Props = {
  templates: TemplateOption[]
  employers: EmployerOption[]
  tiers: TierOption[]
}

export default function AdminJobSeeder({
  templates,
  employers,
  tiers,
}: Props) {
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? '')
  const [employerId, setEmployerId] = useState(employers[0]?.id ?? '')
  const [tierId, setTierId] = useState(tiers[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/admin/job-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey, employerId, tierId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Unable to seed job')
        setLoading(false)
        return
      }

      setMessage('Job seeded successfully and set to LIVE.')
    } catch {
      setError('Unexpected error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-serif text-eeg-charcoal mb-4">Seed Featured Job</h2>
      <p className="text-sm text-gray-600 mb-6">
        Use premium templates to quickly publish polished executive openings for verified employers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
          <select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-eeg-blue-electric"
          >
            {templates.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employer</label>
          <select
            value={employerId}
            onChange={(e) => setEmployerId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-eeg-blue-electric"
          >
            {employers.map((employer: EmployerOption) => (
              <option key={employer.id} value={employer.id}>
                {employer.organizationName} ({employer.userEmail})
                {!employer.approved ? ' • Pending Approval' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
          <select
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-eeg-blue-electric"
          >
            {tiers.map((tier: TierOption) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} — ${(tier.priceCents / 100).toLocaleString()} / {tier.durationDays} days
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Seeding Job...' : 'Seed Job Now'}
        </button>
      </form>
    </div>
  )
}

