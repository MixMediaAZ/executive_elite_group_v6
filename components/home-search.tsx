'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomeSearch() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Store search query and redirect to jobs page
      localStorage.setItem('searchQuery', query.trim())
      router.push('/jobs')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(searchQuery)
  }

  const handleInputFocus = () => {
    setShowResults(true)
  }

  const sampleJobs = [
    { id: 1, title: 'Chief Nursing Officer', company: 'Memorial Healthcare', location: 'Los Angeles, CA' },
    { id: 2, title: 'VP of Clinical Operations', company: 'Regional Medical Center', location: 'San Francisco, CA' },
    { id: 3, title: 'Director of Healthcare Quality', company: 'Pacific Health Systems', location: 'San Diego, CA' }
  ]

  return (
    <div className="max-w-3xl mx-auto mb-12">
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-xl p-2 flex items-center border-2 border-gray-200 focus-within:border-eeg-blue-electric transition-colors">
          <svg className="w-6 h-6 text-gray-400 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search executive positions, organizations, or keywords..."
            className="flex-1 px-4 py-4 text-lg outline-none text-gray-900 placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
          />
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all ml-2"
          >
            Search
          </button>
        </div>
      </form>
      
      {showResults && (
        <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Featured Executive Opportunities</h3>
            <p className="text-sm text-gray-600 mt-1">Join leading healthcare organizations in executive roles</p>
          </div>
          <div className="divide-y divide-gray-200">
            {sampleJobs.map((job) => (
              <div
                key={job.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSearch(job.title)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                    <p className="text-xs text-gray-500 mt-1">{job.location}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    Executive Level
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 text-center">
            <p className="text-sm text-gray-600 mb-3">
              <Link href="/auth/register" className="text-eeg-blue-electric hover:underline font-medium">
                Sign up
              </Link>
              {' '}to access full job listings and apply to positions
            </p>
            <button
              onClick={() => setShowResults(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {!showResults && (
        <p className="text-sm text-gray-600 mt-4 text-center">
          <Link href="/auth/register" className="text-eeg-blue-electric hover:underline">
            Sign up
          </Link>
          {' '}to access full job listings and executive search features
        </p>
      )}
    </div>
  )
}

