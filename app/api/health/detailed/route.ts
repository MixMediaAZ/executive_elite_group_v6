import { NextResponse } from 'next/server'
import { logger } from '@/lib/monitoring/logger'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import { kv } from '@vercel/kv'

type HealthStatus = 'ok' | 'degraded' | 'down'

type CheckResult = {
  status: HealthStatus
  message?: string
  latencyMs?: number
}

async function checkDatabase(): Promise<CheckResult> {
  if (!process.env.DATABASE_URL) {
    return { status: 'degraded', message: 'DATABASE_URL not set' }
  }

  const start = Date.now()
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    await prisma.$disconnect()
    return { status: 'ok', latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: 'down',
      message: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    }
  }
}

async function checkKv(): Promise<CheckResult> {
  // Vercel KV uses KV_REST_API_URL / KV_REST_API_TOKEN (and friends) under the hood.
  const hasUrl = Boolean(process.env.KV_REST_API_URL)
  const hasToken = Boolean(process.env.KV_REST_API_TOKEN)
  if (!hasUrl || !hasToken) {
    return { status: 'degraded', message: 'KV not configured (KV_REST_API_URL/TOKEN missing)' }
  }

  const start = Date.now()
  try {
    const key = `health:kv:${Date.now()}`
    await kv.setex(key, 5, 'ok')
    const val = await kv.get(key)
    return { status: val ? 'ok' : 'degraded', latencyMs: Date.now() - start }
  } catch (err) {
    return {
      status: 'down',
      message: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    }
  }
}

function checkEnv(): Record<string, boolean> {
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    STRIPE_WEBHOOK_SECRET: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    MAILERSEND_API_KEY: Boolean(process.env.MAILERSEND_API_KEY),
    KV_REST_API_URL: Boolean(process.env.KV_REST_API_URL),
    KV_REST_API_TOKEN: Boolean(process.env.KV_REST_API_TOKEN),
  }
}

export async function GET() {
  // Defensive: avoid any DB or external checks during `next build`.
  // Some build pipelines may execute route handlers; we want builds to be deterministic.
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return NextResponse.json(
      {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          nodeEnv: process.env.NODE_ENV || 'development',
          buildPhase: process.env.NEXT_PHASE,
        },
      },
      { status: 200 }
    )
  }

  const start = Date.now()

  const env = checkEnv()
  const database = await checkDatabase()
  const kvCheck = await checkKv()

  // Overall status: down if DB is down; degraded if required env is missing.
  const requiredEnvOk = env.DATABASE_URL && env.NEXTAUTH_SECRET && env.NEXTAUTH_URL
  const overall: HealthStatus =
    database.status === 'down' || kvCheck.status === 'down'
      ? 'down'
      : requiredEnvOk
        ? 'ok'
        : 'degraded'

  const payload = {
    status: overall,
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - start,
    checks: {
      env,
      database,
      kv: kvCheck,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  }

  logger.info(
    {
      healthStatus: overall,
      databaseStatus: database.status,
      latencyMs: payload.latencyMs,
    },
    'Health check (detailed)'
  )

  return NextResponse.json(payload, { status: overall === 'ok' ? 200 : 503 })
}

