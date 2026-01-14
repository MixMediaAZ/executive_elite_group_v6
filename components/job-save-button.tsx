'use client'

import { useEffect, useState } from 'react'

export default function JobSaveButton({ jobId }: { jobId: string }) {
  const [isSaved, setIsSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkSaved = async () => {
      try {
        const response = await fetch(`/api/saved-jobs?jobId=${jobId}`)
        if (!response.ok) return
        const data = await response.json()
        if (data.saved) {
          setIsSaved(true)
        }
      } catch {
        // ignore
      }
    }

    checkSaved()
  }, [jobId])

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save job')
        setLoading(false)
        return
      }

      setIsSaved(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnsave = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/saved-jobs?jobId=${jobId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to remove saved job')
        setLoading(false)
        return
      }

      setIsSaved(false)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isSaved) {
    return (
      <div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleUnsave}
          disabled={loading}
          className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Removing...' : '★ Saved'}
        </button>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-3 bg-white text-eeg-blue-electric border border-eeg-blue-electric rounded-lg font-semibold hover:bg-eeg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : '☆ Save Job'}
      </button>
    </div>
  )
}

