import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { createSubscription, cancelSubscription, getActiveSubscription } from '@/lib/subscriptions'

/**
 * GET /api/subscriptions
 * Get subscriptions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Only employers can have subscriptions' }, { status: 403 })
    }

    const subscriptions = await db.subscription.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        tier: true,
        employer: {
          select: {
            orgName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/subscriptions
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

/**
 * DELETE /api/subscriptions
 * Cancel a subscription
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('id')
    const cancelAtPeriodEnd = searchParams.get('cancelAtPeriodEnd') !== 'false'

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 })
    }

    await cancelSubscription(subscriptionId, cancelAtPeriodEnd)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

