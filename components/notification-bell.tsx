'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications?unread=true&limit=1')
        if (!response.ok) return
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }

    fetchUnreadCount()
    
    // Only poll when tab is visible
    let interval: NodeJS.Timeout
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval)
      } else {
        fetchUnreadCount() // Immediate refresh when tab becomes visible
        interval = setInterval(fetchUnreadCount, 30000)
      }
    }
    
    // Initial interval setup
    interval = setInterval(fetchUnreadCount, 30000)
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (interval) clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  if (loading) {
    return (
      <div className="relative">
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
      </div>
    )
  }

  return (
    <Link
      href="/dashboard/notifications"
      className="relative inline-flex items-center justify-center p-2 sm:p-2 text-gray-600 hover:text-eeg-blue-electric transition-colors min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
      title="Notifications"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

