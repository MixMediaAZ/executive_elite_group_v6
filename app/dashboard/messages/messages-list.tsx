'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Message {
  id: string
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
}

export default function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/messages?folder=${folder}`)
        if (!response.ok) return
        const data = await response.json()
        setMessages(data.messages || [])
        if (data.unreadCount !== undefined) {
          setUnreadCount(data.unreadCount)
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [folder])

  const getSenderName = (message: Message) => {
    if (message.sender.candidateProfile) {
      return `${message.sender.candidateProfile.firstName} ${message.sender.candidateProfile.lastName}`
    }
    if (message.sender.employerProfile) {
      return message.sender.employerProfile.organizationName
    }
    return message.sender.email
  }

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-12 border border-gray-200 text-center">
        <div className="animate-pulse text-gray-400">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Folder Tabs */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setFolder('inbox')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              folder === 'inbox'
                ? 'bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Inbox {folder === 'inbox' && unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFolder('sent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              folder === 'sent'
                ? 'bg-gradient-to-r from-eeg-blue-500 to-eeg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Sent
          </button>
        </div>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-12 border border-gray-200 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-serif text-eeg-charcoal mb-2">No messages</h3>
          <p className="text-gray-600">
            {folder === 'inbox'
              ? "You don't have any messages yet."
              : "You haven't sent any messages yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message) => (
            <Link
              key={message.id}
              href={`/dashboard/messages/${message.id}`}
              className="block bg-white shadow-sm rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className={`flex items-start gap-4 ${!message.read ? 'border-l-4 border-l-eeg-blue-electric pl-4' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {folder === 'inbox' ? getSenderName(message) : message.recipient.email}
                        </h3>
                        {!message.read && folder === 'inbox' && (
                          <span className="w-2 h-2 bg-eeg-blue-electric rounded-full" />
                        )}
                      </div>
                      {message.subject && (
                        <p className="text-sm font-medium text-gray-700 mt-1">{message.subject}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.body}</p>
                      {message.application && (
                        <p className="text-xs text-gray-500 mt-1">
                          Re: {message.application.job.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(message.sentAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

