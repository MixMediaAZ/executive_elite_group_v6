'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface StripeCheckoutProps {
  clientSecret: string
  jobTitle: string
  amountCents: number
  onSuccess: () => void
  onCancel: () => void
}

function CheckoutForm({ jobTitle, amountCents, onSuccess, onCancel }: Omit<StripeCheckoutProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/jobs?payment=success`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  const amount = (amountCents / 100).toFixed(2)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          Paying for: <span className="font-medium">{jobTitle}</span>
        </p>
        <p className="text-xl font-bold text-eeg-blue-electric mb-6">
          ${amount}
        </p>

        <PaymentElement />

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-4 py-2 bg-eeg-blue-electric text-white rounded-md hover:bg-eeg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Pay $${amount}`}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function StripeCheckout({ clientSecret, jobTitle, amountCents, onSuccess, onCancel }: StripeCheckoutProps) {
  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading payment form...</div>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <CheckoutForm
        jobTitle={jobTitle}
        amountCents={amountCents}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  )
}

