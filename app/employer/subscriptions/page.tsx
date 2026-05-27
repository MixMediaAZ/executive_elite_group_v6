import { getServerSessionHelper } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getActiveSubscription } from '@/lib/subscriptions'
import SubscriptionPlans from './subscription-plans'

export const dynamic = 'force-dynamic'

export default async function EmployerSubscriptionsPage() {
  const session = await getServerSessionHelper()
  if (!session) redirect('/auth/signin?callbackUrl=/employer/subscriptions')
  if (session.user.role !== 'EMPLOYER') redirect('/dashboard')
  if (!session.user.employerProfileId) redirect('/employer/onboarding')

  // Only show tiers that have been wired to Stripe (have a stripePriceId) and are marked subscription.
  const tiers = await db.tier.findMany({
    where: { active: true, isSubscription: true, NOT: { stripePriceId: null } },
    orderBy: { priceCents: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      currency: true,
      interval: true,
      isFeatured: true,
      isPremium: true,
    },
  })

  const current = await getActiveSubscription(session.user.employerProfileId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <h1 className="text-3xl sm:text-4xl font-serif text-eeg-charcoal mb-2">Subscription Plans</h1>
        <p className="text-neutral-600 mb-8">
          Recurring access to enhanced employer features. Cancel anytime — you keep access until the
          end of the billing period.
        </p>
        {tiers.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-6 text-neutral-600">
            No subscription plans are available right now. Please check back soon.
          </div>
        ) : (
          <SubscriptionPlans
            tiers={tiers}
            currentTierId={current?.tierId ?? null}
            currentStatus={current?.status ?? null}
          />
        )}
      </div>
    </div>
  )
}
