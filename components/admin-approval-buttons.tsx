'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ApprovalButtonsProps {
  type: 'employer' | 'job'
  id: string
}

export default function ApprovalButtons({ type, id }: ApprovalButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleApprove = async () => {
    setLoading(true)
    setError('')

    try {
      const endpoint = type === 'employer' 
        ? '/api/admin/approve-employer'
        : '/api/admin/approve-job'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [type === 'employer' ? 'employerId' : 'jobId']: id }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to approve')
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      setError('An error occurred')
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (type !== 'job') return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/reject-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to reject')
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      setError('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-2 text-red-600 text-sm">{error}</div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
        >
          Approve
        </button>
        {type === 'job' && (
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
          >
            Reject
          </button>
        )}
      </div>
    </div>
  )
}

