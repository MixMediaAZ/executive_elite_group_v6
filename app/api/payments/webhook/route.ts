import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { handleSubscriptionWebhook } from '@/lib/subscriptions'
import { requireEnv, requireEnvPrefix } from '@/lib/env'
import Stripe from 'stripe'

function getStripe() {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2025-10-29.clover',
  })
}

// Stripe webhook signing secret should look like: whsec_...
const webhookSecret = requireEnvPrefix('STRIPE_WEBHOOK_SECRET', 'whsec_')

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Find payment record
      const payment = await db.jobPayment.findFirst({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
        include: {
          job: true,
        },
      })

      if (payment && payment.status !== 'paid') {
        // Update payment status
        await db.jobPayment.update({
          where: { id: payment.id },
          data: {
            status: 'paid',
            paidAt: new Date(),
            stripeChargeId: paymentIntent.latest_charge as string | undefined,
          },
        })

        // Update job status to PENDING_ADMIN_REVIEW after payment
        await db.job.update({
          where: { id: payment.jobId },
          data: {
            status: 'PENDING_ADMIN_REVIEW',
          },
        })
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const payment = await db.jobPayment.findFirst({
        where: {
          stripePaymentIntentId: paymentIntent.id,
        },
      })

      if (payment) {
        await db.jobPayment.update({
          where: { id: payment.id },
          data: {
            status: 'failed',
          },
        })
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted' ||
      event.type === 'invoice.payment_failed' ||
      event.type === 'invoice.payment_succeeded'
    ) {
      // Handle subscription webhooks
      await handleSubscriptionWebhook(event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

