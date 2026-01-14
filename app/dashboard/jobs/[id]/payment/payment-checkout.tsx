'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StripeCheckout from '@/components/stripe-checkout'

interface PaymentCheckoutProps {
  jobId: string
  jobTitle: string
  tierId: string
  amountCents: number
}

export default function PaymentCheckout({ jobId, jobTitle, tierId, amountCents }: PaymentCheckoutProps) {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId, tierId }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to initialize payment')
          setLoading(false)
          return
        }

        setClientSecret(data.clientSecret)
        setLoading(false)
      } catch {
        setError('Failed to initialize payment')
        setLoading(false)
      }
    }

    createPaymentIntent()
  }, [jobId, tierId])

  const handleSuccess = () => {
    router.push(`/dashboard/jobs/${jobId}?payment=success`)
    router.refresh()
  }

  const handleCancel = () => {
    router.push('/dashboard/jobs')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading payment form...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        Unable to initialize payment. Please try again.
      </div>
    )
  }

  return (
    <StripeCheckout
      clientSecret={clientSecret}
      jobTitle={jobTitle}
      amountCents={amountCents}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}

