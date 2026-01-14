'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface ApplicationFiltersProps {
  userRole: 'CANDIDATE' | 'EMPLOYER'
  jobs?: Array<{ id: string; title: string }>
}

export default function ApplicationFilters({ userRole, jobs }: ApplicationFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [jobId, setJobId] = useState(searchParams.get('jobId') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (jobId) params.set('jobId', jobId)
    if (search) params.set('search', search)
    
    router.push(`/dashboard/applications?${params.toString()}`)
  }

  const handleClear = () => {
    setStatus('')
    setJobId('')
    setSearch('')
    router.push('/dashboard/applications')
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {userRole === 'EMPLOYER' && jobs && jobs.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Job
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
            >
              <option value="">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="INTERVIEW">Interview</option>
            <option value="OFFER">Offer</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {userRole === 'CANDIDATE' ? 'Search Jobs' : 'Search Candidates'}
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={userRole === 'CANDIDATE' ? 'Job title or company...' : 'Candidate name or email...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleFilter}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Apply Filters
          </button>
          {(status || jobId || search) && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


