'use client'

import { useState } from 'react'
import SubscriptionCheckout from './subscription-checkout'

type Tier = {
  id: string
  name: string
  description: string | null
  priceCents: number
  currency: string
  interval: string | null
  isFeatured: boolean
  isPremium: boolean
}

export default function SubscriptionPlans({
  tiers,
  currentTierId,
  currentStatus,
}: {
  tiers: Tier[]
  currentTierId: string | null
  currentStatus: string | null
}) {
  const [checkout, setCheckout] = useState<Tier | null>(null)

  if (checkout) {
    return (
      <SubscriptionCheckout
        tier={checkout}
        onCancel={() => setCheckout(null)}
        onSuccess={() => {
          // Hard reload so the server-rendered "current plan" badge updates from the DB.
          window.location.assign('/employer/subscriptions?status=success')
        }}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tiers.map((tier) => {
        const isCurrent = tier.id === currentTierId && currentStatus === 'ACTIVE'
        const price = (tier.priceCents / 100).toFixed(2)
        return (
          <div
            key={tier.id}
            className={`bg-white rounded-2xl border p-6 flex flex-col ${
              tier.isFeatured
                ? 'border-eeg-blue-electric ring-2 ring-eeg-blue-electric/30'
                : 'border-neutral-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-eeg-charcoal">{tier.name}</h3>
              {tier.isPremium && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Premium
                </span>
              )}
            </div>
            {tier.description && (
              <p className="text-sm text-neutral-600 mb-4">{tier.description}</p>
            )}
            <div className="text-3xl font-bold text-eeg-charcoal mb-1">
              ${price}
              <span className="text-base font-normal text-neutral-500">
                {' '}/ {tier.interval || 'month'}
              </span>
            </div>
            <div className="text-xs uppercase tracking-wide text-neutral-400 mb-6">
              {tier.currency.toUpperCase()}
            </div>
            <button
              type="button"
              disabled={isCurrent}
              onClick={() => setCheckout(tier)}
              className={`mt-auto w-full px-4 py-2.5 rounded-md font-medium transition-colors ${
                isCurrent
                  ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                  : 'bg-eeg-blue-electric text-white hover:bg-eeg-blue-600'
              }`}
            >
              {isCurrent ? 'Current plan' : 'Subscribe'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
