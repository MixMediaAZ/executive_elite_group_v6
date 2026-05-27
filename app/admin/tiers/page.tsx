import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import TiersClient from './tiers-client'

export const dynamic = 'force-dynamic'

export default async function AdminTiersPage() {
  const session = await getServerSessionHelper()
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-eeg-charcoal mb-2">
          Pricing & Tiers
        </h1>
        <p className="text-neutral-600 mb-6">
          Manage one-time job-posting tiers and recurring subscription plans. Subscription tiers
          must have a Stripe Price ID configured before they appear on the employer pricing page.
        </p>
        <TiersClient />
      </div>
    </div>
  )
}
