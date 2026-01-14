import 'dotenv/config'

import OpenAI from 'openai'
import Stripe from 'stripe'
import { Client } from 'pg'

import { requireEnv, requireEnvPrefix } from '../lib/env'

async function checkOpenAI(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OpenAI: SKIP (OPENAI_API_KEY not set)')
    return
  }

  const client = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') })
  await client.models.list()
  console.log('OpenAI: OK')
}

async function checkStripe(): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.log('Stripe: SKIP (STRIPE_SECRET_KEY not set)')
    return
  }

  const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    apiVersion: '2025-10-29.clover',
  })

  // Safe, read-only call that confirms the key is valid.
  await stripe.balance.retrieve()
  console.log('Stripe: OK')

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('Stripe webhook secret: SKIP (STRIPE_WEBHOOK_SECRET not set)')
  } else {
    requireEnvPrefix('STRIPE_WEBHOOK_SECRET', 'whsec_')
    console.log('Stripe webhook secret: OK (format)')
  }
}

async function checkDatabase(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.log('Database: SKIP (DATABASE_URL not set)')
    return
  }

  // Diagnostics that do NOT print secrets.
  try {
    const raw = requireEnv('DATABASE_URL')
    const url = new URL(raw)

    const hasPasswordPlaceholder =
      raw.includes('YOUR_PASSWORD') ||
      raw.includes('YOUR-PASSWORD') ||
      raw.includes('[YOUR') ||
      raw.includes('<PASSWORD>')

    const sslmode = url.searchParams.get('sslmode')
    const pgbouncer = url.searchParams.get('pgbouncer')

    console.log(
      `Database (sanitized): host=${url.hostname} port=${url.port || '(default)'} db=${url.pathname.replace(
        /^\//,
        ''
      )} user=${decodeURIComponent(url.username)}`
    )
    console.log(
      `Database URL flags: sslmode=${sslmode ?? '(missing)'} pgbouncer=${pgbouncer ?? '(missing)'}`
    )
    if (hasPasswordPlaceholder) {
      console.log('Database URL warning: looks like a placeholder password is still in use')
    }
  } catch {
    console.log('Database URL warning: could not parse DATABASE_URL as a URL')
  }

  const client = new Client({
    connectionString: requireEnv('DATABASE_URL'),
  })

  await client.connect()
  await client.query('select 1 as ok')
  await client.end()

  console.log('Database: OK')
}

async function main() {
  // Never print secret values; only print pass/fail.
  const checks: Array<() => Promise<void>> = [checkOpenAI, checkStripe, checkDatabase]

  let failed = false
  for (const check of checks) {
    try {
      await check()
    } catch (err) {
      failed = true
      console.error('Check failed:', err instanceof Error ? err.message : String(err))
    }
  }

  if (failed) process.exitCode = 1
}

void main()

