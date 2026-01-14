'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { NotificationType } from '@/lib/domain-types'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  readAt: Date | null
  linkUrl: string | null
  metadata: unknown
  createdAt: Date
}

interface NotificationListProps {
  initialNotifications: Notification[]
}

export default function NotificationList({ initialNotifications }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isPending, startTransition] = useTransition()

  const markAsRead = async (notificationId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId }),
        })

        if (response.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId
                ? { ...n, read: true, readAt: new Date() }
                : n
            )
          )
        }
      } catch {
        // Ignore errors
      }
    })
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'APPLICATION_RECEIVED':
        return '📥'
      case 'APPLICATION_STATUS_CHANGED':
        return '📊'
      case 'JOB_APPROVED':
      case 'EMPLOYER_APPROVED':
        return '✅'
      case 'JOB_REJECTED':
      case 'EMPLOYER_REJECTED':
        return '❌'
      case 'NEW_MESSAGE':
        return '💬'
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEW_UPDATED':
        return '📅'
      case 'JOB_MATCH':
        return '🎯'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    if (type.includes('APPROVED')) return 'text-green-600'
    if (type.includes('REJECTED')) return 'text-red-600'
    if (type.includes('INTERVIEW')) return 'text-blue-600'
    return 'text-gray-600'
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-12 border border-gray-200 text-center">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-xl font-serif text-eeg-charcoal mb-2">No notifications</h3>
        <p className="text-gray-600">You&apos;re all caught up! We&apos;ll notify you when something important happens.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const NotificationContent = (
          <div
            className={`bg-white shadow-sm rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow ${
              !notification.read ? 'border-l-4 border-l-eeg-blue-electric' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3
                      className={`font-semibold ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'font-bold' : ''
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      disabled={isPending}
                      className="text-xs text-eeg-blue-electric hover:text-eeg-blue-600 font-medium flex-shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

        if (notification.linkUrl) {
          return (
            <Link key={notification.id} href={notification.linkUrl}>
              {NotificationContent}
            </Link>
          )
        }

        return <div key={notification.id}>{NotificationContent}</div>
      })}
    </div>
  )
}

