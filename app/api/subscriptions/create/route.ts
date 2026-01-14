import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { createSubscription } from '@/lib/subscriptions'

/**
 * POST /api/subscriptions/create
 * Create a new subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Only employers can create subscriptions' }, { status: 403 })
    }

    if (!session.user.employerProfileId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 400 })
    }

    const body = await request.json()
    const { tierId, stripePriceId } = body

    if (!tierId || !stripePriceId) {
      return NextResponse.json(
        { error: 'tierId and stripePriceId are required' },
        { status: 400 }
      )
    }

    const result = await createSubscription(
      session.user.id,
      session.user.employerProfileId,
      tierId,
      stripePriceId
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

