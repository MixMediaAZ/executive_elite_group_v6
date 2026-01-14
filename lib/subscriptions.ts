/**
 * Subscription Management Utilities
 * Handles recurring subscriptions for employers
 */

import { db } from './db'
import Stripe from 'stripe'

let stripeSingleton: Stripe | null = null

function getStripe(): Stripe {
  if (stripeSingleton) return stripeSingleton

  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }

  stripeSingleton = new Stripe(apiKey, {
    apiVersion: '2025-10-29.clover',
  })

  return stripeSingleton
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceCents: number
  interval: 'month' | 'year'
  features: string[]
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  userId: string,
  employerId: string,
  tierId: string,
  stripePriceId: string
): Promise<{ subscriptionId: string; clientSecret?: string }> {
  const tier = await db.tier.findUnique({
    where: { id: tierId },
  })

  if (!tier) {
    throw new Error('Tier not found')
  }

  const employer = await db.employerProfile.findUnique({
    where: { id: employerId },
    include: { user: true },
  })

  if (!employer) {
    throw new Error('Employer not found')
  }

  // Check if user already has an active subscription
  const existingSubscription = await db.subscription.findFirst({
    where: {
      userId,
      employerId,
      status: 'ACTIVE',
    },
  })

  if (existingSubscription) {
    throw new Error('Active subscription already exists')
  }

  // Create or retrieve Stripe customer
  let stripeCustomerId = employer.user.email
    ? await getOrCreateStripeCustomer(employer.user.email, employer.user.id)
    : null

  if (!stripeCustomerId) {
    throw new Error('Failed to create Stripe customer')
  }

  const stripe = getStripe()

  // Create Stripe subscription
  const stripeSubscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: stripePriceId }],
    payment_behavior: 'default_incomplete',
    // Stripe typings accept 'off' | 'on_subscription'
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })

  // Stripe.Subscription does not expose current_period_start/end at the top-level in our installed typings.
  // Use the first subscription item period bounds when available.
  const firstItem = stripeSubscription.items?.data?.[0]
  const currentPeriodStart =
    firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null
  const currentPeriodEnd =
    firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null

  // Create subscription record
  const subscription = await db.subscription.create({
    data: {
      userId,
      employerId,
      tierId,
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId,
      stripePriceId,
      amountCents: tier.priceCents,
      currency: tier.currency,
      interval: 'month', // Can be determined from Stripe price
      status: 'ACTIVE',
      currentPeriodStart,
      currentPeriodEnd,
    },
  })

  const clientSecret =
    stripeSubscription.latest_invoice &&
    typeof stripeSubscription.latest_invoice === 'object' &&
    'payment_intent' in stripeSubscription.latest_invoice &&
    stripeSubscription.latest_invoice.payment_intent &&
    typeof stripeSubscription.latest_invoice.payment_intent === 'object' &&
    'client_secret' in stripeSubscription.latest_invoice.payment_intent
      ? (stripeSubscription.latest_invoice.payment_intent.client_secret as string)
      : undefined

  return {
    subscriptionId: subscription.id,
    clientSecret,
  }
}

/**
 * Get or create Stripe customer
 */
async function getOrCreateStripeCustomer(email: string, userId: string): Promise<string> {
  // Check if customer already exists
  const existingSubscription = await db.subscription.findFirst({
    where: {
      userId,
      stripeCustomerId: { not: null },
    },
    select: {
      stripeCustomerId: true,
    },
  })

  if (existingSubscription?.stripeCustomerId) {
    return existingSubscription.stripeCustomerId
  }

  const stripe = getStripe()

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  return customer.id
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<void> {
  const stripe = getStripe()

  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
  })

  if (!subscription || !subscription.stripeSubscriptionId) {
    throw new Error('Subscription not found')
  }

  if (cancelAtPeriodEnd) {
    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancelAtPeriodEnd: true,
      },
    })
  } else {
    // Cancel immediately
    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

    await db.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelAtPeriodEnd: false,
      },
    })
  }
}

/**
 * Get active subscription for an employer
 */
export async function getActiveSubscription(employerId: string) {
  return await db.subscription.findFirst({
    where: {
      employerId,
      status: 'ACTIVE',
    },
    include: {
      tier: true,
    },
  })
}

/**
 * Check if employer has active subscription
 */
export async function hasActiveSubscription(employerId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(employerId)
  return subscription !== null
}

/**
 * Handle Stripe webhook for subscription events
 */
export async function handleSubscriptionWebhook(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription

  const dbSubscription = await db.subscription.findUnique({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  })

  if (!dbSubscription) {
    console.warn(`Subscription ${subscription.id} not found in database`)
    return
  }

  const firstItem = subscription.items?.data?.[0]
  const currentPeriodStart =
    firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000) : null
  const currentPeriodEnd =
    firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null

  switch (event.type) {
    case 'customer.subscription.updated':
      await db.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        },
      })
      break

    case 'customer.subscription.deleted':
      await db.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      })
      break

    case 'invoice.payment_failed':
      await db.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: 'PAST_DUE',
        },
      })
      break

    case 'invoice.payment_succeeded':
      await db.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart,
          currentPeriodEnd,
        },
      })
      break
  }
}

