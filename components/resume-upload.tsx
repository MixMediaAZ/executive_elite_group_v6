'use client'

import { useState, useRef } from 'react'

interface ResumeUploadProps {
  onUploadSuccess?: () => void
}

export default function ResumeUpload({ onUploadSuccess }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      // Step 1: Upload file to server
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/resume/upload-file', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadResponse.json()

      if (!uploadResponse.ok) {
        setError(uploadData.error || 'Failed to upload file')
        setUploading(false)
        return
      }

      // Step 2: Create resume record in database
      const resumeResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadData.fileName,
          fileUrl: uploadData.fileUrl,
          fileMimeType: uploadData.fileMimeType,
          isPrimary: true,
        }),
      })

      const resumeData = await resumeResponse.json()

      if (!resumeResponse.ok) {
        setError(resumeData.error || 'Failed to create resume record')
        setUploading(false)
        return
      }

      setSuccess(true)
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUploadSuccess?.()
    } catch {
      setError('An error occurred. Please try again.')
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Resume
        </label>
        <div className="mt-1 flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-eeg-blue-electric file:text-white hover:file:bg-eeg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          PDF or Word document, max 5MB
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Resume uploaded successfully!
        </div>
      )}

      {uploading && (
        <div className="text-sm text-gray-600">
          Uploading...
        </div>
      )}
    </div>
  )
}

