import { NextRequest, NextResponse } from 'next/server'
import { getServerSessionHelper } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2025-10-29.clover',
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionHelper()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Only employers can create payments' }, { status: 403 })
    }

    if (!session.user.employerProfileId) {
      return NextResponse.json({ error: 'Employer profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { jobId, tierId } = body

    if (!jobId || !tierId) {
      return NextResponse.json({ error: 'Job ID and Tier ID required' }, { status: 400 })
    }

    // Verify job exists and belongs to employer
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        tier: true,
        employer: {
          select: { userId: true },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.employer.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if already paid
    const existingPayment = await db.jobPayment.findFirst({
      where: {
        jobId,
        status: 'paid',
      },
    })

    if (existingPayment) {
      return NextResponse.json({ error: 'Job already paid' }, { status: 400 })
    }

    // Verify tier matches
    if (job.tierId !== tierId) {
      return NextResponse.json({ error: 'Tier mismatch' }, { status: 400 })
    }

    const tier = job.tier

    // Create Stripe Payment Intent
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: tier.priceCents,
      currency: tier.currency || 'usd',
      metadata: {
        jobId,
        tierId,
        employerId: session.user.employerProfileId,
        userId: session.user.id,
      },
      description: `Job Posting: ${job.title} - ${tier.name}`,
    })

    // Create payment record
    const payment = await db.jobPayment.create({
      data: {
        jobId,
        employerId: session.user.employerProfileId,
        tierId,
        amountCents: tier.priceCents,
        currency: tier.currency || 'usd',
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
