'use client'

import { useState, useEffect } from 'react'

interface SuccessMessageProps {
  message: string
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
  className?: string
}

export default function SuccessMessage({
  message,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
  className = '',
}: SuccessMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoDismiss && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, autoDismissDelay)

      return () => clearTimeout(timer)
    }
  }, [autoDismiss, autoDismissDelay, isVisible, onDismiss])

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div
      className={`bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start justify-between ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-2 flex-1">
        <span className="text-lg" aria-hidden="true">
          ✓
        </span>
        <p className="flex-1">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-4 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded"
        aria-label="Dismiss message"
      >
        <span className="text-xl">×</span>
      </button>
    </div>
  )
}

