'use client'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function LoadingState({
  message,
  size = 'md',
  className = '',
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`} role="status" aria-live="polite">
      <div
        className={`${sizeClasses[size]} border-2 border-eeg-blue-500 border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && (
        <span className="text-gray-600" aria-label={message}>
          {message}
        </span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

