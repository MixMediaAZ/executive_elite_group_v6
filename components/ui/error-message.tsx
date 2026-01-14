'use client'

import { useState } from 'react'

interface ErrorMessageProps {
  message: string
  variant?: 'error' | 'warning' | 'info'
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export default function ErrorMessage({
  message,
  variant = 'error',
  dismissible = false,
  onDismiss,
  className = '',
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  }

  const variantIcons = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
  }

  return (
    <div
      className={`${variantStyles[variant]} border px-4 py-3 rounded-lg flex items-start justify-between ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start space-x-2 flex-1">
        <span className="text-lg" aria-hidden="true">
          {variantIcons[variant]}
        </span>
        <p className="flex-1">{message}</p>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="ml-4 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded"
          aria-label="Dismiss message"
        >
          <span className="text-xl">×</span>
        </button>
      )}
    </div>
  )
}

