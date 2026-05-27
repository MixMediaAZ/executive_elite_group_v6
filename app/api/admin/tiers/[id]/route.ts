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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  const body = await req.json().catch(() => ({}))
  const data: Record<string, any> = {}
  const setIfPresent = (key: string, transform: (v: any) => any = (v) => v) => {
    if (key in body) data[key] = transform(body[key])
  }
  setIfPresent('name', (v) => String(v).slice(0, 200))
  setIfPresent('description', (v) => (v === null ? null : String(v).slice(0, 1000)))
  setIfPresent('priceCents', (v) => Math.max(0, Math.round(Number(v))))
  setIfPresent('currency', (v) => String(v).toLowerCase().slice(0, 8))
  setIfPresent('durationDays', (v) => Math.max(1, Math.round(Number(v))))
  setIfPresent('isFeatured', (v) => !!v)
  setIfPresent('isPremium', (v) => !!v)
  setIfPresent('active', (v) => !!v)
  setIfPresent('isSubscription', (v) => !!v)
  setIfPresent('interval', (v) => (v ? String(v) : null))
  setIfPresent('stripePriceId', (v) => (v ? String(v) : null))
  setIfPresent('stripeProductId', (v) => (v ? String(v) : null))

  // Cross-field validation when relevant fields are being changed
  const final = { ...(await db.tier.findUnique({ where: { id: params.id } })), ...data }
  if (!final) return NextResponse.json({ error: 'Tier not found' }, { status: 404 })
  if (final.isSubscription && !final.interval) {
    return NextResponse.json({ error: 'interval is required for subscription tiers' }, { status: 400 })
  }
  if (final.isSubscription && !final.stripePriceId) {
    return NextResponse.json({ error: 'stripePriceId is required for subscription tiers' }, { status: 400 })
  }

  const tier = await db.tier.update({ where: { id: params.id }, data })
  return NextResponse.json({ tier })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (guard.error) return guard.error

  // Never hard-delete a tier referenced by jobs/payments/subscriptions — archive instead.
  const [jobCount, payCount, subCount] = await Promise.all([
    db.job.count({ where: { tierId: params.id } }),
    db.jobPayment.count({ where: { tierId: params.id } }),
    db.subscription.count({ where: { tierId: params.id } }),
  ])
  if (jobCount + payCount + subCount > 0) {
    const tier = await db.tier.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json({ tier, archived: true })
  }
  await db.tier.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}
