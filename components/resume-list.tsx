'use client'

import { useState, useEffect } from 'react'

interface Resume {
  id: string
  fileName: string
  fileUrl: string
  fileMimeType: string
  uploadedAt: string
  isPrimary: boolean
}

export default function ResumeList() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resume')
      if (!response.ok) {
        setError('Failed to load resumes')
        setLoading(false)
        return
      }
      const data = await response.json()
      setResumes(data.resumes || [])
    } catch {
      setError('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return
    }

    try {
      const response = await fetch(`/api/resume?id=${resumeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete resume')
        return
      }

      // Refresh list
      fetchResumes()
    } catch {
      alert('Failed to delete resume')
    }
  }

  const handleSetPrimary = async (resumeId: string) => {
    try {
      const response = await fetch('/api/resume', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, isPrimary: true }),
      })

      if (!response.ok) {
        alert('Failed to set primary resume')
        return
      }

      // Refresh list
      fetchResumes()
    } catch {
      alert('Failed to set primary resume')
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading resumes...</div>
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>
  }

  if (resumes.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No resumes uploaded yet. Upload your first resume above.
      </div>
    )
  }

  return (
    <div className="space-y-2 mt-4">
      <h4 className="text-sm font-medium text-gray-700">Uploaded Resumes:</h4>
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md p-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {resume.fileName}
              </span>
              {resume.isPrimary && (
                <span className="text-xs bg-eeg-blue-electric text-white px-2 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Uploaded: {new Date(resume.uploadedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <a
              href={resume.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-eeg-blue-electric hover:text-eeg-blue-600 font-medium"
            >
              View
            </a>
            {!resume.isPrimary && (
              <button
                onClick={() => handleSetPrimary(resume.id)}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                title="Set as primary resume"
              >
                Set Primary
              </button>
            )}
            <button
              onClick={() => handleDelete(resume.id)}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

