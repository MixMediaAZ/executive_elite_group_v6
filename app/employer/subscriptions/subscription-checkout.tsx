'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

type Tier = {
  id: string
  name: string
  priceCents: number
  currency: string
  interval: string | null
}

function CheckoutForm({ tier, onSuccess, onCancel }: { tier: Tier; onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
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
        return_url: `${window.location.origin}/employer/subscriptions?status=success`,
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

  const price = (tier.priceCents / 100).toFixed(2)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-eeg-charcoal mb-1">Confirm subscription</h3>
        <p className="text-sm text-neutral-600 mb-4">
          {tier.name} — ${price} / {tier.interval || 'month'}
        </p>

        <PaymentElement />

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-4 py-2 bg-eeg-blue-electric text-white rounded-md hover:bg-eeg-blue-600 font-medium disabled:opacity-50"
          >
            {loading ? 'Processing…' : `Subscribe — $${price}`}
          </button>
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        You will be charged ${price} {tier.interval ? `every ${tier.interval}` : 'monthly'} until you cancel.
        Cancel anytime from this page.
      </p>
    </form>
  )
}

export default function SubscriptionCheckout({
  tier,
  onSuccess,
  onCancel,
}: {
  tier: Tier
  onSuccess: () => void
  onCancel: () => void
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierId: tier.id }),
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
        return data
      })
      .then((d) => { if (!cancelled) setClientSecret(d.clientSecret || null) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [tier.id])

  if (error) {
    return (
      <div className="max-w-lg">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
        <button onClick={onCancel} className="text-sm text-neutral-600 hover:underline">← Back to plans</button>
      </div>
    )
  }
  if (!clientSecret) {
    return <div className="text-neutral-600">Preparing checkout…</div>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
      <CheckoutForm tier={tier} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  )
}
