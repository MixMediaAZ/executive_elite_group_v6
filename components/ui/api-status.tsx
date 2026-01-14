'use client'

import { useEffect } from 'react'
import ErrorMessage from './error-message'
import SuccessMessage from './success-message'
import LoadingState from './loading-state'

interface ApiStatusProps {
  loading: boolean
  error: string | null
  success: boolean
  successMessage?: string
  errorVariant?: 'error' | 'warning' | 'info'
  onErrorDismiss?: () => void
  onSuccessDismiss?: () => void
  autoDismissSuccess?: boolean
  autoDismissDelay?: number
  className?: string
}

export default function ApiStatus({
  loading,
  error,
  success,
  successMessage,
  errorVariant = 'error',
  onErrorDismiss,
  onSuccessDismiss,
  autoDismissSuccess = false,
  autoDismissDelay = 5000,
  className = '',
}: ApiStatusProps) {
  // Auto-dismiss success after delay if enabled
  useEffect(() => {
    if (success && autoDismissSuccess && onSuccessDismiss) {
      const timer = setTimeout(() => {
        onSuccessDismiss()
      }, autoDismissDelay)

      return () => clearTimeout(timer)
    }
  }, [success, autoDismissSuccess, autoDismissDelay, onSuccessDismiss])

  if (loading) {
    return <LoadingState message="Processing..." className={className} />
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        variant={errorVariant}
        dismissible
        onDismiss={onErrorDismiss}
        className={className}
      />
    )
  }

  if (success && successMessage) {
    return (
      <SuccessMessage
        message={successMessage}
        onDismiss={onSuccessDismiss}
        autoDismiss={autoDismissSuccess}
        autoDismissDelay={autoDismissDelay}
        className={className}
      />
    )
  }

  return null
}

