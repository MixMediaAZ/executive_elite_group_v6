'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface MessageThreadProps {
  initialMessage: {
    id: string
    senderId: string
    recipientId: string
    sender: {
      id: string
      email: string
      candidateProfile?: { firstName: string; lastName: string } | null
      employerProfile?: { organizationName: string } | null
    }
    recipient: {
      id: string
      email: string
    }
    application?: {
      id: string
      job: { title: string }
    } | null
    type: string
    subject: string | null
    body: string
    read: boolean
    sentAt: string
    parentMessage?: {
      id: string
      subject: string | null
      body: string
      sender: { email: string }
    } | null
    replies: Array<{
      id: string
      sender: {
        email: string
        candidateProfile?: { firstName: string; lastName: string } | null
        employerProfile?: { organizationName: string } | null
      }
      body: string
      sentAt: string
    }>
  }
}

export default function MessageThread({ initialMessage }: MessageThreadProps) {
  const router = useRouter()
  const message = initialMessage
  const [replyBody, setReplyBody] = useState('')
  const [sending, startTransition] = useTransition()

  const getSenderName = (sender: {
    email: string
    candidateProfile?: { firstName: string; lastName: string } | null
    employerProfile?: { organizationName: string } | null
  }) => {
    if (sender.candidateProfile) {
      return `${sender.candidateProfile.firstName} ${sender.candidateProfile.lastName}`
    }
    if (sender.employerProfile) {
      return sender.employerProfile.organizationName
    }
    return sender.email
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyBody.trim()) return

    startTransition(async () => {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: message.senderId === message.sender.id ? message.recipient.id : message.sender.id,
            applicationId: message.application?.id,
            type: 'GENERAL_INQUIRY',
            body: replyBody,
            parentMessageId: message.id,
          }),
        })

        if (response.ok) {
          setReplyBody('')
          router.refresh()
        }
      } catch {
        // Ignore errors
      }
    })
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Message Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-serif text-eeg-charcoal">
              {message.subject || 'No Subject'}
            </h2>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">From:</span> {getSenderName(message.sender)}
              </p>
              <p>
                <span className="font-medium">To:</span> {message.recipient.email}
              </p>
              {message.application && (
                <p>
                  <span className="font-medium">Re:</span> {message.application.job.title}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {new Date(message.sentAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Message (if replying) */}
      {message.parentMessage && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">
            Re: {message.parentMessage.subject || 'Previous message'} from {message.parentMessage.sender.email}
          </p>
          <p className="text-sm text-gray-700">{message.parentMessage.body}</p>
        </div>
      )}

      {/* Message Body */}
      <div className="p-6">
        <div className="prose max-w-none">
          <p className="text-gray-900 whitespace-pre-wrap">{message.body}</p>
        </div>
      </div>

      {/* Replies */}
      {message.replies.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">Replies</h3>
            <div className="space-y-4">
              {message.replies.map((reply: { id: string; sender: { email: string; candidateProfile?: { firstName: string; lastName: string } | null; employerProfile?: { organizationName: string } | null }; body: string; sentAt: string }) => (
                <div key={reply.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {getSenderName(reply.sender)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(reply.sentAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reply Form */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleReply} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply
            </label>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-eeg-blue-electric focus:border-eeg-blue-electric"
              placeholder="Type your reply..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={sending || !replyBody.trim()}
            className="px-6 py-2 bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </form>
      </div>
    </div>
  )
}

