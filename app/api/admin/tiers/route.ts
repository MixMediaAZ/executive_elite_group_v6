import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSessionHelper } from '@/lib/auth-helpers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const session = await getServerSessionHelper()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (session.user.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const tiers = await db.tier.findMany({
    orderBy: [{ active: 'desc' }, { priceCents: 'asc' }],
  })
  // Counts so admins know what's safe to archive vs. in use.
  const ids = tiers.map((t: { id: string }) => t.id)
  const [jobCounts, paymentCounts, subCounts] = await Promise.all([
    db.job.groupBy({ by: ['tierId'], _count: { _all: true }, where: { tierId: { in: ids } } }),
    db.jobPayment.groupBy({ by: ['tierId'], _count: { _all: true }, where: { tierId: { in: ids } } }),
    db.subscription.groupBy({ by: ['tierId'], _count: { _all: true }, where: { tierId: { in: ids } } }),
  ])
  const jobMap = Object.fromEntries(jobCounts.map((r: { tierId: string; _count: { _all: number } }) => [r.tierId, r._count._all]))
  const payMap = Object.fromEntries(paymentCounts.map((r: { tierId: string; _count: { _all: number } }) => [r.tierId, r._count._all]))
  const subMap = Object.fromEntries(subCounts.map((r: { tierId: string; _count: { _all: number } }) => [r.tierId, r._count._all]))

  return NextResponse.json({
    tiers: tiers.map((t: any) => ({
      ...t,
      _counts: {
        jobs: jobMap[t.id] || 0,
        payments: payMap[t.id] || 0,
        subscriptions: subMap[t.id] || 0,
      },
    })),
  })
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await req.json().catch(() => ({}))
  const {
    name, description, priceCents, currency, durationDays,
    isFeatured, isPremium, active,
    isSubscription, interval, stripePriceId, stripeProductId,
  } = body as Record<string, any>

  if (!name || typeof priceCents !== 'number' || priceCents < 0) {
    return NextResponse.json({ error: 'name and priceCents (non-negative number) are required' }, { status: 400 })
  }
  if (isSubscription && !interval) {
    return NextResponse.json({ error: 'interval is required for subscription tiers' }, { status: 400 })
  }
  if (isSubscription && !stripePriceId) {
    return NextResponse.json({ error: 'stripePriceId is required for subscription tiers' }, { status: 400 })
  }

  const tier = await db.tier.create({
    data: {
      name: String(name).slice(0, 200),
      description: description ? String(description).slice(0, 1000) : null,
      priceCents: Math.round(priceCents),
      currency: (currency || 'usd').toLowerCase().slice(0, 8),
      durationDays: typeof durationDays === 'number' ? durationDays : 30,
      isFeatured: !!isFeatured,
      isPremium: !!isPremium,
      active: active !== false,
      isSubscription: !!isSubscription,
      interval: interval ? String(interval) : null,
      stripePriceId: stripePriceId ? String(stripePriceId) : null,
      stripeProductId: stripeProductId ? String(stripeProductId) : null,
    },
  })
  return NextResponse.json({ tier })
}
